-- ═══════════════════════════════════════════════════════
-- setup.sql — Migrations para Fase 1 (Bot Telegram)
-- Execute no SQL Editor do Supabase (em ordem)
-- ═══════════════════════════════════════════════════════

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

-- Opcional: agendar via pg_cron (plano Pro) ou chamar na Edge Function
-- SELECT cron.schedule('limpar-tokens', '*/15 * * * *', 'SELECT limpar_tokens_expirados()');


-- ═══════════════════════════════════════════════════════
-- INSTRUÇÕES DE DEPLOY
-- ═══════════════════════════════════════════════════════

/*
PASSO 1 — Instalar Supabase CLI
  npm install -g supabase
  supabase login

PASSO 2 — Vincular ao projeto
  supabase link --project-ref <SEU_PROJECT_REF>
  (o ref está na URL: https://supabase.com/dashboard/project/<REF>)

PASSO 3 — Configurar variáveis de ambiente da Edge Function
  supabase secrets set TELEGRAM_BOT_TOKEN=<TOKEN_DO_BOTFATHER>
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

  As chaves estão em: Supabase > Project Settings > API

PASSO 4 — Deploy da Edge Function
  supabase functions deploy telegram-bot

PASSO 5 — Registrar webhook no Telegram
  Substitua <TOKEN> e <SEU_PROJECT_REF> e cole no navegador:

  https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<SEU_PROJECT_REF>.supabase.co/functions/v1/telegram-bot

  Resposta esperada: {"ok":true,"result":true}

PASSO 6 — Testar
  Abra o Telegram, ache o bot, envie:
    /start       → recebe código de vínculo
    ajuda        → lista de comandos

PASSO 7 — Vincular no sistema web
  Adicione no painel de Configurações (modules.js) o campo
  para o usuário colar o token recebido do bot.
  
  Ao confirmar, chame:
  
    const { data } = await supabase
        .from("telegram_link_tokens")
        .select("chat_id")
        .eq("token", tokenDigitado)
        .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .maybeSingle();

    if (data) {
        await supabase
            .from("profiles")
            .upsert({ user_id: user.id, telegram_chat_id: data.chat_id });
        await supabase.from("telegram_link_tokens").delete().eq("token", tokenDigitado);
        toast("Telegram vinculado com sucesso!", "success");
    } else {
        toast("Código inválido ou expirado.", "error");
    }


PASSO 8 — Testar fluxo completo
  1. No Telegram: /start → anota o código
  2. No sistema web: Configurações > Bot Telegram > digita o código
  3. No Telegram: "agenda hoje" → deve retornar dados reais


CRIAÇÃO DO BOT (BotFather)
  1. Telegram → procure @BotFather
  2. /newbot → siga as instruções
  3. Guarde o token (formato: 123456789:ABCdef...)

VARIÁVEIS NECESSÁRIAS NO SUPABASE SECRETS
  TELEGRAM_BOT_TOKEN          → do BotFather
  SUPABASE_SERVICE_ROLE_KEY   → Project Settings > API > service_role
  (SUPABASE_URL já é injetado automaticamente nas Edge Functions)
*/

-- ═══════════════════════════════════════════════════════
-- 4. Tabela principal de dados do salão (multi-tenant)
-- ═══════════════════════════════════════════════════════
-- Armazena todas as entidades (config, agenda, diario,
-- servicos, clientes, custos, receitas, produtos) como
-- documentos JSON, uma linha por (user_id, data_type).

CREATE TABLE IF NOT EXISTS salao_data (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type   text NOT NULL,   -- 'config' | 'agenda' | 'diario' | 'servicos' |
                                 -- 'clientes' | 'custos' | 'receitas' | 'produtos'
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


-- ═══════════════════════════════════════════════════════
-- 5. Policy complementar: front-end lê/exclui o próprio
--    token de vínculo (fluxo Configurações > Bot Telegram)
-- ═══════════════════════════════════════════════════════

CREATE POLICY "token_leitura_autenticado" ON telegram_link_tokens
    FOR SELECT USING (true);

CREATE POLICY "token_delete_autenticado" ON telegram_link_tokens
    FOR DELETE USING (true);

