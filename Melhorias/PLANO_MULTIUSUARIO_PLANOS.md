# 🏗️ Vellovy — Plano de Implementação: Multi-Usuário + Planos
### Adendo ao v5 · Sprints 11–13 · Abril 2026

---

## 🧭 O Que Este Documento Cobre

O plano v5 (Sprints 0–10) entrega o produto funcional para um único usuário-salão.
Este adendo adiciona **três camadas que transformam o Vellovy em SaaS comercializável**:

1. **Multi-usuário por salão** — o dono convida profissionais, cada um tem login próprio
2. **Controle de planos e limites** — regras de acesso por plano (Free → Ilimitado)
3. **Infraestrutura de billing** — Stripe + webhooks + gestão de assinatura

---

## 🗂️ Modelo de Acesso — Decisões de Arquitetura

### Hierarquia de Papéis

```
Salão (entidade)
  └── Owner (dono)         → acesso total, gerencia equipe, vê financeiro
      └── Profissional     → vê só sua agenda, seus atendimentos, sua gamificação
          └── Recepcionista (futuro) → agenda de todos + clientes, sem financeiro
```

**Regra de ouro:** O banco impõe o isolamento via RLS. O código nunca filtra por `role` manualmente — isso seria um buraco de segurança.

### Fluxo de Convite (Invite Flow)

```
Owner → Configurações → Equipe → "Convidar Profissional"
  ↓
Insere email → Sistema cria token único (7 dias de validade)
  ↓
Supabase Edge Function dispara email com link:
  https://app.vellovy.com.br/convite?token=XXXX
  ↓
Profissional clica → cria conta (ou faz login se já tiver)
  ↓
Token validado → registro em `membros_salao` criado
  ↓
Profissional acessa o app com visão restrita
```

### O Que Cada Papel Vê

| Módulo | Owner | Profissional |
|---|---|---|
| Agenda — todos os profissionais | ✅ | ❌ (só a própria) |
| Caixa do dia | ✅ | ✅ (só lançamentos próprios) |
| Clientes | ✅ | ✅ (leitura) |
| Financeiro (receita total, repasses) | ✅ | ❌ |
| Dashboard com KPIs | ✅ | 🟡 (KPIs pessoais) |
| Configurações do salão | ✅ | ❌ |
| Gamificação (própria) | ✅ | ✅ |
| Leaderboard da equipe | ✅ | ✅ |

---

## 🗄️ Schema — Novas Tabelas

### Sprint 11.1 — DDL Completo

```sql
-- =====================================================
-- TABELA: membros_salao
-- Vincula auth.users a salões com papel específico
-- =====================================================
CREATE TABLE membros_salao (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id        uuid REFERENCES saloes(id)       ON DELETE CASCADE NOT NULL,
  user_id         uuid REFERENCES auth.users(id)   ON DELETE CASCADE NOT NULL,
  profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  role            text DEFAULT 'profissional'
    CHECK (role IN ('owner', 'profissional', 'recepcionista')),
  ativo           boolean DEFAULT true,
  convidado_em    timestamptz DEFAULT now(),
  aceito_em       timestamptz,
  UNIQUE (salao_id, user_id)
);

-- =====================================================
-- TABELA: convites
-- Tokens de convite para novos membros
-- =====================================================
CREATE TABLE convites (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id    uuid REFERENCES saloes(id) ON DELETE CASCADE NOT NULL,
  email       text NOT NULL,
  role        text DEFAULT 'profissional',
  token       text UNIQUE DEFAULT gen_random_uuid()::text,
  usado       boolean DEFAULT false,
  expira_em   timestamptz DEFAULT (now() + interval '7 days'),
  created_at  timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: planos_salao
-- Controle de assinatura por salão
-- =====================================================
CREATE TABLE planos_salao (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id                uuid REFERENCES saloes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plano                   text DEFAULT 'free'
    CHECK (plano IN ('free', 'essencial', 'profissional', 'premium', 'ilimitado')),
  status                  text DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'cancelado', 'suspenso', 'trial')),
  profissionais_max       int DEFAULT 1,
  tem_bot_telegram        boolean DEFAULT false,
  tem_whatsapp_api        boolean DEFAULT false,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  periodo_inicio          timestamptz,
  periodo_fim             timestamptz,
  trial_fim               timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- =====================================================
-- RLS: membros_salao
-- =====================================================
ALTER TABLE membros_salao ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_salao  ENABLE ROW LEVEL SECURITY;

-- Owner vê e gerencia sua equipe
CREATE POLICY rls_membros_owner ON membros_salao
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Profissional vê apenas seu próprio registro
CREATE POLICY rls_membros_proprio ON membros_salao
  FOR SELECT USING (user_id = auth.uid());

-- Convites: owner cria e gerencia
CREATE POLICY rls_convites_owner ON convites
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Plano: owner vê e gerencia
CREATE POLICY rls_plano_owner ON planos_salao
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =====================================================
-- ATUALIZAR RLS das tabelas existentes
-- Profissionais só acessam dados do salão ao qual pertencem
-- =====================================================

-- Exemplo: agendamentos
DROP POLICY IF EXISTS rls_agenda ON agendamentos;

CREATE POLICY rls_agenda_owner ON agendamentos
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY rls_agenda_profissional ON agendamentos
  FOR SELECT USING (
    profissional_id IN (
      SELECT profissional_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'profissional'
    )
  );

-- Padrão idêntico para: lancamentos_caixa, profissionais, clientes
-- (profissional: SELECT only nas tabelas de clientes e serviços)
-- (profissional: SELECT + INSERT em lancamentos_caixa para os próprios)

-- =====================================================
-- FUNÇÃO: verificar_limite_profissionais()
-- Bloqueia convite se plano atingiu limite
-- =====================================================
CREATE OR REPLACE FUNCTION verificar_limite_profissionais()
RETURNS TRIGGER AS $$
DECLARE
  v_max int;
  v_atual int;
BEGIN
  SELECT profissionais_max INTO v_max
  FROM planos_salao
  WHERE salao_id = NEW.salao_id;

  SELECT COUNT(*) INTO v_atual
  FROM membros_salao
  WHERE salao_id = NEW.salao_id
    AND role = 'profissional'
    AND ativo = true;

  IF v_atual >= v_max THEN
    RAISE EXCEPTION 'LIMITE_PLANO: Este plano permite no máximo % profissionais.', v_max;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limite_profissionais
BEFORE INSERT ON membros_salao
FOR EACH ROW
WHEN (NEW.role = 'profissional')
EXECUTE FUNCTION verificar_limite_profissionais();

-- =====================================================
-- FUNÇÃO: criar_plano_free_no_cadastro()
-- Todo salão novo começa no Free automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION criar_plano_free_no_cadastro()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO planos_salao (salao_id, plano, profissionais_max)
  VALUES (NEW.id, 'free', 1);

  -- Owner como primeiro membro
  INSERT INTO membros_salao (salao_id, user_id, role, aceito_em)
  VALUES (NEW.id, auth.uid(), 'owner', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_plano_inicial
AFTER INSERT ON saloes
FOR EACH ROW
EXECUTE FUNCTION criar_plano_free_no_cadastro();
```

---

## 📦 Definição dos Planos

### Tabela de Limites

| Recurso | Free | Essencial | Profissional | Premium | Ilimitado |
|---|---|---|---|---|---|
| Profissionais | 1 | 3 | 5 | 15 | ∞ |
| Agendamentos/mês | 50 | ∞ | ∞ | ∞ | ∞ |
| Bot Telegram | ❌ | ❌ | ✅ | ✅ | ✅ |
| API WhatsApp | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gamificação | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios avançados | ❌ | ✅ | ✅ | ✅ | ✅ |
| Suporte prioritário | ❌ | ❌ | ❌ | ✅ | ✅ |
| Preço mensal | Grátis | R$ 39 | R$ 69 | R$ 119 | R$ 189 |
| Preço anual (mês) | — | R$ 32 | R$ 57 | R$ 97 | R$ 155 |

### Constante de Planos (Compartilhada)

```typescript
// packages/shared/lib/constants/planos.ts

export const PLANOS = {
  free: {
    id: 'free',
    nome: 'Free',
    preco_mensal: 0,
    preco_anual_mes: 0,
    profissionais_max: 1,
    agendamentos_mes: 50,
    tem_bot_telegram: false,
    tem_whatsapp_api: false,
    tem_relatorios: false,
    stripe_price_mensal: null,
    stripe_price_anual: null,
  },
  essencial: {
    id: 'essencial',
    nome: 'Essencial',
    preco_mensal: 3900,      // centavos
    preco_anual_mes: 3200,
    profissionais_max: 3,
    agendamentos_mes: Infinity,
    tem_bot_telegram: false,
    tem_whatsapp_api: false,
    tem_relatorios: true,
    stripe_price_mensal: process.env.STRIPE_ESSENCIAL_MENSAL,
    stripe_price_anual:  process.env.STRIPE_ESSENCIAL_ANUAL,
  },
  profissional: {
    id: 'profissional',
    nome: 'Profissional',
    preco_mensal: 6900,
    preco_anual_mes: 5700,
    profissionais_max: 5,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: false,
    tem_relatorios: true,
    stripe_price_mensal: process.env.STRIPE_PROF_MENSAL,
    stripe_price_anual:  process.env.STRIPE_PROF_ANUAL,
  },
  premium: {
    id: 'premium',
    nome: 'Premium',
    preco_mensal: 11900,
    preco_anual_mes: 9700,
    profissionais_max: 15,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: true,
    tem_relatorios: true,
    stripe_price_mensal: process.env.STRIPE_PREMIUM_MENSAL,
    stripe_price_anual:  process.env.STRIPE_PREMIUM_ANUAL,
  },
  ilimitado: {
    id: 'ilimitado',
    nome: 'Ilimitado',
    preco_mensal: 18900,
    preco_anual_mes: 15500,
    profissionais_max: 9999,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: true,
    tem_relatorios: true,
    stripe_price_mensal: process.env.STRIPE_ILIM_MENSAL,
    stripe_price_anual:  process.env.STRIPE_ILIM_ANUAL,
  },
} as const;

export type PlanoId = keyof typeof PLANOS;

export function podeCriarProfissional(
  planoAtual: PlanoId,
  quantidadeAtual: number
): boolean {
  return quantidadeAtual < PLANOS[planoAtual].profissionais_max;
}

export function temRecurso(
  planoAtual: PlanoId,
  recurso: 'tem_bot_telegram' | 'tem_whatsapp_api' | 'tem_relatorios'
): boolean {
  return PLANOS[planoAtual][recurso];
}
```

---

## 🚦 Roadmap — Sprints 11–13

### Sprint 11 — Multi-Usuário (Base)
**4 dias**

#### 11.1 — Schema + Triggers (DDL acima)

#### 11.2 — Auth: Identificar Papel no Login

```typescript
// packages/shared/stores/authStore.ts — ATUALIZADO

interface AuthStore {
  user: User | null;
  salaoId: string | null;
  role: 'owner' | 'profissional' | 'recepcionista' | null;
  profissionalId: string | null;

  // Carregado após login
  loadSession: () => Promise<void>;
}

// Após login, buscar papel na tabela membros_salao
const { data: membro } = await supabase
  .from('membros_salao')
  .select('salao_id, role, profissional_id')
  .eq('user_id', user.id)
  .eq('ativo', true)
  .single();

// Salvar no store: role, salaoId, profissionalId
```

#### 11.3 — Middleware: Rota Protegida por Papel

```typescript
// apps/web/middleware.ts
const ROTAS_OWNER_ONLY = ['/financeiro', '/configuracoes', '/relatorios'];

if (ROTAS_OWNER_ONLY.some(r => pathname.startsWith(r)) && role !== 'owner') {
  return NextResponse.redirect(new URL('/agenda', request.url));
}
```

#### 11.4 — Edge Function: Envio de Convite por Email

```typescript
// supabase/functions/enviar-convite/index.ts
// Recebe: { email, salaoId, role, nomeOwner, nomeSalao }
// Cria registro em `convites`
// Envia email via Resend (resend.com — free tier 3k/mês)
// Template: "Fulano te convidou para gerenciar o Salão XYZ no Vellovy"
```

#### 11.5 — Página de Aceite do Convite

```typescript
// apps/web/app/convite/page.tsx
// Rota pública: /convite?token=XXXX
// Valida token → não expirado, não usado
// Se usuário logado → vincula diretamente
// Se não logado → mostra formulário de cadastro → vincula ao completar
// Após aceite → marca token como usado → redireciona para /agenda
```

#### 11.6 — UI: Gestão de Equipe (Owner)

```
/configuracoes → aba "Equipe"
  → Lista de membros com badge de papel + status (ativo/pendente)
  → Botão "Convidar Profissional" (verifica limite do plano)
  → Botão remover membro (desativa, não deleta)
  → Badge "Limite do plano: 3/5 profissionais"
  → CTA "Precisa de mais? Upgrade de plano →"
```

---

### Sprint 12 — Planos + Billing
**4 dias**

#### 12.1 — Stripe Setup

```bash
# Instalar Stripe SDK
npm install stripe @stripe/stripe-js --workspace=apps/web

# Variáveis de ambiente necessárias
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Criar produtos no Stripe Dashboard:
# - Vellovy Essencial (mensal + anual)
# - Vellovy Profissional (mensal + anual)
# - Vellovy Premium (mensal + anual)
# - Vellovy Ilimitado (mensal + anual)
```

#### 12.2 — Checkout (Supabase Edge Function)

```typescript
// supabase/functions/criar-checkout/index.ts
// Recebe: { planoId, ciclo: 'mensal' | 'anual', salaoId }
// Cria Stripe Checkout Session
// Retorna: { url } → redirecionar o usuário

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: stripePriceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${origin}/configuracoes?upgrade=sucesso`,
  cancel_url:  `${origin}/planos`,
  metadata:    { salao_id: salaoId, plano_id: planoId },
  customer_email: ownerEmail,
});
```

#### 12.3 — Webhook Stripe (Supabase Edge Function)

```typescript
// supabase/functions/webhook-stripe/index.ts
// Eventos tratados:
//   checkout.session.completed → ativar plano
//   customer.subscription.updated → atualizar plano
//   customer.subscription.deleted → reverter para free
//   invoice.payment_failed → marcar como suspenso + notificar owner

async function ativarPlano(salaoId: string, planoId: string, subscriptionId: string) {
  const limites = PLANOS[planoId as PlanoId];
  await supabase.from('planos_salao').upsert({
    salao_id: salaoId,
    plano: planoId,
    status: 'ativo',
    profissionais_max: limites.profissionais_max,
    tem_bot_telegram:  limites.tem_bot_telegram,
    tem_whatsapp_api:  limites.tem_whatsapp_api,
    stripe_subscription_id: subscriptionId,
  });
}
```

#### 12.4 — Portal do Cliente Stripe (gerenciar assinatura)

```typescript
// supabase/functions/portal-cliente/index.ts
// Owner clica "Gerenciar Assinatura" → redireciona para Stripe Customer Portal
// Lá: trocar plano, cancelar, atualizar cartão

const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${origin}/configuracoes`,
});
```

#### 12.5 — Enforcement de Limites no Código

```typescript
// Qualquer componente que cria profissional usa esse hook
// packages/shared/hooks/usePlano.ts

export function usePlano() {
  const { salaoId } = useAuthStore();
  const { data: plano } = useQuery({
    queryKey: ['plano', salaoId],
    queryFn: () => getPlanoDoSalao(salaoId!),
  });

  return {
    plano,
    podeCriarProfissional: (qtdAtual: number) =>
      qtdAtual < (plano?.profissionais_max ?? 1),
    temTelegram: plano?.tem_bot_telegram ?? false,
    temWhatsApp: plano?.tem_whatsapp_api ?? false,
  };
}

// Uso no componente:
const { podeCriarProfissional, plano } = usePlano();

<PremiumButton
  disabled={!podeCriarProfissional(equipe.length)}
  onClick={abrirConvite}
>
  Convidar Profissional
</PremiumButton>

{!podeCriarProfissional(equipe.length) && (
  <PlanoUpgradeCard
    mensagem={`Seu plano ${plano?.plano} permite até ${plano?.profissionais_max} profissionais.`}
    cta="Fazer upgrade"
  />
)}
```

---

### Sprint 13 — Página de Planos + WhatsApp API
**3 dias**

#### 13.1 — Página de Planos Interna (/planos)

Versão dentro do app (para usuários já logados que querem fazer upgrade).

#### 13.2 — Landing Page de Planos (HTML externo)

**Arquivo separado** — entregue junto com este plano.
URL: `vellovy.com.br/planos`

#### 13.3 — WhatsApp API (Plano Premium+)

**Tecnologia recomendada:** Evolution API (open source, auto-hospedado) ou Zapi/WPPConnect.
**Não usar Meta Business API** neste momento — burocracia e custo elevados para validação inicial.

```typescript
// supabase/functions/whatsapp-enviar/index.ts
// Disponível apenas para planos com tem_whatsapp_api = true

// Casos de uso:
// 1. Confirmação de agendamento (1 dia antes, automático)
// 2. Lembrete no dia do atendimento (2h antes)
// 3. Mensagem pós-atendimento (agradecimento + avaliação)

// Configuração em /configuracoes → WhatsApp:
//   - Número conectado (QR code via Evolution API)
//   - Templates de mensagem editáveis
//   - Horário de envio (não enviar depois das 20h)
```

---

## 📊 Dependências entre Sprints

```
Sprint 10 (concluído)
  ↓
Sprint 11 — Multi-usuário    (Schema + Auth + Convite + UI)
  ↓
Sprint 12 — Planos + Billing (Stripe + Webhook + Enforcement)
  ↓
Sprint 13 — Landing + WhatsApp
```

---

## ⚠️ Riscos Específicos — Multi-Usuário + Planos

| Risco | Impacto | Mitigação |
|---|---|---|
| Profissional acessa dados de outro salão | **Crítico** | RLS em todas as tabelas — testes de segurança obrigatórios antes do deploy |
| Owner rebaixado por engano perde acesso | Alto | Mínimo 1 owner por salão sempre (constraint no banco) |
| Webhook Stripe não chega → plano não ativado | Alto | Log de webhooks + retry automático do Stripe + verificação manual em /configuracoes |
| WhatsApp bloqueado por spam | Médio | Rate limit de 1 msg/cliente/dia + opt-out visível |
| Trial abuse (criar novas contas para trial grátis) | Médio | Verificação de email real (Supabase OTP) + 1 trial por número de telefone |

---

## 🔑 Decisões de Arquitetura (Multi-Usuário)

1. **Um `auth.user` por profissional** — não criar sistema de auth paralelo. Usar o Supabase Auth nativo com tabela `membros_salao` como ponte.

2. **Token de convite no banco, não no JWT** — mais fácil de revogar e auditar.

3. **Stripe como única fonte de verdade para billing** — o banco espelha o estado, mas o Stripe decide. Nunca atualizar o plano sem passar pelo webhook.

4. **Enforcement duplo: trigger no banco + middleware** — o banco é a última linha. O middleware é UX. Nunca confiar só no front-end.

5. **WhatsApp via Evolution API** — mais barato e sem aprovação Meta para validação inicial. Migrar para Meta Business API quando > 500 usuários ativos.

6. **Plano Free funcional** — usuário gratuito precisa conseguir usar o produto de verdade (1 profissional, 50 agendamentos). Free que não funciona não converte.

---

## 📅 Estimativa Acumulada

| Fase | Sprints | Dias úteis |
|---|---|---|
| Produto base | E + 0–10 | ~31 dias |
| Multi-usuário | 11 | +4 dias |
| Billing + Planos | 12 | +4 dias |
| Landing + WhatsApp | 13 | +3 dias |
| **Total acumulado** | | **~42 dias úteis** |

---

*Adendo v5 → Multi-Usuário + Planos*
*Vellovy SaaS · Abril 2026*
