-- supabase/migrations/v4_cron_jobs.sql
-- Habilita as extensões necessárias para crons e chamadas HTTP no Supabase
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ═══════════════════════════════════════════════════════════════
-- JOBS DE CRON PARA EDGE FUNCTIONS
-- As funções abaixo rodam nos horários convertidos para UTC
-- Fuso Horário de Brasília (BRT) é UTC-3.
-- Portanto: 
-- 08:07 BRT = 11:07 UTC
-- 21:00 BRT = 00:00 UTC
-- ═══════════════════════════════════════════════════════════════

-- 1. Lembretes de WhatsApp (08:07 BRT -> 11:07 UTC)
-- Tenta excluir se já existir para não duplicar na execução
SELECT cron.unschedule('job-cron-whatsapp-lembretes');
SELECT cron.schedule(
  'job-cron-whatsapp-lembretes',
  '7 11 * * *', 
  $$
    SELECT net.http_post(
      url:='https://your-project.supabase.co/functions/v1/cron-whatsapp-lembretes',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
  $$
);

-- 2. Fechamento de Telegram (21:00 BRT -> 00:00 UTC)
SELECT cron.unschedule('job-cron-telegram-fechamento');
SELECT cron.schedule(
  'job-cron-telegram-fechamento',
  '0 0 * * *', 
  $$
    SELECT net.http_post(
      url:='https://your-project.supabase.co/functions/v1/cron-telegram-fechamento',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
  $$
);

-- 3. Gamificação Diária (21:00 BRT -> 00:00 UTC)
SELECT cron.unschedule('job-cron-gamificacao');
SELECT cron.schedule(
  'job-cron-gamificacao',
  '0 0 * * *', 
  $$
    SELECT net.http_post(
      url:='https://your-project.supabase.co/functions/v1/cron-gamificacao',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
  $$
);

-- NOTA: Você precisará substituir "your-project.supabase.co" e "YOUR_ANON_KEY" com os valores reais do seu projeto.
-- Como alternativa, você pode agendar essas funções diretamente pelo painel do Supabase 
-- em "Edge Functions" -> "Cron", sem precisar deste arquivo SQL.
