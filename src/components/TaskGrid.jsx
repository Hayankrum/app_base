import Icon from './Icon'

export default function TaskGrid({ tarefas, lista, fixadas, busca, abrirTarefa, alternarTarefa }) {
  return (
    <section className={`task-grid${lista ? ' task-grid--list' : ''}`} aria-label="Suas tarefas">
      {tarefas.map((tarefa) => (
        <article
          className={`task-card${tarefa.concluida ? ' task-card--done' : ''}`}
          key={tarefa.id}
        >
          <button
            className="task-card-content"
            type="button"
            onClick={() => abrirTarefa(tarefa.id)}
            aria-label={`Abrir tarefa: ${tarefa.titulo}`}
          >
            <span className="task-card-title">{tarefa.titulo}</span>
            <span className="task-card-subtitle">
              {tarefa.concluida ? 'Concluída' : 'Tarefa pendente'}
            </span>
          </button>
          <button
            className={`task-card-check${tarefa.concluida ? ' is-checked' : ''}`}
            type="button"
            aria-label={tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
            onClick={() => alternarTarefa(tarefa)}
          >
            <Icon name={tarefa.concluida ? 'check' : 'circle'} size={22} />
          </button>
          {fixadas.has(tarefa.id) && <span className="task-card-pin"><Icon name="pin" size={17} /></span>}
        </article>
      ))}
      {tarefas.length === 0 && (
        <p className="empty-state">
          {busca ? 'Nenhuma tarefa encontrada.' : 'Suas tarefas aparecerão aqui.'}
        </p>
      )}
    </section>
  )
}
