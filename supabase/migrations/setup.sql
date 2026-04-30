-- 1. Tabela de perfis (vincula user_id ↔ telegram_chat_id)
CREATE TABLE IF NOT EXISTS profiles (
    user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_chat_id text UNIQUE,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário só acessa o próprio perfil
CREATE POLICY "perfil proprio" ON profiles
    FOR ALL USING (auth.uid() = user_id);

-- Trigger: cria perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();


-- 2. Tabela de tokens de vínculo (expira em 10 minutos)
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    chat_id     text PRIMARY KEY,
    token       text NOT NULL,
    created_at  timestamp with time zone DEFAULT now()
);

-- RLS: apenas service_role acessa (Edge Function usa service key)
ALTER TABLE telegram_link_tokens ENABLE ROW LEVEL SECURITY;

-- Sem política pública → apenas service_role pode ler/escrever
-- (a Edge Function usa SUPABASE_SERVICE_ROLE_KEY, bypassa RLS)


-- 3. Função de limpeza automática de tokens expirados
CREATE OR REPLACE FUNCTION limpar_tokens_expirados()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM telegram_link_tokens
    WHERE created_at < now() - interval '10 minutes';
END;
$$;


-- ═══════════════════════════════════════════════════════
-- 4. Tabela principal de dados do salão (multi-tenant)
-- ═══════════════════════════════════════════════════════
-- NOTA: Esta tabela é da v3 (JSONB). Mantida para compatibilidade
-- durante a migração. As tabelas normalizadas estão em v2_normalized.sql.

CREATE TABLE IF NOT EXISTS salao_data (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type   text NOT NULL,
    data        jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at  timestamp with time zone DEFAULT now(),
    CONSTRAINT salao_data_user_type_uq UNIQUE (user_id, data_type)
);

CREATE INDEX IF NOT EXISTS salao_data_user_idx ON salao_data (user_id);

ALTER TABLE salao_data ENABLE ROW LEVEL SECURITY;

-- Usuário acessa apenas seus próprios dados
CREATE POLICY "salao_data_proprio" ON salao_data
    FOR ALL USING (auth.uid() = user_id);

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER salao_data_updated_at
    BEFORE UPDATE ON salao_data
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 5. Policy complementar: front-end lê/exclui o próprio
--    token de vínculo (fluxo Configurações > Bot Telegram)
CREATE POLICY "token_leitura_autenticado" ON telegram_link_tokens
    FOR SELECT USING (true);

CREATE POLICY "token_delete_autenticado" ON telegram_link_tokens
    FOR DELETE USING (true);
