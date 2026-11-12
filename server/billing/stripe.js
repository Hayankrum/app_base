import Stripe from 'stripe'
import process from 'node:process'
// Garante que o .env seja carregado antes de ler as variáveis do Stripe.
import '../config.js'

const segredo = process.env.STRIPE_SECRET_KEY

export const pagamentosConfigurados = Boolean(segredo)
export const stripe = segredo ? new Stripe(segredo) : null
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null
export const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

export const precosPro = {
  mes: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
  ano: process.env.STRIPE_PRICE_PRO_YEARLY || null,
}
