import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import {
  adicionarTarefa,
  alternarTarefa,
  excluirPermanentemente,
  moverParaLixeira,
  restaurarTarefa,
} from '../repo'
import { useSync } from '../hooks/useSync'
import { useBilling } from '../hooks/useBilling'
import Icon from '../components/Icon'
import LimitDialog from '../components/LimitDialog'
import SideMenu from '../components/SideMenu'
import TaskDialog from '../components/TaskDialog'
import TaskGrid from '../components/TaskGrid'
import TaskDetail from '../components/TaskDetail'
import AgendaView from './AgendaView'
import PlansPage from './PlansPage'
import ProgressPage from './ProgressPage'
import SettingsPage from './SettingsPage'
import TrashPage from './TrashPage'

export default function TaskApp({ session, onLogout, onVerApresentacao }) {
  const [titulo, setTitulo] = useState('')
  const [busca, setBusca] = useState('')
  const [detalheId, setDetalheId] = useState(null)
  const [criando, setCriando] = useState(false)
  const [lista, setLista] = useState(false)
  const [maisRecentes, setMaisRecentes] = useState(true)
  const [fixadas, setFixadas] = useState(() => new Set())
  const [menuAberto, setMenuAberto] = useState(false)
  const [agendaAberta, setAgendaAberta] = useState(false)
  const [progressoAberto, setProgressoAberto] = useState(false)
  const [planosAberto, setPlanosAberto] = useState(
    () => new URLSearchParams(window.location.search).has('checkout')
  )
  const [configuracoesAbertas, setConfiguracoesAbertas] = useState(false)
  const [limiteDialogAberto, setLimiteDialogAberto] = useState(false)
  const [filtro, setFiltro] = useState('todas')
  const tarefas = useLiveQuery(() => db.tarefas.orderBy('criadaEm').toArray(), [])
  const pendentes = useLiveQuery(() => db.outbox.count(), [])

  useSync()
  const { billing, carregando: carregandoBilling, erro: erroBilling, atualizar: atualizarBilling } = useBilling()

  const tarefaAtual = tarefas?.find((tarefa) => tarefa.id === detalheId)
  const limiteTarefas = billing?.limites?.tarefas ?? null
  const tarefasAtivas = (tarefas ?? []).filter((tarefa) => !tarefa.excluidaEm).length
  const limiteAtingido = limiteTarefas != null && tarefasAtivas >= limiteTarefas

  useEffect(() => {
    if (!menuAberto || tarefaAtual) return undefined

    function fecharComEscape(event) {
      if (event.key === 'Escape') setMenuAberto(false)
    }

    document.addEventListener('keydown', fecharComEscape)
    return () => document.removeEventListener('keydown', fecharComEscape)
  }, [menuAberto, tarefaAtual])

  // Ao voltar do Stripe, o webhook pode levar alguns segundos para confirmar.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('checkout')) return undefined
    const timer = window.setTimeout(atualizarBilling, 2500)
    return () => window.clearTimeout(timer)
  }, [atualizarBilling])

  const tarefasVisiveis = useMemo(() => {
    const consulta = busca.trim().toLocaleLowerCase('pt-BR')
    return [...(tarefas ?? [])]
      .filter((tarefa) => tarefa.titulo.toLocaleLowerCase('pt-BR').includes(consulta))
      .filter((tarefa) => filtro === 'lixeira' ? Boolean(tarefa.excluidaEm) : !tarefa.excluidaEm)
      .sort((a, b) => {
        const fixada = Number(fixadas.has(b.id)) - Number(fixadas.has(a.id))
        if (fixada) return fixada
        return maisRecentes ? b.criadaEm - a.criadaEm : a.criadaEm - b.criadaEm
      })
  }, [busca, filtro, fixadas, maisRecentes, tarefas])

  function selecionarFiltro(novoFiltro) {
    setFiltro(novoFiltro)
    setAgendaAberta(false)
    setProgressoAberto(false)
    setPlanosAberto(false)
    setConfiguracoesAbertas(false)
    setBusca('')
    setMenuAberto(false)
  }

  function abrirAgenda() {
    setAgendaAberta(true)
    setProgressoAberto(false)
    setPlanosAberto(false)
    setConfiguracoesAbertas(false)
    setFiltro('todas')
    setMenuAberto(false)
  }

  function abrirProgresso() {
    setProgressoAberto(true)
    setAgendaAberta(false)
    setPlanosAberto(false)
    setConfiguracoesAbertas(false)
    setFiltro('todas')
    setMenuAberto(false)
  }

  function abrirPlanos() {
    setPlanosAberto(true)
    setAgendaAberta(false)
    setProgressoAberto(false)
    setConfiguracoesAbertas(false)
    setMenuAberto(false)
    setLimiteDialogAberto(false)
    atualizarBilling()
  }

  function abrirConfiguracoes() {
    setConfiguracoesAbertas(true)
    setAgendaAberta(false)
    setProgressoAberto(false)
    setPlanosAberto(false)
    setMenuAberto(false)
  }

  function abrirCriacao() {
    if (limiteAtingido) {
      setCriando(false)
      setMenuAberto(false)
      setLimiteDialogAberto(true)
      return
    }
    setCriando(true)
  }

  async function adicionar() {
    if (!titulo.trim()) return
    if (limiteAtingido) {
      setCriando(false)
      setLimiteDialogAberto(true)
      return
    }
    await adicionarTarefa(titulo.trim())
    setTitulo('')
    setCriando(false)
    atualizarBilling()
  }

  function alternarFixada(id) {
    setFixadas((atuais) => {
      const novas = new Set(atuais)
      if (novas.has(id)) novas.delete(id)
      else novas.add(id)
      return novas
    })
  }

  async function excluirAtual() {
    if (!tarefaAtual) return
    if (tarefaAtual.excluidaEm) {
      if (!window.confirm(`Excluir "${tarefaAtual.titulo}" permanentemente? Esta ação não pode ser desfeita.`)) return
      await excluirPermanentemente(tarefaAtual.id)
    } else {
      await moverParaLixeira(tarefaAtual.id)
    }
    setDetalheId(null)
    setMenuAberto(false)
    atualizarBilling()
  }

  async function restaurar(id) {
    if (limiteAtingido) {
      setLimiteDialogAberto(true)
      return
    }
    await restaurarTarefa(id)
    atualizarBilling()
  }

  async function restaurarAtual() {
    if (!tarefaAtual) return
    await restaurar(tarefaAtual.id)
    setDetalheId(null)
    setMenuAberto(false)
  }

  async function excluirPermanentementePorId(id) {
    const tarefa = tarefas?.find((item) => item.id === id)
    if (!tarefa || !window.confirm(`Excluir "${tarefa.titulo}" permanentemente? Esta ação não pode ser desfeita.`)) return
    await excluirPermanentemente(id)
    atualizarBilling()
  }

  return (
    <main className={tarefaAtual ? 'app app--detail' : 'app'}>
      {!tarefaAtual ? (
        <>
          <header className="home-header">
            <button
              className="icon-button header-menu-button"
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuAberto((aberto) => !aberto)}
            >
              <Icon name="menu" />
            </button>
            <label className="search-bar">
              <Icon name="search" size={22} />
              <input
                aria-label="Pesquisar tarefas"
                placeholder="Pesquisar tarefas"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
              <button
                className="search-action"
                type="button"
                aria-label={lista ? 'Mostrar em grade' : 'Mostrar em lista'}
                onClick={() => setLista((atual) => !atual)}
              >
                <Icon name={lista ? 'grid' : 'list'} size={23} />
              </button>
              <button
                className="search-action"
                type="button"
                aria-label="Alternar ordem"
                onClick={() => setMaisRecentes((atual) => !atual)}
              >
                <Icon name="sort" size={23} />
              </button>
            </label>
            <div className="profile-avatar" aria-label={`Usuário ${session.usuario.email}`}>
              {session.usuario.email.charAt(0).toLocaleUpperCase('pt-BR')}
            </div>
          </header>

          <SideMenu
            aberto={menuAberto}
            agendaAberta={agendaAberta}
            progressoAberto={progressoAberto}
            planosAberto={planosAberto}
            configuracoesAbertas={configuracoesAbertas}
            filtro={filtro}
            pendentes={pendentes}
            session={session}
            onFechar={() => setMenuAberto(false)}
            onSelecionarFiltro={selecionarFiltro}
            onAbrirAgenda={abrirAgenda}
            onAbrirProgresso={abrirProgresso}
            onAbrirPlanos={abrirPlanos}
            onAbrirConfiguracoes={abrirConfiguracoes}
            onLogout={onLogout}
          />

          {agendaAberta ? (
            <AgendaView tarefas={tarefasVisiveis} abrirTarefa={setDetalheId} />
          ) : progressoAberto ? (
            <ProgressPage tarefas={tarefas} abrirTarefa={setDetalheId} />
          ) : planosAberto ? (
            <PlansPage
              billing={billing}
              carregando={carregandoBilling}
              erro={erroBilling}
              onAtualizar={atualizarBilling}
            />
          ) : configuracoesAbertas ? (
            <SettingsPage
              session={session}
              onLogout={onLogout}
              onVerApresentacao={onVerApresentacao}
            />
          ) : filtro === 'lixeira' ? (
            <TrashPage
              tarefas={tarefasVisiveis}
              lista={lista}
              busca={busca}
              abrirTarefa={setDetalheId}
              onRestaurar={restaurar}
              onExcluirPermanentemente={excluirPermanentementePorId}
            />
          ) : (
            <TaskGrid
              tarefas={tarefasVisiveis}
              lista={lista}
              fixadas={fixadas}
              busca={busca}
              abrirTarefa={setDetalheId}
              alternarTarefa={alternarTarefa}
            />
          )}

          {!agendaAberta && !progressoAberto && !planosAberto && !configuracoesAbertas && filtro !== 'lixeira' && (
            <button
              className="fab"
              type="button"
              aria-label="Adicionar tarefa"
              onClick={abrirCriacao}
            >
              <Icon name="add" size={34} />
            </button>
          )}

          {criando && (
            <TaskDialog
              titulo={titulo}
              onTituloChange={setTitulo}
              onFechar={() => setCriando(false)}
              onCriar={adicionar}
            />
          )}

          {limiteDialogAberto && (
            <LimitDialog
              limite={limiteTarefas}
              onFechar={() => setLimiteDialogAberto(false)}
              onVerPlanos={abrirPlanos}
            />
          )}
        </>
      ) : (
        <TaskDetail
          tarefa={tarefaAtual}
          fixada={fixadas.has(tarefaAtual.id)}
          menuAberto={menuAberto}
          onVoltar={() => { setDetalheId(null); setMenuAberto(false) }}
          onRestaurar={restaurarAtual}
          onAlternarFixada={() => alternarFixada(tarefaAtual.id)}
          onAlternarTarefa={() => alternarTarefa(tarefaAtual)}
          onExcluir={excluirAtual}
          onToggleMenu={() => setMenuAberto((aberto) => !aberto)}
        />
      )}
    </main>
  )
}
