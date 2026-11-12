import Icon from './Icon'

export default function LimitDialog({ limite, onFechar, onVerPlanos }) {
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onFechar()
    }}>
      <div className="task-dialog limit-dialog" role="dialog" aria-modal="true" aria-labelledby="limit-title">
        <div className="dialog-heading">
          <h2 id="limit-title">Limite do plano atingido</h2>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onFechar}>
            <Icon name="close" />
          </button>
        </div>
        <p>
          Você chegou ao limite de {limite} tarefas ativas do plano Grátis.
          Assine o Pro para ter tarefas ilimitadas.
        </p>
        <div className="limit-dialog-actions">
          <button className="dialog-submit" type="button" onClick={onVerPlanos}>
            Ver planos
          </button>
          <button className="limit-dialog-cancel" type="button" onClick={onFechar}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
