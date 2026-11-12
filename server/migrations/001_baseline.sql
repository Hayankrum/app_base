-- Baseline idempotente: reflete o schema atual e adiciona a infraestrutura de
-- sessão, relógio por usuário, idempotência de sync e eventos do Stripe.
-- Pode ser executada em um banco novo ou em um banco criado pelo DDL antigo.

create table if not exists usuarios (
  id text primary key,
  email text not null unique,
  senha_hash text not null,
  criado_em timestamptz not null default now()
);

alter table usuarios
  add column if not exists relogio bigint not null default 0;

create table if not exists tarefas (
  id text primary key,
  user_id text not null references usuarios(id) on delete cascade,
  titulo text not null,
  concluida boolean not null default false,
  criada_em bigint not null,
  atualizada_em bigint not null,
  deletado_em bigint,
  servidor_em bigint not null,
  lixeira_em bigint
);

alter table tarefas
  add column if not exists lixeira_em bigint;

create index if not exists tarefas_user_servidor_idx
  on tarefas (user_id, servidor_em);

create table if not exists sessoes (
  id text primary key,
  user_id text not null references usuarios(id) on delete cascade,
  token_hash text not null unique,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  ultimo_uso_em timestamptz not null default now(),
  ip text,
  user_agent text,
  revogada_em timestamptz
);

create index if not exists sessoes_user_idx on sessoes (user_id);
create index if not exists sessoes_expira_idx on sessoes (expira_em);

create table if not exists assinaturas (
  user_id text primary key references usuarios(id) on delete cascade,
  plano text not null default 'free',
  status text not null default 'active',
  intervalo text,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  periodo_fim timestamptz,
  cancel_at_period_end boolean not null default false,
  ultimo_evento_em bigint,
  atualizado_em timestamptz not null default now()
);

alter table assinaturas
  add column if not exists cancel_at_period_end boolean not null default false;

alter table assinaturas
  add column if not exists ultimo_evento_em bigint;

create index if not exists assinaturas_customer_idx
  on assinaturas (stripe_customer_id);

create table if not exists stripe_eventos (
  id text primary key,
  tipo text not null,
  criado_em timestamptz,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);

create index if not exists stripe_eventos_recebido_idx
  on stripe_eventos (recebido_em);

create table if not exists sync_mutations (
  id text primary key,
  user_id text not null references usuarios(id) on delete cascade,
  registro_id text not null,
  resultado jsonb not null,
  aplicada_em bigint not null,
  criado_em timestamptz not null default now()
);

create index if not exists sync_mutations_user_idx
  on sync_mutations (user_id);

create index if not exists sync_mutations_criado_idx
  on sync_mutations (criado_em);

-- Mantém o contador monotônico alinhado com os dados que já existiam.
update usuarios u
set relogio = greatest(
  u.relogio,
  coalesce((select max(t.servidor_em) from tarefas t where t.user_id = u.id), 0)
)
where u.relogio = 0;
