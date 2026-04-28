// supabase/functions/whatsapp-enviar/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface esperada pelo payload
interface WebhookPayload {
  salaoId: string;
  telefoneDestino: string;
  variaveis: {
    nome?: string;
    servico?: string;
    hora?: string;
    data?: string;
    profissional?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validação de autenticação via header Authorization seria ideal aqui,
    // mas por simplicidade aceitamos a requisição caso envie o salaoId válido

    const { salaoId, telefoneDestino, variaveis } = await req.json() as WebhookPayload;

    if (!salaoId || !telefoneDestino) {
      throw new Error('Parâmetros obrigatórios ausentes.');
    }

    // 1. Validar se o Salão tem acesso ao WhatsApp API (via banco de dados)
    const { data: planoData, error: planoError } = await supabaseClient
      .from('planos_salao')
      .select('tem_whatsapp_api, whatsapp_instancia, whatsapp_token, whatsapp_template')
      .eq('salao_id', salaoId)
      .single();

    if (planoError || !planoData) {
      throw new Error('Salão não encontrado ou sem plano ativo.');
    }

    if (!planoData.tem_whatsapp_api) {
      throw new Error('O plano atual não permite envio via WhatsApp API.');
    }

    const { whatsapp_instancia, whatsapp_token, whatsapp_template } = planoData;

    if (!whatsapp_instancia || !whatsapp_token) {
      throw new Error('Configuração de WhatsApp incompleta (Instância ou Token ausentes).');
    }

    // 2. Construir mensagem
    let mensagem = whatsapp_template || "Olá {nome}! Confirmando seu horário de {hora} para {servico}.";
    
    // Substituir variáveis
    mensagem = mensagem
      .replace(/{nome}/g, variaveis.nome || 'Cliente')
      .replace(/{servico}/g, variaveis.servico || 'Serviço')
      .replace(/{hora}/g, variaveis.hora || '00:00')
      .replace(/{data}/g, variaveis.data || 'hoje')
      .replace(/{profissional}/g, variaveis.profissional || 'Profissional');

    // 3. Disparar para a API externa (mock de Z-API / Evolution)
    // Abaixo está a assinatura básica de disparo HTTP
    
    const apiEndpoint = `https://api.z-api.io/instances/${whatsapp_instancia}/token/${whatsapp_token}/send-text`;
    
    // Remova o mock=true da vida real. Aqui simulamos o sucesso.
    const MOCK_API = true;

    let apiResponse;
    
    if (MOCK_API) {
      console.log(`[MOCK] Enviando WhatsApp para ${telefoneDestino}: ${mensagem}`);
      apiResponse = { status: 200, json: async () => ({ success: true, messageId: "mock_123" }) };
    } else {
      apiResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: telefoneDestino,
          message: mensagem
        })
      });
    }

    if (apiResponse.status !== 200) {
      throw new Error(`Erro na provedora de WhatsApp: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    return new Response(JSON.stringify({ success: true, delivered: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
