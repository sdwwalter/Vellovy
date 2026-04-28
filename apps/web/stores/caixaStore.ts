// stores/caixaStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { LancamentoCaixa, FormaPagamento } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import {
  getLancamentosDoDia,
  criarLancamento as criarLancamentoQuery,
  excluirLancamento as excluirLancamentoQuery,
} from "@vellovy/shared/lib/supabase/queries/caixa";
import { useAuthStore } from "./authStore";

interface TotaisPorForma {
  dinheiro: number;
  pix: number;
  debito: number;
  credito: number;
  outro: number;
}

interface CaixaState {
  lancamentos: LancamentoCaixa[];
  dataSelecionada: string;
  isLoading: boolean;
  error: string | null;
  caixaFechado: boolean;

  formAberto: boolean;
  resumoAberto: boolean;

  setData: (data: string) => void;
  fetchLancamentos: () => Promise<void>;
  criarLancamento: (dados: Omit<LancamentoCaixa, "id" | "created_at">) => Promise<void>;
  excluirLancamento: (id: string) => Promise<void>;
  fecharCaixa: () => void;

  abrirForm: () => void;
  fecharForm: () => void;
  abrirResumo: () => void;
  fecharResumo: () => void;

  totalDia: () => number;
  totalPorForma: () => TotaisPorForma;
  countLancamentos: () => number;
  ticketMedio: () => number;
}

const hoje = () => new Date().toISOString().split("T")[0];

export const useCaixaStore = create<CaixaState>()(
  devtools(
    (set, get) => ({
      lancamentos: [],
      dataSelecionada: hoje(),
      isLoading: false,
      error: null,
      caixaFechado: false,
      formAberto: false,
      resumoAberto: false,

      setData: (data) => {
        set({ dataSelecionada: data, caixaFechado: false });
        get().fetchLancamentos();
      },

      fetchLancamentos: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const data = get().dataSelecionada;
          const lancamentos = await getLancamentosDoDia(supabase, salaoId, data);
          set({ lancamentos, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      criarLancamento: async (dados) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const novo = await criarLancamentoQuery(supabase, dados);
          set((s) => ({
            lancamentos: [...s.lancamentos, novo],
            formAberto: false,
            isLoading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      excluirLancamento: async (id) => {
        const backup = get().lancamentos;
        set((s) => ({
          lancamentos: s.lancamentos.filter((l) => l.id !== id),
        }));

        try {
          const supabase = createClient();
          await excluirLancamentoQuery(supabase, id);
        } catch (err) {
          set({ lancamentos: backup });
          throw err;
        }
      },

      fecharCaixa: () => {
        set({ caixaFechado: true, resumoAberto: true });
      },

      abrirForm: () => set({ formAberto: true }),
      fecharForm: () => set({ formAberto: false }),
      abrirResumo: () => set({ resumoAberto: true }),
      fecharResumo: () => set({ resumoAberto: false }),

      totalDia: () =>
        get().lancamentos.reduce((sum, l) => sum + l.valor, 0),

      totalPorForma: () => {
        const totais: TotaisPorForma = {
          dinheiro: 0, pix: 0, debito: 0, credito: 0, outro: 0,
        };
        get().lancamentos.forEach((l) => {
          totais[l.forma_pagamento] += l.valor;
        });
        return totais;
      },

      countLancamentos: () => get().lancamentos.length,

      ticketMedio: () => {
        const { lancamentos } = get();
        if (lancamentos.length === 0) return 0;
        return Math.round(
          lancamentos.reduce((sum, l) => sum + l.valor, 0) / lancamentos.length
        );
      },
    }),
    { name: "caixa-store" }
  )
);
