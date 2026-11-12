const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SESSION_KEY = 'tarefas-session'

export function obterToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.token ?? null
  } catch {
    encerrarSessao()
    return null
  }
}

function guardarSessao(sessao) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao))
}

export function encerrarSessao() {
  localStorage.removeItem(SESSION_KEY)
}

async function requisitar(url, opcoes) {
  let resposta
  try {
    resposta = await fetch(`${API}${url}`, opcoes)
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível concluir a solicitação.')
  return dados
}

export async function entrar(email, senha) {
  const sessao = await requisitar('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  guardarSessao(sessao)
  return sessao
}

export async function cadastrar(email, senha) {
  const sessao = await requisitar('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  guardarSessao(sessao)
  return sessao
}

export async function restaurarSessao() {
  let sessao
  try {
    sessao = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    encerrarSessao()
    return null
  }
  if (!sessao?.token || !sessao?.usuario?.id) return null

  try {
    const resposta = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
    })
    if (resposta.status === 401) {
      encerrarSessao()
      return null
    }
    if (!resposta.ok) return sessao
    const dados = await resposta.json()
    const atualizada = { ...sessao, usuario: dados.usuario }
    guardarSessao(atualizada)
    return atualizada
  } catch {
    return sessao
  }
}
