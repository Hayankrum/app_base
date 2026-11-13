import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serverDir } from './config.js'
import { pool } from './db.js'

const diretorioMigrations = join(serverDir, 'migrations')
const CHAVE_LOCK = 923_741_001

async function garantirTabelaDeControle(client) {
  await client.query(
    `create table if not exists schema_migrations (
       nome text primary key,
       aplicada_em timestamptz not null default now()
     )`
  )
}

export async function executarMigrations() {
  const client = await pool.connect()
  try {
    await client.query('select pg_advisory_lock($1)', [CHAVE_LOCK])
    await garantirTabelaDeControle(client)

    const arquivos = (await readdir(diretorioMigrations))
      .filter((nome) => nome.endsWith('.sql'))
      .sort()

    const { rows } = await client.query('select nome from schema_migrations')
    const aplicadas = new Set(rows.map((linha) => linha.nome))
    const pendentes = arquivos.filter((nome) => !aplicadas.has(nome))

    for (const nome of pendentes) {
      const sql = await readFile(join(diretorioMigrations, nome), 'utf8')
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into schema_migrations (nome) values ($1)', [nome])
        await client.query('commit')
        console.log(`Migration aplicada: ${nome}`)
      } catch (error) {
        await client.query('rollback')
        throw new Error(`Falha na migration ${nome}: ${error.message}`, { cause: error })
      }
    }

    if (!pendentes.length) {
      console.log('Nenhuma migration pendente.')
    }
    return pendentes
  } finally {
    try {
      await client.query('select pg_advisory_unlock($1)', [CHAVE_LOCK])
    } catch {
      // A conexão pode já estar inutilizável; o lock é liberado ao fechar.
    }
    client.release()
  }
}
