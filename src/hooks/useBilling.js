import { useCallback, useEffect, useState } from 'react'
import { obterBilling } from '../api/billing'

export function useBilling() {
  const [billing, setBilling] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const atualizar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await obterBilling()
      setBilling(dados)
      setErro('')
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    obterBilling()
      .then((dados) => {
        if (!ativo) return
        setBilling(dados)
        setErro('')
      })
      .catch((error) => {
        if (ativo) setErro(error.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [])

  return { billing, carregando, erro, atualizar }
}
