---
name: vellovy-saas
description: SKILL definitiva para o desenvolvimento do SaaS Vellovy. Baseada na arquitetura SCLC-G (Simple, Loveable, Complete, Connected, Gamified) adaptada para gestão de salões de beleza em múltiplas plataformas — web desktop, PWA mobile e app nativo. Use para criar, modificar ou revisar qualquer parte do ecossistema: UI, lógica, banco de dados, gamificação e integrações.
metadata:
  categories: [beauty-tech, saas, web-development, mobile-development, management-system, sclc-patterns, gamification, pwa, monorepo]
  stack: [Next.js, Expo, Supabase, Zustand, TypeScript, TailwindCSS, React Native]
  domain: salon-management
  platforms: [web-desktop, pwa-mobile, native-ios, native-android]
  version: 1.1
  status: production-ready
---

# 🏗️ SKILL: vellovy SaaS — Desenvolvimento SCLC-G

## Visão Geral

O **Vellovy** é um SaaS de gestão para profissionais de beleza posicionado como software de classe corporativa. Cada decisão de código, design e UX deve reforçar autoridade, simplicidade e elegância — nunca mediocridade técnica.

Esta SKILL orienta todo o desenvolvimento. Consulte-a antes de escrever qualquer linha de código.

---

## 📱 Estratégia Multi-Plataforma

### O Problema Real

Salões de beleza têm dois perfis de uso distintos:

| Perfil               | Dispositivo           | Necessidade                              |
|----------------------|-----------------------|------------------------------------------|
| Salão médio/grande   | Desktop/notebook      | Agenda do dia na tela cheia, relatórios  |
| Profissional solo    | Celular (Android/iOS) | Agendamentos rápidos, atendimento em campo |
| Recepcionista        | Tablet ou desktop     | Cadastro de clientes, caixa              |

O sistema precisa funcionar bem nos três cenários **sem manter três codebases separadas**.

---

### Estratégia em 2 Fases

#### ✅ Fase 1 — Web + PWA (lançamento)

**Next.js responsivo + PWA instalável**

O app web funciona no desktop E no celular via browser. Com PWA configurado, o profissional pode "instalar" no celular como se fosse um app nativo — ícone na home, tela cheia, offline parcial.

```
Desktop (Chrome/Safari) → acessa app.salao.com.br
Mobile (Chrome/Safari)  → acessa app.salao.com.br → "Adicionar à tela inicial"
```

**Vantagens da Fase 1:**
- Um único codebase web
- Deploy imediato (sem App Store / Play Store)
- Atualizações instantâneas
- Cobre 90% dos casos de uso

#### 🔜 Fase 2 — App Nativo (Expo) para Mobile

Quando a base de clientes exigir:
- Câmera nativa (foto de cliente, antes/depois)
- Push notifications reais
- Experiência de gestos mais fluida
- Presença nas lojas (App Store / Google Play)

O Expo reutiliza a lógica de negócio já construída na Fase 1 — apenas a camada de UI muda.

---

### Arquitetura Monorepo (Turborepo)

```
salao-premium/
├── apps/
│   ├── web/                    # Next.js — desktop + PWA mobile
│   │   ├── app/                # App Router
│   │   ├── components/         # Componentes web-specific
│   │   └── next.config.ts
│   └── mobile/                 # Expo — app nativo (Fase 2)
│       ├── app/                # Expo Router
│       ├── components/         # Componentes RN-specific
│       └── app.config.ts
│
├── packages/
│   ├── shared/                 # ← CÓDIGO COMPARTILHADO (core)
│   │   ├── types/              # Todas as interfaces (Agendamento, Cliente, etc.)
│   │   ├── validators/         # Zod schemas (validação idêntica nos 2 apps)
│   │   ├── stores/             # Zustand stores (lógica de estado)
│   │   ├── lib/
│   │   │   ├── supabase/       # Client + queries (mesmas queries nos 2)
│   │   │   ├── formatters.ts   # Moeda, data, telefone BR
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   └── ui-tokens/              # T_DESIGN como tokens agnósticos de plataforma
│       ├── colors.ts
│       ├── spacing.ts
│       └── typography.ts
│
├── turbo.json
└── package.json
```

**Regra de ouro:** Qualquer lógica que não toca DOM ou View nativa vai em `packages/shared`. Isso inclui stores Zustand, queries Supabase, validators Zod, formatters e tipos.

---

### PWA: Configuração Obrigatória (Fase 1)

```typescript
// next.config.ts
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
  ],
})({
  // ... resto do next config
});

export default config;
```

```json
// public/manifest.json
{
  "name": "Vellovy",
  "short_name": "Vellovy",
  "description": "Gestão profissional do seu salão",
  "theme_color": "#2C1654",
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

---

### Design Responsivo: Breakpoints e Comportamento

```typescript
// Breakpoints Tailwind customizados para o domínio
// tailwind.config.ts
screens: {
  'mobile':  '375px',   // Celular padrão
  'tablet':  '768px',   // Tablet / iPad
  'desktop': '1024px',  // Notebook / Desktop (contexto principal)
  'wide':    '1440px',  // Telas grandes
}
```

**Comportamento por tela:**

| Componente          | Mobile (≤767px)                         | Desktop (≥1024px)                    |
|---------------------|-----------------------------------------|--------------------------------------|
| Navegação           | Bottom nav bar + hamburguer             | Sidebar fixa (240px)                 |
| Agenda              | Lista vertical de horários              | Grade semanal / visualização completa|
| Modal               | Bottom sheet (desliza de baixo)         | Modal centralizado                   |
| Tabelas             | Cards empilhados, 1 coluna              | Tabela completa com colunas          |
| Formulários         | Full-screen, 1 campo por linha          | Side panel ou modal, 2 colunas       |
| Ações rápidas       | FAB (Floating Action Button)            | Botões inline no header              |

```typescript
// Exemplo: Navegação adaptativa
// components/layout/Navigation.tsx

export function Navigation() {
  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="hidden desktop:flex w-60 ...">
        <Sidebar />
      </aside>

      {/* Mobile: bottom nav */}
      <nav className="flex desktop:hidden fixed bottom-0 w-full ...">
        <BottomNav />
      </nav>
    </>
  );
}
```

**Regras de toque (mobile):**
- Todo elemento interativo: mínimo **48x48px** em mobile
- Espaçamento entre botões: mínimo `spacing[3]` (12px)
- Swipe para deletar em listas (mobile only)
- Pull-to-refresh na agenda (mobile only)

---

### Checklist Multi-Plataforma

Antes de cada feature, validar:

- [ ] **Funciona no mobile browser?** Testou no Chrome mobile (375px)?
- [ ] **Funciona no desktop?** Layout não quebra em 1440px?
- [ ] **Touch targets ok?** Elementos interativos ≥ 48x48px no mobile?
- [ ] **PWA installable?** Manifest e service worker configurados?
- [ ] **Lógica em `shared`?** Store / query / validator está no pacote compartilhado?
- [ ] **Offline parcial?** Dado crítico (agenda do dia) está em cache?

---

## 📊 Os 5 Pilares SCLC-G

### 1. **Simple (Simples)**
> Regra dos 3 cliques para toda ação principal. Zero ruído visual. Código com uma responsabilidade por unidade.

- Cada página = um propósito
- Cada hook = uma responsabilidade
- Toda ação crítica: máximo 3 interações até conclusão
- Formulários com no máximo 5 campos visíveis por etapa

### 2. **Loveable (Adorável)**
> Estética de luxo (T_DESIGN), microcopy acolhedor em pt-BR, feedback visual a cada ação.

- Paleta: Verde Musgo + Ouro (ver seção T_DESIGN)
- Tom: confiante, acolhedor, profissional — nunca frio ou genérico
- Animações sutis, não espetaculares
- Emojis estratégicos: 💇 💅 📅 ✓ ⚠️ — nunca excessivos

### 3. **Complete (Completo)**
> CRUD inabalável, zero perda de dados, todos os estados cobertos.

- Todo fluxo cobre: loading → success → error → empty
- Persistência garantida (Supabase como fonte de verdade)
- Validação client + server com Zod
- Sem "TODO" crítico em produção

### 4. **Connected (Conectado)**
> Cada ação ressoa em todo o sistema. Dados em tempo real. Módulos integrados.

- Agendar consulta reflete na agenda, no financeiro e nas métricas
- Real-time via Supabase Realtime onde relevante
- Estado global via Zustand — sem prop drilling
- Módulos: Agenda ↔ Clientes ↔ Financeiro ↔ Profissionais ↔ Relatórios

### 5. **Gamified (Gamificado)**
> Reconhecimento real do trabalho do profissional. Motivação genuína, sem manipulação, sem punição.

- Pontos por atendimentos concluídos
- Badges de especialidade conquistadas por performance
- Streaks de consistência (dias trabalhados)
- Leaderboard semanal, amigável e opcional
- Celebrações proporcionais — confetti apenas onde merece

---

## 🎨 Design System: T_DESIGN Salão Premium

### Paleta de Cores

```typescript
// tokens/theme.ts — FONTE ÚNICA DE VERDADE
// Identidade Vellovy: Plum (roxo) + Rose (rosé)
// Observação: Para um tema neutro alternativo sem fugir da identidade,
// use neutral[800] como base de surface e plum[300] como primary —
// isso gera uma variação "soft" sem criar uma paleta nova.

export const theme = {
  colors: {
    // Brand primária — Plum (roxo profundo)
    primary: {
      50:  '#F5F0FF',
      100: '#EDE0FF',
      200: '#D9C0FF',
      300: '#BB8FEF',
      400: '#7B4F8E',  // ← Plum principal
      500: '#6A3D7A',
      600: '#572F65',
      700: '#432250',
      800: '#2C1654',  // ← Noir (sidebar, headers)
      900: '#1A0B35',
    },

    // Brand secundária — Rose (rosé suave)
    rose: {
      50:  '#FFF5F8',
      100: '#FFE8EF',
      200: '#FFD0DF',
      300: '#F4A7BC',
      400: '#C4879A',  // ← Rose principal
      500: '#B0707F',
      600: '#955A6A',
      700: '#7A4556',
      800: '#5E3040',
      900: '#3D1E2A',
    },

    // Neutros (base cinza fria — não compete com o roxo)
    neutral: {
      0:   '#FFFFFF',
      50:  '#FAFAFA',
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D1D1D6',
      400: '#A1A1AA',
      500: '#71717A',
      600: '#52525B',
      700: '#3F3F46',
      800: '#27272A',
      900: '#18181B',
    },

    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error:   '#EF4444',
      info:    '#3B82F6',
    },

    text: {
      primary:   '#2C1654',  // Noir — quase-preto com tom roxo
      secondary: '#6B5B7A',  // Txt-muted com identidade
      disabled:  '#A1A1AA',
      inverse:   '#FFFFFF',
      rose:      '#C4879A',  // Destaques suaves
    },

    surface: {
      page:    '#FAFAFA',
      card:    '#FFFFFF',
      soft:    '#FAF8FF',    // Lavender muito suave — identidade sem peso
      overlay: 'rgba(44, 22, 84, 0.45)',  // Overlay com tom noir
    },
  },

  // Typography — mantida da SKILL
  typography: {
    fontFamily: {
      display: '"Playfair Display", Georgia, serif',
      body:    '"DM Sans", system-ui, sans-serif',
      mono:    '"Fira Code", monospace',
    },
    scale: {
      xs:    { size: '0.75rem',  weight: 400, lineHeight: '1rem' },
      sm:    { size: '0.875rem', weight: 400, lineHeight: '1.25rem' },
      base:  { size: '1rem',     weight: 400, lineHeight: '1.5rem' },
      lg:    { size: '1.125rem', weight: 500, lineHeight: '1.75rem' },
      xl:    { size: '1.25rem',  weight: 600, lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem',   weight: 700, lineHeight: '2rem' },
      '3xl': { size: '1.875rem', weight: 700, lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem',  weight: 800, lineHeight: '2.5rem' },
    },
  },

  spacing: {
    1:  '0.25rem',
    2:  '0.5rem',
    3:  '0.75rem',
    4:  '1rem',
    5:  '1.25rem',
    6:  '1.5rem',
    8:  '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },

  radius: {
    sm:   '0.25rem',
    md:   '0.5rem',
    lg:   '0.75rem',
    xl:   '1rem',
    full: '9999px',
  },

  shadow: {
    sm:      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md:      '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg:      '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    premium: '0 4px 24px -4px rgba(123, 79, 142, 0.18)',  // Sombra plum
  },

  transition: {
    fast:   'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow:   'all 0.4s ease',
  },
} as const;

  // Typography
  typography: {
    fontFamily: {
      display: '"Playfair Display", Georgia, serif',  // Títulos premium
      body:    '"DM Sans", system-ui, sans-serif',    // Corpo e UI
      mono:    '"Fira Code", monospace',              // Código/valores
    },
    scale: {
      xs:   { size: '0.75rem',  weight: 400, lineHeight: '1rem' },
      sm:   { size: '0.875rem', weight: 400, lineHeight: '1.25rem' },
      base: { size: '1rem',     weight: 400, lineHeight: '1.5rem' },
      lg:   { size: '1.125rem', weight: 500, lineHeight: '1.75rem' },
      xl:   { size: '1.25rem',  weight: 600, lineHeight: '1.75rem' },
      '2xl':{ size: '1.5rem',   weight: 700, lineHeight: '2rem' },
      '3xl':{ size: '1.875rem', weight: 700, lineHeight: '2.25rem' },
      '4xl':{ size: '2.25rem',  weight: 800, lineHeight: '2.5rem' },
    },
  },

  // Spacing (base 4px)
  spacing: {
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },

  // Border Radius
  radius: {
    sm:   '0.25rem',
    md:   '0.5rem',
    lg:   '0.75rem',
    xl:   '1rem',
    full: '9999px',
  },

  // Shadows
  shadow: {
    sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md:  '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    premium: '0 4px 24px -4px rgba(212, 168, 71, 0.18)',  // Sombra dourada
  },

  // Transitions
  transition: {
    fast:   'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow:   'all 0.4s ease',
  },
} as const;
```

### Regras de Uso Obrigatório

```typescript
// ❌ PROIBIDO — hardcode de cor
<div style={{ backgroundColor: '#5C9A6B', padding: '16px' }}>

// ✅ CORRETO — via tema
<div style={{ backgroundColor: theme.colors.primary[400], padding: theme.spacing[4] }}>

// ✅ CORRETO — via Tailwind com custom tokens
<div className="bg-primary-400 p-4">
```

---

## 🏗️ Stack & Arquitetura

### Stack por Camada

| Camada              | Web (Fase 1)                  | Mobile Nativo (Fase 2)         | Compartilhado             |
|---------------------|-------------------------------|--------------------------------|---------------------------|
| Framework           | Next.js 14+ (App Router)      | Expo + Expo Router             | —                         |
| UI                  | Tailwind CSS + Framer Motion  | NativeWind + Reanimated        | T_DESIGN tokens           |
| Estado global       | Zustand                       | Zustand                        | ✅ `packages/shared`      |
| Banco de dados      | Supabase                      | Supabase                       | ✅ `packages/shared`      |
| Queries             | TanStack Query                | TanStack Query                 | ✅ `packages/shared`      |
| Formulários         | React Hook Form + Zod         | React Hook Form + Zod          | ✅ Zod schemas em shared  |
| Notificações        | Sonner (toast)                | Expo Notifications             | —                         |
| Build/Monorepo      | Turborepo                     | Turborepo                      | ✅                        |
| Deploy              | Vercel                        | EAS Build (Expo)               | —                         |

### Estrutura de Pastas (Monorepo)

```
salao-premium/                        # Turborepo root
│
├── apps/
│   ├── web/                          # Next.js — desktop + PWA mobile
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx        # Shell com navegação adaptativa
│   │   │   │   ├── page.tsx          # Dashboard
│   │   │   │   ├── agenda/
│   │   │   │   ├── clientes/
│   │   │   │   ├── financeiro/
│   │   │   │   ├── profissionais/
│   │   │   │   └── relatorios/
│   │   │   └── api/
│   │   ├── components/               # Componentes web-specific
│   │   │   ├── ui/                   # Design system (Tailwind)
│   │   │   ├── agenda/
│   │   │   ├── clientes/
│   │   │   ├── financeiro/
│   │   │   ├── gamification/
│   │   │   └── layout/               # Sidebar + BottomNav adaptativo
│   │   ├── public/manifest.json      # PWA manifest
│   │   └── next.config.ts
│   │
│   └── mobile/                       # Expo — app nativo (Fase 2)
│       ├── app/                      # Expo Router
│       ├── components/               # Componentes RN-specific (NativeWind)
│       └── app.config.ts
│
├── packages/
│   ├── shared/                       # ← NÚCLEO COMPARTILHADO
│   │   ├── types/
│   │   │   ├── index.ts              # Agendamento, Cliente, Serviço...
│   │   │   └── database.types.ts     # Gerado pelo Supabase CLI
│   │   ├── validators/               # Zod schemas (idênticos nos 2 apps)
│   │   │   ├── agendamento.schema.ts
│   │   │   ├── cliente.schema.ts
│   │   │   └── servico.schema.ts
│   │   ├── stores/                   # Zustand (mesma lógica nos 2 apps)
│   │   │   ├── auth.store.ts
│   │   │   ├── agenda.store.ts
│   │   │   ├── clientes.store.ts
│   │   │   ├── financeiro.store.ts
│   │   │   └── gamification.store.ts
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   └── queries/          # Todas as queries de banco
│   │   │   ├── formatters.ts         # Moeda, data, telefone BR
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   └── ui-tokens/                    # T_DESIGN agnóstico de plataforma
│       ├── colors.ts
│       ├── spacing.ts
│       └── typography.ts
│
├── turbo.json
└── package.json
```

**Regra de ouro:** Qualquer lógica que não toca DOM ou componente nativo vai em `packages/shared`. Isso garante que a Fase 2 (app nativo) reuse 80% da lógica já escrita.



---

## 🗂️ Domain Model

### Entidades Principais

```typescript
// types/index.ts

export interface Salao {
  id: string;
  nome: string;
  slug: string;            // Para multi-tenant
  plano: 'starter' | 'pro' | 'enterprise';
  created_at: string;
}

export interface Profissional {
  id: string;
  salao_id: string;
  nome: string;
  especialidades: string[];
  avatar_url?: string;
  ativo: boolean;
  // Gamification
  pontos_total: number;
  nivel: 1 | 2 | 3 | 4 | 5;
  streak_dias: number;
  badges: string[];
  ultimo_atendimento: string | null;
}

export interface Cliente {
  id: string;
  salao_id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  historico_servicos: string[];
  ultima_visita?: string;
  total_visitas: number;
  observacoes?: string;
}

export interface Servico {
  id: string;
  salao_id: string;
  nome: string;
  descricao?: string;
  duracao_minutos: number;
  preco: number;           // Centavos (evitar float)
  categoria: 'cabelo' | 'unhas' | 'estetica' | 'barba' | 'outro';
  ativo: boolean;
}

export interface Agendamento {
  id: string;
  salao_id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora: string;        // ISO 8601
  duracao_minutos: number;
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'no_show';
  valor: number;            // Centavos
  observacoes?: string;
  created_at: string;
  // Joins (quando carregado com relações)
  cliente?: Cliente;
  profissional?: Profissional;
  servico?: Servico;
}

export interface Transacao {
  id: string;
  salao_id: string;
  agendamento_id?: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  valor: number;            // Centavos
  descricao: string;
  data: string;
  metodo_pagamento?: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro';
}
```

---

## 💻 Templates de Código

### 1. Query Supabase (padrão tipado)

```typescript
// lib/supabase/queries/agendamentos.queries.ts
import { createClient } from '@/lib/supabase/client';
import type { Agendamento } from '@/types';

export async function getAgendamentosDoDia(
  salaoId: string,
  data: string  // 'YYYY-MM-DD'
): Promise<Agendamento[]> {
  const supabase = createClient();

  const { data: agendamentos, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      cliente:clientes(*),
      profissional:profissionais(*),
      servico:servicos(*)
    `)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${data}T00:00:00`)
    .lte('data_hora', `${data}T23:59:59`)
    .order('data_hora', { ascending: true });

  if (error) throw new Error(error.message);
  return agendamentos ?? [];
}
```

### 2. Zustand Store

```typescript
// stores/agenda.store.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { getAgendamentosDoDia } from '@/lib/supabase/queries/agendamentos.queries';
import type { Agendamento } from '@/types';

interface AgendaStore {
  // State
  agendamentos: Agendamento[];
  dataAtiva: string;          // 'YYYY-MM-DD'
  isLoading: boolean;
  error: string | null;

  // Actions
  setDataAtiva: (data: string) => void;
  fetchAgendamentos: (salaoId: string, data?: string) => Promise<void>;
  addAgendamento: (agendamento: Agendamento) => void;
  updateAgendamento: (id: string, changes: Partial<Agendamento>) => void;
  removeAgendamento: (id: string) => void;
}

export const useAgendaStore = create<AgendaStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      agendamentos: [],
      dataAtiva: new Date().toISOString().split('T')[0],
      isLoading: false,
      error: null,

      setDataAtiva: (data) => set({ dataAtiva: data }),

      fetchAgendamentos: async (salaoId, data) => {
        const targetDate = data ?? get().dataAtiva;
        set({ isLoading: true, error: null });
        try {
          const agendamentos = await getAgendamentosDoDia(salaoId, targetDate);
          set({ agendamentos, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      addAgendamento: (agendamento) =>
        set((state) => ({
          agendamentos: [...state.agendamentos, agendamento]
            .sort((a, b) => a.data_hora.localeCompare(b.data_hora)),
        })),

      updateAgendamento: (id, changes) =>
        set((state) => ({
          agendamentos: state.agendamentos.map((a) =>
            a.id === id ? { ...a, ...changes } : a
          ),
        })),

      removeAgendamento: (id) =>
        set((state) => ({
          agendamentos: state.agendamentos.filter((a) => a.id !== id),
        })),
    }))
  )
);
```

### 3. Custom Hook

```typescript
// hooks/useAgenda.ts
import { useCallback, useEffect } from 'react';
import { useAgendaStore } from '@/stores/agenda.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export function useAgenda() {
  const salaoId = useAuthStore((s) => s.salaoId);
  const {
    agendamentos,
    dataAtiva,
    isLoading,
    error,
    setDataAtiva,
    fetchAgendamentos,
    updateAgendamento,
  } = useAgendaStore();

  // Carrega ao montar e quando data muda
  useEffect(() => {
    if (salaoId) fetchAgendamentos(salaoId);
  }, [salaoId, dataAtiva, fetchAgendamentos]);

  const confirmarAgendamento = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        updateAgendamento(id, { status: 'confirmado' });

        const supabase = createClient();
        await supabase
          .from('agendamentos')
          .update({ status: 'confirmado' })
          .eq('id', id);

        toast.success('✓ Agendamento confirmado');
      } catch (err) {
        // Rollback
        updateAgendamento(id, { status: 'agendado' });
        toast.error('Erro ao confirmar. Tente novamente.');
      }
    },
    [updateAgendamento]
  );

  const cancelarAgendamento = useCallback(
    async (id: string, motivo?: string) => {
      try {
        updateAgendamento(id, { status: 'cancelado' });

        const supabase = createClient();
        await supabase
          .from('agendamentos')
          .update({ status: 'cancelado', observacoes: motivo })
          .eq('id', id);

        toast.success('Agendamento cancelado');
      } catch (err) {
        updateAgendamento(id, { status: 'confirmado' }); // rollback
        toast.error('Erro ao cancelar.');
      }
    },
    [updateAgendamento]
  );

  return {
    agendamentos,
    dataAtiva,
    isLoading,
    error,
    setDataAtiva,
    confirmarAgendamento,
    cancelarAgendamento,
  };
}
```

### 4. Componente UI (PremiumButton)

```typescript
// components/ui/PremiumButton.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

/**
 * PremiumButton — Botão padrão do Design System Salão Premium.
 * Respeita T_DESIGN e WCAG 2.1 AA.
 */
export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary:
        'bg-primary-400 text-white hover:bg-primary-500 focus-visible:ring-primary-400 shadow-sm',
      secondary:
        'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus-visible:ring-neutral-400 border border-neutral-200',
      ghost:
        'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400',
      danger:
        'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
      gold:
        'bg-gold-400 text-white hover:bg-gold-500 focus-visible:ring-gold-400 shadow-premium',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';
```

### 5. Page Pattern (Next.js App Router)

```typescript
// app/(dashboard)/agenda/page.tsx
import { Suspense } from 'react';
import { AgendaView } from '@/components/agenda/AgendaView';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { createServerClient } from '@/lib/supabase/server';
import { getAgendamentosDoDia } from '@/lib/supabase/queries/agendamentos.queries';

export const metadata = { title: 'Agenda — Salão Premium' };

export default async function AgendaPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pré-carrega dados do dia atual no servidor
  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosIniciais = await getAgendamentosDoDia(user!.id, hoje);

  return (
    <Suspense fallback={<SkeletonLoader rows={6} />}>
      <AgendaView agendamentosIniciais={agendamentosIniciais} />
    </Suspense>
  );
}
```

---

## 🎮 Gamificação: Profissional de Beleza

### Filosofia
Reconhecer trabalho real. Celebrar consistência. Nunca punir. Nunca manipular.

### Sistema de Pontos

| Ação                              | Pontos | Condição                        |
|-----------------------------------|--------|---------------------------------|
| Concluir atendimento              | 80     | Status → `concluido`            |
| Atendimento 5 estrelas (cliente)  | 120    | Avaliação registrada ≥ 5/5      |
| Dia completo (agenda cheia)       | 50     | ≥ 6 atendimentos concluídos     |
| Streak de 5 dias                  | 40     | Bônus único                     |
| Streak de 15 dias                 | 80     | Bônus único                     |
| Novo cliente fidelizado           | 30     | 3ª visita do mesmo cliente      |
| Sem cancelamentos na semana       | 60     | Zero no_show / cancelados       |

**Regra:** máximo 200 pts/dia. Nunca perder pontos.

### Badges de Especialista

| Badge              | Ícone | Como conquistar                         |
|--------------------|-------|-----------------------------------------|
| Primeira Sessão    | 🌱    | Primeiro atendimento concluído          |
| Mãos de Ouro       | ✨    | 20 atendimentos com nota máxima         |
| Fidelizador        | 💛    | 10 clientes com 3+ visitas              |
| Agenda Cheia       | 📅    | 5 dias com agenda completa              |
| Consistente        | 🔥    | 15 dias seguidos trabalhando            |
| Expert de Cabelo   | 💇    | 100 atendimentos de cabelo              |
| Mestre do Salão    | 👑    | 500 atendimentos concluídos (lendário)  |

### Gamification Store

```typescript
// stores/gamification.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface GamificationStore {
  pontos: number;
  nivel: 1 | 2 | 3 | 4 | 5;
  streak: number;
  ultimoAtendimento: string | null;
  badges: string[];
  preferencias: {
    ativo: boolean;
    mostrarLeaderboard: boolean;
    celebracoes: boolean;
    som: boolean;
  };

  addPontos: (quantidade: number, motivo: string) => void;
  desbloquearBadge: (badgeId: string) => void;
  incrementarStreak: () => void;
  resetarStreak: () => void;
  calcularNivel: () => 1 | 2 | 3 | 4 | 5;
}

const NIVEIS = [0, 600, 1500, 3000, 6000]; // pontos mínimos por nível

export const useGamificationStore = create<GamificationStore>()(
  devtools(
    persist(
      (set, get) => ({
        pontos: 0,
        nivel: 1,
        streak: 0,
        ultimoAtendimento: null,
        badges: [],
        preferencias: {
          ativo: true,
          mostrarLeaderboard: true,
          celebracoes: true,
          som: false,
        },

        addPontos: (quantidade, motivo) => {
          const novoTotal = get().pontos + quantidade;
          const novoNivel = get().calcularNivel();
          set({ pontos: novoTotal, nivel: novoNivel });
          // Dispara toast via observer externo
        },

        desbloquearBadge: (badgeId) => {
          if (get().badges.includes(badgeId)) return;
          set((s) => ({ badges: [...s.badges, badgeId] }));
        },

        incrementarStreak: () => {
          const hoje = new Date().toISOString().split('T')[0];
          const ultimo = get().ultimoAtendimento;
          const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (ultimo === ontem) {
            set((s) => ({ streak: s.streak + 1, ultimoAtendimento: hoje }));
          } else if (ultimo !== hoje) {
            set({ streak: 1, ultimoAtendimento: hoje });
          }
        },

        resetarStreak: () => set({ streak: 0 }),

        calcularNivel: () => {
          const pontos = get().pontos;
          let nivel: 1 | 2 | 3 | 4 | 5 = 1;
          NIVEIS.forEach((minimo, i) => {
            if (pontos >= minimo) nivel = (i + 1) as any;
          });
          return nivel;
        },
      }),
      { name: 'gamification-store' }
    )
  )
);
```

---

## 🌐 Microcopy (pt-BR)

```typescript
// lib/constants/messages.ts
export const MSG = {
  AGENDA: {
    VAZIA: 'Nenhum atendimento hoje. Que tal adicionar o primeiro?',
    CRIADO: '✓ Agendamento criado com sucesso',
    CONFIRMADO: '✓ Agendamento confirmado',
    CANCELADO: 'Agendamento cancelado',
    ERRO_SALVAR: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    CONFLITO_HORARIO: '⚠️ Já existe um agendamento neste horário para este profissional.',
  },
  CLIENTE: {
    CADASTRADO: '✓ Cliente cadastrado',
    ATUALIZADO: '✓ Dados atualizados',
    DELETAR_CONFIRM: 'Tem certeza que quer remover este cliente? Esta ação não pode ser desfeita.',
  },
  FINANCEIRO: {
    RECEITA_REGISTRADA: '✓ Receita registrada',
    DESPESA_REGISTRADA: '✓ Despesa registrada',
    SALDO_NEGATIVO: '⚠️ Saldo em atenção este mês',
  },
  GAMIFICATION: {
    BADGE_DESBLOQUEADO: (nome: string) => `🏆 Badge conquistado: ${nome}!`,
    STREAK: (dias: number) => `🔥 ${dias} dias seguidos — Continue assim!`,
    NIVEL_UP: (nivel: number) => `🎊 Você subiu para o Nível ${nivel}!`,
    BEM_VINDO: 'Bem-vindo de volta! 👋',
  },
  ERROS: {
    GENERICO: 'Algo deu errado. Tente novamente.',
    SEM_CONEXAO: '📶 Sem conexão. Verifique sua internet.',
    NAO_AUTORIZADO: 'Sessão expirada. Faça login novamente.',
    CAMPO_OBRIGATORIO: (campo: string) => `${campo} é obrigatório`,
  },
} as const;
```

---

## ✅ Checklist de Qualidade

### Antes de cada commit, validar:

#### Code
- [ ] Sem `any` em TypeScript — use tipos explícitos ou generics
- [ ] Sem cores hardcoded — apenas `theme.*` ou classes Tailwind customizadas
- [ ] Componentes < 300 linhas — extrair se maior
- [ ] Funções < 25 linhas — extrair se maior
- [ ] Nomes descritivos — `useAgendamentosDoDia`, não `useAg`
- [ ] Sem `console.log` em produção
- [ ] Importações organizadas: React → libs externas → projeto → tipos
- [ ] Lógica de negócio em `packages/shared`, não em `apps/web` diretamente

#### Multi-Plataforma
- [ ] Testou em mobile browser (375px, Chrome DevTools)?
- [ ] Testou em desktop (1440px)?
- [ ] Touch targets ≥ 48x48px nos elementos mobile?
- [ ] Navegação adaptativa funciona (sidebar no desktop, bottom nav no mobile)?
- [ ] Modais usam bottom sheet no mobile e modal centralizado no desktop?
- [ ] PWA manifest e service worker configurados?
- [ ] Dado crítico (agenda do dia) está em cache offline?

#### UX / Design
- [ ] T_DESIGN aplicado (Verde Musgo + Ouro)
- [ ] Regra dos 3 cliques respeitada
- [ ] Todos os estados cobertos: `loading` → `success` → `error` → `empty`
- [ ] Toast/feedback em toda ação do usuário
- [ ] Microcopy em pt-BR e acolhedor

#### Funcionalidade
- [ ] CRUD completo para a entidade em questão
- [ ] Validação Zod no client E no server
- [ ] Erros do Supabase capturados e tratados
- [ ] Operações otimistas com rollback quando aplicável

#### Acessibilidade (WCAG 2.1 AA)
- [ ] Contraste de cores ≥ 4.5:1 (texto normal), ≥ 3:1 (texto grande)
- [ ] Todos os elementos interativos acessíveis via teclado
- [ ] Labels semânticos em inputs (`htmlFor` + `id`)
- [ ] `aria-*` attributes onde necessário
- [ ] Focusable ring visível em todos os elementos interativos

#### Gamificação
- [ ] Reconhece trabalho real (não ação artificial)?
- [ ] Sem punição (nunca remove pontos)?
- [ ] Sem Dark Patterns (notificações manipuladoras)?
- [ ] Usuário pode desabilitar via preferências?
- [ ] Celebrações proporcionais ao achievement?

#### Segurança
- [ ] Row-Level Security (RLS) ativo no Supabase para a tabela
- [ ] Nunca expor `salao_id` hardcoded no client — sempre via `auth.uid()`
- [ ] Variáveis de ambiente: `NEXT_PUBLIC_*` apenas para o que é seguro expor

---

## 🚀 Como Usar Esta SKILL

### Padrão de solicitação ao assistente:

```
"Desenvolva [feature] seguindo a SKILL Salão Premium:

1. Feature: [descrição clara]
2. Tipo: Hook / Componente / Page / Store / Query
3. Requisitos:
   - [req 1]
   - [req 2]
4. Módulo relacionado: [Agenda / Clientes / Financeiro / Gamificação]
5. Referência: [componente ou padrão similar já existente]

Siga os padrões de:
- T_DESIGN (Verde Musgo + Ouro)
- Zustand store pattern
- Microcopy pt-BR
- WCAG 2.1 AA
- Checklist de qualidade SCLC-G
"
```

### Exemplo prático:

```
"Desenvolva o componente `AgendaSlot` seguindo a SKILL Salão Premium:

1. Feature: Card de horário da agenda diária
2. Tipo: Componente (molécula)
3. Requisitos:
   - Mostrar hora, nome do cliente, serviço e profissional
   - Status visual com cor semântica (confirmado=verde, cancelado=cinza, no_show=vermelho)
   - Ação de confirmar e cancelar acessível
   - Skeleton quando carregando
4. Módulo: Agenda
5. Referência: PremiumCard + PremiumBadge

Siga T_DESIGN, WCAG 2.1 AA e microcopy pt-BR."
```

---

## 📋 Checklist de Release (Feature Completa)

- [ ] **Conectada?** Esta feature conversa com o resto do sistema?
- [ ] **Responsiva?** Funciona bem no mobile (375px) E no desktop (1440px)?
- [ ] **PWA-ready?** Funciona offline parcialmente? Installable no celular?
- [ ] **Shared-first?** Lógica de negócio está em `packages/shared`?
- [ ] **Gamificada?** O profissional recebe feedback/incentivo?
- [ ] **Segura?** RLS configurado no Supabase?
- [ ] **Acessível?** WCAG 2.1 AA validado?
- [ ] **Simples?** 3-click rule respeitada?
- [ ] **Premium?** Estética Verde Musgo + Ouro consistente?
- [ ] **Testada?** Testes unitários de hooks e queries?
- [ ] **Documentada?** JSDoc nos componentes principais?

---

**Versão:** 1.1
**Data:** Abril 2026
**Status:** ✅ Production-Ready
**Plataformas:** Web Desktop · PWA Mobile · App Nativo (Fase 2)
**Princípio:** "Software que faz o profissional de beleza se sentir poderoso — em qualquer tela."
