import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { env, ehProducao, usarHttps } from '../config.js'
import { pool } from '../db.js'

const COOKIE_SEGURO = usarHttps || ehProducao
const NOME_COOKIE = COOKIE_SEGURO ? '__Host-sessao' : 'sessao'
const NOMES_ANTIGOS = ['sessao', '__Host-sessao']
const DIAS_SESSAO = env.SESSION_DAYS

function hashDoToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function opcoesDoCookie() {
  return {
    httpOnly: true,
    secure: COOKIE_SEGURO,
    sameSite: 'lax',
    path: '/',
    maxAge: DIAS_SESSAO * 24 * 60 * 60 * 1000,
  }
}

export function lerTokenSessao(req) {
  const cabecalho = req.get('cookie')
  if (!cabecalho) return null
  for (const parte of cabecalho.split(';')) {
    const separador = parte.indexOf('=')
    if (separador === -1) continue
    const nome = parte.slice(0, separador).trim()
    if (nome !== NOME_COOKIE && !NOMES_ANTIGOS.includes(nome)) continue
    try {
      return decodeURIComponent(parte.slice(separador + 1).trim()) || null
    } catch {
      return null
    }
  }
  return null
}

export function definirCookieSessao(res, token) {
  res.cookie(NOME_COOKIE, token, opcoesDoCookie())
}

export function limparCookieSessao(res) {
  const opcoes = { ...opcoesDoCookie() }
  delete opcoes.maxAge
  for (const nome of new Set([NOME_COOKIE, ...NOMES_ANTIGOS])) {
    res.clearCookie(nome, opcoes)
  }
}

export async function criarSessao({ userId, ip, userAgent }) {
  const token = randomBytes(32).toString('base64url')
  const expiraEm = new Date(Date.now() + DIAS_SESSAO * 24 * 60 * 60 * 1000)
  await pool.query(
    `insert into sessoes (id, user_id, token_hash, expira_em, ip, user_agent)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      randomUUID(),
      userId,
      hashDoToken(token),
      expiraEm,
      ip ? String(ip).slice(0, 100) : null,
      userAgent ? String(userAgent).slice(0, 500) : null,
    ]
  )
  return token
}

// Busca a sessão no banco a cada requisição (a revogação vale imediatamente) e
// renova a validade de forma deslizante.
export async function buscarSessao(token) {
  if (!token || token.length > 200) return null
  const { rows: [usuario] } = await pool.query(
    `with atualizada as (
       update sessoes
       set ultimo_uso_em = now(),
           expira_em = now() + make_interval(days => $2)
       where token_hash = $1
         and revogada_em is null
         and expira_em > now()
       returning user_id
     )
     select u.id, u.email
     from atualizada a
     join usuarios u on u.id = a.user_id`,
    [hashDoToken(token), DIAS_SESSAO]
  )
  return usuario ?? null
}

export async function revogarSessao(token) {
  if (!token) return
  await pool.query(
    'update sessoes set revogada_em = now() where token_hash = $1 and revogada_em is null',
    [hashDoToken(token)]
  )
}

export async function revogarSessoesDoUsuario(userId) {
  await pool.query(
    'update sessoes set revogada_em = now() where user_id = $1 and revogada_em is null',
    [userId]
  )
}

export async function limparSessoesExpiradas() {
  await pool.query(
    `delete from sessoes
     where expira_em < now() - interval '7 days'
        or (revogada_em is not null and revogada_em < now() - interval '7 days')`
  )
}
