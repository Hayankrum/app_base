import { useEffect, useState } from 'react'
import { tempoRestanteLixeira } from '../utils/format'

export default function TempoRestanteLixeira({ excluidaEm }) {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 60_000)
    return () => clearInterval(intervalo)
  }, [])

  return tempoRestanteLixeira(excluidaEm, agora)
}
