import { useEffect } from 'react'
import { sincronizar } from '../sync'

export function useSync() {
  useEffect(() => {
    const aoFicarVisivel = () => {
      if (document.visibilityState === 'visible') sincronizar()
    }
    window.addEventListener('online', sincronizar)
    document.addEventListener('visibilitychange', aoFicarVisivel)
    const intervalo = setInterval(sincronizar, 30_000)
    sincronizar()
    return () => {
      window.removeEventListener('online', sincronizar)
      document.removeEventListener('visibilitychange', aoFicarVisivel)
      clearInterval(intervalo)
    }
  }, [])
}
