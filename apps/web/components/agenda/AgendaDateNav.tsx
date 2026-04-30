// components/agenda/AgendaDateNav.tsx
"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AgendaDateNavProps {
  data: string;
  onAnterior: () => void;
  onProximo: () => void;
  onHoje: () => void;
}

/**
 * Navegação entre dias — < Hoje >
 * Mostra dia da semana, número e mês.
 */
export function AgendaDateNav({ data, onAnterior, onProximo, onHoje }: AgendaDateNavProps) {
  const date = new Date(data + "T12:00:00");
  const hoje = new Date().toISOString().split("T")[0];
  const isHoje = data === hoje;

  const diaSemana = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const diaFormatado = date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-neutral-200/60 px-4 py-3 mb-4">
      <button
        onClick={onAnterior}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-primary-400 transition-all cursor-pointer"
        aria-label="Dia anterior"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={onHoje}
        className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity group"
        aria-label="Ir para hoje"
      >
        <span className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isHoje ? "text-primary-400" : "text-text-secondary"
        )}>
          {isHoje ? "✦ Hoje" : diaSemana}
        </span>
        <span className="text-sm font-semibold text-text-primary">
          {diaFormatado}
        </span>
        {!isHoje && (
          <span className="text-[10px] text-primary-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <CalendarDays size={10} /> Voltar para hoje
          </span>
        )}
      </button>

      <button
        onClick={onProximo}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-primary-400 transition-all cursor-pointer"
        aria-label="Próximo dia"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
