// components/servicos/ServicoForm.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X, Calculator, Clock, DollarSign, Package,
  Percent, Plus, Trash2, AlertTriangle, ChevronDown,
} from "lucide-react";
import { useServicoStore } from "@/stores/servicoStore";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { CATEGORIA_LABELS } from "@vellovy/shared/lib/constants";
import {
  calcularCustoMaoObra,
  calcularCustoTotal,
  calcularPrecoIdeal,
  calcularMargemReal,
} from "@vellovy/shared/lib/precificacao";
import type { CategoriaServico, ProdutoUsado, Servico } from "@vellovy/shared/types";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const CATEGORIAS: CategoriaServico[] = ["cabelo", "barba", "unhas", "estetica", "outro"];

export function ServicoForm() {
  const {
    servicos, editandoId, fecharForm,
    criarServico, atualizarServico,
    getProfissionais, getProdutos,
  } = useServicoStore();

  const profissionais = getProfissionais();
  const produtos = getProdutos();
  const editando = editandoId ? servicos.find((s) => s.id === editandoId) : null;

  // Form state
  const [nome, setNome] = useState(editando?.nome ?? "");
  const [categoria, setCategoria] = useState<CategoriaServico>(editando?.categoria ?? "cabelo");
  const [duracao, setDuracao] = useState(editando?.duracao_minutos ?? 45);
  const [profId, setProfId] = useState(profissionais[0]?.id ?? "");
  const [margemDesejada, setMargemDesejada] = useState(editando?.margem_desejada ?? 100);
  const [precoManual, setPrecoManual] = useState<number | null>(editando?.preco_ideal ?? null);
  const [usandoPrecoManual, setUsandoPrecoManual] = useState(false);
  const [produtosUsados, setProdutosUsados] = useState<ProdutoUsado[]>(
    editando?.produtos_usados ?? []
  );

  // Selected professional
  const profSelecionado = profissionais.find((p) => p.id === profId);
  const valorHora = profSelecionado?.valor_hora ?? 0;

  // Calculated pricing
  const custoMaoObra = useMemo(
    () => calcularCustoMaoObra(duracao, valorHora),
    [duracao, valorHora]
  );

  const custoProdutos = useMemo(
    () => produtosUsados.reduce((t, pu) => t + pu.custo, 0),
    [produtosUsados]
  );

  const custoTotal = calcularCustoTotal(custoMaoObra, custoProdutos);
  const precoSugerido = calcularPrecoIdeal(custoTotal, margemDesejada);
  const precoFinal = usandoPrecoManual ? (precoManual ?? precoSugerido) : precoSugerido;
  const margemReal = calcularMargemReal(precoFinal, custoTotal);

  // Add product
  const adicionarProduto = () => {
    const disponivel = produtos.find(
      (p) => p.ativo && !produtosUsados.some((pu) => pu.produto_id === p.id)
    );
    if (!disponivel) { toast("Todos os produtos já foram adicionados"); return; }
    const gramasDefault = 10;
    const custo = Math.round(gramasDefault * disponivel.custo_grama);
    setProdutosUsados([
      ...produtosUsados,
      { produto_id: disponivel.id, produto: disponivel, gramas: gramasDefault, custo },
    ]);
  };

  const atualizarGramas = (idx: number, gramas: number) => {
    setProdutosUsados((prev) =>
      prev.map((pu, i) =>
        i === idx
          ? { ...pu, gramas, custo: Math.round(gramas * (pu.produto?.custo_grama ?? 0)) }
          : pu
      )
    );
  };

  const trocarProduto = (idx: number, prodId: string) => {
    const prod = produtos.find((p) => p.id === prodId);
    if (!prod) return;
    setProdutosUsados((prev) =>
      prev.map((pu, i) =>
        i === idx
          ? { ...pu, produto_id: prodId, produto: prod, custo: Math.round(pu.gramas * prod.custo_grama) }
          : pu
      )
    );
  };

  const removerProduto = (idx: number) => {
    setProdutosUsados((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit
  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Nome do serviço é obrigatório"); return; }
    if (duracao < 5) { toast.error("Duração mínima: 5 minutos"); return; }

    const dados: Omit<Servico, "id"> = {
      salao_id: "salao-1",
      nome: nome.trim(),
      categoria,
      duracao_minutos: duracao,
      preco_ideal: precoFinal,
      custo_estimado: custoTotal,
      custo_mao_obra: custoMaoObra,
      custo_produtos: custoProdutos,
      margem_desejada: margemDesejada,
      ativo: editando?.ativo ?? true,
      produtos_usados: produtosUsados,
    };

    if (editandoId) {
      atualizarServico(editandoId, dados);
      toast("Serviço atualizado ✅");
    } else {
      criarServico(dados);
      toast("Serviço criado ✅");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end tablet:items-center justify-center animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-2xl tablet:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
            {editandoId ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <button onClick={fecharForm} className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 block">Nome do serviço</label>
            <input
              value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Corte Feminino"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>

          {/* Categoria + Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 block">Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaServico)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white cursor-pointer">
                {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 block flex items-center gap-1">
                <Clock size={12} /> Duração (min)
              </label>
              <input type="number" min={5} step={5} value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm"
              />
            </div>
          </div>

          {/* Profissional (para custo mão de obra) */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 block">
              Profissional base (valor/hora)
            </label>
            <select value={profId} onChange={(e) => setProfId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white cursor-pointer">
              {profissionais.filter((p) => p.ativo).map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {fmtBRL(p.valor_hora)}/h</option>
              ))}
            </select>
          </div>

          {/* ═══ PRECIFICAÇÃO INTELIGENTE ═══ */}
          <div className="bg-gradient-to-br from-primary-50/50 to-primary-100/30 rounded-2xl p-4 border border-primary-200/50">
            <h3 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
              <Calculator size={16} /> Precificação Automática
            </h3>

            {/* Custo mão de obra */}
            <div className="flex items-center justify-between py-2 border-b border-primary-100/60">
              <span className="text-xs text-text-secondary">Mão de obra ({duracao}min × {fmtBRL(valorHora)}/h)</span>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{fmtBRL(custoMaoObra)}</span>
            </div>

            {/* Produtos usados */}
            <div className="py-2 border-b border-primary-100/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Package size={12} /> Produtos ({produtosUsados.length})
                </span>
                <button onClick={adicionarProduto}
                  className="text-[10px] font-semibold text-primary-500 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer">
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              {produtosUsados.length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic">Nenhum produto adicionado</p>
              ) : (
                <div className="space-y-2">
                  {produtosUsados.map((pu, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/60 rounded-lg p-2">
                      <select value={pu.produto_id} onChange={(e) => trocarProduto(idx, e.target.value)}
                        className="flex-1 text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer min-w-0">
                        {produtos.filter((p) => p.ativo).map((p) => (
                          <option key={p.id} value={p.id}>{p.nome} ({fmtBRL(p.custo_grama)}/g)</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number" min={1} step={1} value={pu.gramas}
                          onChange={(e) => atualizarGramas(idx, Number(e.target.value))}
                          className="w-14 text-xs border border-neutral-200 rounded-lg px-2 py-1.5 text-center"
                        />
                        <span className="text-[10px] text-neutral-400">g</span>
                      </div>
                      <span className="text-xs font-semibold text-text-primary tabular-nums w-16 text-right shrink-0">
                        {fmtBRL(pu.custo)}
                      </span>
                      <button onClick={() => removerProduto(idx)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-300 hover:text-error cursor-pointer shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-secondary">Custo produtos total</span>
                <span className="text-sm font-semibold text-text-primary tabular-nums">{fmtBRL(custoProdutos)}</span>
              </div>
            </div>

            {/* Custo total */}
            <div className="flex items-center justify-between py-2 border-b border-primary-100/60">
              <span className="text-xs font-bold text-text-primary">= CUSTO TOTAL</span>
              <span className="text-base font-bold text-red-500 tabular-nums">{fmtBRL(custoTotal)}</span>
            </div>

            {/* Margem */}
            <div className="py-2 border-b border-primary-100/60">
              <label className="text-xs text-text-secondary flex items-center gap-1 mb-1">
                <Percent size={12} /> Margem desejada
              </label>
              <div className="flex items-center gap-2">
                <input type="range" min={10} max={300} step={5} value={margemDesejada}
                  onChange={(e) => { setMargemDesejada(Number(e.target.value)); setUsandoPrecoManual(false); }}
                  className="flex-1 accent-primary-400"
                />
                <span className="text-sm font-bold text-primary-600 tabular-nums w-14 text-right">{margemDesejada}%</span>
              </div>
            </div>

            {/* Preço sugerido */}
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-bold text-emerald-700">= PREÇO SUGERIDO</span>
              <span className="text-lg font-bold text-emerald-600 tabular-nums">{fmtBRL(precoSugerido)}</span>
            </div>

            {/* Override manual */}
            <div className="mt-2 bg-white/70 rounded-xl p-3">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={usandoPrecoManual}
                  onChange={(e) => { setUsandoPrecoManual(e.target.checked); if (e.target.checked) setPrecoManual(precoSugerido); }}
                  className="accent-primary-400"
                />
                <span className="text-xs font-medium text-text-secondary">Ajustar preço manualmente</span>
              </label>
              {usandoPrecoManual && (
                <div>
                  <input type="number" min={0} step={100} value={precoManual ?? 0}
                    onChange={(e) => setPrecoManual(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-right font-semibold"
                  />
                  <p className="text-[10px] text-text-secondary mt-1">Valor em centavos. Ex: 8000 = R$ 80,00</p>
                </div>
              )}
            </div>

            {/* Margem real */}
            {usandoPrecoManual && (
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-primary-100/60">
                <span className="text-xs text-text-secondary">Margem real com preço ajustado</span>
                <span className={cn("text-sm font-bold tabular-nums",
                  margemReal >= 80 ? "text-emerald-600" : margemReal >= 40 ? "text-amber-600" : "text-red-500"
                )}>
                  {margemReal}%
                  {margemReal < 40 && <AlertTriangle size={12} className="inline ml-1" />}
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <PremiumButton variant="ghost" onClick={fecharForm} className="flex-1">Cancelar</PremiumButton>
            <PremiumButton onClick={handleSubmit} className="flex-1">
              {editandoId ? "Salvar" : "Criar Serviço"}
            </PremiumButton>
          </div>
        </div>
      </div>
    </div>
  );
}
