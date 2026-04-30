-- supabase/migrations/v2_normalized.sql
-- Schema normalizado do Vellovy SaaS v4
-- IMPORTANTE: Executar em staging primeiro, nunca direto em produção

-- ═══════════════════════════════════════════════════════════════
-- TABELAS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saloes (
  id          uuid REFERENCES auth.users(id) PRIMARY KEY,
  nome        text NOT NULL,
  responsavel text,
  telefone    text,
  plano       text DEFAULT 'free' CHECK (plano IN ('free','pro','enterprise')),
  cor_primaria     text DEFAULT '#7B4F8E',
  cor_secundaria   text DEFAULT '#C4879A',
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
  mes_ano     text NOT NULL,
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

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — cada salão vê só seus dados
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE saloes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_fixos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE repasses          ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_salao    ON saloes            FOR ALL USING (auth.uid() = id);
CREATE POLICY rls_prof     ON profissionais      FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_clientes ON clientes           FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_servicos ON servicos           FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_agenda   ON agendamentos       FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_caixa    ON lancamentos_caixa  FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_custos   ON custos_fixos       FOR ALL USING (auth.uid() = salao_id);
CREATE POLICY rls_repasses ON repasses           FOR ALL USING (auth.uid() = salao_id);

-- ═══════════════════════════════════════════════════════════════
-- ÍNDICES DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_agenda_salao_data   ON agendamentos(salao_id, data_hora);
CREATE INDEX idx_agenda_status       ON agendamentos(salao_id, status);
CREATE INDEX idx_caixa_salao_data    ON lancamentos_caixa(salao_id, data);
CREATE INDEX idx_clientes_salao      ON clientes(salao_id, segmento);
CREATE INDEX idx_clientes_telefone   ON clientes(salao_id, telefone);
CREATE INDEX idx_prof_salao          ON profissionais(salao_id, ativo);
CREATE INDEX idx_servicos_salao      ON servicos(salao_id, ativo);
CREATE INDEX idx_custos_mes          ON custos_fixos(salao_id, mes_ano);
CREATE INDEX idx_repasses_mes        ON repasses(salao_id, mes_ano);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: updated_at automático nos agendamentos
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agendamentos_updated_at
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
