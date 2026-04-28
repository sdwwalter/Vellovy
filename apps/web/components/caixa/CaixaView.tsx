// components/caixa/CaixaView.tsx
"use client";

import { useEffect } from "react";
import { Wallet, Plus, Lock, CheckCircle2 } from "lucide-react";
import { useCaixaStore } from "@/stores/caixaStore";
import { CaixaLancamento } from "./CaixaLancamento";
import { CaixaResumo } from "./CaixaResumo";
import { CaixaForm } from "./CaixaForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { PremiumSheet } from "@/components/ui/PremiumSheet";
import { fmtBRL, fmtData } from "@vellovy/shared/lib/formatters";
import { toast } from "sonner";

export function CaixaView() {
  const {
    lancamentos, dataSelecionada, isLoading, caixaFechado,
    resumoAberto, fecharResumo,
    fetchLancamentos, excluirLancamento, abrirForm, fecharCaixa,
    totalDia, totalPorForma, countLancamentos, ticketMedio,
  } = useCaixaStore();

  useEffect(() => { fetchLancamentos(); }, [fetchLancamentos]);

  const total = totalDia();
  const totais = totalPorForma();
  const count = countLancamentos();
  const ticket = ticketMedio();

  const handleDelete = (id: string) => {
    excluirLancamento(id);
    toast("Lançamento removido");
  };

  const handleFecharCaixa = () => {
    if (lancamentos.length === 0) {
      toast.error("Não há lançamentos para fechar o caixa");
      return;
    }
    fecharCaixa();
    toast.success("✓ Caixa fechado com sucesso");
  };

  return (
    <>
      <PageHeader
        title="Caixa"
        subtitle={fmtData(dataSelecionada)}
        action={
          <div className="flex items-center gap-2">
            {lancamentos.length > 0 && !caixaFechado && (
              <PremiumButton variant="rose" leftIcon={<Lock size={16} />} onClick={handleFecharCaixa} size="md">
                <span className="hidden tablet:inline">Fechar Caixa</span>
                <span className="tablet:hidden">Fechar</span>
              </PremiumButton>
            )}
            <PremiumButton leftIcon={<Plus size={18} />} onClick={abrirForm}>
              <span className="hidden tablet:inline">Novo Lançamento</span>
              <span className="tablet:hidden">Novo</span>
            </PremiumButton>
          </div>
        }
      />

      {/* Resumo (sempre visível se houver lançamentos) */}
      {count > 0 && (
        <CaixaResumo total={total} totaisPorForma={totais} count={count} ticketMedio={ticket} />
      )}

      {/* Lista de lançamentos */}
      {isLoading ? (
        <PremiumSkeleton variant="list" rows={4} />
      ) : lancamentos.length === 0 ? (
        <PremiumEmpty
          icon={<Wallet size={28} />}
          title="Nenhum lançamento hoje"
          description="Registre o primeiro lançamento do dia para começar o controle."
          actionLabel="Novo lançamento"
          onAction={abrirForm}
        />
      ) : (
        <div className="space-y-2">
          {lancamentos.map((lc) => (
            <CaixaLancamento key={lc.id} lancamento={lc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Form */}
      <CaixaForm />

      {/* Resumo de fechamento */}
      <PremiumSheet open={resumoAberto} onClose={fecharResumo} title="Caixa Fechado">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-1">
            Caixa fechado!
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {fmtData(dataSelecionada)} — {count} lançamentos
          </p>

          <div className="bg-gradient-hero rounded-2xl p-6 text-white mb-6">
            <p className="text-sm text-white/70 mb-1">Total do dia</p>
            <p className="text-3xl font-bold font-[family-name:var(--font-display)]">{fmtBRL(total)}</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-left mb-6">
            {Object.entries(totais).filter(([, v]) => v > 0).map(([key, valor]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-text-secondary capitalize">{key}</span>
                <span className="text-sm font-semibold text-text-primary">{fmtBRL(valor)}</span>
              </div>
            ))}
          </div>

          <PremiumButton onClick={fecharResumo} className="w-full">Fechar</PremiumButton>
        </div>
      </PremiumSheet>
    </>
  );
}
