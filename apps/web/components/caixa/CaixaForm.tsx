// components/caixa/CaixaForm.tsx
"use client";

import { useState } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PremiumSheet } from "@/components/ui/PremiumSheet";
import { useCaixaStore } from "@/stores/caixaStore";
import { useServicoStore } from "@/stores/servicoStore";
import { useAuthStore } from "@/stores/authStore";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import type { FormaPagamento } from "@vellovy/shared/types";
import { Banknote, Smartphone, CreditCard, Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const FORMAS: { key: FormaPagamento; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "dinheiro", label: "Dinheiro", icon: <Banknote size={18} />, color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { key: "pix", label: "PIX", icon: <Smartphone size={18} />, color: "border-blue-400 bg-blue-50 text-blue-700" },
  { key: "debito", label: "Débito", icon: <CreditCard size={18} />, color: "border-amber-400 bg-amber-50 text-amber-700" },
  { key: "credito", label: "Crédito", icon: <CreditCard size={18} />, color: "border-purple-400 bg-purple-50 text-purple-700" },
  { key: "outro", label: "Outro", icon: <Receipt size={18} />, color: "border-neutral-300 bg-neutral-50 text-neutral-600" },
];

interface CaixaFormProps {
  defaultCliente?: string;
  defaultValor?: number;
  defaultServicoId?: string;
}

export function CaixaForm({ defaultCliente, defaultValor, defaultServicoId }: CaixaFormProps) {
  const { formAberto, fecharForm, criarLancamento, dataSelecionada } = useCaixaStore();
  const { servicos, profissionais } = useServicoStore();
  const { salaoId } = useAuthStore();
  const [clienteNome, setClienteNome] = useState(defaultCliente ?? "");
  const [valorStr, setValorStr] = useState(defaultValor ? (defaultValor / 100).toFixed(2) : "");
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [servicoId, setServicoId] = useState(defaultServicoId ?? "");
  const [profId, setProfId] = useState("");
  const [tipo, setTipo] = useState<"servico" | "produto">("servico");

  const valorCentavos = Math.round(parseFloat(valorStr || "0") * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) { toast.error("Nome do cliente é obrigatório"); return; }
    if (valorCentavos <= 0) { toast.error("Valor deve ser maior que zero"); return; }

    criarLancamento({
      salao_id: salaoId ?? '',
      data: dataSelecionada,
      cliente_nome: clienteNome.trim(),
      valor: valorCentavos,
      forma_pagamento: forma,
      servico_id: servicoId || undefined,
      profissional_id: profId || undefined,
      tipo,
      agendamento_id: undefined,
    });
    toast.success("✓ Lançamento registrado");
    resetForm();
  };

  const resetForm = () => {
    setClienteNome(""); setValorStr(""); setForma("pix");
    setServicoId(""); setProfId(""); setTipo("servico");
  };

  return (
    <PremiumSheet open={formAberto} onClose={() => { fecharForm(); resetForm(); }} title="Novo Lançamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PremiumInput label="Nome do cliente" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Maria Eduarda" id="cx-cliente" />

        <PremiumInput label="Valor (R$)" type="number" step="0.01" min="0" value={valorStr} onChange={(e) => setValorStr(e.target.value)} placeholder="80.00" id="cx-valor" />

        {/* Forma de pagamento */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Forma de pagamento</label>
          <div className="grid grid-cols-3 tablet:grid-cols-5 gap-2">
            {FORMAS.map((f) => (
              <button key={f.key} type="button" onClick={() => setForma(f.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer",
                  forma === f.key ? f.color + " ring-1" : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                )}>
                {f.icon}
                <span className="text-[11px] font-medium">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tipo */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setTipo("servico")}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border", tipo === "servico" ? "bg-primary-50 text-primary-600 border-primary-200" : "bg-white text-neutral-500 border-neutral-200")}>
            Serviço
          </button>
          <button type="button" onClick={() => setTipo("produto")}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border", tipo === "produto" ? "bg-primary-50 text-primary-600 border-primary-200" : "bg-white text-neutral-500 border-neutral-200")}>
            Produto
          </button>
        </div>

        {/* Serviço (opcional) */}
        {tipo === "servico" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Serviço (opcional)</label>
            <select value={servicoId} onChange={(e) => { setServicoId(e.target.value); const s = servicos.find(x => x.id === e.target.value); if (s && !valorStr) setValorStr((s.preco_ideal / 100).toFixed(2)); }}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white cursor-pointer" id="cx-servico">
              <option value="">Selecione</option>
              {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome} — {fmtBRL(s.preco_ideal)}</option>)}
            </select>
          </div>
        )}

        {/* Profissional (opcional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Profissional (opcional)</label>
          <select value={profId} onChange={(e) => setProfId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white cursor-pointer" id="cx-prof">
            <option value="">Selecione</option>
            {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        {/* Total preview */}
        {valorCentavos > 0 && (
          <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-emerald-700 font-medium">Total</span>
            <span className="text-lg font-bold text-emerald-800">{fmtBRL(valorCentavos)}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <PremiumButton type="button" variant="ghost" onClick={() => { fecharForm(); resetForm(); }} className="flex-1">Cancelar</PremiumButton>
          <PremiumButton type="submit" className="flex-1" disabled={!clienteNome.trim() || valorCentavos <= 0}>Registrar</PremiumButton>
        </div>
      </form>
    </PremiumSheet>
  );
}
