// stores/financeiroStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Despesa, Repasse, ResumoMensal } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import {
  getDespesasDoMes,
  criarDespesa as criarDespesaQuery,
  excluirDespesa as excluirDespesaQuery,
  getRepassesDoMes,
  toggleRepassePago,
  getReceitaDoMes,
} from "@vellovy/shared/lib/supabase/queries/financeiro";
import { useAuthStore } from "./authStore";

type AbaFinanceiro = "resumo" | "despesas" | "repasses" | "relatorios";

interface FinanceiroState {
  mesAno: string;
  abaAtiva: AbaFinanceiro;
  despesas: Despesa[];
  repasses: Repasse[];
  receitaTotal: number;
  isLoading: boolean;
  error: string | null;
  formDespesaAberto: boolean;
  formRepasseAberto: boolean;

  setMesAno: (m: string) => void;
  setAba: (a: AbaFinanceiro) => void;
  fetchDados: () => Promise<void>;

  criarDespesa: (d: Omit<Despesa, "id">) => Promise<void>;
  excluirDespesa: (id: string) => Promise<void>;
  marcarDespesaPaga: (id: string) => void;
  marcarRepassePago: (id: string) => Promise<void>;

  abrirFormDespesa: () => void;
  fecharFormDespesa: () => void;
  abrirFormRepasse: () => void;
  fecharFormRepasse: () => void;

  totalDespesas: () => number;
  despesasPorCategoria: () => Record<string, number>;
  despesasPendentes: () => Despesa[];
  repassesPendentes: () => Repasse[];

  // Computed / Relatórios
  dre: ResumoMensal | null;
  receitasMes: () => {
    porForma: Record<string, number>;
    porTipo: { servico: number; produto: number };
    porProfissional: Array<{ nome: string; valor: number; atendimentos: number }>;
    porServico: Array<{ nome: string; valor: number; count: number; custo: number }>;
  };
  historico12Meses: () => Array<{ mes_ano: string; receita_servicos: number; receita_produtos: number; despesas: number; repasses: number; atendimentos: number }>;
}

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const useFinanceiroStore = create<FinanceiroState>()(
  devtools(
    (set, get) => ({
      mesAno: mesAtual(),
      abaAtiva: "resumo",
      despesas: [],
      repasses: [],
      receitaTotal: 0,
      isLoading: false,
      error: null,
      formDespesaAberto: false,
      formRepasseAberto: false,
      dre: null,

      setMesAno: (m) => { set({ mesAno: m }); get().fetchDados(); },
      setAba: (a) => set({ abaAtiva: a }),

      fetchDados: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const mes = get().mesAno;

          const despesas = await getDespesasDoMes(supabase, salaoId, mes);
          const repasses = await getRepassesDoMes(supabase, salaoId, get().mesAno);
          const receitaTotal = await getReceitaDoMes(supabase, salaoId, get().mesAno);

          // Build DRE Simplificada
          const despesasTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
          const repassesTotal = repasses.reduce((acc, r) => acc + r.valor_repasse, 0);
          const lucroBruto = receitaTotal - despesasTotal;
          const lucroLiquido = lucroBruto - repassesTotal;
          const margem = receitaTotal > 0 ? Math.round((lucroLiquido / receitaTotal) * 100) : 0;

          const dre: ResumoMensal = {
            mes_ano: get().mesAno,
            receita_servicos: receitaTotal,
            receita_produtos: 0,
            receita_total: receitaTotal,
            despesas_fixas: despesasTotal,
            despesas_variaveis: 0,
            despesas_total: despesasTotal,
            repasses_total: repassesTotal,
            lucro_bruto: lucroBruto,
            lucro_liquido: lucroLiquido,
            margem_lucro: margem,
            ticket_medio: 0,
            total_atendimentos: 0,
          };

          set({ despesas, repasses, receitaTotal, dre, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      criarDespesa: async (dados) => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        try {
          const supabase = createClient();
          await criarDespesaQuery(supabase, {
            salao_id: salaoId,
            categoria: dados.categoria,
            descricao: dados.descricao,
            valor: dados.valor,
            mes_ano: dados.mes_ano,
          });
          set({ formDespesaAberto: false });
          get().fetchDados(); // Reload
        } catch (err) {
          throw err;
        }
      },

      excluirDespesa: async (id) => {
        const backup = get().despesas;
        set((s) => ({ despesas: s.despesas.filter((d) => d.id !== id) }));

        try {
          const supabase = createClient();
          await excluirDespesaQuery(supabase, id);
        } catch (err) {
          set({ despesas: backup });
          throw err;
        }
      },

      marcarDespesaPaga: (id) => {
        set((s) => ({
          despesas: s.despesas.map((d) => d.id === id ? { ...d, pago: !d.pago } : d),
        }));
      },

      marcarRepassePago: async (id) => {
        const repasse = get().repasses.find((r) => r.id === id);
        if (!repasse) return;

        const novoPago = !repasse.pago;
        set((s) => ({
          repasses: s.repasses.map((r) => r.id === id ? { ...r, pago: novoPago } : r),
        }));

        try {
          const supabase = createClient();
          await toggleRepassePago(supabase, id, novoPago);
        } catch (err) {
          // Rollback
          set((s) => ({
            repasses: s.repasses.map((r) => r.id === id ? { ...r, pago: !novoPago } : r),
          }));
        }
      },

      abrirFormDespesa: () => set({ formDespesaAberto: true }),
      fecharFormDespesa: () => set({ formDespesaAberto: false }),
      abrirFormRepasse: () => set({ formRepasseAberto: true }),
      fecharFormRepasse: () => set({ formRepasseAberto: false }),

      totalDespesas: () => get().despesas.reduce((s, d) => s + d.valor, 0),
      despesasPorCategoria: () => {
        const cats: Record<string, number> = {};
        get().despesas.forEach((d) => { cats[d.categoria] = (cats[d.categoria] ?? 0) + d.valor; });
        return cats;
      },
      despesasPendentes: () => get().despesas.filter((d) => !d.pago),
      repassesPendentes: () => get().repasses.filter((r) => !r.pago),

      receitasMes: () => {
        const total = get().receitaTotal;
        return {
          porForma: { pix: total },
          porTipo: { servico: total, produto: 0 },
          porProfissional: [],
          porServico: [],
        };
      },

      historico12Meses: () => {
        // Placeholder até que o backend de relatórios seja implementado
        const { mesAno, dre } = get();
        if (!dre) return [];
        return [{
          mes_ano: mesAno,
          receita_servicos: dre.receita_servicos,
          receita_produtos: dre.receita_produtos,
          despesas: dre.despesas_total,
          repasses: dre.repasses_total,
          atendimentos: dre.total_atendimentos,
        }];
      },
    }),
    { name: "financeiro-store" }
  )
);
