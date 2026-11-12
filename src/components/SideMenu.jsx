import Icon from './Icon'

export default function SideMenu({
  aberto,
  agendaAberta,
  progressoAberto,
  planosAberto,
  configuracoesAbertas,
  filtro,
  pendentes,
  session,
  onFechar,
  onSelecionarFiltro,
  onAbrirAgenda,
  onAbrirProgresso,
  onAbrirPlanos,
  onAbrirConfiguracoes,
  onLogout,
}) {
  const naLista = !agendaAberta && !progressoAberto && !planosAberto && !configuracoesAbertas

  return (
    <div className={`side-menu-overlay${aberto ? ' is-open' : ''}`} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onFechar()
    }}>
      <aside className="side-menu" role="dialog" aria-modal="true" aria-label="Navegação">
        <div className="side-menu-brand">
          <span className="side-menu-logo"><Icon name="calendar" size={23} /></span>
          <span>Organização</span>
        </div>
        <nav className="side-menu-nav" aria-label="Seções">
          <button
            className={naLista && filtro === 'todas' ? 'is-selected' : ''}
            type="button"
            aria-current={naLista && filtro === 'todas' ? 'page' : undefined}
            onClick={() => onSelecionarFiltro('todas')}
          >
            <Icon name="check" size={23} /> Início
          </button>
          <button
            className={agendaAberta ? 'is-selected' : ''}
            type="button"
            aria-current={agendaAberta ? 'page' : undefined}
            onClick={onAbrirAgenda}
          >
            <Icon name="calendar" size={23} /> Agenda
          </button>
          <button
            className={progressoAberto ? 'is-selected' : ''}
            type="button"
            aria-current={progressoAberto ? 'page' : undefined}
            onClick={onAbrirProgresso}
          >
            <Icon name="chart" size={23} /> Progresso
          </button>
          <button
            className={planosAberto ? 'is-selected' : ''}
            type="button"
            aria-current={planosAberto ? 'page' : undefined}
            onClick={onAbrirPlanos}
          >
            <Icon name="card" size={23} /> Planos
          </button>
          <button
            className={naLista && filtro === 'lixeira' ? 'is-selected' : ''}
            type="button"
            aria-current={naLista && filtro === 'lixeira' ? 'page' : undefined}
            onClick={() => onSelecionarFiltro('lixeira')}
          >
            <Icon name="trash" size={23} /> Lixeira
          </button>
          <button
            className={configuracoesAbertas ? 'is-selected' : ''}
            type="button"
            aria-current={configuracoesAbertas ? 'page' : undefined}
            onClick={onAbrirConfiguracoes}
          >
            <Icon name="settings" size={23} /> Ajustes
          </button>
        </nav>
        <div className="side-menu-footer">
          <div className="side-menu-sync">
            <span className={`sync-indicator${pendentes ? ' is-pending' : ''}`} />
            <span>{pendentes ? `${pendentes} alteração(ões) aguardando sincronização` : 'Tudo sincronizado'}</span>
          </div>
          <div className="side-menu-account">
            <span className="side-menu-account-email" title={session.usuario.email}>
              {session.usuario.email}
            </span>
            <button
              className="side-menu-logout"
              type="button"
              aria-label="Sair da conta"
              title="Sair da conta"
              onClick={onLogout}
            >
              <Icon name="logout" size={20} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
