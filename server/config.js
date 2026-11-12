import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const serverDir = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(serverDir, '.env') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  APP_URL: z.string().url('APP_URL deve ser uma URL válida').default('http://localhost:5173'),
  PORT: z.coerce.number().int().positive().default(3001),
  // Em produção, use "true" apenas se a aplicação estiver atrás de um proxy
  // confiável (Railway, Render, Fly, Nginx etc.).
  TRUST_PROXY: z.string().optional(),
  // CORS adicional além da APP_URL. Em geral o frontend e a API ficam na
  // mesma origem e isto não é necessário.
  CORS_ORIGIN: z.string().optional(),
  // Migrations automáticas no boot. Pode ser desativado em produção e rodar
  // `npm run db:migrate` no deploy.
  MIGRATE_ON_START: z
    .enum(['true', 'false'])
    .default('true'),
  SESSION_DAYS: z.coerce.number().int().positive().max(365).default(30),
  // Opcional: mantido por compatibilidade com instalações antigas. A sessão
  // nova é um token opaco; este segredo não é mais usado para assinar JWTs.
  JWT_SECRET: z.string().optional(),
  // Stripe (todos opcionais; sem eles a página de planos continua abrindo).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const detalhes = parsed.error.issues
    .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Configuração de ambiente inválida:\n${detalhes}`)
}

export const env = parsed.data
export { serverDir }

export const databaseUrl = env.DATABASE_URL
export const port = env.PORT
export const appUrl = env.APP_URL.replace(/\/$/, '')
export const ehProducao = env.NODE_ENV === 'production'
export const usarHttps = appUrl.startsWith('https://')
