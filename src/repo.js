import { db } from './db'
import { sincronizar } from './sync'

export async function adicionarTarefa(titulo) {
  const agora = Date.now()
  const registro = {
    id: crypto.randomUUID(),
    titulo,
    concluida: false,
    criadaEm: agora,
    atualizadaEm: agora,
  }
  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    await db.tarefas.add(registro)
    await db.outbox.add({ operacao: 'upsert', registroId: registro.id })
  })
  sincronizar()
}

export async function alternarTarefa(tarefa) {
  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    await db.tarefas.update(tarefa.id, {
      concluida: !tarefa.concluida,
      atualizadaEm: Date.now(),
    })
    await db.outbox.add({ operacao: 'upsert', registroId: tarefa.id })
  })
  sincronizar()
}

export async function moverParaLixeira(id) {
  const tarefa = await db.tarefas.get(id)
  if (!tarefa) return
  const agora = Date.now()
  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    await db.tarefas.update(id, {
      excluidaEm: agora,
      atualizadaEm: agora,
    })
    await db.outbox.add({ operacao: 'upsert', registroId: id })
  })
  sincronizar()
}

export async function restaurarTarefa(id) {
  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    await db.tarefas.update(id, {
      excluidaEm: null,
      atualizadaEm: Date.now(),
    })
    await db.outbox.add({ operacao: 'upsert', registroId: id })
  })
  sincronizar()
}

export async function excluirPermanentemente(id) {
  await db.transaction('rw', db.tarefas, db.outbox, async () => {
    await db.tarefas.delete(id)
    await db.outbox.add({ operacao: 'delete', registroId: id })
  })
  sincronizar()
}