// components/financeiro/FinanceiroResumo.tsx
"use client";

import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  BarChart3, Scissors, CreditCard, Banknote,
  Smartphone, Receipt,
} from "lucide-react";
import { PremiumKPI } from "@/components/ui/PremiumKPI";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { FORMA_PAGAMENTO_LABELS } from "@vellovy/shared/lib/constants";
import type { ResumoMensal } from "@vellovy/shared/types";
import { cn } from "@/lib/utils/cn";

interface FinanceiroResumoProps {
  dre: ResumoMensal;
  receitasMes: {
    porForma: Record<string, number>;
    porTipo: { servico: number; produto: number };
    porProfissional: Array<{ nome: string; valor: number; atendimentos: number }>;
    porServico: Array<{ nome: string; valor: number; count: number; custo: number }>;
  };
  historico: Array<{ mes_ano: string; receita_servicos: number; receita_produtos: number; despesas: number; repasses: number; atendimentos: number }>;
}

const pagIcons: Record<string, React.ReactNode> = {
  dinheiro: <Banknote size={14} className="text-emerald-500" />,
  pix: <Smartphone size={14} className="text-blue-500" />,
  debito: <CreditCard size={14} className="text-amber-500" />,
  credito: <CreditCard size={14} className="text-purple-500" />,
  outro: <Receipt size={14} className="text-neutral-400" />,
};

export function FinanceiroResumo({ dre, receitasMes, historico }: FinanceiroResumoProps) {
  const isLucro = dre.lucro_liquido >= 0;

  return (
    <div className="space-y-6 animate-in">
      {/* ─── DRE KPIs ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
        <PremiumKPI label="Receita Total" value={fmtBRL(dre.receita_total)} icon={<TrendingUp size={18} />}
          trend={{ value: `${dre.total_atendimentos} atend.`, direction: "up" }} />
        <PremiumKPI label="Despesas" value={fmtBRL(dre.despesas_total)} icon={<TrendingDown size={18} />}
          trend={{ value: `${Math.round((dre.despesas_total / Math.max(dre.receita_total, 1)) * 100)}% da receita`, direction: "down" }} />
        <PremiumKPI label="Lucro Líquido" value={fmtBRL(dre.lucro_liquido)} icon={<DollarSign size={18} />}
          trend={{ value: isLucro ? "Positivo" : "⚠ Negativo", direction: isLucro ? "up" : "down" }} />
        <PremiumKPI label="Margem" value={`${dre.margem_lucro}%`} icon={<Percent size={18} />}
          trend={{ value: dre.margem_lucro >= 20 ? "Saudável" : "⚠ Atenção", direction: dre.margem_lucro >= 20 ? "up" : "down" }} />
      </div>

      {/* ─── DRE Demonstrativo ──────────────────────────────── */}
      <PremiumCard padding="lg">
        <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-primary-400" /> Demonstrativo (DRE Simplificada)
        </h3>
        <div className="space-y-2">
          <DRELine label="Receita — Serviços" value={dre.receita_servicos} type="receita" sub />
          <DRELine label="Receita — Produtos" value={dre.receita_produtos} type="receita" sub hint="ISS/ICMS diferenciado" />
          <DRELine label="RECEITA TOTAL" value={dre.receita_total} type="receita" bold />
          <div className="border-t border-neutral-100 my-2" />
          <DRELine label="(−) Despesas operacionais" value={dre.despesas_total} type="despesa" />
          <DRELine label="= LUCRO BRUTO" value={dre.lucro_bruto} type={dre.lucro_bruto >= 0 ? "receita" : "despesa"} bold />
          <DRELine label="(−) Repasses profissionais" value={dre.repasses_total} type="despesa" />
          <div className="border-t-2 border-neutral-200 my-2" />
          <DRELine label="= LUCRO LÍQUIDO" value={dre.lucro_liquido} type={dre.lucro_liquido >= 0 ? "receita" : "despesa"} bold />
        </div>
      </PremiumCard>

      {/* ─── Receita por Forma de Pagamento ──────────────────── */}
      <PremiumCard padding="lg">
        <h3 className="text-sm font-bold text-text-primary mb-3">Receita por forma de pagamento</h3>
        <div className="space-y-2">
          {Object.entries(receitasMes.porForma)
            .sort(([, a], [, b]) => b - a)
            .map(([forma, valor]) => {
              const pct = Math.round((valor / Math.max(dre.receita_total, 1)) * 100);
              return (
                <div key={forma} className="flex items-center gap-3">
                  <div className="w-6">{pagIcons[forma]}</div>
                  <span className="text-xs text-text-secondary w-16">{(FORMA_PAGAMENTO_LABELS as Record<string, string>)[forma] ?? forma}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700",
                        forma === "pix" ? "bg-blue-400" : forma === "credito" ? "bg-purple-400" :
                        forma === "debito" ? "bg-amber-400" : forma === "dinheiro" ? "bg-emerald-400" : "bg-neutral-300"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-text-primary tabular-nums w-20 text-right">{fmtBRL(valor)}</span>
                  <span className="text-[10px] text-text-secondary w-8 text-right">{pct}%</span>
                </div>
              );
            })}
        </div>
      </PremiumCard>

      {/* ─── Receita por Serviço (margem) ────────────────────── */}
      <PremiumCard padding="lg">
        <h3 className="text-sm font-bold text-text-primary mb-3">
          Serviços — Receita vs. Custo
          <span className="text-xs text-text-secondary font-normal ml-2">(margem de lucro)</span>
        </h3>
        <div className="space-y-2">
          {receitasMes.porServico.map((s) => {
            const margem = Math.round(((s.valor - s.custo) / Math.max(s.valor, 1)) * 100);
            const alertaCusto = s.custo > s.valor * 0.4;
            return (
              <div key={s.nome} className="flex items-center gap-3">
                <Scissors size={14} className="text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-text-primary truncate">{s.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">{s.count}x</span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{fmtBRL(s.valor)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div className={cn("h-full rounded-full", alertaCusto ? "bg-warning" : "bg-emerald-400")}
                        style={{ width: `${100 - margem}%` }} />
                    </div>
                    <span className={cn("text-[10px] font-semibold tabular-nums",
                      alertaCusto ? "text-warning" : "text-emerald-600"
                    )}>
                      {alertaCusto && "⚠ "}{margem}% margem
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PremiumCard>

      {/* ─── Receita por Profissional ────────────────────────── */}
      <PremiumCard padding="lg">
        <h3 className="text-sm font-bold text-text-primary mb-3">Faturamento por profissional</h3>
        <div className="space-y-3">
          {receitasMes.porProfissional.map((p, i) => {
            const pct = Math.round((p.valor / Math.max(dre.receita_total, 1)) * 100);
            return (
              <div key={p.nome} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                  {i + 1}º
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-text-primary">{p.nome}</span>
                    <span className="text-sm font-bold text-text-primary tabular-nums">{fmtBRL(p.valor)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-300 to-primary-500 transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-text-secondary">{p.atendimentos} atend. · {pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PremiumCard>

      {/* ─── Gráfico 12 meses (CSS bars) ─────────────────────── */}
      <PremiumCard padding="lg">
        <h3 className="text-sm font-bold text-text-primary mb-4">Evolução — Últimos 12 meses</h3>
        <div className="flex items-end gap-1.5 h-40">
          {historico.map((m) => {
            const receita = m.receita_servicos + m.receita_produtos;
            const maxReceita = Math.max(...historico.map((h) => h.receita_servicos + h.receita_produtos));
            const hPct = Math.round((receita / Math.max(maxReceita, 1)) * 100);
            const mesLabel = m.mes_ano.split("-")[1];
            return (
              <div key={m.mes_ano} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: "120px" }}>
                  <div
                    className="w-full bg-gradient-to-t from-primary-400 to-primary-200 rounded-t-md transition-all duration-500 group-hover:from-primary-500 group-hover:to-primary-300 relative"
                    style={{ height: `${hPct}%`, minHeight: "4px" }}
                    title={`${fmtBRL(receita)}`}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {fmtBRL(receita)}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-text-secondary">{mesLabel}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-text-secondary">
          <span>← 12 meses atrás</span>
          <span>Mês atual →</span>
        </div>
      </PremiumCard>

      {/* ─── Nota tributária ─────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-4">
        <h4 className="text-xs font-bold text-blue-700 mb-1">💡 Nota sobre tributação (Simples Nacional)</h4>
        <p className="text-[11px] text-blue-600 leading-relaxed">
          Serviços de salão de beleza: tributados pelo <strong>Anexo III</strong> (ISS) — alíquota efetiva ~6%. 
          Revenda de produtos: tributada pelo <strong>Anexo I</strong> (ICMS) — alíquota efetiva ~4%.
          A separação de receitas por tipo (serviço vs. produto) no DRE acima ajuda na apuração correta do DAS mensal.
        </p>
      </div>
    </div>
  );
}

// ─── DRE Line Helper ────────────────────────────────────────────
function DRELine({ label, value, type, bold, sub, hint }: {
  label: string; value: number; type: "receita" | "despesa";
  bold?: boolean; sub?: boolean; hint?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-1", bold && "pt-2")}>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs", bold ? "font-bold text-text-primary" : sub ? "text-text-secondary pl-4" : "text-text-secondary")}>
          {label}
        </span>
        {hint && <span className="text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{hint}</span>}
      </div>
      <span className={cn(
        "text-xs tabular-nums",
        bold ? "font-bold text-base" : "font-semibold",
        type === "receita" ? "text-emerald-600" : "text-red-500"
      )}>
        {type === "despesa" && value > 0 ? "−" : ""}{fmtBRL(Math.abs(value))}
      </span>
    </div>
  );
}
