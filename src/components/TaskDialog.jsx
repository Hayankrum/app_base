import Icon from './Icon'

export default function TaskDialog({ titulo, onTituloChange, onFechar, onCriar }) {
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onFechar()
    }}>
      <form className="task-dialog" onSubmit={(event) => { event.preventDefault(); onCriar() }}>
        <div className="dialog-heading">
          <h2>Nova tarefa</h2>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onFechar}>
            <Icon name="close" />
          </button>
        </div>
        <input
          autoFocus
          aria-label="Título da tarefa"
          placeholder="Título"
          value={titulo}
          onChange={(event) => onTituloChange(event.target.value)}
        />
        <button className="dialog-submit" type="submit" disabled={!titulo.trim()}>Criar tarefa</button>
      </form>
    </div>
  )
}
