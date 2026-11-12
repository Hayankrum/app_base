import Dexie from 'dexie'

function criarBanco(nome) {
  const banco = new Dexie(nome)

  banco.version(1).stores({
    tarefas: 'id, criadaEm, atualizadaEm',
    outbox: '++seq',
    meta: 'chave',
  })

  banco.version(2).stores({
    tarefas: 'id, criadaEm, atualizadaEm',
    outbox: '++seq, registroId',
    meta: 'chave',
  })

  return banco
}

export let db = criarBanco('MeuBancoV2')

export async function usarBancoDoUsuario(userId) {
  db.close()
  db = criarBanco(`MeuBancoV2-${userId}`)
  await db.open()
}