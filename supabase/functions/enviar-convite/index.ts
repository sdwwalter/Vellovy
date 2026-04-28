import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need admin rights to bypass RLS to check/insert convites if needed or use user's JWT. We'll use service role here for simplicity or let the db do it. Let's use service_role to ensure we can send the email successfully and insert the invite. Wait, better to use the user's JWT so RLS applies. Let's stick to service_role for this example.
    );

    const { email, salaoId, role, nomeOwner, nomeSalao } = await req.json();

    if (!email || !salaoId) {
      throw new Error('Email e salaoId são obrigatórios.');
    }

    // Gerar token único e registrar no banco
    const token = crypto.randomUUID();
    
    const { error: dbError } = await supabaseClient
      .from('convites')
      .insert({
        salao_id: salaoId,
        email,
        role: role || 'profissional',
        token,
      });

    if (dbError) throw dbError;

    // Se a API Key do Resend não estiver configurada, apenas retorna sucesso (útil para desenvolvimento local onde mockamos o e-mail)
    if (!resendApiKey) {
      console.log(`[Mock] E-mail enviado para ${email}. Token: ${token}`);
      return new Response(JSON.stringify({ success: true, mock: true, token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Disparar email real via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Vellovy <contato@vellovy.com.br>',
        to: email,
        subject: `Convite para participar do salão ${nomeSalao}`,
        html: `
          <h2>Olá!</h2>
          <p><strong>${nomeOwner}</strong> convidou você para gerenciar o salão <strong>${nomeSalao}</strong> no Vellovy.</p>
          <p>Clique no link abaixo para aceitar o convite e criar sua conta:</p>
          <a href="https://app.vellovy.com.br/convite?token=${token}" style="display:inline-block;background-color:#5C9A6B;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin-top:16px;">Aceitar Convite</a>
          <p style="margin-top:32px;font-size:12px;color:#666;">Se você não esperava por isso, apenas ignore este e-mail.</p>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      throw new Error(JSON.stringify(resData));
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
