import { useState } from 'react'
import Icon from '../components/Icon'

const TAREFAS_EXEMPLO = [
  { titulo: 'Revisar o projeto', concluida: true },
  { titulo: 'Responder aos e-mails', concluida: true },
  { titulo: 'Planejar a semana', concluida: false },
  { titulo: 'Estudar 30 minutos', concluida: false },
]

const DIAS_DA_SEMANA = [
  { nome: 'seg', numero: 10 },
  { nome: 'ter', numero: 11 },
  { nome: 'qua', numero: 12 },
  { nome: 'qui', numero: 13 },
  { nome: 'sex', numero: 14 },
  { nome: 'sáb', numero: 15 },
  { nome: 'dom', numero: 16 },
]

function VisualTarefas() {
  return (
    <div className="welcome-preview" aria-hidden="true">
      <div className="welcome-preview-top">
        <strong>Hoje</strong>
        <span>2 de 4</span>
      </div>
      <ul className="welcome-preview-list">
        {TAREFAS_EXEMPLO.map((tarefa) => (
          <li className={tarefa.concluida ? 'is-done' : ''} key={tarefa.titulo}>
            <span className="welcome-preview-check">
              {tarefa.concluida && <Icon name="check" size={12} />}
            </span>
            {tarefa.titulo}
          </li>
        ))}
      </ul>
      <div className="welcome-preview-progress">
        <span />
      </div>
    </div>
  )
}

function VisualAgenda() {
  return (
    <div className="welcome-preview" aria-hidden="true">
      <div className="welcome-preview-top">
        <strong>Agenda</strong>
        <span>Esta semana</span>
      </div>
      <div className="welcome-week">
        {DIAS_DA_SEMANA.map((dia, indice) => (
          <div
            className={`welcome-week-day${indice === 3 ? ' is-active' : ''}`}
            key={dia.nome}
          >
            <span>{dia.nome}</span>
            <strong>{dia.numero}</strong>
          </div>
        ))}
      </div>
      <ul className="welcome-preview-list">
        <li>
          <span className="welcome-preview-check" />
          Planejar a semana
        </li>
        <li className="is-done">
          <span className="welcome-preview-check"><Icon name="check" size={12} /></span>
          Revisar o projeto
        </li>
        <li>
          <span className="welcome-preview-check" />
          Estudar 30 minutos
        </li>
      </ul>
    </div>
  )
}

function VisualProgresso() {
  return (
    <div className="welcome-preview" aria-hidden="true">
      <div className="welcome-preview-top">
        <strong>Progresso</strong>
        <span>Hoje</span>
      </div>
      <div className="welcome-progress-body">
        <div className="welcome-ring"><span>64%</span></div>
        <div className="welcome-mini-stats">
          <div><strong>8</strong><span>concluídas</span></div>
          <div><strong>5</strong><span>pendentes</span></div>
          <div><strong>7</strong><span>dias seguidos</span></div>
        </div>
      </div>
    </div>
  )
}

const VISUAIS = {
  tarefas: VisualTarefas,
  agenda: VisualAgenda,
  progresso: VisualProgresso,
}

export default function OnboardingPage({ session, onComecar }) {
  const [passo, setPasso] = useState(0)
  const email = session?.usuario?.email ?? ''
  const nome = email.split('@')[0]
  const nomeExibicao = nome ? nome.charAt(0).toLocaleUpperCase('pt-BR') + nome.slice(1) : ''

  const passos = [
    {
      eyebrow: 'BEM-VINDO',
      titulo: `Olá${nomeExibicao ? `, ${nomeExibicao}` : ''}.`,
      subtitulo: 'Seu dia mais leve começa aqui.',
      texto: 'Este é o seu espaço para organizar tarefas, planejar a semana e acompanhar o progresso — com ou sem internet.',
      visual: 'tarefas',
    },
    {
      eyebrow: 'TAREFAS E AGENDA',
      titulo: 'Tudo o que importa, em um só lugar.',
      texto: 'Crie tarefas, fixe as mais importantes e planeje a semana na agenda. Suas alterações ficam salvas mesmo quando você está offline.',
      visual: 'agenda',
    },
    {
      eyebrow: 'PROGRESSO E PLANOS',
      titulo: 'Acompanhe o seu ritmo.',
      texto: 'Veja o que você concluiu no dia e na semana. Comece grátis com até 20 tarefas ativas e mude para o Pro quando quiser.',
      visual: 'progresso',
    },
  ]

  const atual = passos[passo]
  const Visual = VISUAIS[atual.visual]
  const ultimoPasso = passo === passos.length - 1
  const percentual = ((passo + 1) / passos.length) * 100

  function avancar() {
    if (ultimoPasso) {
      onComecar()
      return
    }
    setPasso((indice) => Math.min(indice + 1, passos.length - 1))
  }

  function voltar() {
    setPasso((indice) => Math.max(indice - 1, 0))
  }

  return (
    <main className="welcome-page">
      <section className="welcome-shell" aria-labelledby="welcome-title">
        <header className="welcome-top">
          <div className="welcome-brand">
            <span className="welcome-logo"><Icon name="calendar" size={22} /></span>
            <span>Organização</span>
          </div>
          <button className="welcome-exit" type="button" onClick={onComecar}>
            Pular
          </button>
        </header>

        <div className="welcome-progress-wrap">
          <div
            className="welcome-progress-track"
            role="progressbar"
            aria-label={`Passo ${passo + 1} de ${passos.length}`}
            aria-valuemin={1}
            aria-valuemax={passos.length}
            aria-valuenow={passo + 1}
          >
            <span style={{ width: `${percentual}%` }} />
          </div>
          <span className="welcome-progress-label">{passo + 1} de {passos.length}</span>
        </div>

        <div className="welcome-step" key={passo}>
          <div className="welcome-hero">
            <div className="welcome-copy">
              <p className="welcome-eyebrow">{atual.eyebrow}</p>
              <h1 id="welcome-title">{atual.titulo}</h1>
              {atual.subtitulo && <p className="welcome-subtitle">{atual.subtitulo}</p>}
              <p className="welcome-lead">{atual.texto}</p>
            </div>
            <Visual />
          </div>

          <div className="welcome-nav">
            <button
              className="welcome-back"
              type="button"
              onClick={voltar}
              disabled={passo === 0}
            >
              <Icon name="chevronLeft" size={18} />
              Voltar
            </button>
            <button className="welcome-cta" type="button" onClick={avancar}>
              {ultimoPasso ? 'Começar a usar' : 'Próximo'}
              <Icon name={ultimoPasso ? 'check' : 'chevronRight'} size={19} />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
