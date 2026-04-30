import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Identificar a data de hoje (para avaliar se foi dia cheio sem no-show)
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataHoje = `${ano}-${mes}-${dia}`;

    // Buscar agendamentos de hoje agrupados por profissional
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('id, profissional_id, status')
      .eq('data', dataHoje);

    if (error) throw error;

    // Agrupar por profissional
    const stats: Record<string, { total: number, no_shows: number, concluidos: number }> = {};
    for (const agendamento of agendamentos || []) {
      const pid = agendamento.profissional_id;
      if (!stats[pid]) stats[pid] = { total: 0, no_shows: 0, concluidos: 0 };
      
      stats[pid].total++;
      if (agendamento.status === 'no_show') stats[pid].no_shows++;
      if (agendamento.status === 'realizado') stats[pid].concluidos++;
    }

    let updates = 0;

    // Avaliar missões de gamificação (PLANO_VELLOVY_v5.md: Dia cheio >= 6 atend sem no_show -> +50)
    for (const [profissionalId, dados] of Object.entries(stats)) {
      if (dados.concluidos >= 6 && dados.no_shows === 0) {
        // Ganha +50 pontos
        // Nota: O ideal é ter um RPC que faça update atomically "pontos = pontos + 50"
        const { data: prof, error: getProfError } = await supabase
          .from('profissionais')
          .select('pontos')
          .eq('id', profissionalId)
          .single();

        if (!getProfError && prof) {
          const novosPontos = (prof.pontos || 0) + 50;
          await supabase
            .from('profissionais')
            .update({ pontos: novosPontos })
            .eq('id', profissionalId);
          updates++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Gamificação calculada com sucesso",
        data: dataHoje,
        profissionais_premiados: updates
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
