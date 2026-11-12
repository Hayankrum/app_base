export function chaveDoDia(data) {
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
}

function tarefaConcluidaNoDia(tarefa, chave) {
  // Não existe um campo concluidaEm; atualizadaEm é a melhor aproximação
  // de quando a tarefa foi marcada/alterada por último.
  return tarefa.concluida && chaveDoDia(new Date(tarefa.atualizadaEm)) === chave
}

export function calcularProgresso(tarefas, agora = new Date()) {
  const ativas = (tarefas ?? []).filter((tarefa) => !tarefa.excluidaEm)
  const chaveHoje = chaveDoDia(agora)

  const tarefasDeHoje = ativas.filter((tarefa) => chaveDoDia(new Date(tarefa.criadaEm)) === chaveHoje)
  const concluidasDeHoje = tarefasDeHoje.filter((tarefa) => tarefa.concluida)
  const concluidasHoje = ativas
    .filter((tarefa) => tarefaConcluidaNoDia(tarefa, chaveHoje))
    .sort((a, b) => b.atualizadaEm - a.atualizadaEm)

  const total = ativas.length
  const concluidas = ativas.filter((tarefa) => tarefa.concluida).length
  const pendentes = total - concluidas

  const dias = Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - (6 - indice))
    const chave = chaveDoDia(data)
    return {
      chave,
      data,
      hoje: chave === chaveHoje,
      semana: data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      criadas: ativas.filter((tarefa) => chaveDoDia(new Date(tarefa.criadaEm)) === chave).length,
      concluidas: ativas.filter((tarefa) => tarefaConcluidaNoDia(tarefa, chave)).length,
    }
  })

  let sequencia = 0
  for (let indice = 0; indice < 365; indice += 1) {
    const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - indice)
    const chave = chaveDoDia(data)
    const teveConclusao = ativas.some((tarefa) => tarefaConcluidaNoDia(tarefa, chave))
    if (teveConclusao) {
      sequencia += 1
    } else if (indice > 0) {
      break
    }
  }

  return {
    total,
    concluidas,
    pendentes,
    tarefasDeHoje: tarefasDeHoje.length,
    concluidasDeHoje: concluidasDeHoje.length,
    pendentesDeHoje: tarefasDeHoje.length - concluidasDeHoje.length,
    concluidasHoje,
    percentualHoje: tarefasDeHoje.length
      ? Math.round((concluidasDeHoje.length / tarefasDeHoje.length) * 100)
      : 0,
    percentualGeral: total ? Math.round((concluidas / total) * 100) : 0,
    sequencia,
    dias,
    maximoDia: Math.max(1, ...dias.map((dia) => Math.max(dia.criadas, dia.concluidas))),
    concluidasNaSemana: dias.reduce((soma, dia) => soma + dia.concluidas, 0),
  }
}
