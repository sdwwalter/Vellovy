// apps/web/app/(dashboard)/planos/page.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { usePlano } from "@/hooks/usePlano";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export default function PlanosPage() {
  const { plano, loading: planoLoading } = usePlano();
  const { salaoId, user } = useAuthStore();
  const [cicloAnual, setCicloAnual] = useState(false);
  const [criandoCheckout, setCriandoCheckout] = useState<string | null>(null);

  const assinarPlano = async (planoId: string, priceId: string) => {
    setCriandoCheckout(planoId);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('criar-checkout', {
        body: { 
          planoId, 
          ciclo: cicloAnual ? 'anual' : 'mensal', 
          salaoId, 
          stripePriceId: priceId,
          origin: window.location.origin,
          ownerEmail: user?.email
        }
      });
      if (error) throw error;
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar checkout');
      setCriandoCheckout(null);
    }
  };

  const gerenciarAssinatura = async () => {
    setCriandoCheckout("gerenciar");
    try {
      if (!plano?.stripe_customer_id) throw new Error("Assinatura não encontrada");
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('portal-cliente', {
        body: { stripeCustomerId: plano.stripe_customer_id, origin: window.location.origin }
      });
      if (error) throw error;
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir portal');
      setCriandoCheckout(null);
    }
  };

  if (planoLoading) {
    return <div className="flex justify-center p-8 animate-pulse text-text-secondary">Carregando planos...</div>;
  }

  return (
    <>
      <PageHeader title="Planos" subtitle="Evolua seu salão para o próximo nível" />

      {plano?.stripe_customer_id && (
        <div className="mb-6 animate-in">
          <PremiumCard padding="md" className="flex items-center justify-between border-primary-200 bg-primary-50/30">
            <div>
              <h3 className="font-bold text-primary-800">Seu plano atual é {plano.plano.toUpperCase()}</h3>
              <p className="text-sm text-primary-600/80">Você pode alterar ou cancelar a qualquer momento.</p>
            </div>
            <PremiumButton isLoading={criandoCheckout === "gerenciar"} onClick={gerenciarAssinatura}>
              Gerenciar Assinatura
            </PremiumButton>
          </PremiumCard>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="bg-neutral-100 p-1 rounded-full inline-flex items-center gap-1 border border-neutral-200">
          <button 
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!cicloAnual ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            onClick={() => setCicloAnual(false)}
          >
            Mensal
          </button>
          <button 
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${cicloAnual ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            onClick={() => setCicloAnual(true)}
          >
            Anual <span className="ml-1 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">18% off</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in">
        {/* ESSENCIAL */}
        <PremiumCard padding="lg" className="border-neutral-200 hover:border-primary-300 transition-colors flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-text-primary">Essencial</h3>
            <p className="text-sm text-text-secondary">Para salões com equipe enxuta.</p>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-primary-600">R$ {cicloAnual ? "32" : "39"}</span>
            <span className="text-sm text-text-secondary">/mês</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 3 profissionais</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Agendamentos Ilimitados</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Relatórios Básicos</li>
            <li className="flex items-center gap-2 opacity-50"><X size={16} /> Bot Telegram</li>
            <li className="flex items-center gap-2 opacity-50"><X size={16} /> API WhatsApp</li>
          </ul>
          <PremiumButton 
            variant="secondary" 
            className="w-full"
            isLoading={criandoCheckout === "essencial"}
            onClick={() => assinarPlano("essencial", cicloAnual ? "price_essencial_anual" : "price_essencial_mensal")}
            disabled={plano?.plano === 'essencial'}
          >
            {plano?.plano === 'essencial' ? 'Plano Atual' : 'Assinar Essencial'}
          </PremiumButton>
        </PremiumCard>

        {/* PROFISSIONAL */}
        <PremiumCard padding="lg" className="border-amber-200 bg-gradient-to-b from-white to-amber-50/30 flex flex-col relative transform md:-translate-y-2 shadow-lg">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            Mais Popular
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-text-primary">Profissional</h3>
            <p className="text-sm text-text-secondary">Para salões que já têm ritmo e precisam de automação.</p>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-amber-600">R$ {cicloAnual ? "57" : "69"}</span>
            <span className="text-sm text-text-secondary">/mês</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Até 5 profissionais</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Tudo do Essencial</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Bot Telegram nativo</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Gamificação / Leaderboard</li>
            <li className="flex items-center gap-2 opacity-50"><X size={16} /> API WhatsApp</li>
          </ul>
          <PremiumButton 
            className="w-full bg-amber-500 hover:bg-amber-600 border-amber-600 shadow-amber-500/20"
            isLoading={criandoCheckout === "profissional"}
            onClick={() => assinarPlano("profissional", cicloAnual ? "price_profissional_anual" : "price_profissional_mensal")}
            disabled={plano?.plano === 'profissional'}
          >
            {plano?.plano === 'profissional' ? 'Plano Atual' : 'Assinar Profissional'}
          </PremiumButton>
        </PremiumCard>

        {/* PREMIUM */}
        <PremiumCard padding="lg" className="border-neutral-200 hover:border-primary-300 transition-colors flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-text-primary">Premium</h3>
            <p className="text-sm text-text-secondary">Para salões maiores com comunicação automatizada.</p>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-primary-600">R$ {cicloAnual ? "97" : "119"}</span>
            <span className="text-sm text-text-secondary">/mês</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 15 profissionais</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Tudo do Profissional</li>
            <li className="flex items-center gap-2 font-semibold text-primary-700"><Check size={16} className="text-primary-500" /> API WhatsApp (Envio Automático)</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Suporte Prioritário</li>
          </ul>
          <PremiumButton 
            variant="secondary" 
            className="w-full"
            isLoading={criandoCheckout === "premium"}
            onClick={() => assinarPlano("premium", cicloAnual ? "price_premium_anual" : "price_premium_mensal")}
            disabled={plano?.plano === 'premium'}
          >
            {plano?.plano === 'premium' ? 'Plano Atual' : 'Assinar Premium'}
          </PremiumButton>
        </PremiumCard>
      </div>
    </>
  );
}
