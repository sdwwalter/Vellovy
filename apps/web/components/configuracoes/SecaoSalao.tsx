// components/configuracoes/SecaoSalao.tsx
"use client";

import { useState } from "react";
import { Globe, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export function SecaoSalao() {
  const { salaoId } = useAuthStore();
  const [salaoNome, setSalaoNome] = useState("Salão Exemplo");
  const [salaoTel, setSalaoTel] = useState("11999887766");
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo");

  const salvar = async () => {
    if (!salaoId) return;
    try {
      const supabase = createClient();
      await supabase
        .from("saloes")
        .update({ nome: salaoNome, telefone: salaoTel, fuso_horario: fusoHorario })
        .eq("id", salaoId);
      toast.success("Configurações salvas ✅");
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <div className="animate-in space-y-4">
      <PageHeader title="Dados do Salão" subtitle="Informações gerais" />
      <PremiumCard padding="lg">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Nome do salão</label>
            <input value={salaoNome} onChange={(e) => setSalaoNome(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Telefone</label>
            <input value={salaoTel} onChange={(e) => setSalaoTel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block flex items-center gap-1">
              <Globe size={12} /> Fuso horário
            </label>
            <select value={fusoHorario} onChange={(e) => setFusoHorario(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white cursor-pointer">
              <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Recife">Recife (GMT-3)</option>
              <option value="America/Belem">Belém (GMT-3)</option>
            </select>
          </div>
          <PremiumButton onClick={salvar} leftIcon={<Save size={14} />} className="w-full">Salvar</PremiumButton>
        </div>
      </PremiumCard>
    </div>
  );
}
