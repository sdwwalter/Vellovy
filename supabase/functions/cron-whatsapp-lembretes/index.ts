import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Identificar a data de amanhã
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    // Formatar YYYY-MM-DD
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    const dataAmanha = `${ano}-${mes}-${dia}`;

    // Buscar agendamentos de amanhã com status "agendado" onde o salão tem WhatsApp API
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data,
        hora,
        cliente_id,
        salao_id,
        clientes ( nome, telefone ),
        saloes ( id, nome, tem_whatsapp_api, whatsapp_instancia, whatsapp_token, whatsapp_template )
      `)
      .eq('data', dataAmanha)
      .eq('status', 'agendado')
      .eq('saloes.tem_whatsapp_api', true);

    if (error) throw error;

    // Filtrar para remover resultados vazios de salões (se o inner join não for estrito)
    const agendamentosValidos = (agendamentos || []).filter(
      (a: any) => a.saloes && a.clientes && a.clientes.telefone
    );

    let disparos = 0;
    const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    const funcUrl = `https://${projectRef}.supabase.co/functions/v1/whatsapp-enviar`;

    for (const agendamento of agendamentosValidos) {
      const payload = {
        salaoId: agendamento.salao_id,
        telefone: agendamento.clientes.telefone,
        nome: agendamento.clientes.nome,
        data: agendamento.data,
        hora: agendamento.hora
      };

      try {
        // Disparar chamando a nossa própria function whatsapp-enviar
        // Nota: O ideal é usar o trigger HTTP para manter tudo isolado.
        const res = await fetch(funcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) disparos++;
      } catch (err) {
        console.error(`Falha ao disparar para ${payload.telefone}`, err);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Lembretes enviados com sucesso",
        data_alvo: dataAmanha,
        processados: disparos,
        encontrados: agendamentosValidos.length
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
