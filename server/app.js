import cors from 'cors'
import express from 'express'
import { resolve } from 'node:path'
import authRouter from './auth/routes.js'
import billingRouter from './billing/routes.js'
import { billingWebhook } from './billing/webhook.js'
import { env, serverDir } from './config.js'
import { verificarBanco } from './db.js'
import syncRouter from './sync/routes.js'

const distPath = resolve(serverDir, '../dist')
// Na Vercel os arquivos estáticos são servidos pelo CDN e o Express roda como
// uma função serverless, sem acesso garantido à pasta `dist`.
const servirArquivosEstaticos = !process.env.VERCEL

export const app = express()

if (env.TRUST_PROXY === 'true' || process.env.VERCEL) {
  app.set('trust proxy', 1)
}

app.use(cors())

// O Stripe exige o corpo bruto para validar a assinatura do webhook.
app.post('/billing/webhook', express.raw({ type: 'application/json' }), billingWebhook)

app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    await verificarBanco()
    res.json({ ok: true })
  } catch (error) {
    console.error('Banco de dados indisponível:', error)
    res.status(503).json({ ok: false })
  }
})

app.use('/auth', authRouter)
app.use('/billing', billingRouter)
app.use('/sync', syncRouter)

// Rotas de API desconhecidas não devem cair no fallback do frontend.
app.use(['/auth', '/billing', '/sync'], (_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' })
})

if (servirArquivosEstaticos) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || !req.accepts('html')) return next()
    res.sendFile(resolve(distPath, 'index.html'))
  })
}

app.use((error, _req, res, next) => {
  console.error('Erro não tratado:', error)
  if (res.headersSent) return next(error)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})
