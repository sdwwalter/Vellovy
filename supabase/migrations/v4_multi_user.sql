-- =====================================================
-- TABELA: membros_salao
-- Vincula auth.users a salões com papel específico
-- =====================================================
CREATE TABLE IF NOT EXISTS membros_salao (
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
CREATE TABLE IF NOT EXISTS convites (
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
CREATE TABLE IF NOT EXISTS planos_salao (
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

-- agendamentos
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

-- lancamentos_caixa
DROP POLICY IF EXISTS rls_caixa ON lancamentos_caixa;

CREATE POLICY rls_caixa_owner ON lancamentos_caixa
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY rls_caixa_profissional_select ON lancamentos_caixa
  FOR SELECT USING (
    profissional_id IN (
      SELECT profissional_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'profissional'
    )
  );

CREATE POLICY rls_caixa_profissional_insert ON lancamentos_caixa
  FOR INSERT WITH CHECK (
    profissional_id IN (
      SELECT profissional_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'profissional'
    )
  );

-- profissionais
DROP POLICY IF EXISTS rls_prof ON profissionais;

CREATE POLICY rls_prof_owner ON profissionais
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY rls_prof_profissional_select ON profissionais
  FOR SELECT USING (
    id IN (
      SELECT profissional_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'profissional'
    )
  );

-- clientes
DROP POLICY IF EXISTS rls_clientes ON clientes;

CREATE POLICY rls_clientes_owner ON clientes
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY rls_clientes_profissional_select ON clientes
  FOR SELECT USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'profissional'
    )
  );

-- servicos
DROP POLICY IF EXISTS rls_servicos ON servicos;

CREATE POLICY rls_servicos_owner ON servicos
  FOR ALL USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY rls_servicos_profissional_select ON servicos
  FOR SELECT USING (
    salao_id IN (
      SELECT salao_id FROM membros_salao
      WHERE user_id = auth.uid() AND role = 'profissional'
    )
  );

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

DROP TRIGGER IF EXISTS trg_limite_profissionais ON membros_salao;
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

DROP TRIGGER IF EXISTS trg_plano_inicial ON saloes;
CREATE TRIGGER trg_plano_inicial
AFTER INSERT ON saloes
FOR EACH ROW
EXECUTE FUNCTION criar_plano_free_no_cadastro();

-- =====================================================
-- MIGRAÇÃO DE DADOS EXISTENTES (Opcional/Necessário se já houver salões)
-- Cria planos e owner para salões e usuários existentes
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM saloes LOOP
        IF NOT EXISTS (SELECT 1 FROM planos_salao WHERE salao_id = r.id) THEN
            INSERT INTO planos_salao (salao_id, plano, profissionais_max)
            VALUES (r.id, 'free', 1);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM membros_salao WHERE salao_id = r.id AND user_id = r.id) THEN
            INSERT INTO membros_salao (salao_id, user_id, role, aceito_em)
            VALUES (r.id, r.id, 'owner', now());
        END IF;
    END LOOP;
END;
$$;
