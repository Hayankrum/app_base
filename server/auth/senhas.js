import { Buffer } from 'node:buffer'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export async function gerarHashSenha(senha) {
  const sal = randomBytes(16).toString('hex')
  const hash = await scrypt(senha, sal, 64)
  return `${sal}:${hash.toString('hex')}`
}

export async function verificarSenha(senha, hashSalvo) {
  const [sal, hashHex] = hashSalvo.split(':')
  const hashEsperado = Buffer.from(hashHex, 'hex')
  const hashRecebido = await scrypt(senha, sal, hashEsperado.length)
  return hashEsperado.length === hashRecebido.length && timingSafeEqual(hashEsperado, hashRecebido)
}

// Mantém o tempo de resposta parecido com o de uma senha existente,
// evitando revelar quais e-mails estão cadastrados.
export async function simularVerificacaoSenha(senha) {
  await scrypt(senha, 'senha-inexistente', 64)
  return false
}

export function validarCredenciais(email, senha) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && typeof senha === 'string'
    && senha.length >= 8
    && senha.length <= 128
}
