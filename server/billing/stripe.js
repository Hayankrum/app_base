import Stripe from 'stripe'
import { appUrl, env } from '../config.js'

const segredo = env.STRIPE_SECRET_KEY

export const pagamentosConfigurados = Boolean(segredo)
export const stripe = segredo ? new Stripe(segredo) : null
export const webhookSecret = env.STRIPE_WEBHOOK_SECRET || null
export { appUrl }

export const precosPro = {
  mes: env.STRIPE_PRICE_PRO_MONTHLY || null,
  ano: env.STRIPE_PRICE_PRO_YEARLY || null,
}
