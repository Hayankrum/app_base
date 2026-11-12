const CHAVE = 'tarefas-onboarding'

function chaveDoUsuario(userId) {
  return `${CHAVE}:${userId}`
}

export function onboardingFoiVisto(userId) {
  try {
    return localStorage.getItem(chaveDoUsuario(userId)) === '1'
  } catch {
    return false
  }
}

export function marcarOnboardingVisto(userId) {
  try {
    localStorage.setItem(chaveDoUsuario(userId), '1')
  } catch {
    // Sem localStorage, a apresentação aparece novamente no próximo acesso.
  }
}
