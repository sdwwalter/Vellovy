# 🏗️ Plano de Implementação — Vellovy SaaS v5
### SCLC-G · Baseado na SKILL Salão Premium · Abril 2026

---

## 🧭 Norte do Produto

> **Vellovy não é só agenda. É o sistema nervoso do salão.**
> O profissional abre no celular, fecha o caixa no Telegram, e sente que seu trabalho foi reconhecido.

Três diferenciais que nenhum concorrente de prateleira entrega juntos:
1. **Velocidade de campo** — PWA instalável, funciona com conexão ruim
2. **Bot Telegram como canal nativo** — não é integração. É feature core.
3. **Gamificação honesta** — reconhece trabalho real, não manipula

Toda decisão de arquitetura serve esses três pilares. Se não serve, não entra.

---

## 📍 Estado Atual (v3.2) — Diagnóstico Honesto

| Dimensão | Status | Severidade |
|---|---|---|
| Conflito de merge em `index.html` | 🔴 Não resolvido | **Bloqueador** |
| Supabase keys hardcoded em `app.js` | 🔴 Exposto no repositório público | **Emergência de segurança** |
| Stack (Vanilla JS, 3 arquivos) | 🟡 Funciona, não escala | Técnico |
| Auth (Supabase email + Google OAuth) | ✅ Funcional | — |
| Banco (1 tabela JSONB) | 🟡 Funciona, não permite índices ou RLS granular | Técnico |
| Sync offline (localStorage + debounce) | ✅ Funcional | — |
| Mobile (bottom nav, bottom sheet, FAB) | ✅ Responsivo | — |
| Bot Telegram (Deno Edge Function) | ✅ Funcional — **diferencial real** | — |
| Dark mode | ✅ Funcional | — |
| TypeScript | ❌ Ausente | Técnico |
| Gamificação | ❌ Ausente | Produto |
| Testes | ❌ Ausentes | Qualidade |
| CI/CD | ❌ Ausente | Infraestrutura |
| Error monitoring | ❌ Ausente | Infraestrutura |

### O que o plano v4 não tratou adequadamente

1. **As chaves do Supabase no repositório público são uma emergência imediata** — não um item de sprint.
2. **O bot Telegram é o diferencial #1** — o plano v4 o coloca no Sprint 8. Deveria ser protegido no dia zero.
3. **Nenhuma estratégia de CI/CD ou monitoring** — sem isso, cada deploy é um risco.
4. **O monorepo Turborepo tem custo de onboarding alto** — para um dev solo, há uma forma mais leve de chegar ao mesmo resultado.
5. **PWA no Sprint 9 é tarde demais** — os usuários atuais JÁ estão no mobile.
6. **Sem plano de rollback para migração JSONB** — se a migração quebrar dados de clientes reais, o produto morre.
7. **Sem infraestrutura SaaS** (planos, billing, trial) — limita crescimento.

---

## 🔴 Pré-Sprint: Emergências (Antes de Qualquer Código)

**Prazo: 1 dia. Não opcional.**

### E.1 — Rotacionar Chaves do Supabase Agora

```bash
# 1. Acessar dashboard.supabase.com → projeto → Settings → API
# 2. Gerar nova anon key + service_role key
# 3. Atualizar no Vercel/hosting: Environment Variables
# 4. Criar .env.local local com as novas chaves
# 5. Nunca mais commitar chaves — adicionar ao .gitignore

# .gitignore (adicionar se não existir)
.env.local
.env.*.local
*.env
```

### E.2 — Remover Chaves do Histórico Git

```bash
# Usar git-filter-repo (mais seguro que filter-branch)
pip install git-filter-repo

git filter-repo --path app.js --force
# ou remover linhas específicas com expressão
git filter-repo \
  --replace-text <(echo 'SUPABASE_URL==>REMOVED') \
  --force

# Forçar push (vai quebrar histórico local de colaboradores)
git push origin --force --all
git push origin --force --tags
```

> ⚠️ Se o repositório for público e as chaves estiverem expostas há mais de algumas horas, assuma que foram capturadas por bots de scanning. Rotacione sem demora, independente do git cleanup.

### E.3 — Resolver Conflito de Merge

```bash
# Verificar onde estão os marcadores
grep -n "<<<<<<\|=======\|>>>>>>>" index.html

# Resolver manualmente — preservar a versão mais recente de cada bloco
# Testar no browser depois de cada resolução
```

### E.4 — Verificar Integridade do App Atual

Antes de migrar qualquer coisa, documentar:
- Lista de todas as funcionalidades que funcionam hoje
- Print do banco JSONB (estrutura real dos dados)
- Backup completo do Supabase (dashboard → Project → Backups)

---

## 🎯 Destino — Vellovy v4.0

### Princípio de Arquitetura: Simples no Início, Escalável no Caminho

O plano v4 propõe Turborepo completo desde o Sprint 0. Isso é correto como destino, mas tem custo alto de configuração para um dev solo.

**Abordagem v5:** Criar a estrutura do monorepo, mas **sem a complexidade do Turborepo na Fase 1**. Usar `npm workspaces` simples. Migrar para Turborepo quando o app nativo (Expo) for necessário.

```
vellovy/
├── packages/
│   └── shared/                 ← TypeScript puro, sem build steps
│       ├── types/
│       ├── validators/
│       ├── stores/
│       └── lib/
│           ├── supabase/
│           └── formatters.ts
│
├── apps/
│   └── web/                    ← Next.js 15 (único app por ora)
│       ├── app/
│       ├── components/
│       └── public/
│           └── manifest.json   ← PWA desde o início
│
├── package.json               ← workspaces simples
└── .github/
    └── workflows/
        └── deploy.yml         ← CI/CD Vercel
```

### Stack Definitiva

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + PWA + deploy Vercel fácil |
| Estilo | Tailwind CSS | Tokens T_DESIGN como tema customizado |
| Estado | Zustand + persist | Simples, funciona offline, reutilizável no Expo futuro |
| Banco | Supabase (PostgreSQL normalizado) | RLS por salão, real-time, edge functions |
| Validação | Zod | Client + server, mesmos schemas |
| Formulários | React Hook Form + Zod | Integração nativa |
| Gráficos | Recharts | Leve, declarativo, funciona com SSR |
| Bot | Deno Edge Function (Supabase) | Já existe, só migrar queries |
| PWA | next-pwa | Instalável, offline parcial |
| CI/CD | GitHub Actions → Vercel | Deploy automático a cada push |
| Monitoring | Sentry (free tier) | Erros em produção capturados |
| Analytics | Plausible ou Vercel Analytics | Privado, sem cookies |

---

## 🚦 Roadmap — Sprints Reordenados

### Visão Geral

```
Emergência (E)     → Segurança + conflito git            [1 dia]
Sprint 0           → Fundação monorepo + tipos + schema  [3 dias]
Sprint 1           → Next.js Shell + Auth + PWA          [4 dias]  ← PWA desde o início
Sprint 2           → Agenda (módulo principal)           [4 dias]
Sprint 3           → Caixa + integração Agenda→Caixa     [3 dias]
Sprint 4           → Bot Telegram migrado + novos cmd    [2 dias]  ← antecipado
Sprint 5           → Clientes (CRM)                      [3 dias]
Sprint 6           → Financeiro unificado                [3 dias]
Sprint 7           → Dashboard conectado                 [2 dias]
Sprint 8           → Gamificação                         [2 dias]
Sprint 9           → Serviços + Configurações            [2 dias]
Sprint 10          → CI/CD + Monitoring + Testes         [2 dias]
```

**Total estimado:** ~31 dias úteis  
**Diferença do v4:** Mesma estimativa, ordem inteligente, sem emergências esquecidas.

---

### Sprint 0 — Fundação
**3 dias | Bloqueador de tudo**

#### 0.1 — Monorepo com npm workspaces

```json
// package.json (raiz)
{
  "name": "vellovy",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":   "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/web",
    "lint":  "npm run lint --workspace=apps/web"
  }
}
```

```json
// packages/shared/package.json
{
  "name": "@vellovy/shared",
  "version": "0.0.1",
  "main": "./index.ts",
  "types": "./index.ts"
}
```

#### 0.2 — Tipos TypeScript (contrato do sistema)

```typescript
// packages/shared/types/index.ts

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'realizado'
  | 'cancelado'
  | 'no_show';

export type SegmentoCliente =
  | 'nova'
  | 'regular'
  | 'fiel'
  | 'ausente'
  | 'inativa';

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'debito'
  | 'credito'
  | 'outro';

export interface Salao {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  plano: 'free' | 'pro' | 'enterprise';
  cor_primaria: string;
  cor_secundaria: string;
  fuso_horario: string;
  telegram_chat_id?: string;
  whatsapp_template?: string;
  created_at: string;
}

export interface Profissional {
  id: string;
  salao_id: string;
  nome: string;
  funcao: string;
  ativo: boolean;
  // Gamificação
  pontos_total: number;
  nivel: 1 | 2 | 3 | 4 | 5;
  streak_dias: number;
  badges: string[];
  ultima_atividade: string | null;
}

export interface Cliente {
  id: string;
  salao_id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  segmento: SegmentoCliente;
  total_gasto: number;   // centavos
  ultima_visita: string | null;
  total_visitas: number;
  observacoes?: string;
}

export interface Servico {
  id: string;
  salao_id: string;
  nome: string;
  preco_ideal: number;      // centavos
  custo_estimado: number;   // centavos
  duracao_minutos: number;
  categoria: 'cabelo' | 'unhas' | 'estetica' | 'barba' | 'outro';
  ativo: boolean;
}

export interface Agendamento {
  id: string;
  salao_id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora: string;          // ISO 8601
  duracao_minutos: number;
  status: StatusAgendamento;
  valor: number;              // centavos
  forma_pagamento?: FormaPagamento;
  observacoes?: string;
  criado_via_caixa: boolean;  // se foi lançado direto no caixa
  created_at: string;
  // Joins (opcional, quando carregado com relações)
  cliente?: Cliente;
  profissional?: Profissional;
  servico?: Servico;
}

export interface LancamentoCaixa {
  id: string;
  salao_id: string;
  agendamento_id?: string;    // link opcional com agenda
  data: string;               // YYYY-MM-DD
  cliente_nome: string;
  servico_id?: string;
  profissional_id?: string;
  valor: number;              // centavos
  forma_pagamento: FormaPagamento;
  tipo: 'servico' | 'produto';
  produto_id?: string;
  created_at: string;
}

export interface CustoFixo {
  id: string;
  salao_id: string;
  categoria: string;
  descricao: string;
  valor: number;    // centavos
  mes_ano: string;  // "2026-04"
}

export interface Repasse {
  id: string;
  salao_id: string;
  profissional_id: string;
  mes_ano: string;
  valor_total: number;    // centavos (base de cálculo)
  percentual: number;     // ex: 40 = 40%
  valor_repasse: number;  // centavos (calculado)
  pago: boolean;
}
```

#### 0.3 — Schema Supabase Normalizado

```sql
-- supabase/migrations/v2_normalized.sql
-- IMPORTANTE: Executar em staging primeiro, nunca direto em produção

-- Tabelas
CREATE TABLE IF NOT EXISTS saloes (
  id          uuid REFERENCES auth.users(id) PRIMARY KEY,
  nome        text NOT NULL,
  responsavel text,
  telefone    text,
  plano       text DEFAULT 'free' CHECK (plano IN ('free','pro','enterprise')),
  cor_primaria     text DEFAULT '#5C9A6B',
  cor_secundaria   text DEFAULT '#C9A84C',
  fuso_horario     text DEFAULT 'America/Sao_Paulo',
  telegram_chat_id text,
  whatsapp_template text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profissionais (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id     uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  nome         text NOT NULL,
  funcao       text DEFAULT 'profissional',
  ativo        boolean DEFAULT true,
  pontos_total int DEFAULT 0,
  nivel        smallint DEFAULT 1 CHECK (nivel BETWEEN 1 AND 5),
  streak_dias  int DEFAULT 0,
  badges       text[] DEFAULT '{}',
  ultima_atividade timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id        uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  nome            text NOT NULL,
  telefone        text,
  email           text,
  data_nascimento date,
  segmento        text DEFAULT 'nova'
    CHECK (segmento IN ('nova','regular','fiel','ausente','inativa')),
  total_gasto     bigint DEFAULT 0,
  ultima_visita   date,
  total_visitas   int DEFAULT 0,
  observacoes     text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id         uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  nome             text NOT NULL,
  preco_ideal      bigint DEFAULT 0,
  custo_estimado   bigint DEFAULT 0,
  duracao_minutos  int DEFAULT 60,
  categoria        text DEFAULT 'cabelo'
    CHECK (categoria IN ('cabelo','unhas','estetica','barba','outro')),
  ativo            boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id        uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  cliente_id      uuid REFERENCES clientes(id) ON DELETE SET NULL,
  profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  servico_id      uuid REFERENCES servicos(id) ON DELETE SET NULL,
  data_hora       timestamptz NOT NULL,
  duracao_minutos int DEFAULT 60,
  status          text DEFAULT 'agendado'
    CHECK (status IN ('agendado','confirmado','realizado','cancelado','no_show')),
  valor           bigint DEFAULT 0,
  forma_pagamento text CHECK (forma_pagamento IN ('dinheiro','pix','debito','credito','outro')),
  observacoes     text,
  criado_via_caixa boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lancamentos_caixa (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id        uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  agendamento_id  uuid REFERENCES agendamentos(id) ON DELETE SET NULL,
  data            date NOT NULL,
  cliente_nome    text NOT NULL,
  servico_id      uuid REFERENCES servicos(id) ON DELETE SET NULL,
  profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  valor           bigint NOT NULL,
  forma_pagamento text DEFAULT 'dinheiro'
    CHECK (forma_pagamento IN ('dinheiro','pix','debito','credito','outro')),
  tipo            text DEFAULT 'servico' CHECK (tipo IN ('servico','produto')),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custos_fixos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id    uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  categoria   text NOT NULL,
  descricao   text,
  valor       bigint NOT NULL,
  mes_ano     text NOT NULL,  -- "2026-04"
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repasses (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id        uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  profissional_id uuid REFERENCES profissionais(id) ON DELETE CASCADE NOT NULL,
  mes_ano         text NOT NULL,
  valor_total     bigint DEFAULT 0,
  percentual      numeric(5,2) DEFAULT 0,
  valor_repasse   bigint DEFAULT 0,
  pago            boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- RLS (Row Level Security) — cada salão vê só seus dados
ALTER TABLE saloes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_fixos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE repasses         ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_salao      ON saloes            FOR ALL USING (auth.uid() = id);
CREATE POLICY rls_prof       ON profissionais      FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_clientes   ON clientes           FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_servicos   ON servicos           FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_agenda     ON agendamentos        FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_caixa      ON lancamentos_caixa  FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_custos     ON custos_fixos        FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_repasses   ON repasses            FOR ALL USING (auth.uid() = salao_id);

-- Índices de performance
CREATE INDEX idx_agenda_salao_data  ON agendamentos(salao_id, data_hora);
CREATE INDEX idx_caixa_salao_data   ON lancamentos_caixa(salao_id, data);
CREATE INDEX idx_clientes_salao     ON clientes(salao_id, segmento);
CREATE INDEX idx_prof_salao         ON profissionais(salao_id, ativo);
```

#### 0.4 — Script de Migração JSONB → Normalizado (com rollback)

```sql
-- supabase/migrations/v2_migrate_jsonb.sql
-- ESTRATÉGIA: Migrar dados do salao_data JSONB para tabelas normalizadas
-- ROLLBACK: salao_data permanece intacta por 30 dias

-- Migrar agendamentos
INSERT INTO agendamentos (salao_id, data_hora, status, valor, observacoes)
SELECT
  user_id,
  (entry->>'dataHora')::timestamptz,
  COALESCE(entry->>'status', 'agendado'),
  COALESCE((entry->>'valor')::bigint * 100, 0),  -- converter para centavos
  entry->>'observacao'
FROM salao_data,
  jsonb_array_elements(data->'agendamentos') AS entry
WHERE data_type = 'agenda'
ON CONFLICT DO NOTHING;

-- (padrão similar para clientes, serviços, lançamentos)
-- Verificar contagens antes e depois
-- SELECT count(*) FROM salao_data WHERE data_type = 'agenda';
-- SELECT count(*) FROM agendamentos;
```

> ⚠️ **Regra de ouro da migração:** Só ativar o Next.js em produção após confirmar que 100% dos dados foram migrados corretamente. Usar feature flag ou subdomínio `v4.vellovy.app` para beta.

---

### Sprint 1 — Next.js Shell + Auth + PWA
**4 dias | Define a qualidade do produto**

#### 1.1 — Criar apps/web com Next.js 15

```bash
cd apps/web
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# Dependências core
npm install @supabase/supabase-js @supabase/ssr
npm install zustand zod react-hook-form @hookform/resolvers
npm install lucide-react recharts
npm install sonner              # toast
npm install next-pwa            # PWA
npm install @sentry/nextjs      # error monitoring
```

#### 1.2 — PWA Configurada desde o Início

> Decisão estratégica: os usuários atuais já estão no mobile.
> PWA não pode ser o Sprint 9 — é Sprint 1.

```typescript
// apps/web/next.config.ts
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: { maxEntries: 100, maxAgeSeconds: 300 },
      },
    },
  ],
})({
  experimental: { typedRoutes: true },
  images: { domains: ['*.supabase.co'] },
});

export default config;
```

```json
// apps/web/public/manifest.json
{
  "name": "Vellovy",
  "short_name": "Vellovy",
  "description": "Gestão profissional do seu salão",
  "theme_color": "#5C9A6B",
  "background_color": "#FAFAFA",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/agenda",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

#### 1.3 — Layout Adaptativo (Sidebar + Bottom Nav)

```
≤ 767px  → BottomNav fixo (5 abas: Agenda, Caixa, Clientes, Financeiro, Config)
768-1023px → Sidebar colapsável (48px, só ícones)
≥ 1024px → Sidebar expandida (240px, ícone + label)
```

**Rotas definitivas:**
```
/             → redirect → /agenda
/agenda       → Agenda do dia
/caixa        → Caixa diária
/clientes     → CRM
/servicos     → Catálogo
/financeiro   → Resumo + custos + repasses
/configuracoes → Salão + profissionais + bot + gamificação
```

#### 1.4 — Design System T_DESIGN Vellovy

```typescript
// tailwind.config.ts — tokens customizados
theme: {
  extend: {
    colors: {
      musgo:  { DEFAULT: '#5C9A6B', 50: '#F3F7F4', 400: '#5C9A6B', 700: '#3D6B4A' },
      ouro:   { DEFAULT: '#C9A84C', 50: '#FEFBF0', 400: '#C9A84C', 700: '#9B7A2A' },
      surface: { page: '#FAFAFA', card: '#FFFFFF' },
    },
    fontFamily: {
      display: ['"Playfair Display"', 'Georgia', 'serif'],
      body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
    },
    screens: {
      mobile: '375px', tablet: '768px', desktop: '1024px', wide: '1440px',
    },
    boxShadow: {
      premium: '0 4px 24px -4px rgba(201, 168, 76, 0.18)',
    },
  },
}
```

**Componentes base a criar:**
```
PremiumCard       → card base com sombra e hover
PremiumButton     → primary (musgo) / secondary / ghost / gold
PremiumInput      → com label flutuante + erro inline
PremiumBadge      → status colorido
PremiumSheet      → bottom sheet mobile + modal desktop
PremiumSkeleton   → loading state
PremiumEmpty      → estado vazio com CTA
PremiumKPI        → card de métrica com animação
```

#### 1.5 — Autenticação

**Manter:** email/senha + Google OAuth  
**Remover:** lógica de auth espalhada em `app.js`  
**Adicionar:** proteção de rotas via middleware Next.js

```typescript
// apps/web/middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return response;
}
```

#### 1.6 — CI/CD GitHub Actions → Vercel

```yaml
# .github/workflows/deploy.yml
name: Deploy Vellovy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint --workspace=apps/web
      - run: npx tsc --noEmit --workspace=apps/web

  deploy:
    needs: lint-and-typecheck
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

### Sprint 2 — Módulo Agenda
**4 dias | O módulo mais usado. Define a qualidade percebida.**

#### 2.1 — Zustand Store: Agenda

```typescript
// packages/shared/stores/agendaStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Agendamento } from '../types';

interface AgendaStore {
  agendamentos: Agendamento[];
  dataSelecionada: string;       // "YYYY-MM-DD"
  filtroStatus: string | null;
  filtroProf: string | null;
  isLoading: boolean;
  error: string | null;

  setData: (data: string) => void;
  setFiltroStatus: (status: string | null) => void;
  fetchAgendamentos: (salaoId: string, data?: string) => Promise<void>;
  criarAgendamento: (dados: Omit<Agendamento, 'id' | 'created_at'>) => Promise<Agendamento>;
  atualizarStatus: (id: string, status: Agendamento['status']) => Promise<void>;
  excluirAgendamento: (id: string) => Promise<void>;
  // Optimistic updates
  _optimisticUpdate: (id: string, changes: Partial<Agendamento>) => void;
  _rollback: (id: string, original: Partial<Agendamento>) => void;
}
```

**Estratégia offline:** `zustand/middleware` persist com IndexedDB via `idb-keyval` (substitui localStorage — maior capacidade, async).

#### 2.2 — Queries

```typescript
// packages/shared/lib/supabase/queries/agenda.ts

export async function getAgendamentosDoDia(
  salaoId: string,
  data: string
): Promise<Agendamento[]> {
  const { data: rows, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      cliente:clientes(id, nome, telefone, segmento),
      profissional:profissionais(id, nome),
      servico:servicos(id, nome, duracao_minutos)
    `)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${data}T00:00:00-03:00`)
    .lte('data_hora', `${data}T23:59:59-03:00`)
    .neq('status', 'cancelado')
    .order('data_hora');

  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function verificarConflito(
  salaoId: string,
  profissionalId: string,
  dataHora: string,
  duracaoMinutos: number,
  excludeId?: string
): Promise<boolean> {
  const fim = new Date(new Date(dataHora).getTime() + duracaoMinutos * 60000).toISOString();
  let query = supabase
    .from('agendamentos')
    .select('id')
    .eq('salao_id', salaoId)
    .eq('profissional_id', profissionalId)
    .in('status', ['agendado', 'confirmado'])
    .lt('data_hora', fim)
    .gt('data_hora', dataHora); // overlap simplificado

  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query;
  return (data?.length ?? 0) > 0;
}
```

#### 2.3 — UI Mobile e Desktop

```
Mobile (≤767px):
  → Lista vertical de horários
  → Swipe esquerda: cancelar agendamento
  → Pull-to-refresh
  → FAB verde para novo agendamento
  → Navegação entre dias via setas (< >)

Desktop (≥1024px):
  → Grade semanal 7 colunas
  → Filtro por profissional no topo
  → Click em slot vazio = novo agendamento
  → Botão "Nova Consulta" no header
```

#### 2.4 — Estado Visual por Status

```
agendado   → borda neutral-300, ícone relógio cinza
confirmado → borda musgo-400, ícone check verde
realizado  → fundo musgo-50, texto musgo-700
cancelado  → fundo neutral-100, texto riscado
no_show    → fundo red-50, texto red-600
```

#### 2.5 — Formulário: Novo Agendamento (3 cliques)

1. **Data/hora** — date picker + grid de horários disponíveis (filtra ocupados)
2. **Cliente** — autocomplete (busca por nome/telefone) ou "novo cliente"
3. **Serviço + Profissional** — chips clicáveis com duração e preço

Validação Zod + detecção de conflito antes de salvar.

---

### Sprint 3 — Módulo Caixa
**3 dias**

#### 3.1 — Caixa com formas de pagamento por lançamento

**Manter do v3:**
- Listagem de serviços + produtos do dia
- Total com animação de contador

**Adicionar:**
- Forma de pagamento por lançamento (dinheiro, PIX, débito, crédito)
- Totais por forma de pagamento (fecha caixa físico)
- Botão "Fechar Caixa" → gera resumo → dispara no Telegram

#### 3.2 — Integração Agenda → Caixa (fluxo mais importante do sistema)

```
Agendamento marcado como "realizado"
  → Modal: "Registrar no caixa agora?"
  → Sim → Formulário de caixa pré-preenchido (cliente + serviço + valor + profissional)
         → Usuário escolhe forma de pagamento → Salvar
  → Não → Apenas muda status
```

Este fluxo precisa ter latência zero na percepção. Optimistic update + sync assíncrono.

---

### Sprint 4 — Bot Telegram (Antecipado)
**2 dias | Diferencial #1 — proteger antes de qualquer outra coisa**

> **Por que Sprint 4 e não Sprint 8?**
> O bot Telegram é o feature mais diferenciado do Vellovy. Usuários que dependem dele NÃO PODEM ficar sem ele durante a migração. Migrar as queries no Sprint 4 garante continuidade.

#### 4.1 — Migrar queries do bot para o novo schema

```typescript
// supabase/functions/telegram-bot/queries.ts

// ANTES (v3 — JSONB)
const { data } = await supabase.from('salao_data')
  .select('data').eq('data_type', 'agenda').single();

// DEPOIS (v4 — normalizado)
const { data: agendamentos } = await supabase
  .from('agendamentos')
  .select(`
    data_hora, status, valor,
    cliente:clientes(nome),
    servico:servicos(nome),
    profissional:profissionais(nome)
  `)
  .eq('salao_id', salaoId)
  .gte('data_hora', inicioHoje)
  .lte('data_hora', fimHoje)
  .order('data_hora');
```

#### 4.2 — Novos comandos

| Comando | Resposta |
|---|---|
| `/agenda` | Agenda do dia (já existe, atualizar query) |
| `/caixa` | Total do dia por forma de pagamento |
| `/fechar` | Resumo completo: receitas, formas de pagamento, atendimentos |
| `/ticket` | Ticket médio dos últimos 30 dias |
| `/clientes` | Top 5 clientes mais frequentes do mês |
| `/semana` | Receita acumulada da semana |

#### 4.3 — Mapa de vinculação bot ↔ salão

```typescript
// O chat_id do Telegram precisa estar salvo na tabela saloes
// Implementar endpoint de vinculação:
// 1. Usuário clica "Vincular Telegram" em Configurações
// 2. Sistema gera token único de 6 dígitos
// 3. Usuário envia /vincular XXXXXX no bot
// 4. Bot salva chat_id no salão
```

---

### Sprint 5 — Módulo Clientes (CRM)
**3 dias**

#### 5.1 — Segmentação automática via query Supabase

```typescript
// packages/shared/lib/supabase/queries/clientes.ts

export function calcularSegmento(
  totalVisitas: number,
  ultimaVisita: string | null
): SegmentoCliente {
  if (!ultimaVisita || totalVisitas === 0) return 'nova';
  const diasSem = Math.floor(
    (Date.now() - new Date(ultimaVisita).getTime()) / 86400000
  );
  if (diasSem > 90)  return 'inativa';
  if (diasSem > 45)  return 'ausente';
  if (totalVisitas >= 10) return 'fiel';
  return 'regular';
}
```

**Recalcular automaticamente** após cada lançamento no caixa via trigger Supabase:

```sql
-- supabase/functions/recalcular_segmento.sql
CREATE OR REPLACE FUNCTION recalcular_segmento_cliente()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clientes
  SET
    total_visitas = total_visitas + 1,
    ultima_visita = NEW.data,
    total_gasto   = total_gasto + NEW.valor
  WHERE id = (
    SELECT id FROM clientes
    WHERE salao_id = NEW.salao_id
    AND nome = NEW.cliente_nome
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_segmento
AFTER INSERT ON lancamentos_caixa
FOR EACH ROW EXECUTE FUNCTION recalcular_segmento_cliente();
```

#### 5.2 — UI: Lista + Perfil de Cliente

```
Lista:
  → Busca por nome ou telefone (debounce 300ms)
  → Filtro por segmento (chips: Todos · Fiéis · Ausentes · Novas)
  → Card com nome, badge segmento, última visita, total gasto

Perfil (/clientes/[id]):
  → Header: nome + segmento badge
  → Timeline de atendimentos
  → Total gasto + ticket médio
  → Botão WhatsApp (wa.me/55NÚMERO)
  → Aniversário (se cadastrado) com badge
```

---

### Sprint 6 — Financeiro Unificado
**3 dias**

#### 6.1 — Refatorar 3 módulos → 1 página com abas

```
/financeiro
  ├── Resumo     → KPIs mensais + gráfico 12 meses
  ├── Custos     → Fixos por mês + categorias
  └── Repasses   → Por profissional + percentual + status pago
```

#### 6.2 — KPIs financeiros reais

- Receita do mês vs. mês anterior (delta % com seta)
- Lucro = receita - custos fixos - repasses
- Ticket médio do mês
- Serviço mais lucrativo (preço - custo)
- Margem de lucro por serviço (alerta visual quando custo > 40% do preço)

#### 6.3 — Gráfico 12 meses com Recharts

```typescript
// Substituir SVG inline por componente declarativo
<BarChart data={dadosMensais} width={600} height={300}>
  <Bar dataKey="receita"  fill="#5C9A6B" />
  <Bar dataKey="despesas" fill="#C9A84C" />
  <XAxis dataKey="mes" />
  <Tooltip formatter={(v) => fmtBRL(v as number)} />
</BarChart>
```

---

### Sprint 7 — Dashboard Conectado
**2 dias**

#### 7.1 — KPIs em tempo real via queries paralelas

```typescript
// packages/shared/lib/supabase/queries/dashboard.ts
export async function getDashboardData(salaoId: string) {
  const hoje = new Date().toISOString().split('T')[0];
  const [
    agendaHoje,
    receitaHoje,
    clientesNoMes,
    agendaAmanha,
    ticketMedio,
  ] = await Promise.all([
    countAgendamentosHoje(salaoId, hoje),
    getReceitaHoje(salaoId, hoje),
    countClientesNovosNoMes(salaoId),
    getAgendamentosAmanha(salaoId),
    getTicketMedioDiario(salaoId),
  ]);
  return { agendaHoje, receitaHoje, clientesNoMes, agendaAmanha, ticketMedio };
}
```

#### 7.2 — Onboarding (4 passos, mostra até completar)

```
1. Cadastrar primeiro serviço    → /servicos
2. Adicionar profissional        → /configuracoes
3. Criar primeiro agendamento    → /agenda
4. Registrar primeiro lançamento → /caixa
```

#### 7.3 — Confirmação em lote (WhatsApp)

- Lista de agendamentos de amanhã com status
- Botão "Confirmar todos" → muda status no banco + abre WhatsApp com template customizável
- Template editável em Configurações

---

### Sprint 8 — Gamificação
**2 dias | Reconhece trabalho real. Nunca pune. Nunca manipula.**

#### 8.1 — Sistema de Pontos

| Ação | Pontos | Trigger |
|---|---|---|
| Agendamento realizado | +80 | status → `realizado` |
| Caixa fechada no dia | +50 | botão "Fechar Caixa" |
| Cliente novo fidelizado (3ª visita) | +30 | trigger no banco |
| Dia cheio (≥ 6 atendimentos) | +50 | cron diário |
| Semana sem no_show | +60 | cron semanal |
| Streak de 7 dias | +100 | bônus único |
| Streak de 15 dias | +150 | bônus único |

**Teto diário:** 200 pontos. Nunca decrementar.

#### 8.2 — Badges

| Badge | Emoji | Conquista |
|---|---|---|
| Primeiro Passo | 🌱 | Primeiro atendimento realizado |
| Especialista | ⭐ | 10 avaliações positivas |
| Fidelizador | 💛 | 10 clientes com 3+ visitas |
| Agenda Cheia | 📅 | 5 dias com ≥6 atendimentos |
| Consistente | 🔥 | 15 dias seguidos |
| 100 Atendimentos | 💎 | Marco real de volume |
| Mestre do Salão | 👑 | 500 atendimentos (lendário) |

#### 8.3 — UI não-invasiva

```typescript
// GamificationToast — aparece 4s, não bloqueia nada
// Nível visível no avatar do profissional (pequeno badge)
// Página /perfil com progresso completo e badges
// Pode ser desabilitado em Configurações → Gamificação
```

---

### Sprint 9 — Serviços + Configurações
**2 dias**

#### 9.1 — Módulo Serviços

**Manter:** Catálogo com preço ideal + custo + margem  
**Adicionar:**
- Duração do serviço em minutos (usado na detecção de conflito)
- Categoria (cabelo, unhas, estética, barba)
- Indicador visual: ⚠️ quando custo > 40% do preço
- Toggle ativo/inativo (soft delete)

#### 9.2 — Configurações

**Manter:** Dados do salão, profissionais, white-label, zona de perigo  
**Adicionar:**
- Preferências de gamificação (ligar/desligar, son, celebrações)
- Template WhatsApp (texto editável com variáveis: {nome}, {servico}, {hora})
- Fuso horário
- Vinculação Bot Telegram
- Plano atual + botão upgrade (infra SaaS futura)

---

### Sprint 10 — CI/CD, Monitoring e Testes
**2 dias | Produto profissional precisa de infraestrutura profissional**

#### 10.1 — Sentry para Error Monitoring

```typescript
// Captura erros em produção com contexto de usuário
// Free tier: 5k eventos/mês — suficiente para início
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Remover dados sensíveis antes de enviar
    if (event.user) delete event.user.email;
    return event;
  },
});
```

#### 10.2 — Testes Unitários Prioritários

```
Ferramenta: Vitest + Testing Library

Testes obrigatórios antes de release:
  calcularSegmento()     → 5 cenários de segmento de cliente
  calcularTicketMedio()  → edge cases (sem dados, 1 dado, N dados)
  verificarConflito()    → sobreposição de horários
  validação Zod agenda   → campos, datas, status inválido
  fmtBRL()               → centavos para string formatada
```

#### 10.3 — Checklist de Acessibilidade (WCAG 2.1 AA)

```
Contraste texto normal  ≥ 4.5:1
Contraste texto grande  ≥ 3:1
Touch targets mobile    ≥ 48x48px
Navegação por teclado   Tab + Enter em todos os elementos interativos
Labels em inputs        htmlFor + id em todos
Focus ring visível      Em todos os elementos focáveis
```

---

## 🗃️ Mapa de Arquivos — De Onde Para Onde

| Arquivo atual | Destino v4 | O que acontece |
|---|---|---|
| `index.html` | `apps/web/app/layout.tsx` | Shell + tokens Tailwind |
| `app.js` (auth, router) | `middleware.ts` + `stores/authStore.ts` | Separar responsabilidades |
| `app.js` (SUPABASE keys) | `.env.local` → Vercel env | **Emergência E.1** |
| `modules.js` (dashboard) | `app/page.tsx` | Queries reais do Supabase |
| `modules.js` (agenda) | Sprint 2 inteiro | Reescrever com Zustand + queries tipadas |
| `modules.js` (diario) | Sprint 3 inteiro | Virar "Caixa" |
| `modules.js` (clientes) | Sprint 5 inteiro | CRM com segmentação via trigger |
| `modules.js` (servicos) | Sprint 9.1 | Migrar com TypeScript + categorias |
| `modules.js` (custos + receitas + controle) | Sprint 6 inteiro | Unificar em /financeiro |
| `modules.js` (Storage Engine JSONB) | `packages/shared/lib/supabase/queries/` | Queries tipadas por entidade |
| `modules.js` (SVG gráfico inline) | `components/charts/GraficoAnual.tsx` | Substituir por Recharts |
| `ai-fallback.js` | `packages/shared/lib/ai/` | Manter como módulo separado |
| `supabase/functions/telegram-bot/` | Sprint 4 — atualizar queries | Manter, migrar queries |
| `styles.css` | `tailwind.config.ts` + `globals.css` | CSS vars → tokens Tailwind |

**Código a remover (sem negociação):**
- Marcadores de merge `<<<<<<< HEAD`
- `SUPABASE_URL` e `SUPABASE_KEY` hardcoded
- Routing manual por hash (`#agenda`, `#caixa`)
- SVG icon registry manual (substituir por `lucide-react`)
- Flag `_syncedThisSession` (desnecessária com Zustand persist)

---

## 📊 Dependências entre Sprints

```
Emergência (E)
  ↓
Sprint 0  → Tipos + Schema + Monorepo
  ↓
Sprint 1  → Shell + Auth + PWA + CI/CD
  ↓
Sprint 2  → Agenda
  ↓
Sprint 3  → Caixa  (consome eventos da Agenda)
  ↓
Sprint 4  → Bot Telegram  (consome Agenda + Caixa com novo schema)
  ↓
Sprint 5  → Clientes  (CRM alimentado pelo Caixa)
  ↓
Sprint 6  → Financeiro  (consume Caixa + Custos)
  ↓
Sprint 7  → Dashboard  (consome todos os módulos)
  ↓
Sprint 8  → Gamificação  (consome eventos dos módulos 2-7)
  ↓
Sprint 9  → Serviços + Config
  ↓
Sprint 10 → Monitoring + Testes
```

---

## ⚠️ Riscos e Mitigações (Atualizados)

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Chaves Supabase exploradas antes da rotação | Alta | **Crítico** | Rotacionar ANTES de qualquer outro passo |
| Perda de dados de clientes na migração JSONB | Alta | Alto | Deploy em subdomínio beta. Migrar dados. Verificar contagens. Só cortar quando 100% validado. |
| Bot Telegram para de funcionar durante migração | Média | Alto | Sprint 4 antecipado garante que o bot migra junto com o schema |
| Usuários atuais quebrados durante migração | Alta | Alto | Manter v3 em produção até v4 estar completo e validado. Usar `v4.vellovy.app` para beta. |
| Scope creep e paralisia de feature | Alta | Médio | Seguir ordem de sprints. Nenhuma feature nova até Sprint 10. |
| Monorepo com dependências quebradas | Baixa | Médio | npm workspaces é mais simples que Turborepo. Migrar para Turborepo apenas na Fase 2. |

---

## 🔑 Decisões de Arquitetura (Imutáveis)

1. **npm workspaces antes de Turborepo** — Turborepo entra na Fase 2 (app Expo). Para Fase 1, workspaces simples é suficiente e tem menos custo de manutenção.

2. **PWA desde o Sprint 1** — os usuários atuais são mobile-first. Não é opcional.

3. **Bot Telegram no Sprint 4, não no Sprint 8** — é diferencial #1. Não pode quebrar por 4 semanas.

4. **Valores em centavos (bigint)** — nunca `float` para dinheiro. `10000` = R$ 100,00. Formatar apenas na UI via `fmtBRL`.

5. **Trigger Supabase para segmentação de clientes** — lógica de segmento no banco, não no client. Consistência garantida.

6. **Zustand com persist** — estado offline-first. A agenda do dia e o caixa precisam funcionar com conexão intermitente.

7. **RLS em todas as tabelas** — nunca filtrar por `salao_id` apenas no código. O banco precisa garantir o isolamento.

8. **Schema normalizado** — sem volta ao JSONB genérico. Índices, RLS granular e relatórios dependem disso.

---

## 🚀 Fase 2 — App Nativo Expo (Quando?)

Iniciar Fase 2 quando:
- [ ] Base ativa ≥ 200 usuários
- [ ] PWA tem limitações claras sendo reportadas (câmera, push notifications)
- [ ] Sprint 10 concluído e estável

O que a Fase 2 reaproveita:
- 100% dos tipos (`packages/shared/types`)
- 100% das queries Supabase
- 100% dos Zustand stores
- 100% dos validators Zod
- ~30% da UI (adaptar de Tailwind para NativeWind)

---

## 🏢 Infraestrutura SaaS (Fase 3 — Planos e Billing)

Não entrar no Sprint 0-10. Planejar após base de usuários validada.

```
Plano Free:
  → 1 profissional, 30 agendamentos/mês, sem bot Telegram

Plano Pro (R$ 49/mês):
  → 5 profissionais, sem limite, bot Telegram, gamificação completa

Plano Enterprise (R$ 149/mês):
  → Profissionais ilimitados, relatórios avançados, white-label, suporte prioritário
```

Stack billing: Stripe + Supabase Edge Function para webhooks.

---

## 📅 Estimativa de Tempo (v5)

| Sprint | Escopo | Estimativa |
|---|---|---|
| E — Emergência | Keys, merge conflict, backup | **1 dia** |
| 0 — Fundação | Monorepo + tipos + schema + migração script | 3 dias |
| 1 — Shell | Next.js + Auth + PWA + CI/CD + Design System | 4 dias |
| 2 — Agenda | Store + queries + UI mobile+desktop | 4 dias |
| 3 — Caixa | Store + queries + integração agenda | 3 dias |
| 4 — Bot Telegram | Migrar queries + novos comandos + vinculação | 2 dias |
| 5 — Clientes | CRM + trigger segmentação + perfil | 3 dias |
| 6 — Financeiro | Unificar módulos + Recharts + indicadores | 3 dias |
| 7 — Dashboard | KPIs reais + onboarding + confirmação lote | 2 dias |
| 8 — Gamificação | Store + badges + toasts | 2 dias |
| 9 — Serviços + Config | Catálogo + configurações completas | 2 dias |
| 10 — Qualidade | Testes + Sentry + WCAG | 2 dias |
| **Total** | | **~31 dias úteis** |

---

## ✅ Checklist por Sprint (Definitivo)

Antes de declarar qualquer sprint "pronto":

**Código**
- [ ] Sem `any` no TypeScript
- [ ] Sem cores hardcoded (apenas tokens Tailwind ou `theme.*`)
- [ ] Componentes < 300 linhas
- [ ] Lógica de negócio em `packages/shared`, não em `apps/web`
- [ ] Sem `console.log` em produção

**Plataforma**
- [ ] Testou no mobile browser (375px, Chrome DevTools)?
- [ ] Testou no desktop (1440px)?
- [ ] Touch targets ≥ 48px em mobile?
- [ ] PWA installable? (Lighthouse PWA score ≥ 90)

**UX**
- [ ] 4 estados cobertos: loading → success → error → empty
- [ ] Toast em toda ação do usuário (sucesso e erro)
- [ ] Microcopy em pt-BR, acolhedor
- [ ] 3 cliques para toda ação principal

**Funcionalidade**
- [ ] CRUD completo para a entidade
- [ ] Validação Zod no client
- [ ] Erros do Supabase tratados (não mostrar mensagem técnica)
- [ ] Optimistic update com rollback onde aplicável

**Segurança**
- [ ] RLS verificado na tabela correspondente
- [ ] Nenhuma chave ou segredo no código

**Qualidade**
- [ ] Nenhum `TODO` crítico aberto
- [ ] Fluxo testado em mobile real (não apenas DevTools)

---

*Plano v5 — Vellovy SaaS*  
*Baseado na SKILL Salão Premium SCLC-G v1.1*  
*Repositório: github.com/sdwplayer01/Vellovy*  
*Abril 2026*  
*Princípio: "O profissional de beleza abre no celular, fecha o caixa no Telegram, e sente que seu trabalho foi reconhecido."*
