import { useState } from 'react'
import Icon from '../components/Icon'

export default function LoginPage({ onAuthenticate }) {
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cadastro = modo === 'cadastro'

  async function enviar(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await onAuthenticate(modo, email.trim(), senha)
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-mark"><Icon name="calendar" size={25} /></div>
        <h1 id="auth-title">{cadastro ? 'Criar conta' : 'Entrar'}</h1>
        <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
          <button
            className={!cadastro ? 'is-selected' : ''}
            type="button"
            role="tab"
            aria-selected={!cadastro}
            onClick={() => { setModo('login'); setErro('') }}
          >
            Entrar
          </button>
          <button
            className={cadastro ? 'is-selected' : ''}
            type="button"
            role="tab"
            aria-selected={cadastro}
            onClick={() => { setModo('cadastro'); setErro('') }}
          >
            Criar conta
          </button>
        </div>
        <form className="auth-form" onSubmit={enviar}>
          <label htmlFor="auth-email">E-mail</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="auth-password">Senha</label>
          <div className="auth-password-field">
            <input
              id="auth-password"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete={cadastro ? 'new-password' : 'current-password'}
              required
              minLength={cadastro ? 8 : undefined}
              maxLength={128}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
            <button
              className="auth-password-toggle"
              type="button"
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrarSenha}
              onClick={() => setMostrarSenha((mostrar) => !mostrar)}
            >
              <Icon name={mostrarSenha ? 'eyeOff' : 'eye'} size={20} />
            </button>
          </div>
          {erro && <p className="auth-error" role="alert">{erro}</p>}
          <button className="auth-submit" type="submit" disabled={enviando}>
            {enviando ? 'Aguarde...' : cadastro ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
