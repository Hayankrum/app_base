import { RETENCAO_LIXEIRA_MS } from '../../shared/constants.js'

export function formatarData(data, opcoes) {
  const texto = data.toLocaleDateString('pt-BR', opcoes)
  return texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1)
}

export function tempoRestanteLixeira(excluidaEm, agora) {
  const restante = excluidaEm + RETENCAO_LIXEIRA_MS - agora
  if (restante <= 0) return 'Expira agora'

  const dias = Math.ceil(restante / (24 * 60 * 60 * 1000))
  if (dias >= 1) return `${dias} ${dias === 1 ? 'dia restante' : 'dias restantes'}`

  const horas = Math.ceil(restante / (60 * 60 * 1000))
  if (horas >= 1) return `${horas} ${horas === 1 ? 'hora restante' : 'horas restantes'}`

  const minutos = Math.max(1, Math.ceil(restante / (60 * 1000)))
  return `${minutos} min restantes`
}
