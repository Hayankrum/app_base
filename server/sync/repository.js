import { RETENCAO_LIXEIRA_MS } from '../../shared/constants.js'

export async function proximoRelogio(client, userId) {
  const { rows: [ultimo] } = await client.query(
    'select coalesce(max(servidor_em), 0) as valor from tarefas where user_id = $1',
    [userId]
  )
  return Math.max(Date.now(), Number(ultimo.valor) + 1)
}

// Transforma em tombstone as tarefas que estão na lixeira há mais de 3 dias.
// Roda no pull porque todo cliente passa por ele antes de enviar alterações.
export async function expurgarLixeira(client, userId) {
  const limite = Date.now() - RETENCAO_LIXEIRA_MS
  const agora = await proximoRelogio(client, userId)
  await client.query(
    `update tarefas
     set deletado_em = $1, servidor_em = $1
     where user_id = $2
       and deletado_em is null
       and lixeira_em is not null
       and lixeira_em <= $3`,
    [agora, userId, limite]
  )
}
