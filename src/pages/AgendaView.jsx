import { useState } from 'react'
import Icon from '../components/Icon'
import { formatarData } from '../utils/format'

export default function AgendaView({ tarefas, abrirTarefa }) {
  const [diaSelecionado, setDiaSelecionado] = useState(() => new Date())
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })

  const hoje = new Date()
  const chaveDoDia = (data) => `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
  const chaveHoje = chaveDoDia(hoje)
  const chaveSelecionada = chaveDoDia(diaSelecionado)
  const primeiroDia = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), 1)
  const inicioCalendario = new Date(primeiroDia)
  inicioCalendario.setDate(primeiroDia.getDate() - ((primeiroDia.getDay() + 6) % 7))
  const dias = Array.from({ length: 42 }, (_, indice) => {
    const data = new Date(inicioCalendario)
    data.setDate(inicioCalendario.getDate() + indice)
    return data
  })
  const tarefasDoDia = (tarefas ?? [])
    .filter((tarefa) => chaveDoDia(new Date(tarefa.criadaEm)) === chaveSelecionada)
    .sort((a, b) => a.criadaEm - b.criadaEm)
  const tarefasPorHora = Array.from({ length: 24 }, (_, hora) => ({
    hora,
    tarefas: tarefasDoDia.filter((tarefa) => new Date(tarefa.criadaEm).getHours() === hora),
  }))
  const diasComTarefas = new Set((tarefas ?? []).map((tarefa) => chaveDoDia(new Date(tarefa.criadaEm))))

  function mudarMes(diferenca) {
    setMesVisivel((atual) => new Date(atual.getFullYear(), atual.getMonth() + diferenca, 1))
  }

  function selecionarDia(data) {
    setDiaSelecionado(data)
    setMesVisivel(new Date(data.getFullYear(), data.getMonth(), 1))
  }

  return (
    <section className="agenda-page" aria-label="Agenda">
      <div className="agenda-layout">
        <section className="calendar-panel" aria-label="Calendário mensal">
          <div className="calendar-heading">
            <h2>{formatarData(mesVisivel, { month: 'long', year: 'numeric' })}</h2>
            <div className="calendar-controls">
              <button className="agenda-today-button" type="button" onClick={() => selecionarDia(hoje)}>
                Hoje
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Mês anterior"
                onClick={() => mudarMes(-1)}
              >
                <Icon name="chevronLeft" size={21} />
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Próximo mês"
                onClick={() => mudarMes(1)}
              >
                <Icon name="chevronRight" size={21} />
              </button>
            </div>
          </div>

          <div className="calendar-grid calendar-weekdays" aria-hidden="true">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>
          <div className="calendar-grid calendar-days">
            {dias.map((data) => {
              const chave = chaveDoDia(data)
              const mesmoMes = data.getMonth() === mesVisivel.getMonth()
              return (
                <button
                  className={[
                    'calendar-day',
                    mesmoMes ? '' : 'is-outside',
                    chave === chaveHoje ? 'is-today' : '',
                    chave === chaveSelecionada ? 'is-selected' : '',
                    diasComTarefas.has(chave) ? 'has-tasks' : '',
                  ].filter(Boolean).join(' ')}
                  key={chave}
                  type="button"
                  aria-label={data.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  aria-pressed={chave === chaveSelecionada}
                  onClick={() => selecionarDia(data)}
                >
                  <span>{data.getDate()}</span>
                  {diasComTarefas.has(chave) && <i aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          <div className="calendar-legend">
            <span><i className="legend-today" /> Hoje</span>
            <span><i className="legend-task" /> Dia com tarefas</span>
          </div>
        </section>

        <section className="agenda-day-panel" aria-live="polite">
          <div className="agenda-day-heading">
            <div>
              <p className="agenda-eyebrow">RESUMO DO DIA</p>
              <h2>{formatarData(diaSelecionado, { weekday: 'long' })}</h2>
              <p className="agenda-date">
                {formatarData(diaSelecionado, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className="agenda-count">{tarefasDoDia.length}</span>
          </div>

          <div className="agenda-timeline" aria-label="Mapa de horários do dia">
            {!tarefasDoDia.length && (
              <div className="agenda-timeline-empty">
                <strong>Nenhuma tarefa neste dia</strong>
                <span>As tarefas adicionadas nesta data aparecerão no horário correspondente.</span>
              </div>
            )}
            {tarefasPorHora.map(({ hora, tarefas: tarefasDaHora }) => (
              <div className={`agenda-hour-row${tarefasDaHora.length ? ' has-events' : ''}`} key={hora}>
                <span className="agenda-hour-label">{String(hora).padStart(2, '0')}:00</span>
                <span className="agenda-hour-line" aria-hidden="true" />
                <div className="agenda-hour-events">
                  {tarefasDaHora.map((tarefa) => (
                    <button
                      className={`agenda-task${tarefa.concluida ? ' is-complete' : ''}`}
                      key={tarefa.id}
                      type="button"
                      onClick={() => abrirTarefa(tarefa.id)}
                    >
                      <span className="agenda-task-marker"><Icon name={tarefa.concluida ? 'check' : 'circle'} size={19} /></span>
                      <span className="agenda-task-copy">
                        <strong>{tarefa.titulo}</strong>
                        <small>{tarefa.concluida ? 'Concluída' : 'Pendente'} · {new Date(tarefa.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                      </span>
                      <Icon name="chevronRight" size={19} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
