// components/financeiro/FinanceiroDespesas.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Check, Clock, RotateCw, AlertTriangle, TrendingDown } from "lucide-react";
import { useFinanceiroStore } from "@/stores/financeiroStore";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumSheet } from "@/components/ui/PremiumSheet";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { fmtBRL, fmtData } from "@vellovy/shared/lib/formatters";
import { CATEGORIA_DESPESA_LABELS } from "@vellovy/shared/lib/constants";
import type { CategoriaDespesa } from "@vellovy/shared/types";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const CATEGORIAS: CategoriaDespesa[] = [
  "aluguel", "agua_luz", "produtos", "equipamentos",
  "marketing", "impostos", "manutencao", "folha_pagamento", "outros",
];

const catColors: Record<string, string> = {
  aluguel: "bg-blue-100 text-blue-700",
  agua_luz: "bg-cyan-100 text-cyan-700",
  produtos: "bg-amber-100 text-amber-700",
  equipamentos: "bg-purple-100 text-purple-700",
  marketing: "bg-rose-100 text-rose-700",
  impostos: "bg-red-100 text-red-700",
  manutencao: "bg-orange-100 text-orange-700",
  folha_pagamento: "bg-emerald-100 text-emerald-700",
  outros: "bg-neutral-100 text-neutral-600",
};

export function FinanceiroDespesas() {
  const {
    despesas, mesAno, formDespesaAberto,
    abrirFormDespesa, fecharFormDespesa, criarDespesa,
    marcarDespesaPaga, excluirDespesa,
    totalDespesas, despesasPorCategoria, despesasPendentes,
  } = useFinanceiroStore();

  const total = totalDespesas();
  const porCat = despesasPorCategoria();
  const pendentes = despesasPendentes();
  const [pendingDel, setPendingDel] = useState<string | null>(null);

  // Form state
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [cat, setCat] = useState<CategoriaDespesa>("outros");
  const [venc, setVenc] = useState("");
  const [recorrente, setRecorrente] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) { toast.error("Descrição obrigatória"); return; }
    const v = Math.round(parseFloat(valor || "0") * 100);
    if (v <= 0) { toast.error("Valor deve ser maior que zero"); return; }
    criarDespesa({
      salao_id: "salao-1", descricao: desc.trim(), valor: v,
      categoria: cat, mes_ano: mesAno,
      data_vencimento: venc || undefined, pago: false, recorrente,
    });
    toast.success("✓ Despesa registrada");
    setDesc(""); setValor(""); setCat("outros"); setVenc(""); setRecorrente(false);
  };

  const handleDel = (id: string) => {
    if (pendingDel !== id) { setPendingDel(id); return; }
    excluirDespesa(id);
    setPendingDel(null);
    toast("Despesa removida");
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Resumo despesas */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{fmtBRL(total)}</p>
          <p className="text-xs text-text-secondary">{despesas.length} despesas · {pendentes.length} pendentes</p>
        </div>
        <PremiumButton leftIcon={<Plus size={16} />} onClick={abrirFormDespesa} size="md">Nova</PremiumButton>
      </div>

      {/* Pendentes alert */}
      {pendentes.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-warning shrink-0" />
          <p className="text-xs text-warning font-medium">
            {pendentes.length} despesa{pendentes.length > 1 ? "s" : ""} pendente{pendentes.length > 1 ? "s" : ""}: {fmtBRL(pendentes.reduce((s, d) => s + d.valor, 0))}
          </p>
        </div>
      )}

      {/* Por categoria */}
      <PremiumCard padding="md">
        <h4 className="text-xs font-bold text-text-primary mb-3">Por categoria</h4>
        <div className="grid grid-cols-2 tablet:grid-cols-3 gap-2">
          {Object.entries(porCat).sort(([, a], [, b]) => b - a).map(([c, v]) => (
            <div key={c} className={cn("rounded-lg p-2.5 text-center", catColors[c])}>
              <p className="text-[10px] font-medium opacity-80">{CATEGORIA_DESPESA_LABELS[c] ?? c}</p>
              <p className="text-sm font-bold tabular-nums">{fmtBRL(v)}</p>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Lista de despesas */}
      {despesas.length === 0 ? (
        <PremiumEmpty icon={<DespesaIcon />} title="Nenhuma despesa este mês"
          actionLabel="Registrar despesa" onAction={abrirFormDespesa} />
      ) : (
        <div className="space-y-2">
          {despesas.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-neutral-200/60 p-4 flex items-center gap-3 group animate-in">
              {/* Pago toggle */}
              <button onClick={() => marcarDespesaPaga(d.id)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer shrink-0",
                  d.pago ? "bg-emerald-100 border-emerald-300 text-emerald-600" : "border-neutral-300 text-neutral-400 hover:border-primary-300"
                )} aria-label={d.pago ? "Marcar como não pago" : "Marcar como pago"}>
                {d.pago ? <Check size={14} /> : <Clock size={14} />}
              </button>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium truncate", d.pago ? "text-text-secondary line-through" : "text-text-primary")}>{d.descricao}</span>
                  {d.recorrente && <span title="Recorrente"><RotateCw size={12} className="text-primary-300 shrink-0" /></span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", catColors[d.categoria])}>
                    {CATEGORIA_DESPESA_LABELS[d.categoria]}
                  </span>
                  {d.data_vencimento && <span className="text-[10px] text-text-secondary">Venc: {fmtData(d.data_vencimento)}</span>}
                </div>
              </div>
              {/* Valor + Delete */}
              <span className={cn("text-sm font-bold tabular-nums shrink-0", d.pago ? "text-text-secondary" : "text-red-500")}>
                {fmtBRL(d.valor)}
              </span>
              <button onClick={() => handleDel(d.id)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0",
                  pendingDel === d.id ? "bg-red-100 text-error" : "text-neutral-300 hover:text-error hover:bg-red-50 opacity-0 group-hover:opacity-100"
                )} aria-label="Excluir">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <PremiumSheet open={formDespesaAberto} onClose={() => { fecharFormDespesa(); }} title="Nova Despesa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PremiumInput label="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Aluguel do imóvel" id="fin-desc" />
          <PremiumInput label="Valor (R$)" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="3500.00" id="fin-val" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Categoria</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIAS.map((c) => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className={cn("px-2 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer border",
                    cat === c ? catColors[c] + " border-current ring-1" : "bg-white text-neutral-500 border-neutral-200"
                  )}>{CATEGORIA_DESPESA_LABELS[c]}</button>
              ))}
            </div>
          </div>
          <PremiumInput label="Data de vencimento (opcional)" type="date" value={venc} onChange={(e) => setVenc(e.target.value)} id="fin-venc" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} className="w-4 h-4 rounded border-neutral-300 text-primary-400 cursor-pointer" />
            <span className="text-sm text-text-primary">Despesa recorrente (mensal)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <PremiumButton type="button" variant="ghost" onClick={fecharFormDespesa} className="flex-1">Cancelar</PremiumButton>
            <PremiumButton type="submit" className="flex-1">Registrar</PremiumButton>
          </div>
        </form>
      </PremiumSheet>
    </div>
  );
}

function DespesaIcon() { return <TrendingDown size={28} />; }
