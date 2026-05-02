// components/agenda/AgendaView.tsx
"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus, LayoutGrid, List } from "lucide-react";
import { useAgendaStore } from "@/stores/agendaStore";
import { useServicoStore } from "@/stores/servicoStore";
import { AgendaDateNav } from "./AgendaDateNav";
import { AgendaSlot } from "./AgendaSlot";
import { AgendaTimeGrid } from "./AgendaTimeGrid";
import { AgendaOcupacaoBar } from "./AgendaOcupacaoBar";
import { AgendaForm } from "./AgendaForm";
import { ClienteDrawer } from "@/components/clientes/ClienteDrawer";
import { useClienteQuickView } from "@/hooks/useClienteQuickView";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { STATUS_LABELS } from "@vellovy/shared/lib/constants";
import type { Agendamento, StatusAgendamento } from "@vellovy/shared/types";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const STATUS_FILTERS: (StatusAgendamento | "todos")[] = [
  "todos", "agendado", "confirmado", "realizado", "cancelado",
];

type VisualizacaoAgenda = "lista" | "grade";

export function AgendaView() {
  const {
    agendamentos, dataSelecionada, isLoading, filtroStatus, filtroProfissional,
    setFiltroStatus, setFiltroProfissional,
    irParaDiaAnterior, irParaProximoDia, irParaHoje,
    fetchAgendamentos, atualizarStatus, excluirAgendamento,
    abrirForm, agendamentosFiltrados, totalDia, countPorStatus,
    realizadoParaCaixa, setRealizadoParaCaixa,
  } = useAgendaStore();
  const { profissionais, fetchServicos } = useServicoStore();

  // Visualização: lista ou grade
  const [visualizacao, setVisualizacao] = useState<VisualizacaoAgenda>("lista");

  // Cliente drawer
  const clienteDrawer = useClienteQuickView();

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

  // Reagendar: abre o form pré-preenchido via URL params
  const handleReagendar = (ag: Agendamento) => {
    // Abrir form com dados pré-preenchidos
    abrirForm();
    toast.info("Preencha o novo horário para reagendar");
  };

  // Click em slot vazio da grade → abre form
  const handleSlotClick = (profissionalId: string, hora: string) => {
    abrirForm();
    toast.info(`Agendando para ${hora}`);
  };

  // Click em agendamento na grade → menu/detalhes
  const handleAgendamentoClick = (id: string) => {
    // No futuro pode abrir um drawer de detalhes.
    // Por ora, o click é informacional.
  };

  // Click no nome do cliente
  const handleClienteClick = (clienteId: string) => {
    clienteDrawer.abrir(clienteId);
  };

  return (
    <>
      <PageHeader
        title="Agenda"
        action={
          <div className="flex items-center gap-2">
            {/* Toggle visualização */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
              <button
                onClick={() => setVisualizacao("lista")}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer",
                  visualizacao === "lista"
                    ? "bg-white shadow-sm text-primary-600"
                    : "text-neutral-400 hover:text-neutral-600"
                )}
                title="Visualização em lista"
                aria-label="Lista"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setVisualizacao("grade")}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer",
                  visualizacao === "grade"
                    ? "bg-white shadow-sm text-primary-600"
                    : "text-neutral-400 hover:text-neutral-600"
                )}
                title="Visualização em grade"
                aria-label="Grade"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <PremiumButton leftIcon={<Plus size={18} />} onClick={() => abrirForm()}>
              <span className="hidden tablet:inline">Novo Agendamento</span>
              <span className="tablet:hidden">Novo</span>
            </PremiumButton>
          </div>
        }
      />

      {/* Date Nav */}
      <AgendaDateNav data={dataSelecionada} onAnterior={irParaDiaAnterior} onProximo={irParaProximoDia} onHoje={irParaHoje} />

      {/* Stats bar + Ocupação */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="bg-white rounded-lg border border-neutral-200/60 px-3 py-2 flex items-center gap-2 shrink-0">
          <span className="text-xs text-text-secondary">Previsão</span>
          <span className="text-sm font-bold text-primary-600">{fmtBRL(total)}</span>
        </div>
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="shrink-0">
            <PremiumBadge variant={status as StatusAgendamento} label={`${count} ${STATUS_LABELS[status as StatusAgendamento] ?? status}`} size="sm" dot />
          </div>
        ))}
      </div>

      {/* Ocupação do dia */}
      <div className="mb-4">
        <AgendaOcupacaoBar agendamentos={agendamentos} />
      </div>

      {/* Filters (mostrar apenas na visualização lista) */}
      {visualizacao === "lista" && (
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
      )}

      {/* Conteúdo principal */}
      {isLoading ? (
        <PremiumSkeleton variant="card" rows={4} />
      ) : visualizacao === "grade" ? (
        /* Grade horária */
        <AgendaTimeGrid
          agendamentos={agendamentos}
          profissionais={profissionais}
          onSlotClick={handleSlotClick}
          onAgendamentoClick={handleAgendamentoClick}
          onChangeStatus={handleStatusChange}
        />
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
            <AgendaSlot
              key={ag.id}
              agendamento={ag}
              onChangeStatus={handleStatusChange}
              onDelete={handleDelete}
              onReagendar={handleReagendar}
              onClienteClick={handleClienteClick}
            />
          ))}
        </div>
      )}

      {/* Form sheet */}
      <AgendaForm />

      {/* Agenda→Caixa modal */}
      {realizadoParaCaixa && (
        <AgendaCaixaModal agendamento={realizadoParaCaixa} onClose={() => setRealizadoParaCaixa(null)} />
      )}

      {/* Cliente Drawer */}
      <ClienteDrawer
        data={clienteDrawer.data}
        isLoading={clienteDrawer.isLoading}
        isOpen={clienteDrawer.isOpen}
        onClose={clienteDrawer.fechar}
      />
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
