import pg from 'pg'
import { databaseUrl } from './config.js'

// Pool com timeouts curtos o suficiente para não deixar requisições penduradas
// quando o banco estiver lento ou indisponível.
export const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
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
