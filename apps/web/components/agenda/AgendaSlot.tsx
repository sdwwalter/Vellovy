// components/agenda/AgendaSlot.tsx
"use client";

import { useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, User, Scissors, MoreVertical, Phone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import type { Agendamento, StatusAgendamento } from "@vellovy/shared/types";
import { fmtBRL, fmtHora, fmtDuracao } from "@vellovy/shared/lib/formatters";
import { STATUS_LABELS } from "@vellovy/shared/lib/constants";

interface AgendaSlotProps {
  agendamento: Agendamento;
  onChangeStatus: (id: string, status: StatusAgendamento) => void;
  onDelete: (id: string) => void;
  onReagendar?: (agendamento: Agendamento) => void;
  onClienteClick?: (clienteId: string) => void;
}

const statusBg: Record<StatusAgendamento, string> = {
  agendado: "bg-white border-neutral-200/60",
  confirmado: "bg-white border-primary-200/60",
  realizado: "bg-emerald-50/50 border-emerald-200/60",
  cancelado: "bg-neutral-50 border-neutral-200/40 opacity-60",
  no_show: "bg-red-50/50 border-red-200/60",
};

const accentBg: Record<StatusAgendamento, string> = {
  agendado: "bg-neutral-100",
  confirmado: "bg-primary-50",
  realizado: "bg-emerald-100",
  cancelado: "bg-neutral-100",
  no_show: "bg-red-100",
};

const nextMap: Partial<Record<StatusAgendamento, StatusAgendamento>> = {
  agendado: "confirmado",
  confirmado: "realizado",
};

const nextLabel: Record<string, string> = {
  agendado: "Confirmar →",
  confirmado: "Marcar realizado →",
};

export function AgendaSlot({ agendamento: ag, onChangeStatus, onDelete, onReagendar, onClienteClick }: AgendaSlotProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDel, setPendingDel] = useState(false);

  const nome = ag.cliente?.nome ?? "Cliente";
  const servico = ag.servico?.nome ?? "Serviço";
  const prof = ag.profissional?.nome ?? "Prof.";
  const next = nextMap[ag.status];

  const handleDel = () => {
    if (!pendingDel) { setPendingDel(true); return; }
    onDelete(ag.id);
    setMenuOpen(false);
    setPendingDel(false);
  };

  return (
    <div className={cn("rounded-xl border transition-all duration-200 animate-in group", statusBg[ag.status], ag.status !== "cancelado" && "hover:shadow-md hover:-translate-y-0.5")}>
      <div className="flex items-stretch">
        {/* Hora */}
        <div className={cn("flex flex-col items-center justify-center w-20 shrink-0 rounded-l-xl py-4", accentBg[ag.status])}>
          <span className="text-lg font-bold text-text-primary tabular-nums">{fmtHora(ag.data_hora)}</span>
          <span className="text-[10px] text-text-secondary font-medium">{fmtDuracao(ag.duracao_minutos)}</span>
        </div>
        {/* Info */}
        <div className="flex-1 py-3 px-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-sm font-semibold text-text-primary truncate",
                  ag.status === "cancelado" && "line-through",
                  onClienteClick && ag.cliente_id && "cursor-pointer hover:text-primary-500 transition-colors"
                )}
                onClick={() => onClienteClick && ag.cliente_id && onClienteClick(ag.cliente_id)}
                title={onClienteClick ? "Ver resumo do cliente" : undefined}
              >
                {nome}
              </h3>
              <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                <Scissors size={12} /><span className="truncate">{servico}</span>
                <span className="text-neutral-300">·</span>
                <span className="font-medium text-primary-400">{fmtBRL(ag.valor)}</span>
              </p>
            </div>
            {/* Menu */}
            <div className="relative shrink-0">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 cursor-pointer" aria-label="Ações"><MoreVertical size={16} /></button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setPendingDel(false); }} />
                  <div className="absolute right-0 top-10 z-20 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 min-w-[180px] animate-in">
                    {next && <button onClick={() => { onChangeStatus(ag.id, next); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 text-primary-600 font-medium cursor-pointer">{nextLabel[ag.status]}</button>}
                    {ag.cliente?.telefone && <a href={`https://wa.me/55${ag.cliente.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-sm hover:bg-neutral-50 text-text-secondary cursor-pointer"><Phone size={14} className="inline mr-2" />WhatsApp</a>}
                    {onReagendar && (ag.status === "cancelado" || ag.status === "no_show") && <button onClick={() => { onReagendar(ag); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-blue-600 font-medium cursor-pointer"><RefreshCw size={14} className="inline mr-2" />Reagendar</button>}
                    {ag.status !== "cancelado" && ag.status !== "realizado" && <button onClick={() => { onChangeStatus(ag.id, "cancelado"); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-warning cursor-pointer">Cancelar</button>}
                    <button onClick={handleDel} className={cn("w-full text-left px-4 py-2.5 text-sm cursor-pointer", pendingDel ? "bg-red-50 text-error font-semibold" : "hover:bg-red-50 text-error/70")}>{pendingDel ? "⚠ Confirmar exclusão" : "Excluir"}</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-secondary flex items-center gap-1"><User size={12} />{prof}</span>
            <PremiumBadge variant={ag.status} label={STATUS_LABELS[ag.status] ?? ag.status} size="sm" dot />
          </div>
        </div>
      </div>
      {/* Quick action — avançar status */}
      {next && (
        <button onClick={() => onChangeStatus(ag.id, next)} className={cn("w-full py-2 text-xs font-medium rounded-b-xl border-t cursor-pointer transition-all", "tablet:opacity-0 tablet:group-hover:opacity-100", ag.status === "agendado" ? "bg-primary-50 text-primary-600 border-primary-100 hover:bg-primary-100" : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100")}>{nextLabel[ag.status]}</button>
      )}
      {/* Quick action — reagendar cancelados/no_show */}
      {!next && onReagendar && (ag.status === "cancelado" || ag.status === "no_show") && (
        <button
          onClick={() => onReagendar(ag)}
          className="w-full py-2 text-xs font-medium rounded-b-xl border-t cursor-pointer transition-all bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={12} />
          Reagendar
        </button>
      )}
    </div>
  );
}
