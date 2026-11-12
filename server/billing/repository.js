import { pool } from '../db.js'
import { PLANO_PADRAO } from './plans.js'

let assinaturasMigration

export function garantirTabelaAssinaturas() {
  assinaturasMigration ??= pool.query(
    `create table if not exists assinaturas (
       user_id text primary key references usuarios(id) on delete cascade,
       plano text not null default 'free',
       status text not null default 'active',
       intervalo text,
       stripe_customer_id text,
       stripe_subscription_id text unique,
       periodo_fim timestamptz,
       cancel_at_period_end boolean not null default false,
       atualizado_em timestamptz not null default now()
     );
     alter table assinaturas
       add column if not exists cancel_at_period_end boolean not null default false`
  ).then(() => undefined).catch((error) => {
    assinaturasMigration = undefined
    throw error
  })
  return assinaturasMigration
}

export async function obterAssinatura(userId) {
  await garantirTabelaAssinaturas()
  const { rows: [assinatura] } = await pool.query(
    'select * from assinaturas where user_id = $1',
    [userId]
  )
  return assinatura ?? {
    user_id: userId,
    plano: PLANO_PADRAO,
    status: 'active',
    intervalo: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    periodo_fim: null,
    cancel_at_period_end: false,
  }
}

export function planoEfetivo(assinatura) {
  const statusAtivo = assinatura.status === 'active' || assinatura.status === 'trialing'
  return assinatura.plano === 'pro' && statusAtivo ? 'pro' : 'free'
}

export async function contarTarefasAtivas(userId) {
  const { rows: [resultado] } = await pool.query(
    'select count(*)::int as total from tarefas where user_id = $1 and deletado_em is null',
    [userId]
  )
  return resultado.total
}

export async function salvarClienteStripe(userId, customerId) {
  await garantirTabelaAssinaturas()
  await pool.query(
    `insert into assinaturas (user_id, plano, status, stripe_customer_id)
     values ($1, 'free', 'active', $2)
     on conflict (user_id) do update set
       stripe_customer_id = excluded.stripe_customer_id,
       atualizado_em = now()`,
    [userId, customerId]
  )
}

export async function salvarAssinatura(userId, dados) {
  await garantirTabelaAssinaturas()
  await pool.query(
    `insert into assinaturas
       (user_id, plano, status, intervalo, stripe_customer_id, stripe_subscription_id, periodo_fim, cancel_at_period_end)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (user_id) do update set
       plano = excluded.plano,
       status = excluded.status,
       intervalo = excluded.intervalo,
       stripe_customer_id = coalesce(excluded.stripe_customer_id, assinaturas.stripe_customer_id),
       stripe_subscription_id = coalesce(excluded.stripe_subscription_id, assinaturas.stripe_subscription_id),
       periodo_fim = excluded.periodo_fim,
       cancel_at_period_end = excluded.cancel_at_period_end,
       atualizado_em = now()`,
    [
      userId,
      dados.plano,
      dados.status,
      dados.intervalo,
      dados.customerId,
      dados.subscriptionId,
      dados.periodoFim,
      Boolean(dados.cancelAtPeriodEnd),
    ]
  )
}

export async function buscarUsuarioPorCustomer(customerId) {
  if (!customerId) return null
  await garantirTabelaAssinaturas()
  const { rows: [assinatura] } = await pool.query(
    'select user_id from assinaturas where stripe_customer_id = $1',
    [customerId]
  )
  return assinatura?.user_id ?? null
}
