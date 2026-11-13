import { app } from '../server/app.js'
import { env } from '../server/config.js'
import { executarMigrations } from '../server/migrate.js'

let bancoPreparado

function prepararBanco() {
  if (env.MIGRATE_ON_START !== 'true') return Promise.resolve()
  bancoPreparado ??= executarMigrations().catch((error) => {
    // Permite tentar novamente na próxima requisição se o banco estava fora.
    bancoPreparado = undefined
    throw error
  })
  return bancoPreparado
}

function normalizarCaminho(req) {
  const url = new URL(req.url, 'http://localhost')
  const caminhoOriginal = url.searchParams.get('__vercel_path')
  const caminhoApi = url.pathname === '/api'
    || url.pathname === '/api/index'
    || url.pathname.startsWith('/api/')

  // Em produção a Vercel normalmente entrega o caminho original. Removemos
  // apenas o parâmetro interno usado pelo rewrite.
  if (!caminhoApi) {
    url.searchParams.delete('__vercel_path')
    req.url = `${url.pathname}${url.search}`
    return
  }

  // Fallback: se a função recebeu apenas `/api`, o rewrite informa o caminho
  // original em `__vercel_path`.
  if ((url.pathname === '/api' || url.pathname === '/api/index') && caminhoOriginal) {
    url.searchParams.delete('__vercel_path')
    req.url = `${caminhoOriginal}${url.search}`
    return
  }

  // Acesso direto a /api/... também é aceito.
  url.searchParams.delete('__vercel_path')
  url.pathname = url.pathname === '/api' || url.pathname === '/api/index'
    ? '/'
    : url.pathname.slice(4)
  req.url = `${url.pathname}${url.search}`
}

export default async function handler(req, res) {
  normalizarCaminho(req)

  try {
    await prepararBanco()
  } catch (error) {
    console.error('Falha ao preparar o banco de dados:', error)
    return res.status(503).json({ erro: 'Banco de dados indisponível. Tente novamente.' })
  }

  return app(req, res)
}
