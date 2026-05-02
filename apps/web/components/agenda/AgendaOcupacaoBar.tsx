// components/agenda/AgendaOcupacaoBar.tsx
"use client";

import { useMemo } from "react";
import { TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Agendamento } from "@vellovy/shared/types";

interface AgendaOcupacaoBarProps {
  agendamentos: Agendamento[];
  totalSlots?: number; // Total de slots disponíveis no dia (padrão: 24 slots = 12h de trabalho em 30min)
}

/**
 * Indicador visual de ocupação do dia.
 * Mostra preenchidos/total + barra de progresso + badge de gamificação.
 */
export function AgendaOcupacaoBar({
  agendamentos,
  totalSlots = 24,
}: AgendaOcupacaoBarProps) {
  const { ocupados, percentual, agendaCheia } = useMemo(() => {
    // Contar apenas agendamentos ativos (não cancelados)
    const ativos = agendamentos.filter(
      (a) => a.status !== "cancelado"
    ).length;

    const pct = totalSlots > 0 ? Math.min(Math.round((ativos / totalSlots) * 100), 100) : 0;

    return {
      ocupados: ativos,
      percentual: pct,
      agendaCheia: ativos >= 6, // Badge de gamificação
    };
  }, [agendamentos, totalSlots]);

  // Gerar blocos visuais da barra (8 blocos)
  const totalBlocos = 8;
  const blocosAtivos = Math.round((percentual / 100) * totalBlocos);

  // Cor baseada no percentual
  const corBarra = percentual >= 80
    ? "bg-emerald-400"
    : percentual >= 50
      ? "bg-primary-400"
      : percentual >= 25
        ? "bg-rose-300"
        : "bg-neutral-300";

  const corTexto = percentual >= 80
    ? "text-emerald-600"
    : percentual >= 50
      ? "text-primary-600"
      : "text-text-secondary";

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-neutral-200/60 px-3 py-2">
      {/* Ícone */}
      <TrendingUp size={14} className={cn("shrink-0", corTexto)} />

      {/* Texto */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("text-xs font-semibold tabular-nums", corTexto)}>
          {ocupados}/{totalSlots} horários
        </span>
        <span className="text-[10px] text-text-secondary">·</span>
        <span className={cn("text-xs font-bold tabular-nums", corTexto)}>
          {percentual}%
        </span>
      </div>

      {/* Barra visual em blocos */}
      <div className="flex items-center gap-0.5" aria-label={`${percentual}% de ocupação`}>
        {Array.from({ length: totalBlocos }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-3 rounded-sm transition-all duration-300",
              i < blocosAtivos ? corBarra : "bg-neutral-200/60"
            )}
          />
        ))}
      </div>

      {/* Badge "Agenda Cheia" — gamificação */}
      {agendaCheia && (
        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5 shrink-0 animate-in">
          <Star size={10} className="fill-yellow-400" />
          <span className="text-[10px] font-semibold">Agenda Cheia!</span>
        </div>
      )}
    </div>
  );
}
