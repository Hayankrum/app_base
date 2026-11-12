import { useEffect, useState } from 'react'
import { usarBancoDoUsuario } from './db'
import { cadastrar, encerrarSessao, entrar, restaurarSessao } from './auth'
import { marcarOnboardingVisto, onboardingFoiVisto } from './utils/onboarding'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import TaskApp from './pages/TaskApp'
import './style.css'

function App() {
  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [onboardingVisto, setOnboardingVisto] = useState(true)

  useEffect(() => {
    let ativo = true
    restaurarSessao()
      .then(async (sessao) => {
        if (sessao) {
          await usarBancoDoUsuario(sessao.usuario.id)
          if (!ativo) return
          setOnboardingVisto(onboardingFoiVisto(sessao.usuario.id))
        }
        if (ativo) setSession(sessao)
      })
      .catch((error) => {
        console.error('Não foi possível restaurar a sessão:', error)
        if (ativo) setSession(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    function expirarSessao() {
      encerrarSessao()
      setSession(null)
    }
    window.addEventListener('auth:expired', expirarSessao)
    return () => window.removeEventListener('auth:expired', expirarSessao)
  }, [])

  async function autenticar(modo, email, senha) {
    const sessao = modo === 'cadastro'
      ? await cadastrar(email, senha)
      : await entrar(email, senha)
    await usarBancoDoUsuario(sessao.usuario.id)
    setOnboardingVisto(onboardingFoiVisto(sessao.usuario.id))
    setSession(sessao)
  }

  function sair() {
    encerrarSessao()
    setSession(null)
  }

  function concluirOnboarding() {
    if (session) marcarOnboardingVisto(session.usuario.id)
    setOnboardingVisto(true)
  }

  function reverApresentacao() {
    setOnboardingVisto(false)
  }

  if (carregando) {
    return <main className="auth-page"><p className="auth-loading">Carregando...</p></main>
  }

  if (!session) return <LoginPage onAuthenticate={autenticar} />

  if (!onboardingVisto) {
    return (
      <OnboardingPage
        session={session}
        onComecar={concluirOnboarding}
      />
    )
  }

  return (
    <TaskApp
      key={session.usuario.id}
      session={session}
      onLogout={sair}
      onVerApresentacao={reverApresentacao}
    />
  )
}

export default App
