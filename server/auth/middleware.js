import { verificarToken } from './tokens.js'

export function exigirAutenticacao(req, res, next) {
  const [tipo, token] = (req.get('authorization') || '').split(' ')
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' })
  }
  try {
    const usuario = verificarToken(token)
    if (!usuario) return res.status(401).json({ erro: 'Token inválido ou expirado.' })
    req.userId = usuario.sub
    req.usuario = { id: usuario.sub, email: usuario.email }
    next()
  } catch (error) {
    console.error('Falha ao validar token:', error)
    res.status(503).json({ erro: 'Autenticação não configurada no servidor.' })
  }
}
