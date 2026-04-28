import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

function fmtBRL(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Identificar a data de hoje
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataHoje = `${ano}-${mes}-${dia}`;

    // Buscar salões que tem bot de Telegram ativado
    const { data: saloes, error: saloesError } = await supabase
      .from('saloes')
      .select('id, nome, telegram_chat_id, tem_telegram_bot')
      .eq('tem_telegram_bot', true)
      .not('telegram_chat_id', 'is', null);

    if (saloesError) throw saloesError;

    let disparos = 0;

    for (const salao of saloes || []) {
      // Calcular faturamento do dia (apenas lançamentos de hoje)
      const { data: lancamentos, error: lancError } = await supabase
        .from('lancamentos_caixa')
        .select('valor')
        .eq('salao_id', salao.id)
        .gte('created_at', `${dataHoje}T00:00:00Z`)
        .lte('created_at', `${dataHoje}T23:59:59Z`);

      if (lancError) continue;

      const totalDia = (lancamentos || []).reduce((acc: number, cur: any) => acc + cur.valor, 0);
      const qtdAtendimentos = (lancamentos || []).length;

      const mensagem = `📊 *Fechamento de Caixa*\n\n` +
                       `🏢 ${salao.nome}\n` +
                       `📅 Data: ${dia}/${mes}/${ano}\n\n` +
                       `Atendimentos/Vendas: ${qtdAtendimentos}\n` +
                       `Faturamento Total: *${fmtBRL(totalDia)}*\n\n` +
                       `Ótimo trabalho hoje! 💇‍♀️💅`;

      if (salao.telegram_chat_id && TELEGRAM_BOT_TOKEN) {
        try {
          const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
          const res = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: salao.telegram_chat_id,
              text: mensagem,
              parse_mode: 'Markdown'
            })
          });

          if (res.ok) disparos++;
        } catch (err) {
          console.error(`Falha ao enviar Telegram para salão ${salao.id}`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Fechamentos de Telegram enviados com sucesso",
        data: dataHoje,
        processados: disparos,
        saloes_elegiveis: (saloes || []).length
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
