# ✦ Salão Premium — Gestão Inteligente para Salões de Beleza

> Sistema SaaS completo: agenda, caixa diário, CRM, controle financeiro, bot Telegram e interface mobile-first. Tudo em **3 arquivos**.

![Version](https://img.shields.io/badge/version-3.2-7B4F8E)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production--ready-success)

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Tech Stack](#tech-stack)
- [Deploy](#deploy)
- [Bot Telegram](#bot-telegram)
- [Segurança](#segurança)
- [Customização](#customização)
- [Estrutura de Dados](#estrutura-de-dados)
- [Atalhos de Teclado](#atalhos-de-teclado)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

**Salão Premium** é um sistema de gestão completo para salões de beleza, barbearias e estúdios de estética. Desenvolvido com arquitetura **offline-first** e **mobile-first**, funciona 100% sem internet e sincroniza automaticamente com o Supabase quando online.

### Princípios SLC

| Princípio | Implementação |
|-----------|---------------|
| **Simples** | 3 arquivos, zero build tools, zero frameworks |
| **Adorável** | Bottom Sheet mobile, animações suaves, dark mode |
| **Completo** | Agenda → Caixa → CRM → Controle Anual → Bot Telegram |

---

## Arquitetura

```
sistemasalao/
├── index.html                              # Shell HTML + Design System CSS (~35KB)
├── app.js                                  # Core: Auth, Router, Tema, Modais (~38KB)
├── modules.js                              # Páginas, Storage Engine, Sync (~66KB)
├── ai-fallback.js                          # Módulo fallback IA (reserva futura)
├── supabase/
│   ├── functions/
│   │   └── telegram-bot/
│   │       └── index.ts                    # Edge Function — Bot Telegram (~18KB)
│   └── migrations/
│       └── setup.sql                       # Schema: profiles, tokens, RLS (~5KB)
└── README.md
```

### Fluxo de Dados

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser    │────→│ localStorage │────→│   Supabase   │
│  (modules)  │←────│  (offline)   │←────│  (cloud DB)  │
└─────────────┘     └──────────────┘     └──────────────┘
                          ↕ debounce 1.5s
                    ┌──────────────┐
                    │  Telegram    │
                    │  Bot (Edge)  │
                    └──────────────┘
```

**Estratégia de sync:** Write-through com debounce de 1500ms. Cada save em localStorage agenda um flush para Supabase. Se offline, fica em fila local.

---

## Funcionalidades

### Módulos do Sistema

| Módulo | Descrição | Página |
|--------|-----------|--------|
| **Dashboard** | KPIs animados, gráfico 7 dias, retenção, agenda de amanhã | `dashboard` |
| **Agenda** | Agendamentos com status (agendado/confirmado/realizado/cancelado) | `agenda` |
| **Diário / Caixa** | Lançamentos do dia: serviços + produtos vendidos | `diario` |
| **Serviços** | Catálogo de serviços com preço ideal e custo estimado | `servicos` |
| **Clientes** | CRM com segmentação (Fiel/Regular/Ausente/Inativa/Nova) | `clientes` |
| **Custos Fixos** | 10 categorias fixas + outros customizáveis | `custos` |
| **Receitas** | Repasses de cadeiras, manicure, pedicure | `receitas` |
| **Controle Anual** | Tabela 12 meses + gráfico de barras | `controle` |
| **Configurações** | Dados do salão, profissionais, zona de perigo | `configuracoes` |

### Funcionalidades Mobile-First

| Feature | Onde | Breakpoint |
|---------|------|------------|
| **Bottom Navigation** | 5 tabs fixas na base | ≤ 768px |
| **Bottom Sheet** | Formulários abrem como sheet deslizante | ≤ 768px |
| **FAB** | Botão flutuante para ação rápida | ≤ 768px |
| **Sidebar colapsável** | Auto-collapse em hover no tablet | 769–1200px |
| **Sidebar fixa** | Navegação completa no desktop | > 1200px |

### Funcionalidades Dashboard

- **KPIs com animação** — contadores que sobem de 0 ao valor final (easeOut cubic)
- **Gráfico 7 dias** — SVG inline com barras coloridas (plum = hoje, verde = acima da média)
- **Retenção de clientes** — donut chart com taxa de clientes ativos nos últimos 30 dias
- **Agenda de amanhã** — lista com botão WhatsApp individual + confirmação em lote
- **Onboarding** — checklist de 4 passos para novos usuários (dismissível)

### Integrações

- **WhatsApp** — links `wa.me` com mensagens pré-formatadas (confirmação, lembrete)
- **WhatsApp Batch** — confirmar todos os agendamentos de amanhã com 1 clique
- **Bot Telegram** — consultas de agenda, caixa e clientes em linguagem natural
- **Supabase Auth** — email/senha + Google OAuth
- **Dark Mode** — tema escuro completo via `data-theme="dark"`

---

## Tech Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | Vanilla JS (ES Modules) | ES2020+ |
| **CSS** | Custom Properties (Design System) | CSS3 |
| **Auth** | Supabase Auth (JWT) | v2 |
| **Database** | Supabase (PostgreSQL) | v2 |
| **Bot** | Deno Edge Function | Deno std 0.177 |
| **Ícones** | SVG inline (registry próprio, 23 ícones) | — |
| **PWA** | Manifest dinâmico | — |

> **Zero dependências de build.** Sem webpack, sem bundler, sem npm install. Basta servir os 3 arquivos via qualquer HTTP server.

---

## Deploy

### 1. Configurar Supabase

#### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote `Project URL` e `anon/public key` (Settings → API)
3. Atualize em `app.js` (linhas 13–14):

```javascript
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY = 'sua-anon-key-aqui';
```

#### 1.2 Criar tabela de dados

Execute no **SQL Editor** do Supabase:

```sql
-- Tabela principal (armazena todos os dados como JSONB)
CREATE TABLE salao_data (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type text NOT NULL CHECK (data_type IN (
        'config', 'custos', 'receitas', 'servicos',
        'diario', 'agenda', 'produtos', 'clientes'
    )),
    data jsonb NOT NULL DEFAULT '{}',
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, data_type)
);

ALTER TABLE salao_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários isolados" ON salao_data
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_salao_data_user ON salao_data(user_id, data_type);
```

#### 1.3 Criar tabelas do Bot Telegram (opcional)

Execute o conteúdo de `supabase/migrations/setup.sql` no SQL Editor. Ele cria:

- `profiles` — vínculo user ↔ Telegram chat_id
- `telegram_link_tokens` — tokens temporários de vínculo (10 min)
- Triggers automáticos de criação de perfil

#### 1.4 Configurar Auth

Em **Authentication → Settings**:

- ✅ Habilitar Email confirmations
- ✅ (Opcional) Google OAuth — configure Client ID/Secret no Google Cloud Console

### 2. Deploy Frontend

#### Opção A: GitHub Pages (Grátis)

```bash
git add .
git commit -m "deploy"
git push origin main
```
Em Settings → Pages → Source: Branch `main`. Acesse `https://seuuser.github.io/sistemasalao/`.

#### Opção B: Netlify / Vercel

1. Conecte o repositório Git
2. Sem build command (são arquivos estáticos)
3. Publish directory: `/`

#### Opção C: Qualquer servidor estático

```bash
npx -y http-server . -p 8080 --cors
```

> **Importante:** Os arquivos usam ES Modules (`import/export`). Servir via `file://` não funciona — é necessário um HTTP server.

---

## Bot Telegram

### Como funciona

O bot roda como **Supabase Edge Function** (Deno). Recebe mensagens via webhook, consulta dados reais do Supabase, e responde sem IA — zero alucinação.

### Comandos disponíveis

| Comando | Resposta |
|---------|----------|
| `agenda hoje` | Lista de agendamentos de hoje |
| `agenda amanhã` | Lista de agendamentos de amanhã |
| `próximos` | Próximos 10 agendamentos |
| `caixa hoje` | Faturamento + lucro do dia |
| `caixa ontem` | Faturamento + lucro de ontem |
| `semana` | Resumo financeiro da semana |
| `mês` | Resumo financeiro do mês |
| `clientes inativos` | Clientes ausentes há +45 dias |
| `resumo` | Briefing completo do dia |
| `ajuda` | Lista de comandos |

### Deploy do Bot

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Vincular ao projeto
supabase link --project-ref <SEU_PROJECT_REF>

# 3. Configurar secrets
supabase secrets set TELEGRAM_BOT_TOKEN=<TOKEN_DO_BOTFATHER>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

# 4. Deploy
supabase functions deploy telegram-bot

# 5. Registrar webhook (cole no navegador)
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<SEU_PROJECT_REF>.supabase.co/functions/v1/telegram-bot
```

### Fluxo de Vínculo

1. Usuário envia `/start` no Telegram → recebe código de 8 caracteres
2. Usuário digita o código em **Configurações → Bot Telegram** no sistema web
3. Sistema valida o token (expira em 10 min), vincula chat_id ao user_id
4. A partir daí, o bot responde com dados reais do salão

---

## Segurança

### Proteção de Dados

| Camada | Mecanismo |
|--------|-----------|
| **Autenticação** | Supabase Auth (JWT com refresh automático) |
| **Isolamento** | RLS: `auth.uid() = user_id` — cada salão vê apenas seus dados |
| **Bot** | Service Role Key apenas no Deno Edge (nunca exposta ao client) |
| **Tokens** | Vínculo Telegram expira em 10 min, sem política RLS pública |
| **Client Key** | A `anon key` no `app.js` é **publishable** por design — segura com RLS ativo |

### Offline & Resiliência

- **Offline-first:** Todos os dados salvos em `localStorage` primeiro
- **Sync debounced:** Flush para Supabase após 1.5s de inatividade
- **Banner de status:** Indicador visual de "Sem conexão" / "Conexão restaurada"
- **Sem perda de dados:** Se offline ao salvar, sincroniza automaticamente quando voltar online

---

## Customização

### White-Label (Cores do Salão)

O sistema aplica cores customizadas por salão no login:

```javascript
// Em Configurações, salve:
Config.save({ corPrimaria: '#1B5E20', corSecundaria: '#FF6F00' });
```

As variáveis CSS `--plum` e `--rose` são atualizadas dinamicamente.

### Adicionar Nova Página

1. **Router** — em `app.js`, adicione ao objeto `PAGES`:
```javascript
minhaPagina: { icon: 'BarChart3', title: 'Minha Página' }
```

2. **HTML** — em `index.html`, adicione dentro de `#pages-container`:
```html
<div id="page-minhaPagina" class="page hidden"></div>
```

3. **Renderer** — em `modules.js`, adicione ao `PAGES_RENDER`:
```javascript
minhaPagina: (container) => {
    container.innerHTML = `<h2>Minha Página</h2>`;
}
```

### Adicionar Ícone

Em `app.js`, adicione ao objeto `ICONS` o SVG path Lucide desejado:

```javascript
const ICONS = {
    // ... existentes (23 ícones)
    MeuIcone: '<path d="M12 2L2 7l10 5 10-5-10-5z"/>',
};
```

Lista completa: [lucide.dev](https://lucide.dev)

### Dark Mode

O sistema já suporta dark mode. Toggle via sidebar ou atalho. As variáveis CSS são:

```css
[data-theme="dark"] {
    --bg: linear-gradient(135deg, #1a1225 0%, #2d1b2e 100%);
    --bg-card: #2d1b3e;
    --txt-dark: #f5f0ff;
    --txt-muted: #b8a8c8;
    /* ... completo em index.html */
}
```

---

## Estrutura de Dados

Todos os dados são armazenados como JSON em `localStorage` e sincronizados como JSONB no Supabase.

| Chave | Tipo | Conteúdo |
|-------|------|----------|
| `salao_config` | Object | Nome, responsável, profissionais, cores |
| `salao_servicos` | Array | Catálogo de serviços com preço e custo |
| `salao_produtos` | Array | Produtos com estoque e preço de venda |
| `salao_diario` | Array | Lançamentos do caixa (data, cliente, valor) |
| `salao_agenda` | Array | Agendamentos (data, hora, cliente, status) |
| `salao_clientes` | Array | CRM auto-gerado de diário + agenda |
| `salao_custos` | Object | Custos fixos mensais (hash por mês-chave) |
| `salao_receitas` | Object | Receitas de repasses (hash por mês-chave) |

### Cache e Performance

- **Stats Cache:** `Map` em memória para `Clientes.calcStats()` — invalidado a cada escrita
- **Sync Flag:** `_syncedThisSession` evita re-sync redundante do CRM
- **Debounce:** `_dirtyKeys` acumula chaves modificadas, flush único a cada 1.5s

---

## Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `1` | Dashboard |
| `2` | Agenda |
| `3` | Diário / Caixa |
| `4` | Clientes |
| `5` | Serviços |
| `6` | Controle Anual |
| `9` | Configurações |
| `Esc` | Fechar modal / sheet |
| `?` | Mostrar atalhos |

> Atalhos são desativados quando o foco está em `<input>`, `<select>` ou `<textarea>`.

---

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Página em branco | Aberto via `file://` | Usar HTTP server (`npx http-server .`) |
| "Invalid API key" | Chave errada em `app.js` | Verificar que é a `anon` key (não service_role) |
| Dados não sincronizam | RLS mal configurado | Executar SQL de criação da tabela + policy |
| Bot não responde | Webhook não registrado | Executar URL de `setWebhook` no navegador |
| Bot responde "não vinculado" | Token expirado | Gerar novo `/start` e vincular em < 10 min |
| Modal cortado no mobile | `__openModal` em vez de `__openForm` | Verificar que formulários usam `__openForm` |
| Bottom nav sobre o sheet | z-index conflitante | Bottom nav deve ser < 1050 |

### Limpar Dados

Em **Configurações → Zona de Perigo → Limpar Todos os Dados**, ou via console:

```javascript
localStorage.clear();
location.reload();
```

---

## Licença

MIT License — Livre para uso comercial e modificação.

---

<div align="center">

**Salão Premium v3.2** · Mobile-First · Offline-First · White-Label Ready

Desenvolvido com ♠ para profissionais de beleza

</div>
