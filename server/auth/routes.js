import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { garantirTabelaUsuarios, pool } from '../db.js'
import { exigirAutenticacao } from './middleware.js'
import { gerarHashSenha, simularVerificacaoSenha, validarCredenciais, verificarSenha } from './senhas.js'
import { criarToken, obterSegredoToken } from './tokens.js'

const router = Router()

function respostaSessao(res, usuario) {
  res.json({
    token: criarToken(usuario),
    usuario: { id: usuario.id, email: usuario.email },
  })
}

router.post('/register', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const senha = req.body?.senha
  if (!validarCredenciais(email, senha)) {
    return res.status(400).json({ erro: 'Informe um e-mail válido e uma senha de 8 a 128 caracteres.' })
  }

  try {
    await garantirTabelaUsuarios()
    obterSegredoToken()
    const usuario = { id: randomUUID(), email }
    const senhaHash = await gerarHashSenha(senha)
    await pool.query(
      'insert into usuarios (id, email, senha_hash) values ($1, $2, $3)',
      [usuario.id, usuario.email, senhaHash]
    )
    respostaSessao(res, usuario)
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' })
    }
    console.error('Falha no cadastro:', error)
    res.status(503).json({ erro: 'Não foi possível criar a conta. Verifique a configuração do servidor.' })
  }
})

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const senha = req.body?.senha
  if (!email || email.length > 254 || typeof senha !== 'string' || senha.length > 128) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
  }

  try {
    await garantirTabelaUsuarios()
    obterSegredoToken()
    const { rows: [usuario] } = await pool.query(
      'select id, email, senha_hash from usuarios where email = $1',
      [email]
    )
    const senhaValida = usuario
      ? await verificarSenha(senha, usuario.senha_hash)
      : await simularVerificacaoSenha(senha)
    if (!senhaValida) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    respostaSessao(res, usuario)
  } catch (error) {
    console.error('Falha no login:', error)
    res.status(503).json({ erro: 'Não foi possível entrar. Verifique a configuração do servidor.' })
  }
})

router.get('/me', exigirAutenticacao, (req, res) => {
  res.json({ usuario: req.usuario })
})

export default router
