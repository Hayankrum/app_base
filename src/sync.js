import { RETENCAO_LIXEIRA_MS } from '../shared/constants.js'
import { obterToken } from './auth'
import { db } from './db'

const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
let rodando = false

export async function sincronizar() {
  const token = obterToken()
  if (rodando || !token) return
  rodando = true
  const falhas = []
  try {
    // A lixeira expira mesmo offline; a exclusão fica na fila para sincronizar.
    try {
      await expurgarLixeira()
    } catch (e) {
      falhas.push(e)
    }

    if (navigator.onLine) {
      // Primeiro busca o que mudou na nuvem. Assim, exclusões definitivas
      // chegam antes de qualquer alteração local antiga ser enviada.
      try {
        await pull()
      } catch (e) {
        falhas.push(e)
      }
      try {
        await push()
      } catch (e) {
        falhas.push(e)
      }
    }
  } finally {
    rodando = false
  }
  if (falhas.length) {
    console.warn('Sync falhou, tentará de novo:', falhas[0].message)
  }
}

export async function expurgarLixeira() {
  const limite = Date.now() - RETENCAO_LIXEIRA_MS
  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    const expiradas = await db.tarefas
      .filter((tarefa) => Boolean(tarefa.excluidaEm) && tarefa.excluidaEm <= limite)
      .toArray()
    if (!expiradas.length) return

    const ids = expiradas.map((tarefa) => tarefa.id)
    await db.tarefas.bulkDelete(ids)
    const chaves = await db.outbox.where('registroId').anyOf(ids).primaryKeys()
    if (chaves.length) await db.outbox.bulkDelete(chaves)
    await db.outbox.bulkAdd(ids.map((id) => ({ operacao: 'delete', registroId: id })))
  })
}

async function removerDaFila(ids) {
  if (!ids.length) return
  const chaves = await db.outbox.where('registroId').anyOf(ids).primaryKeys()
  if (chaves.length) await db.outbox.bulkDelete(chaves)
}

async function push() {
  const pendentes = await db.outbox.orderBy('seq').toArray()
  if (!pendentes.length) return

  const operacoes = []
  for (const op of pendentes) {
    if (op.operacao === 'upsert') {
      const dados = await db.tarefas.get(op.registroId)
      // Se o registro sumiu localmente, a intenção é excluir. Enviar um upsert
      // sem dados faria o servidor ignorar e a tarefa voltaria no próximo pull.
      operacoes.push(
        dados
          ? { operacao: 'upsert', id: op.registroId, dados }
          : { operacao: 'delete', id: op.registroId, dados: null }
      )
    } else if (op.operacao === 'delete') {
      operacoes.push({ operacao: 'delete', id: op.registroId, dados: null })
    }
  }

  const res = await fetch(`${API}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify({ operacoes }),
  })
  if (res.status === 401) window.dispatchEvent(new Event('auth:expired'))
  if (!res.ok) throw new Error('push falhou')
  const { removidos = [] } = await res.json()

  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    // só limpa a fila depois do servidor confirmar
    await db.outbox.bulkDelete(pendentes.map((p) => p.seq))
    if (removidos.length) {
      const ids = [...new Set(removidos)]
      // Exclusão definitiva vence: remove a cópia local e qualquer alteração
      // pendente que ainda tentaria recriá-la.
      await db.tarefas.bulkDelete(ids)
      await removerDaFila(ids)
    }
  })
}

async function pull() {
  const meta = await db.meta.get('ultimoSync')
  const desde = meta?.valor ?? 0

  const res = await fetch(`${API}/sync/pull?desde=${desde}`, {
    headers: { Authorization: `Bearer ${obterToken()}` },
  })
  if (res.status === 401) window.dispatchEvent(new Event('auth:expired'))
  if (!res.ok) throw new Error('pull falhou')
  const { registros = [], removidos = [], agora = desde } = await res.json()

  await db.transaction('rw', db.tarefas, db.outbox, db.meta, async () => {
    // Exclusão permanente é definitiva: aplica mesmo com alteração local
    // pendente, senão um upsert antigo pode ressuscitar a tarefa.
    const idsRemovidos = [...new Set(removidos)]
    if (idsRemovidos.length) {
      await db.tarefas.bulkDelete(idsRemovidos)
      await removerDaFila(idsRemovidos)
    }

    // não sobrescreve o que ainda tem alteração local pendente
    const pendentes = new Set((await db.outbox.toArray()).map((o) => o.registroId))
    let adiados = false

    for (const r of registros) {
      if (pendentes.has(r.id)) {
        adiados = true
        continue
      }
      const local = await db.tarefas.get(r.id)
      if (!local || r.atualizadaEm > local.atualizadaEm) {
        await db.tarefas.put(r)
      }
    }

    // Se algum registro foi adiado, não avança o cursor: a alteração precisa
    // ser buscada de novo depois que a fila local for enviada.
    await db.meta.put({ chave: 'ultimoSync', valor: adiados ? desde : agora })
  })
}
