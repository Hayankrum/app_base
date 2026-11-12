import Icon from './Icon'

export default function TaskDetail({
  tarefa,
  fixada,
  menuAberto,
  onVoltar,
  onRestaurar,
  onAlternarFixada,
  onAlternarTarefa,
  onExcluir,
  onToggleMenu,
}) {
  return (
    <>
      <header className="detail-header">
        <button className="icon-button" type="button" aria-label="Voltar" onClick={onVoltar}>
          <Icon name="back" size={29} />
        </button>
        <div className="detail-header-actions">
          {tarefa.excluidaEm ? (
            <button className="icon-button detail-action" type="button" aria-label="Restaurar tarefa" onClick={onRestaurar}>
              <Icon name="restore" />
            </button>
          ) : (
            <>
              <button
                className={`icon-button detail-action${fixada ? ' is-active' : ''}`}
                type="button"
                aria-label={fixada ? 'Desafixar tarefa' : 'Fixar tarefa'}
                onClick={onAlternarFixada}
              >
                <Icon name="pin" />
              </button>
              <button
                className="icon-button detail-action"
                type="button"
                aria-label={tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                onClick={onAlternarTarefa}
              >
                <Icon name={tarefa.concluida ? 'check' : 'circle'} />
              </button>
            </>
          )}
          <button
            className="icon-button detail-action"
            type="button"
            aria-label={tarefa.excluidaEm ? 'Excluir tarefa permanentemente' : 'Mover para a lixeira'}
            onClick={onExcluir}
          >
            <Icon name="trash" />
          </button>
        </div>
      </header>
      <section className="detail-content">
        <h1>{tarefa.titulo}</h1>
        <p className="detail-description">
          {tarefa.concluida
            ? 'Tarefa concluída'
            : 'Tarefa pendente'}
        </p>
      </section>
      <footer className="detail-footer">
        <button className="icon-button detail-action footer-more" type="button" aria-label="Mais opções" onClick={onToggleMenu}>
          <Icon name="more" />
        </button>
        {menuAberto && (
          <div className="delete-menu" role="menu">
            {tarefa.excluidaEm ? (
              <>
                <button className="delete-menu-item" type="button" role="menuitem" onClick={onRestaurar}>
                  <Icon name="restore" size={19} /> Restaurar tarefa
                </button>
                <button className="delete-menu-item is-destructive" type="button" role="menuitem" onClick={onExcluir}>
                  <Icon name="trash" size={19} /> Excluir definitivamente
                </button>
              </>
            ) : (
              <button className="delete-menu-item" type="button" role="menuitem" onClick={onExcluir}>
                <Icon name="trash" size={19} /> Mover para a lixeira
              </button>
            )}
          </div>
        )}
      </footer>
    </>
  )
}
