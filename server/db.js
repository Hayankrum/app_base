import pg from 'pg'
import { databaseUrl } from './config.js'

// Na Vercel cada instância da função abre seu próprio pool. Mantemos um limite
// baixo para não esgotar as conexões do Postgres e usamos a URL "pooled" do
// provedor (Neon, Supabase etc.) sempre que possível.
const executandoNaVercel = Boolean(process.env.VERCEL)

// Pool com timeouts curtos o suficiente para não deixar requisições penduradas
// quando o banco estiver lento ou indisponível.
export const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: Number(process.env.PG_POOL_MAX) || (executandoNaVercel ? 3 : 10),
  idleTimeoutMillis: executandoNaVercel ? 10_000 : 30_000,
  connectionTimeoutMillis: 8_000,
  statement_timeout: 20_000,
  query_timeout: 20_000,
})

// Sem este handler, um erro em uma conexão ociosa derruba o processo.
pool.on('error', (error) => {
  console.error('Erro inesperado em uma conexão do PostgreSQL:', error)
})

export async function verificarBanco() {
  await pool.query('select 1')
}

export async function fecharPool() {
  await pool.end()
}

// Garantias idempotentes usadas pelas rotas. A migração 001 já cria tudo, mas
// manter estas funções evita falhas em bancos antigos e em deploys feitos antes
// da migração ser executada.
let tabelaUsuariosGarantida

export function garantirTabelaUsuarios() {
  tabelaUsuariosGarantida ??= pool.query(
    `create table if not exists usuarios (
       id text primary key,
       email text not null unique,
       senha_hash text not null,
       criado_em timestamptz not null default now()
     );
     alter table usuarios
       add column if not exists relogio bigint not null default 0`
  ).then(() => undefined).catch((error) => {
    tabelaUsuariosGarantida = undefined
    throw error
  })
  return tabelaUsuariosGarantida
}

let colunaLixeiraGarantida

export function garantirColunaLixeira() {
  colunaLixeiraGarantida ??= pool.query(
    `create table if not exists tarefas (
       id text primary key,
       user_id text not null references usuarios(id) on delete cascade,
       titulo text not null,
       concluida boolean not null default false,
       criada_em bigint not null,
       atualizada_em bigint not null,
       deletado_em bigint,
       servidor_em bigint not null,
       lixeira_em bigint
     );
     alter table tarefas
       add column if not exists lixeira_em bigint`
  ).then(() => undefined).catch((error) => {
    colunaLixeiraGarantida = undefined
    throw error
  })
  return colunaLixeiraGarantida
}

// Executa `fn` dentro de uma transação, revertendo em qualquer erro.
export async function emTransacao(fn) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const resultado = await fn(client)
    await client.query('commit')
    return resultado
  } catch (error) {
    try {
      await client.query('rollback')
    } catch (rollbackError) {
      console.error('Falha ao reverter transação:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}
