// components/configuracoes/SecaoEquipe.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { PremiumSheet } from "@/components/ui/PremiumSheet";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { PlanoSalaoData } from "@vellovy/shared/hooks/usePlano";

interface Props {
  plano: PlanoSalaoData | null;
  podeCriarProfissional: (qtd: number) => boolean;
  irParaPlano: () => void;
}

export function SecaoEquipe({ plano, podeCriarProfissional, irParaPlano }: Props) {
  const { salaoId } = useAuthStore();
  const [conviteAberto, setConviteAberto] = useState(false);
  const [emailConvite, setEmailConvite] = useState("");
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const enviarConvite = async () => {
    if (!emailConvite.trim() || !salaoId) return;
    setEnviandoConvite(true);
    try {
      const supabase = createClient();
      await supabase.functions.invoke("enviar-convite", {
        body: { email: emailConvite, salaoId, role: "profissional" },
      });
      toast.success(`Convite enviado para ${emailConvite}`);
      setConviteAberto(false);
      setEmailConvite("");
    } catch {
      toast.error("Erro ao enviar convite");
    } finally {
      setEnviandoConvite(false);
    }
  };

  return (
    <div className="animate-in space-y-4">
      <PageHeader title="Equipe" subtitle="Gerencie seus profissionais" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-secondary uppercase">Uso do Plano</span>
        <span className="text-xs font-bold text-primary-600">2 / {plano?.profissionais_max || "?"} Profissionais</span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-2 mb-4">
        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(100, (2 / (plano?.profissionais_max || 1)) * 100)}%` }} />
      </div>

      <PremiumCard padding="md" className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-neutral-100 rounded-xl bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">S</div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Salão Exemplo (Você)</h4>
              <p className="text-xs text-text-secondary">owner@salao.com</p>
            </div>
          </div>
          <PremiumBadge variant="confirmado" label="Owner" size="sm" />
        </div>

        <PremiumButton
          className="w-full mt-4"
          onClick={() => {
            if (!podeCriarProfissional(2)) {
              toast.error("Limite do plano atingido. Faça upgrade para convidar mais profissionais.");
              irParaPlano();
              return;
            }
            setConviteAberto(true);
          }}
        >
          + Convidar Profissional
        </PremiumButton>
      </PremiumCard>

      <PremiumCard padding="md" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 flex flex-col items-center text-center">
        <h4 className="text-sm font-bold text-amber-800">Precisa de mais profissionais?</h4>
        <p className="text-xs text-amber-700 mt-1 mb-3">Faça upgrade do seu plano para expandir sua equipe.</p>
        <PremiumButton variant="secondary" size="sm" onClick={irParaPlano}>Ver planos</PremiumButton>
      </PremiumCard>

      {/* Sheet de convite — substitui o prompt() nativo */}
      <PremiumSheet open={conviteAberto} onClose={() => setConviteAberto(false)} title="Convidar Profissional">
        <div className="space-y-4 p-1">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">E-mail do profissional</label>
            <input
              type="email"
              value={emailConvite}
              onChange={(e) => setEmailConvite(e.target.value)}
              placeholder="profissional@email.com"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <PremiumButton variant="ghost" className="flex-1" onClick={() => setConviteAberto(false)}>
              Cancelar
            </PremiumButton>
            <PremiumButton className="flex-1" onClick={enviarConvite} isLoading={enviandoConvite}>
              Enviar Convite
            </PremiumButton>
          </div>
        </div>
      </PremiumSheet>
    </div>
  );
}
