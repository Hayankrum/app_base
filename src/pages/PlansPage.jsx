import { useEffect, useState } from 'react'
import { abrirPortalAssinatura, criarCheckout } from '../api/billing'
import Icon from '../components/Icon'

const ROTULOS_STATUS = {
  active: 'Ativa',
  trialing: 'Em período de teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
  paused: 'Pausada',
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
  if (!valor) return null
  return new Date(valor).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function mensagemInicialCheckout() {
  const checkout = new URLSearchParams(window.location.search).get('checkout')
  if (checkout === 'sucesso') {
    return 'Pagamento concluído! A confirmação pode levar alguns segundos. Atualize o status abaixo.'
  }
  if (checkout === 'cancelado') return 'Checkout cancelado. Nenhuma cobrança foi realizada.'
  if (checkout === 'portal') return 'Assinatura atualizada.'
  return ''
}

export default function PlansPage({ billing, carregando, erro, onAtualizar }) {
  const [intervalo, setIntervalo] = useState('mes')
  const [processando, setProcessando] = useState(null)
  const [erroAcao, setErroAcao] = useState('')
  const [aviso] = useState(mensagemInicialCheckout)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('checkout')) return
    params.delete('checkout')
    const query = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
  }, [])

  const assinatura = billing?.assinatura
  const planoAtual = assinatura?.planoEfetivo ?? 'free'
  const proAtivo = planoAtual === 'pro'
  const limiteTarefas = billing?.limites?.tarefas ?? null
  const tarefasAtivas = billing?.uso?.tarefasAtivas ?? 0
  const pagamentosConfigurados = billing?.pagamentosConfigurados ?? false
  const planos = billing?.planos ?? []
  const planoPro = planos.find((plano) => plano.id === 'pro')
  const economiaAnual = planoPro
    ? planoPro.precos.mes * 12 - planoPro.precos.ano
    : 0
  const percentualUso = limiteTarefas
    ? Math.min(100, Math.round((tarefasAtivas / limiteTarefas) * 100))
    : 0

  const mensagemErro = erroAcao || erro

  async function assinar() {
    setErroAcao('')
    setProcessando('checkout')
    try {
      const { url } = await criarCheckout(intervalo)
      if (!url) throw new Error('O provedor não retornou uma URL de checkout.')
      window.location.href = url
    } catch (error) {
      setErroAcao(error.message)
      setProcessando(null)
    }
  }

  async function gerenciar() {
    setErroAcao('')
    setProcessando('portal')
    try {
      const { url } = await abrirPortalAssinatura()
      if (!url) throw new Error('O provedor não retornou uma URL do portal.')
      window.location.href = url
    } catch (error) {
      setErroAcao(error.message)
      setProcessando(null)
    }
  }

  return (
    <section className="plans-page" aria-label="Planos e assinatura">
      <header className="plans-heading">
        <p className="agenda-eyebrow">SUA ASSINATURA</p>
        <h1>Planos</h1>
        <p>Escolha o plano que acompanha o seu ritmo. Cancele quando quiser.</p>
      </header>

      {aviso && <p className="plans-alert is-info" role="status">{aviso}</p>}
      {mensagemErro && <p className="plans-alert is-error" role="alert">{mensagemErro}</p>}

      {carregando && !billing ? (
        <p className="plans-loading">Carregando planos...</p>
      ) : (
        <>
          <section className="plans-usage" aria-label="Uso do plano atual">
            <div className="plans-usage-copy">
              <span className="plans-usage-label">Plano atual</span>
              <strong>{planoAtual === 'pro' ? 'Pro' : 'Grátis'}</strong>
              <span>
                {limiteTarefas
                  ? `${tarefasAtivas} de ${limiteTarefas} tarefas ativas`
                  : `${tarefasAtivas} tarefas ativas · ilimitado`}
              </span>
            </div>
            {limiteTarefas && (
              <div className="plans-usage-bar" aria-hidden="true">
                <span style={{ width: `${percentualUso}%` }} />
              </div>
            )}
            <button
              className="plans-refresh"
              type="button"
              onClick={onAtualizar}
              disabled={carregando}
            >
              {carregando ? 'Atualizando...' : 'Atualizar status'}
            </button>
          </section>

          <div className="plans-interval" role="group" aria-label="Periodicidade da cobrança">
            <button
              className={intervalo === 'mes' ? 'is-selected' : ''}
              type="button"
              aria-pressed={intervalo === 'mes'}
              onClick={() => setIntervalo('mes')}
            >
              Mensal
            </button>
            <button
              className={intervalo === 'ano' ? 'is-selected' : ''}
              type="button"
              aria-pressed={intervalo === 'ano'}
              onClick={() => setIntervalo('ano')}
            >
              Anual
              {economiaAnual > 0 && <span>economize {formatarPreco(economiaAnual)}</span>}
            </button>
          </div>

          <div className="plans-grid">
            {planos.map((plano) => {
              const destaque = plano.id === 'pro'
              const ehAtual = plano.id === planoAtual
              const preco = plano.precos[intervalo]
              return (
                <article className={`plans-card${destaque ? ' is-highlighted' : ''}`} key={plano.id}>
                  {destaque && <span className="plans-tag">Mais popular</span>}
                  <header>
                    <h2>{plano.nome}</h2>
                    <p>{plano.descricao}</p>
                  </header>
                  <p className="plans-price">
                    {preco === 0 ? 'Grátis' : formatarPreco(preco)}
                    {preco > 0 && (
                      <span>{intervalo === 'mes' ? '/mês' : '/ano'}</span>
                    )}
                  </p>
                  <ul className="plans-features">
                    {plano.recursos.map((recurso) => (
                      <li key={recurso}><Icon name="check" size={17} />{recurso}</li>
                    ))}
                  </ul>

                  {destaque ? (
                    proAtivo ? (
                      <button
                        className="plans-cta is-secondary"
                        type="button"
                        onClick={gerenciar}
                        disabled={processando !== null}
                      >
                        {processando === 'portal' ? 'Abrindo...' : 'Gerenciar assinatura'}
                      </button>
                    ) : (
                      <button
                        className="plans-cta"
                        type="button"
                        onClick={assinar}
                        disabled={!pagamentosConfigurados || processando !== null}
                      >
                        {processando === 'checkout' ? 'Redirecionando...' : `Assinar ${plano.nome}`}
                      </button>
                    )
                  ) : (
                    <button className="plans-cta is-current" type="button" disabled>
                      {ehAtual ? 'Plano atual' : 'Incluído'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>

          <section className="plans-status" aria-label="Detalhes da assinatura">
            <div>
              <h2>Detalhes da assinatura</h2>
              <p>
                Status:
                {' '}
                <strong>
                  {assinatura?.cancelamentoAgendado
                    ? 'Cancelamento agendado'
                    : ROTULOS_STATUS[assinatura?.status] ?? 'Não assinante'}
                </strong>
                {assinatura?.periodoFim && (
                  <>
                    {' · '}
                    {assinatura.cancelamentoAgendado
                      ? `Acesso até ${formatarData(assinatura.periodoFim)}`
                      : `Próxima renovação em ${formatarData(assinatura.periodoFim)}`}
                  </>
                )}
              </p>
            </div>
            {assinatura?.plano === 'pro' && (
              <button
                className="plans-manage"
                type="button"
                onClick={gerenciar}
                disabled={processando !== null}
              >
                {processando === 'portal' ? 'Abrindo...' : 'Gerenciar assinatura'}
              </button>
            )}
          </section>

          {!pagamentosConfigurados && (
            <p className="plans-note">
              Os pagamentos ainda não estão configurados neste servidor.
              Configure as chaves do Stripe para habilitar a assinatura.
            </p>
          )}
        </>
      )}
    </section>
  )
}
