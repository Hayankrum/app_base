export const LIMITE_TAREFAS_GRATIS = 20

export const PLANOS = [
  {
    id: 'free',
    nome: 'Grátis',
    descricao: 'Para organizar o dia a dia.',
    limiteTarefas: LIMITE_TAREFAS_GRATIS,
    precos: { mes: 0, ano: 0 },
    recursos: [
      `Até ${LIMITE_TAREFAS_GRATIS} tarefas ativas`,
      'Agenda e progresso diário',
      'Sincronização entre dispositivos',
    ],
  },
  {
    id: 'pro',
    nome: 'Pro',
    descricao: 'Para quem precisa de espaço sem limites.',
    limiteTarefas: null,
    precos: { mes: 19.9, ano: 199 },
    recursos: [
      'Tarefas ilimitadas',
      'Agenda e progresso diário',
      'Sincronização entre dispositivos',
      'Suporte prioritário',
    ],
  },
]

export const PLANO_PADRAO = 'free'

export function obterPlano(id) {
  return PLANOS.find((plano) => plano.id === id) ?? PLANOS[0]
}

export function limiteDoPlano(id) {
  return obterPlano(id).limiteTarefas
}
