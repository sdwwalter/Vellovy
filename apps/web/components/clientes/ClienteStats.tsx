// components/clientes/ClienteStats.tsx
"use client";

import { Users, Heart, AlertTriangle, UserPlus, TrendingUp, Cake } from "lucide-react";
import { PremiumKPI } from "@/components/ui/PremiumKPI";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import type { Cliente } from "@vellovy/shared/types";

interface ClienteStatsProps {
  total: number;
  fieis: number;
  ausentes: number;
  novas: number;
  taxaRetencao: number;
  ticketMedio: number;
  aniversariantes: Cliente[];
  emRisco: Cliente[];
}

export function ClienteStats({
  total, fieis, ausentes, novas, taxaRetencao, ticketMedio, aniversariantes, emRisco,
}: ClienteStatsProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
        <PremiumKPI label="Total Clientes" value={String(total)} icon={<Users size={18} />} />
        <PremiumKPI label="Fiéis" value={String(fieis)} icon={<Heart size={18} />}
          trend={fieis > 0 ? { value: `${Math.round((fieis / Math.max(total, 1)) * 100)}%`, direction: "up" } : undefined} />
        <PremiumKPI label="Retenção" value={`${taxaRetencao}%`} icon={<TrendingUp size={18} />}
          trend={{ value: taxaRetencao >= 70 ? "Saudável" : "Atenção", direction: taxaRetencao >= 70 ? "up" : "down" }} />
        <PremiumKPI label="Ticket Médio" value={fmtBRL(ticketMedio)} icon={<TrendingUp size={18} />} />
      </div>

      {/* Alertas de saúde */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
        {/* Aniversariantes */}
        {aniversariantes.length > 0 && (
          <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cake size={16} className="text-rose-500" />
              <span className="text-sm font-semibold text-rose-700">
                🎂 Aniversariantes esta semana ({aniversariantes.length})
              </span>
            </div>
            <div className="space-y-1">
              {aniversariantes.slice(0, 3).map((c) => (
                <p key={c.id} className="text-xs text-rose-600">{c.nome}</p>
              ))}
            </div>
          </div>
        )}

        {/* Em risco */}
        {emRisco.length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-warning" />
              <span className="text-sm font-semibold text-warning">
                ⚠ Clientes em risco ({emRisco.length})
              </span>
            </div>
            <div className="space-y-1">
              {emRisco.slice(0, 3).map((c) => (
                <p key={c.id} className="text-xs text-text-secondary">
                  <span className="font-medium">{c.nome}</span>
                  <span className="text-neutral-400"> — {fmtBRL(c.total_gasto)} perdidos</span>
                </p>
              ))}
              {emRisco.length > 3 && (
                <p className="text-[10px] text-warning font-medium">+{emRisco.length - 3} mais</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
