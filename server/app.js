import cors from 'cors'
import express from 'express'
import { resolve } from 'node:path'
import authRouter from './auth/routes.js'
import billingRouter from './billing/routes.js'
import { billingWebhook } from './billing/webhook.js'
import { serverDir } from './config.js'
import syncRouter from './sync/routes.js'

const distPath = resolve(serverDir, '../dist')

export const app = express()

app.use(cors())

// O Stripe exige o corpo bruto para validar a assinatura do webhook.
app.post('/billing/webhook', express.raw({ type: 'application/json' }), billingWebhook)

app.use(express.json())

app.use('/auth', authRouter)
app.use('/billing', billingRouter)
app.use('/sync', syncRouter)

app.use(express.static(distPath))
app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) return next()
  res.sendFile(resolve(distPath, 'index.html'))
})
