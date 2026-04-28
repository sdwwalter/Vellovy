// components/financeiro/FinanceiroRepasses.tsx
"use client";

import { Check, Clock, Users, Percent } from "lucide-react";
import { useFinanceiroStore } from "@/stores/financeiroStore";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export function FinanceiroRepasses() {
  const { repasses, marcarRepassePago, repassesPendentes } = useFinanceiroStore();
  const pendentes = repassesPendentes();
  const totalRepasses = repasses.reduce((s, r) => s + r.valor_repasse, 0);
  const totalPendente = pendentes.reduce((s, r) => s + r.valor_repasse, 0);

  if (repasses.length === 0) {
    return (
      <PremiumEmpty
        icon={<Users size={28} />}
        title="Nenhum repasse este mês"
        description="Os repasses são calculados automaticamente com base nos atendimentos realizados."
      />
    );
  }

  return (
    <div className="space-y-4 animate-in">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <PremiumCard padding="md">
          <div className="text-center">
            <p className="text-xs text-text-secondary">Total repasses</p>
            <p className="text-xl font-bold text-text-primary tabular-nums">{fmtBRL(totalRepasses)}</p>
          </div>
        </PremiumCard>
        <PremiumCard padding="md">
          <div className="text-center">
            <p className="text-xs text-text-secondary">Pendente</p>
            <p className={cn("text-xl font-bold tabular-nums", totalPendente > 0 ? "text-warning" : "text-emerald-600")}>
              {fmtBRL(totalPendente)}
            </p>
          </div>
        </PremiumCard>
      </div>

      {/* Nota legal */}
      <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3">
        <p className="text-[11px] text-blue-600 leading-relaxed">
          <strong>📋 Nota:</strong> Repasses para profissionais autônomos (MEI/PJ) devem ser documentados via RPA ou NFS-e.
          Profissionais CLT seguem folha de pagamento normal. Retenção de INSS (11%) aplica-se sobre autônomos sem CNPJ.
        </p>
      </div>

      {/* Cards de repasse por profissional */}
      <div className="space-y-3">
        {repasses.map((r) => {
          const nome = r.profissional?.nome ?? "Profissional";
          const funcao = r.profissional?.funcao ?? "";
          const initials = nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

          return (
            <div key={r.id} className={cn(
              "bg-white rounded-xl border p-5 transition-all",
              r.pago ? "border-emerald-200/60" : "border-neutral-200/60"
            )}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-text-primary">{nome}</h3>
                  <p className="text-xs text-text-secondary">{funcao}</p>
                </div>
                <button
                  onClick={() => { marcarRepassePago(r.id); toast.success(r.pago ? "Marcado como pendente" : "✓ Repasse pago"); }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all border",
                    r.pago
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-white text-warning border-warning/30 hover:bg-warning/5"
                  )}
                >
                  {r.pago ? <><Check size={14} /> Pago</> : <><Clock size={14} /> Pendente</>}
                </button>
              </div>

              {/* Breakdown */}
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Faturamento bruto</span>
                  <span className="text-sm font-semibold text-text-primary tabular-nums">{fmtBRL(r.valor_total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Percent size={12} /> Percentual
                  </span>
                  <span className="text-sm font-semibold text-primary-600">{r.percentual}%</span>
                </div>
                <div className="border-t border-neutral-200 pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Valor do repasse</span>
                  <span className="text-lg font-bold text-text-primary tabular-nums">{fmtBRL(r.valor_repasse)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
