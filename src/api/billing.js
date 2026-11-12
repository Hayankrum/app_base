import { obterToken } from '../auth'

const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function requisitar(url, opcoes = {}) {
  const token = obterToken()
  let resposta
  try {
    resposta = await fetch(`${API}${url}`, {
      ...opcoes,
      headers: {
        ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (resposta.status === 401) {
    window.dispatchEvent(new Event('auth:expired'))
    throw new Error('Sua sessão expirou. Entre novamente.')
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível concluir a solicitação.')
  return dados
}

export function obterBilling() {
  return requisitar('/billing')
}

export function criarCheckout(intervalo) {
  return requisitar('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ intervalo }),
  })
}

export function abrirPortalAssinatura() {
  return requisitar('/billing/portal', { method: 'POST' })
}
