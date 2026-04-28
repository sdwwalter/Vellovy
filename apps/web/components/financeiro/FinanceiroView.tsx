// components/financeiro/FinanceiroView.tsx
"use client";

import { useEffect } from "react";
import { BarChart3, Receipt, Users, FileText } from "lucide-react";
import { useFinanceiroStore } from "@/stores/financeiroStore";
import { FinanceiroResumo } from "./FinanceiroResumo";
import { FinanceiroDespesas } from "./FinanceiroDespesas";
import { FinanceiroRepasses } from "./FinanceiroRepasses";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { cn } from "@/lib/utils/cn";

const ABAS = [
  { key: "resumo" as const, label: "Resumo", icon: <BarChart3 size={16} /> },
  { key: "despesas" as const, label: "Despesas", icon: <Receipt size={16} /> },
  { key: "repasses" as const, label: "Repasses", icon: <Users size={16} /> },
] as const;

const MESES_LABEL: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

export function FinanceiroView() {
  const {
    mesAno, abaAtiva, isLoading, dre,
    setMesAno, setAba, fetchDados,
    receitasMes, historico12Meses,
  } = useFinanceiroStore();

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const [ano, mes] = mesAno.split("-");
  const mesLabel = `${MESES_LABEL[mes] ?? mes} de ${ano}`;

  return (
    <>
      <PageHeader title="Financeiro" subtitle={mesLabel} />

      {/* Seletor de mês */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="month"
          value={mesAno}
          onChange={(e) => setMesAno(e.target.value)}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
          id="fin-mes"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1 mb-6">
        {ABAS.map((aba) => (
          <button
            key={aba.key}
            onClick={() => setAba(aba.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all",
              abaAtiva === aba.key
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            {aba.icon}
            {aba.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <PremiumSkeleton variant="card" rows={4} />
      ) : (
        <>
          {abaAtiva === "resumo" && dre && (
            <FinanceiroResumo
              dre={dre}
              receitasMes={receitasMes()}
              historico={historico12Meses()}
            />
          )}
          {abaAtiva === "despesas" && <FinanceiroDespesas />}
          {abaAtiva === "repasses" && <FinanceiroRepasses />}
        </>
      )}
    </>
  );
}
