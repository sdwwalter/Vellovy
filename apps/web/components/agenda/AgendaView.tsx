// components/agenda/AgendaView.tsx
"use client";

import { useEffect } from "react";
import { CalendarDays, Plus, Filter } from "lucide-react";
import { useAgendaStore } from "@/stores/agendaStore";
import { useServicoStore } from "@/stores/servicoStore";
import { AgendaDateNav } from "./AgendaDateNav";
import { AgendaSlot } from "./AgendaSlot";
import { AgendaForm } from "./AgendaForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { STATUS_LABELS } from "@vellovy/shared/lib/constants";
import type { StatusAgendamento } from "@vellovy/shared/types";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const STATUS_FILTERS: (StatusAgendamento | "todos")[] = [
  "todos", "agendado", "confirmado", "realizado", "cancelado",
];

export function AgendaView() {
  const {
    dataSelecionada, isLoading, filtroStatus, filtroProfissional,
    setFiltroStatus, setFiltroProfissional,
    irParaDiaAnterior, irParaProximoDia, irParaHoje,
    fetchAgendamentos, atualizarStatus, excluirAgendamento,
    abrirForm, agendamentosFiltrados, totalDia, countPorStatus,
    realizadoParaCaixa, setRealizadoParaCaixa,
  } = useAgendaStore();
  const { profissionais, fetchServicos } = useServicoStore();

  useEffect(() => { fetchAgendamentos(); fetchServicos(); }, [fetchAgendamentos, fetchServicos]);

  const items = agendamentosFiltrados();
  const counts = countPorStatus();
  const total = totalDia();

  const handleStatusChange = (id: string, status: StatusAgendamento) => {
    atualizarStatus(id, status);
    if (status === "confirmado") toast.success("✓ Agendamento confirmado");
    if (status === "realizado") toast.success("✓ Atendimento concluído!");
    if (status === "cancelado") toast("Agendamento cancelado");
  };

  const handleDelete = (id: string) => {
    excluirAgendamento(id);
    toast("Agendamento removido");
  };

  return (
    <>
      <PageHeader
        title="Agenda"
        action={
          <PremiumButton leftIcon={<Plus size={18} />} onClick={() => abrirForm()}>
            <span className="hidden tablet:inline">Novo Agendamento</span>
            <span className="tablet:hidden">Novo</span>
          </PremiumButton>
        }
      />

      {/* Date Nav */}
      <AgendaDateNav data={dataSelecionada} onAnterior={irParaDiaAnterior} onProximo={irParaProximoDia} onHoje={irParaHoje} />

      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <div className="bg-white rounded-lg border border-neutral-200/60 px-3 py-2 flex items-center gap-2 shrink-0">
          <span className="text-xs text-text-secondary">Previsão</span>
          <span className="text-sm font-bold text-primary-600">{fmtBRL(total)}</span>
        </div>
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="shrink-0">
            <PremiumBadge variant={status as StatusAgendamento} label={`${count} ${STATUS_LABELS[status] ?? status}`} size="sm" dot />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Status filter */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                filtroStatus === s
                  ? "bg-primary-400 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}>
              {s === "todos" ? "Todos" : STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>

        {/* Prof filter */}
        <select value={filtroProfissional} onChange={(e) => setFiltroProfissional(e.target.value)}
          className="h-8 px-3 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border-0 cursor-pointer hover:bg-neutral-200 transition-colors">
          <option value="todos">Todos profissionais</option>
          {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {/* Agenda List */}
      {isLoading ? (
        <PremiumSkeleton variant="card" rows={4} />
      ) : items.length === 0 ? (
        <PremiumEmpty
          icon={<CalendarDays size={28} />}
          title={filtroStatus !== "todos" ? "Nenhum agendamento com este filtro" : "Nenhum atendimento hoje"}
          description={filtroStatus !== "todos" ? "Tente outro filtro ou limpe a seleção." : "Que tal adicionar o primeiro agendamento?"}
          actionLabel={filtroStatus === "todos" ? "Criar agendamento" : undefined}
          onAction={filtroStatus === "todos" ? () => abrirForm() : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((ag) => (
            <AgendaSlot key={ag.id} agendamento={ag} onChangeStatus={handleStatusChange} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Form sheet */}
      <AgendaForm />

      {/* Agenda→Caixa modal */}
      {realizadoParaCaixa && (
        <AgendaCaixaModal agendamento={realizadoParaCaixa} onClose={() => setRealizadoParaCaixa(null)} />
      )}
    </>
  );
}

// ─── Agenda → Caixa Modal ─────────────────────────────────────
function AgendaCaixaModal({ agendamento, onClose }: { agendamento: import("@vellovy/shared/types").Agendamento; onClose: () => void }) {
  // Caixa store não necessário aqui — redireciona via URL

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(44,22,84,0.45)]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-in">
        <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)] mb-2">
          Registrar no caixa?
        </h3>
        <p className="text-sm text-text-secondary mb-1">
          <strong>{agendamento.cliente?.nome}</strong> — {agendamento.servico?.nome}
        </p>
        <p className="text-2xl font-bold text-primary-600 mb-6">{fmtBRL(agendamento.valor)}</p>
        <div className="flex gap-3">
          <PremiumButton variant="ghost" onClick={onClose} className="flex-1">Não agora</PremiumButton>
          <PremiumButton onClick={() => {
            window.location.href = `/caixa?from_agenda=${agendamento.id}&cliente=${encodeURIComponent(agendamento.cliente?.nome ?? "")}&valor=${agendamento.valor}&servico=${agendamento.servico_id}`;
          }} className="flex-1">Registrar</PremiumButton>
        </div>
      </div>
    </div>
  );
}
