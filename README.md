# Meu PWA

## Desenvolvimento local

Instale as dependências uma única vez na raiz:

```sh
npm install
```

Inicie o frontend e a API juntos com um único comando:

```sh
npm run dev
```

A API usa `server/.env` para carregar `DATABASE_URL` e `PORT` (por padrão,
`3001`). O Vite encaminha as rotas `/auth`, `/billing` e `/sync` para essa API
durante o desenvolvimento. Configure também `JWT_SECRET` com uma chave aleatória
de pelo menos 32 caracteres, por exemplo gerada com
`openssl rand -base64 48`. Para iniciar somente a API, use `npm run
dev:server`.

## Deploy na Vercel

O projeto já está configurado para a Vercel:

- `vercel.json` publica o frontend Vite gerado em `dist/` no CDN e encaminha
  `/auth`, `/billing`, `/sync` e `/health` para uma única Vercel Function.
- `api/index.js` inicializa o Express no formato serverless.
- O fallback de SPA devolve `index.html` para rotas do React.
- O service worker (`sw.js`) e o manifest são servidos sem cache longo.

### 1. Banco de dados

A Vercel não hospeda um PostgreSQL persistente. Crie um banco externo (Neon,
Supabase, Railway, Amazon RDS etc.) e copie a URL de conexão. Prefira a URL
**pooled** do provedor, indicada para ambientes serverless.

### 2. Importar o projeto

Importe o repositório em [vercel.com/new](https://vercel.com/new). A Vercel
detecta o Vite e usa:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install` (instala também o workspace `server`)

### 3. Variáveis de ambiente

Configure no dashboard da Vercel, em **Settings → Environment Variables**:

```sh
DATABASE_URL=postgres://...        # URL pooled do banco
JWT_SECRET=...                     # pelo menos 32 caracteres
APP_URL=https://seu-dominio.com    # opcional; sem ela usamos o domínio da Vercel
MIGRATE_ON_START=true              # padrão: aplica migrações no primeiro acesso
```

Se usar pagamentos, adicione também `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY` e
`STRIPE_PRICE_PRO_YEARLY`. Não defina `PORT` na Vercel e não configure
`VITE_API_URL`: frontend e API compartilham o mesmo domínio.

### 4. Migrações do banco

Com `MIGRATE_ON_START=true` (padrão), a migração `001_baseline.sql` é aplicada
automaticamente na primeira requisição. Para controlar isso manualmente, defina
`MIGRATE_ON_START=false` e rode uma vez, apontando para o banco de produção:

```sh
DATABASE_URL='postgres://...' npm run db:migrate
```

Em projetos com Preview Deployments, use um banco separado para preview ou
desative as migrações automáticas nos previews para não alterar o banco de
produção.

### 5. Stripe

Cadastre o webhook apontando para `https://seu-dominio.com/billing/webhook` e
escute os mesmos eventos descritos na seção de pagamentos abaixo. `APP_URL` deve
ser o domínio público usado nos redirecionamentos do Checkout.

### 6. Verificar o deploy

Depois do deploy, acesse `https://seu-dominio.com/health`. A resposta deve ser
`{"ok":true}`. Se retornar 503, confira `DATABASE_URL` e se o banco aceita
conexões da Vercel.

## Produção: frontend e API no mesmo deploy

Esta seção vale para VPS, Railway, Render ou qualquer host que execute um
processo Node contínuo. Para a Vercel, use a seção anterior. O projeto usa npm
workspaces, então `npm install` na raiz instala também as dependências da API.
Para publicar, configure `DATABASE_URL`, `JWT_SECRET` (uma chave aleatória de
pelo menos 32 caracteres) e, se necessário, `PORT` no ambiente de hospedagem. O
comando de build e o comando de inicialização são:

```sh
npm run build
npm start
```

`npm run build` gera o frontend em `dist/`. `npm start` aplica as migrações
pendentes (quando `MIGRATE_ON_START=true`) e inicia o Express, que serve tanto os
arquivos desse diretório quanto as APIs `/auth`, `/billing` e `/sync` no mesmo
host e porta. Configure a hospedagem para executar `npm run build` no build e
`npm start` ao iniciar a aplicação. Não configure `VITE_API_URL` quando frontend
e API compartilham o mesmo domínio.

O PostgreSQL continua sendo um serviço separado: informe a URL dele em
`DATABASE_URL` e mantenha o banco persistente. Para preparar um banco novo,
execute este SQL. O usuário do banco precisa ter permissão para criar tabelas e
índices:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tarefas (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  criada_em bigint NOT NULL,
  atualizada_em bigint NOT NULL,
  deletado_em bigint,
  servidor_em bigint NOT NULL,
  lixeira_em bigint
);

CREATE INDEX IF NOT EXISTS tarefas_user_servidor_idx
  ON tarefas (user_id, servidor_em);
```

O servidor cria a tabela `usuarios` no primeiro cadastro e adiciona `lixeira_em`
se faltar em uma tabela `tarefas` existente.

O aplicativo oferece cadastro e login por e-mail e senha (mínimo de 8
caracteres). A tabela `usuarios` é criada automaticamente na primeira operação
de autenticação; o usuário do banco precisa ter permissão para criá-la. As senhas
são armazenadas com hash e salt, e o token de sessão assinado expira em 30 dias.
Defina `JWT_SECRET` como um segredo persistente e privado: alterá-lo invalida as
sessões existentes. As rotas de sincronização exigem login, e os dados locais e
remotos de cada conta são isolados.

Tarefas movidas para a lixeira podem ser restauradas e ficam lá por 3 dias.
Depois desse prazo, são apagadas definitivamente automaticamente, tanto no
cliente quanto no servidor. A exclusão permanente sincroniza a remoção com os
outros dispositivos e é definitiva: alterações antigas que ainda estejam na
fila de um aparelho offline não recriam a tarefa. O servidor também ignora um
upsert que tentaria retirar da lixeira uma tarefa sem uma restauração explícita
mais recente.

## Planos e pagamentos com Stripe

O projeto tem dois planos:

- **Grátis**: até 20 tarefas ativas, com agenda, progresso e sincronização.
- **Pro**: tarefas ilimitadas, cobrado mensal ou anualmente.

O catálogo de planos fica em `server/billing/plans.js`. A cobrança usa o Stripe
Checkout e o Portal de Cobrança. A tabela `assinaturas` é criada
automaticamente pelo servidor na primeira consulta de assinatura; ela guarda o
plano, o status, o intervalo, os IDs do Stripe e a data de renovação.

### Variáveis de ambiente

Adicione as variáveis abaixo ao seu `server/.env` (há um modelo em
`server/.env.example`):

```sh
APP_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
```

`APP_URL` deve ser a URL pública do frontend. Em produção, use o domínio real.
Sem `STRIPE_SECRET_KEY`, a página de planos continua acessível, mas os botões
de assinatura ficam desabilitados.

### Configuração no dashboard do Stripe

1. Crie o produto **Pro** e dois preços recorrentes: mensal e anual, em BRL.
2. Copie os IDs dos preços para `STRIPE_PRICE_PRO_MONTHLY` e
   `STRIPE_PRICE_PRO_YEARLY`.
3. Cadastre um endpoint de webhook apontando para
   `https://seu-dominio/billing/webhook`.
4. Escute os eventos `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated` e
   `customer.subscription.deleted`.
5. Copie o segredo de assinatura do webhook para `STRIPE_WEBHOOK_SECRET`.

Durante o desenvolvimento, é possível encaminhar os eventos para a API local:

```sh
stripe listen --forward-to localhost:3001/billing/webhook
```

O Stripe CLI mostra um `whsec_...` temporário; use-o em
`STRIPE_WEBHOOK_SECRET`.

### Fluxo de assinatura

- `GET /billing` retorna catálogo, plano atual, uso e limites.
- `POST /billing/checkout` cria a sessão do Stripe Checkout.
- `POST /billing/portal` abre o Portal de Cobrança para gerenciar/cancelar.
- `POST /billing/webhook` sincroniza o status real da assinatura.

O limite de tarefas é aplicado no cliente, que bloqueia a criação e mostra o
diálogo de upgrade ao atingir o teto do plano Grátis. Como o app é offline-first,
o servidor não descarta tarefas criadas offline que ultrapassem o limite; o
controle é feito na interface para evitar perda de dados.

