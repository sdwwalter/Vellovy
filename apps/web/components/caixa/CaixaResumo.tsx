// components/caixa/CaixaResumo.tsx
"use client";

import { Banknote, Smartphone, CreditCard, Receipt, TrendingUp, Hash } from "lucide-react";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { cn } from "@/lib/utils/cn";

interface TotaisPorForma {
  dinheiro: number;
  pix: number;
  debito: number;
  credito: number;
  outro: number;
}

interface CaixaResumoProps {
  total: number;
  totaisPorForma: TotaisPorForma;
  count: number;
  ticketMedio: number;
}

const formas = [
  { key: "dinheiro" as const, label: "Dinheiro", icon: <Banknote size={16} />, color: "text-emerald-600 bg-emerald-50" },
  { key: "pix" as const, label: "PIX", icon: <Smartphone size={16} />, color: "text-blue-600 bg-blue-50" },
  { key: "debito" as const, label: "Débito", icon: <CreditCard size={16} />, color: "text-amber-600 bg-amber-50" },
  { key: "credito" as const, label: "Crédito", icon: <CreditCard size={16} />, color: "text-purple-600 bg-purple-50" },
  { key: "outro" as const, label: "Outro", icon: <Receipt size={16} />, color: "text-neutral-600 bg-neutral-100" },
];

export function CaixaResumo({ total, totaisPorForma, count, ticketMedio }: CaixaResumoProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Total grande */}
      <div className="bg-gradient-hero rounded-2xl p-6 text-white">
        <p className="text-sm text-white/70 font-medium mb-1">Total do dia</p>
        <p className="text-4xl font-bold font-[family-name:var(--font-display)] tabular-nums">
          {fmtBRL(total)}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs text-white/60 flex items-center gap-1">
            <Hash size={12} /> {count} lançamentos
          </span>
          <span className="text-xs text-white/60 flex items-center gap-1">
            <TrendingUp size={12} /> Ticket médio: {fmtBRL(ticketMedio)}
          </span>
        </div>
      </div>

      {/* Breakdown por forma */}
      <div className="grid grid-cols-2 tablet:grid-cols-5 gap-2">
        {formas.map(({ key, label, icon, color }) => {
          const valor = totaisPorForma[key];
          const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
          return (
            <div key={key} className="bg-white rounded-xl border border-neutral-200/60 p-3 text-center">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2", color)}>
                {icon}
              </div>
              <p className="text-xs text-text-secondary font-medium">{label}</p>
              <p className="text-sm font-bold text-text-primary tabular-nums">{fmtBRL(valor)}</p>
              {valor > 0 && <p className="text-[10px] text-text-secondary mt-0.5">{pct}%</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
