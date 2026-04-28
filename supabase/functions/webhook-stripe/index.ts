// supabase/functions/webhook-stripe/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Constantes dos limites (idealmente compartilhado, mas no edge reescrevemos o básico para evitar complexidade de bundle)
const LIMITES_PLANOS: Record<string, { profissionais_max: number, tem_bot_telegram: boolean, tem_whatsapp_api: boolean }> = {
  free: { profissionais_max: 1, tem_bot_telegram: false, tem_whatsapp_api: false },
  essencial: { profissionais_max: 3, tem_bot_telegram: false, tem_whatsapp_api: false },
  profissional: { profissionais_max: 5, tem_bot_telegram: true, tem_whatsapp_api: false },
  premium: { profissionais_max: 15, tem_bot_telegram: true, tem_whatsapp_api: true },
  ilimitado: { profissionais_max: 9999, tem_bot_telegram: true, tem_whatsapp_api: true },
};

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  
  if (!signature) {
    return new Response("Missing stripe signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Missing webhook secret configuration", { status: 500 });
  }

  let event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const salaoId = session.metadata?.salao_id;
        const planoId = session.metadata?.plano_id;
        
        if (salaoId && planoId) {
          const limites = LIMITES_PLANOS[planoId] || LIMITES_PLANOS.free;
          await supabaseClient.from('planos_salao').upsert({
            salao_id: salaoId,
            plano: planoId,
            status: 'ativo',
            profissionais_max: limites.profissionais_max,
            tem_bot_telegram: limites.tem_bot_telegram,
            tem_whatsapp_api: limites.tem_whatsapp_api,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'salao_id' });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Atualizar status no banco se necessário (ex: past_due, canceled)
        // Aqui precisaríamos mapear do stripe_subscription_id para o salao
        const statusMap: Record<string, string> = {
          active: 'ativo',
          past_due: 'suspenso',
          canceled: 'cancelado',
          trialing: 'trial'
        };

        const status = statusMap[subscription.status] || 'suspenso';

        await supabaseClient.from('planos_salao')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Reverte para o plano free
        await supabaseClient.from('planos_salao')
          .update({ 
            plano: 'free',
            status: 'cancelado',
            profissionais_max: LIMITES_PLANOS.free.profissionais_max,
            tem_bot_telegram: false,
            tem_whatsapp_api: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
