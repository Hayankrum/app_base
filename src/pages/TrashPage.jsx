import Icon from '../components/Icon'
import TempoRestanteLixeira from '../components/TempoRestanteLixeira'

export default function TrashPage({
  tarefas,
  lista,
  busca,
  abrirTarefa,
  onRestaurar,
  onExcluirPermanentemente,
}) {
  return (
    <section className="trash-page" aria-label="Lixeira">
      <header className="trash-heading">
        <div>
          <h1>Lixeira</h1>
          <p>As tarefas excluídas ficam aqui por 3 dias. Depois disso, são apagadas definitivamente.</p>
        </div>
        <span className="agenda-count">{tarefas.length}</span>
      </header>
      <div className={`task-grid${lista ? ' task-grid--list' : ''}`} aria-label="Tarefas na lixeira">
        {tarefas.map((tarefa) => (
          <article className="task-card trash-card" key={tarefa.id}>
            <button
              className="task-card-content"
              type="button"
              onClick={() => abrirTarefa(tarefa.id)}
              aria-label={`Abrir tarefa: ${tarefa.titulo}`}
            >
              <span className="task-card-title">{tarefa.titulo}</span>
              <span className="task-card-subtitle">
                <TempoRestanteLixeira excluidaEm={tarefa.excluidaEm} />
              </span>
            </button>
            <div className="trash-card-actions">
              <button
                className="trash-card-action"
                type="button"
                aria-label={`Restaurar tarefa: ${tarefa.titulo}`}
                onClick={() => onRestaurar(tarefa.id)}
              >
                <Icon name="restore" size={19} /> Restaurar
              </button>
              <button
                className="trash-card-action is-destructive"
                type="button"
                aria-label={`Excluir permanentemente: ${tarefa.titulo}`}
                onClick={() => onExcluirPermanentemente(tarefa.id)}
              >
                <Icon name="trash" size={18} /> Excluir
              </button>
            </div>
          </article>
        ))}
        {tarefas.length === 0 && (
          <p className="empty-state">
            {busca ? 'Nenhuma tarefa encontrada.' : 'A lixeira está vazia.'}
          </p>
        )}
      </div>
    </section>
  )
}
