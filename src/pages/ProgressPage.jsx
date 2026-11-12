import { useMemo } from 'react'
import Icon from '../components/Icon'
import { calcularProgresso } from '../utils/progress'

function mensagemDoDia(progresso) {
  if (!progresso.tarefasDeHoje) {
    return 'Você ainda não criou tarefas hoje. Adicione uma para acompanhar o progresso do dia.'
  }
  if (progresso.percentualHoje === 100) {
    return 'Dia completo! Todas as tarefas de hoje foram concluídas.'
  }
  if (progresso.percentualHoje >= 50) {
    return 'Bom ritmo! Você já passou da metade das tarefas de hoje.'
  }
  return 'Um passo de cada vez. Conclua mais uma tarefa para avançar.'
}

function alturaDaBarra(valor, maximo) {
  return valor ? `${Math.max(8, Math.round((valor / maximo) * 100))}%` : '0%'
}

export default function ProgressPage({ tarefas, abrirTarefa }) {
  const progresso = useMemo(() => calcularProgresso(tarefas), [tarefas])

  return (
    <section className="progress-page" aria-label="Progresso">
      <header className="progress-heading">
        <p className="agenda-eyebrow">ACOMPANHE SEU RITMO</p>
        <h1>Progresso</h1>
        <p>Veja como estão suas tarefas de hoje e dos últimos sete dias.</p>
      </header>

      <div className="progress-highlight">
        <div
          className="progress-ring"
          style={{ '--progresso': `${progresso.percentualHoje}%` }}
          role="img"
          aria-label={`${progresso.percentualHoje}% das tarefas de hoje concluídas`}
        >
          <span>{progresso.percentualHoje}%</span>
          <small>hoje</small>
        </div>
        <div className="progress-highlight-copy">
          <span className="progress-badge">Hoje</span>
          <h2>
            {progresso.concluidasDeHoje} de {progresso.tarefasDeHoje}
            {' '}
            {progresso.tarefasDeHoje === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
          </h2>
          <p>{mensagemDoDia(progresso)}</p>
          <div className="progress-inline">
            <span><i className="progress-dot is-done" />{progresso.concluidasDeHoje} concluídas</span>
            <span><i className="progress-dot is-pending" />{progresso.pendentesDeHoje} pendentes</span>
          </div>
        </div>
      </div>

      <div className="progress-stats">
        <article className="progress-stat">
          <span className="progress-stat-icon"><Icon name="list" size={20} /></span>
          <strong>{progresso.total}</strong>
          <span>Tarefas ativas</span>
        </article>
        <article className="progress-stat">
          <span className="progress-stat-icon is-done"><Icon name="check" size={20} /></span>
          <strong>{progresso.concluidas}</strong>
          <span>Concluídas</span>
        </article>
        <article className="progress-stat">
          <span className="progress-stat-icon is-pending"><Icon name="circle" size={20} /></span>
          <strong>{progresso.pendentes}</strong>
          <span>Pendentes</span>
        </article>
        <article className="progress-stat">
          <span className="progress-stat-icon is-flame"><Icon name="flame" size={20} /></span>
          <strong>{progresso.sequencia}</strong>
          <span>{progresso.sequencia === 1 ? 'Dia seguido' : 'Dias seguidos'}</span>
        </article>
      </div>

      <section className="progress-card" aria-labelledby="progress-chart-title">
        <div className="progress-section-heading">
          <div>
            <h2 id="progress-chart-title">Últimos 7 dias</h2>
            <p>
              {progresso.concluidasNaSemana}
              {' '}
              {progresso.concluidasNaSemana === 1 ? 'conclusão' : 'conclusões'} nesta semana.
            </p>
          </div>
          <div className="progress-legend">
            <span><i className="is-created" />Criadas</span>
            <span><i className="is-completed" />Concluídas</span>
          </div>
        </div>

        <div
          className="progress-chart"
          role="img"
          aria-label={`Tarefas criadas e concluídas nos últimos 7 dias. Total concluído: ${progresso.concluidasNaSemana}.`}
        >
          {progresso.dias.map((dia) => (
            <div className="progress-chart-day" key={dia.chave}>
              <div className="progress-chart-bars" aria-hidden="true">
                <span
                  className="progress-bar is-created"
                  style={{ height: alturaDaBarra(dia.criadas, progresso.maximoDia) }}
                  title={`${dia.criadas} criada(s)`}
                />
                <span
                  className="progress-bar is-completed"
                  style={{ height: alturaDaBarra(dia.concluidas, progresso.maximoDia) }}
                  title={`${dia.concluidas} concluída(s)`}
                />
              </div>
              <span className={`progress-chart-label${dia.hoje ? ' is-today' : ''}`}>
                <span>{dia.semana}</span>
                <strong>{dia.data.getDate()}</strong>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="progress-card" aria-labelledby="progress-completed-title">
        <div className="progress-section-heading">
          <div>
            <h2 id="progress-completed-title">Concluídas hoje</h2>
            <p>As tarefas que você finalizou nas últimas horas.</p>
          </div>
          <span className="agenda-count">{progresso.concluidasHoje.length}</span>
        </div>

        {progresso.concluidasHoje.length ? (
          <ul className="progress-completed-list">
            {progresso.concluidasHoje.map((tarefa) => (
              <li key={tarefa.id}>
                <button type="button" onClick={() => abrirTarefa(tarefa.id)}>
                  <span className="progress-completed-check"><Icon name="check" size={18} /></span>
                  <span className="progress-completed-copy">
                    <strong>{tarefa.titulo}</strong>
                    <small>
                      Concluída às
                      {' '}
                      {new Date(tarefa.atualizadaEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </span>
                  <Icon name="chevronRight" size={18} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="progress-empty">
            Nenhuma tarefa concluída hoje ainda. Marque uma tarefa para começar sua sequência.
          </p>
        )}
      </section>
    </section>
  )
}
