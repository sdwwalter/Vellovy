// components/clientes/ClienteView.tsx
"use client";

import { useEffect } from "react";
import { Users, Plus, SortAsc } from "lucide-react";
import { useClienteStore } from "@/stores/clienteStore";
import { ClienteSearch } from "./ClienteSearch";
import { ClienteCard } from "./ClienteCard";
import { ClienteStats } from "./ClienteStats";
import { ClienteForm } from "./ClienteForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { SEGMENTO_LABELS } from "@vellovy/shared/lib/constants";
import type { SegmentoCliente } from "@vellovy/shared/types";
import { cn } from "@/lib/utils/cn";

const SEGMENTOS: (SegmentoCliente | "todos")[] = [
  "todos", "fiel", "regular", "nova", "ausente", "inativa",
];

const ORDENACOES = [
  { value: "nome" as const, label: "Nome A→Z" },
  { value: "ultimo_visita" as const, label: "Última visita" },
  { value: "total_gasto" as const, label: "Maior gasto" },
  { value: "total_visitas" as const, label: "Mais visitas" },
];

export function ClienteView() {
  const {
    isLoading, busca, filtroSegmento, ordenacao,
    setBusca, setFiltroSegmento, setOrdenacao,
    fetchClientes, abrirForm, clientesFiltrados, stats,
  } = useClienteStore();

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const items = clientesFiltrados();
  const s = stats();

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${s.total} cadastrados`}
        action={
          <PremiumButton leftIcon={<Plus size={18} />} onClick={() => abrirForm()}>
            <span className="hidden tablet:inline">Novo Cliente</span>
            <span className="tablet:hidden">Novo</span>
          </PremiumButton>
        }
      />

      {/* KPIs + Alertas */}
      {!isLoading && s.total > 0 && (
        <ClienteStats
          total={s.total}
          fieis={s.fieis}
          ausentes={s.ausentes}
          novas={s.novas}
          taxaRetencao={s.taxaRetencao}
          ticketMedio={s.ticketMedio}
          aniversariantes={s.aniversariantes}
          emRisco={s.emRisco}
        />
      )}

      {/* Search */}
      <ClienteSearch value={busca} onChange={setBusca} />

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {SEGMENTOS.map((seg) => (
            <button key={seg} onClick={() => setFiltroSegmento(seg)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                filtroSegmento === seg
                  ? "bg-primary-400 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}>
              {seg === "todos" ? `Todos (${s.total})` : `${SEGMENTO_LABELS[seg]} (${
                seg === "fiel" ? s.fieis :
                seg === "ausente" ? s.ausentes :
                seg === "inativa" ? s.inativas :
                seg === "nova" ? s.novas :
                items.filter(c => c.segmento === seg).length
              })`}
            </button>
          ))}
        </div>

        <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as typeof ordenacao)}
          className="h-8 px-3 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border-0 cursor-pointer hover:bg-neutral-200 transition-colors">
          {ORDENACOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <PremiumSkeleton variant="card" rows={5} />
      ) : items.length === 0 ? (
        <PremiumEmpty
          icon={<Users size={28} />}
          title={busca ? "Nenhum resultado" : filtroSegmento !== "todos" ? "Nenhum cliente neste segmento" : "Nenhum cliente cadastrado"}
          description={busca ? `Nenhum cliente encontrado para "${busca}".` : "Cadastre seus clientes para começar a construir relacionamentos."}
          actionLabel={!busca && filtroSegmento === "todos" ? "Cadastrar cliente" : undefined}
          onAction={!busca && filtroSegmento === "todos" ? () => abrirForm() : undefined}
        />
      ) : (
        <div className="space-y-2">
          {items.map((c) => <ClienteCard key={c.id} cliente={c} />)}
        </div>
      )}

      <ClienteForm />
    </>
  );
}
