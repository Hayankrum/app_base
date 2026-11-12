import { Router } from 'express'
import { exigirAutenticacao } from '../auth/middleware.js'
import { garantirColunaLixeira, pool } from '../db.js'
import { expurgarLixeira, proximoRelogio } from './repository.js'

const router = Router()

router.post('/push', exigirAutenticacao, async (req, res) => {
  const userId = req.userId
  const { operacoes = [] } = req.body
  let client
  try {
    await garantirColunaLixeira()
    client = await pool.connect()
    await client.query('begin')
    // Serializa pushes do mesmo usuário para que servidor_em seja sempre
    // crescente e nenhuma alteração seja pulada pelo cursor do pull.
    await client.query('select pg_advisory_xact_lock(hashtext($1)::bigint)', [userId])
    let relogio = await proximoRelogio(client, userId)
    const removidos = []

    for (const op of operacoes) {
      const agora = relogio++
      if (op.operacao === 'upsert' && op.dados) {
        const d = op.dados
        // Uma exclusão definitiva é um tombstone: um upsert antigo não pode
        // recriá-la. A condição de lixeira também impede que uma edição feita
        // antes de saber da exclusão tire a tarefa da lixeira sem restaurar.
        const resultado = await client.query(
          `insert into tarefas
             (id, user_id, titulo, concluida, criada_em, atualizada_em, deletado_em, servidor_em, lixeira_em)
           values ($1,$2,$3,$4,$5,$6,null,$7,$8)
           on conflict (id) do update set
             titulo = excluded.titulo,
             concluida = excluded.concluida,
             atualizada_em = excluded.atualizada_em,
             lixeira_em = excluded.lixeira_em,
             servidor_em = excluded.servidor_em
           where tarefas.user_id = excluded.user_id
             and tarefas.deletado_em is null
             and tarefas.atualizada_em <= excluded.atualizada_em
             and (
               tarefas.lixeira_em is null
               or excluded.lixeira_em is not null
               or excluded.atualizada_em > tarefas.lixeira_em
             )`,
          [d.id, userId, d.titulo, d.concluida, d.criadaEm, d.atualizadaEm, agora, d.excluidaEm ?? null]
        )
        if (resultado.rowCount === 0) {
          const { rows } = await client.query(
            'select deletado_em from tarefas where id = $1 and user_id = $2',
            [d.id, userId]
          )
          if (rows[0]?.deletado_em) removidos.push(op.id)
        }
      } else if (op.operacao === 'delete') {
        await client.query(
          `update tarefas set deletado_em = $1, servidor_em = $1
           where id = $2 and user_id = $3`,
          [agora, op.id, userId]
        )
      }
    }
    await client.query('commit')
    // Avisa o cliente quais upserts encontraram um tombstone para ele remover
    // a cópia local em vez de mantê-la "ressuscitada" no aparelho.
    res.json({ ok: true, removidos })
  } catch (e) {
    if (client) {
      try {
        await client.query('rollback')
      } catch (rollbackError) {
        console.error('Falha ao reverter a sincronização:', rollbackError)
      }
    }
    console.error(e)
    res.status(500).json({ erro: 'falha no push' })
  } finally {
    client?.release()
  }
})

router.get('/pull', exigirAutenticacao, async (req, res) => {
  const userId = req.userId
  const desde = Number(req.query.desde) || 0
  let client
  try {
    await garantirColunaLixeira()
    client = await pool.connect()
    await client.query('begin')
    await client.query('select pg_advisory_xact_lock(hashtext($1)::bigint)', [userId])
    await expurgarLixeira(client, userId)
    const { rows } = await client.query(
      `select * from tarefas
       where user_id = $1 and servidor_em > $2
       order by servidor_em`,
      [userId, desde]
    )
    const registros = rows
      .filter((r) => !r.deletado_em)
      .map((r) => ({
        id: r.id,
        titulo: r.titulo,
        concluida: r.concluida,
        criadaEm: Number(r.criada_em),
        atualizadaEm: Number(r.atualizada_em),
        excluidaEm: r.lixeira_em == null ? null : Number(r.lixeira_em),
      }))
    const removidos = rows.filter((r) => r.deletado_em).map((r) => r.id)
    const agora = rows.length ? Number(rows[rows.length - 1].servidor_em) : desde
    await client.query('commit')
    res.json({ registros, removidos, agora })
  } catch (e) {
    if (client) {
      try {
        await client.query('rollback')
      } catch (rollbackError) {
        console.error('Falha ao reverter o pull:', rollbackError)
      }
    }
    console.error(e)
    res.status(500).json({ erro: 'falha no pull' })
  } finally {
    client?.release()
  }
})

router.use((_req, res) => {
  res.status(404).json({ erro: 'rota não encontrada' })
})

export default router
