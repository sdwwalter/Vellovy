// components/configuracoes/SecaoWhatsApp.tsx
"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { toast } from "sonner";
import type { PlanoSalaoData } from "@vellovy/shared/hooks/usePlano";

interface Props {
  plano: PlanoSalaoData | null;
}

export function SecaoWhatsApp({ plano }: Props) {
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    "Olá {nome}! Confirmando seu horário de {hora} para {servico} amanhã. Podemos contar com sua presença? 💜"
  );
  const [whatsappInstancia, setWhatsappInstancia] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");

  if (!plano?.tem_whatsapp_api) {
    return (
      <div className="animate-in space-y-4">
        <PageHeader title="WhatsApp API" subtitle="Configurações de disparo automático" />
        <PremiumCard padding="lg" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-center">
          <span className="text-3xl mb-2 block">💬</span>
          <h3 className="text-lg font-bold text-amber-800">Recurso Premium</h3>
          <p className="text-sm text-amber-700 mt-1 mb-4">
            O envio automático de confirmações via WhatsApp só está disponível a partir do plano Premium.
          </p>
          <Link href="/planos">
            <PremiumButton className="w-full">Ver Planos e Fazer Upgrade</PremiumButton>
          </Link>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-4">
      <PageHeader title="WhatsApp API" subtitle="Configurações de disparo automático" />
      <PremiumCard padding="lg" className="border-emerald-200">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-text-primary">Conexão da API (Z-API / Evolution)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Instância</label>
              <input value={whatsappInstancia} onChange={(e) => setWhatsappInstancia(e.target.value)}
                placeholder="Ex: vel_inst_123"
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Token</label>
              <input type="password" value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)}
                placeholder="Ex: T0k3N..."
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm" />
            </div>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard padding="lg">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Mensagem de Confirmação</label>
            <textarea value={whatsappTemplate} onChange={(e) => setWhatsappTemplate(e.target.value)}
              rows={4} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm resize-none" />
          </div>
          <div className="bg-neutral-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Variáveis disponíveis</p>
            <div className="flex flex-wrap gap-1.5">
              {["{nome}", "{servico}", "{hora}", "{data}", "{profissional}"].map((v) => (
                <span key={v} className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-mono">{v}</span>
              ))}
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Preview</p>
            <p className="text-xs text-text-primary">
              {whatsappTemplate
                .replace("{nome}", "Maria")
                .replace("{servico}", "Corte Feminino")
                .replace("{hora}", "14:00")
                .replace("{data}", "amanhã")
                .replace("{profissional}", "Ana")}
            </p>
          </div>
          <PremiumButton onClick={() => toast.success("Configurações salvas ✅")} leftIcon={<Save size={14} />} className="w-full">Salvar Configurações</PremiumButton>
        </div>
      </PremiumCard>
    </div>
  );
}
