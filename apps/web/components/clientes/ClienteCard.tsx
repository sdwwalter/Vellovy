// components/clientes/ClienteCard.tsx
"use client";

import Link from "next/link";
import { Phone, Calendar, TrendingUp, Cake, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import type { Cliente } from "@vellovy/shared/types";
import { fmtBRL, fmtData, fmtTelefone } from "@vellovy/shared/lib/formatters";
import { SEGMENTO_LABELS } from "@vellovy/shared/lib/constants";
import { diasSemVisita, isAniversarioHoje } from "@vellovy/shared/lib/segmentacao";

interface ClienteCardProps {
  cliente: Cliente;
}

const segmentoColors: Record<string, string> = {
  fiel: "border-l-amber-400",
  regular: "border-l-neutral-300",
  nova: "border-l-blue-400",
  ausente: "border-l-orange-400",
  inativa: "border-l-neutral-200",
};

const avatarColors: Record<string, string> = {
  fiel: "bg-amber-100 text-amber-700",
  regular: "bg-neutral-100 text-neutral-600",
  nova: "bg-blue-100 text-blue-700",
  ausente: "bg-orange-100 text-orange-700",
  inativa: "bg-neutral-100 text-neutral-400",
};

export function ClienteCard({ cliente: c }: ClienteCardProps) {
  const dias = diasSemVisita(c.ultima_visita);
  const niver = isAniversarioHoje(c.data_nascimento);
  const initials = c.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link
      href={`/clientes/${c.id}`}
      className={cn(
        "flex items-center gap-3 bg-white rounded-xl border border-neutral-200/60 p-4",
        "border-l-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-in",
        segmentoColors[c.segmento],
        c.segmento === "inativa" && "opacity-70"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 relative",
        avatarColors[c.segmento]
      )}>
        {initials}
        {niver && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center text-white" title="Aniversário hoje!">
            <Cake size={10} />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-text-primary truncate">{c.nome}</h3>
          <PremiumBadge variant={c.segmento} label={SEGMENTO_LABELS[c.segmento] ?? c.segmento} size="sm" />
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          {c.telefone && (
            <span className="flex items-center gap-1">
              <Phone size={11} /> {fmtTelefone(c.telefone)}
            </span>
          )}
          {c.ultima_visita ? (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {fmtData(c.ultima_visita)}
            </span>
          ) : (
            <span className="text-neutral-400">Sem visita</span>
          )}
        </div>

        {/* Risk indicator for ausentes/inativas */}
        {(c.segmento === "ausente" || c.segmento === "inativa") && dias > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle size={11} className={c.segmento === "inativa" ? "text-error" : "text-warning"} />
            <span className={cn("text-[10px] font-medium", c.segmento === "inativa" ? "text-error" : "text-warning")}>
              {dias} dias sem visita
            </span>
          </div>
        )}
      </div>

      {/* Valor + Arrow */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-text-primary tabular-nums">{fmtBRL(c.total_gasto)}</p>
          <p className="text-[10px] text-text-secondary">{c.total_visitas} visitas</p>
        </div>
        <ChevronRight size={16} className="text-neutral-300" />
      </div>
    </Link>
  );
}
