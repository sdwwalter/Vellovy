// components/servicos/ServicosView.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Scissors, Plus, AlertTriangle, Pencil, Power,
  Trash2, Package, Clock, Percent, DollarSign,
} from "lucide-react";
import { useServicoStore } from "@/stores/servicoStore";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServicoForm } from "./ServicoForm";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { CATEGORIA_LABELS } from "@vellovy/shared/lib/constants";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const CATEGORIAS = ["todos", "cabelo", "barba", "unhas", "estetica", "outro"];

const catColors: Record<string, string> = {
  cabelo: "bg-primary-100 text-primary-700",
  barba: "bg-amber-100 text-amber-700",
  unhas: "bg-rose-100 text-rose-700",
  estetica: "bg-blue-100 text-blue-700",
  outro: "bg-neutral-100 text-neutral-600",
};

export function ServicosView() {
  const {
    isLoading, filtroCategoria, formAberto,
    fetchServicos, setFiltro, abrirForm, toggleAtivo, excluirServico,
    servicosFiltrados,
  } = useServicoStore();

  useEffect(() => { fetchServicos(); }, [fetchServicos]);

  const servicos = servicosFiltrados();
  const [pendingDel, setPendingDel] = useState<string | null>(null);

  const handleDel = (id: string) => {
    if (pendingDel !== id) { setPendingDel(id); return; }
    excluirServico(id);
    setPendingDel(null);
    toast("Serviço removido");
  };

  return (
    <>
      <PageHeader title="Serviços" subtitle={`${servicos.length} cadastrados`} />

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIAS.map((cat) => (
            <button key={cat} onClick={() => setFiltro(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                filtroCategoria === cat
                  ? "bg-primary-400 text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              )}>
              {cat === "todos" ? "Todos" : (CATEGORIA_LABELS as Record<string, string>)[cat] ?? cat}
            </button>
          ))}
        </div>
        <PremiumButton leftIcon={<Plus size={16} />} onClick={() => abrirForm()} size="md">Novo</PremiumButton>
      </div>

      {isLoading ? (
        <PremiumSkeleton variant="card" rows={4} />
      ) : servicos.length === 0 ? (
        <PremiumEmpty icon={<Scissors size={28} />} title="Nenhum serviço cadastrado"
          actionLabel="Cadastrar serviço" onAction={() => abrirForm()} />
      ) : (
        <div className="space-y-3">
          {servicos.map((s) => {
            const custoEst = s.custo_estimado ?? 0;
            const margem = custoEst > 0
              ? Math.round(((s.preco_ideal - custoEst) / custoEst) * 100)
              : 0;
            const alertaCusto = custoEst > s.preco_ideal * 0.4;

            return (
              <PremiumCard key={s.id} padding="lg" className={cn(!s.ativo && "opacity-50")}>
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catColors[s.categoria])}>
                    <Scissors size={18} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{s.nome}</h3>
                      {!s.ativo && <PremiumBadge variant="cancelado" label="Inativo" size="sm" />}
                      {alertaCusto && (
                        <span className="text-[10px] text-warning flex items-center gap-0.5">
                          <AlertTriangle size={10} /> custo alto
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", catColors[s.categoria])}>
                        {CATEGORIA_LABELS[s.categoria]}
                      </span>
                      <span className="flex items-center gap-0.5"><Clock size={10} /> {s.duracao_minutos}min</span>
                    </div>

                    {/* Pricing breakdown */}
                    <div className="grid grid-cols-2 tablet:grid-cols-4 gap-2 bg-neutral-50 rounded-lg p-2.5">
                      <div className="text-center">
                        <p className="text-[9px] text-text-secondary uppercase">Preço</p>
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">{fmtBRL(s.preco_ideal)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-text-secondary uppercase">Custo</p>
                        <p className="text-sm font-bold text-red-500 tabular-nums">{fmtBRL(custoEst)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-text-secondary uppercase">Mão obra</p>
                        <p className="text-xs font-semibold text-text-primary tabular-nums">{fmtBRL(s.custo_mao_obra ?? 0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-text-secondary uppercase">Margem</p>
                        <p className={cn("text-sm font-bold tabular-nums", margem >= 80 ? "text-emerald-600" : margem >= 40 ? "text-amber-600" : "text-red-500")}>
                          {margem}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => abrirForm(s.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-primary-500 hover:bg-primary-50 cursor-pointer transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleAtivo(s.id)}
                      className={cn("w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                        s.ativo ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-neutral-300 hover:text-neutral-500 hover:bg-neutral-50"
                      )}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleDel(s.id)}
                      className={cn("w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                        pendingDel === s.id ? "bg-red-100 text-error" : "text-neutral-300 hover:text-error hover:bg-red-50"
                      )}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      )}

      {/* Form */}
      {formAberto && <ServicoForm />}
    </>
  );
}
