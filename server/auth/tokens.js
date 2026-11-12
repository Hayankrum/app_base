import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'
import process from 'node:process'

export function obterSegredoToken() {
  const segredo = process.env.JWT_SECRET
  if (!segredo || segredo.length < 32) {
    throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.')
  }
  return segredo
}

export function criarToken(usuario) {
  const cabecalho = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const carga = Buffer.from(JSON.stringify({
    sub: usuario.id,
    email: usuario.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  })).toString('base64url')
  const assinatura = createHmac('sha256', obterSegredoToken())
    .update(`${cabecalho}.${carga}`)
    .digest('base64url')
  return `${cabecalho}.${carga}.${assinatura}`
}

export function verificarToken(token) {
  const partes = token.split('.')
  if (partes.length !== 3) return null
  const [cabecalho, carga, assinatura] = partes
  const assinaturaEsperada = createHmac('sha256', obterSegredoToken())
    .update(`${cabecalho}.${carga}`)
    .digest()
  const assinaturaRecebida = Buffer.from(assinatura, 'base64url')
  if (
    assinaturaRecebida.length !== assinaturaEsperada.length
    || !timingSafeEqual(assinaturaRecebida, assinaturaEsperada)
  ) return null

  try {
    const dados = JSON.parse(Buffer.from(carga, 'base64url').toString())
    if (!dados.sub || !Number.isInteger(dados.exp) || dados.exp <= Date.now() / 1000) return null
    return dados
  } catch {
    return null
  }
}
