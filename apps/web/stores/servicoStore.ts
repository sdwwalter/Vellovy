// stores/servicoStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Servico, Produto, Profissional } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import {
  getServicos,
  criarServico as criarServicoQuery,
  atualizarServico as atualizarServicoQuery,
  getProfissionais,
} from "@vellovy/shared/lib/supabase/queries/servicos";
import { useAuthStore } from "./authStore";

interface ServicoState {
  servicos: Servico[];
  produtos: Produto[];
  profissionais: Profissional[];
  filtroCategoria: string;
  formAberto: boolean;
  editandoId: string | null;
  isLoading: boolean;

  fetchServicos: () => Promise<void>;
  criarServico: (s: Omit<Servico, "id">) => Promise<void>;
  atualizarServico: (id: string, s: Partial<Servico>) => Promise<void>;
  toggleAtivo: (id: string) => Promise<void>;
  excluirServico: (id: string) => Promise<void>;
  setFiltro: (cat: string) => void;
  abrirForm: (id?: string) => void;
  fecharForm: () => void;

  // Computed
  servicosFiltrados: () => Servico[];
  getProfissionais: () => Profissional[];
  getProdutos: () => Produto[];
}

export const useServicoStore = create<ServicoState>()(
  devtools(
    (set, get) => ({
      servicos: [],
      produtos: [],
      profissionais: [],
      filtroCategoria: "todos",
      formAberto: false,
      editandoId: null,
      isLoading: false,

      fetchServicos: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true });
        try {
          const supabase = createClient();
          const [servicos, profissionais] = await Promise.all([
            getServicos(supabase, salaoId),
            getProfissionais(supabase, salaoId),
          ]);

          // Buscar produtos se tabela existir
          const { data: produtos } = await supabase
            .from('produtos')
            .select('*')
            .eq('salao_id', salaoId)
            .eq('ativo', true);

          set({
            servicos,
            profissionais,
            produtos: (produtos ?? []) as Produto[],
            isLoading: false,
          });
        } catch (err) {
          console.error("Servicos fetch error:", err);
          set({ isLoading: false });
        }
      },

      criarServico: async (dados) => {
        set({ isLoading: true });
        try {
          const supabase = createClient();
          const novo = await criarServicoQuery(supabase, dados);
          set((s) => ({
            servicos: [...s.servicos, novo],
            formAberto: false,
            editandoId: null,
            isLoading: false,
          }));
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      atualizarServico: async (id, dados) => {
        // Optimistic
        set((s) => ({
          servicos: s.servicos.map((sv) => sv.id === id ? { ...sv, ...dados } : sv),
          formAberto: false,
          editandoId: null,
        }));

        try {
          const supabase = createClient();
          await atualizarServicoQuery(supabase, id, dados);
        } catch (err) {
          get().fetchServicos(); // Rollback via reload
          throw err;
        }
      },

      toggleAtivo: async (id) => {
        const servico = get().servicos.find((s) => s.id === id);
        if (!servico) return;

        const novoAtivo = !servico.ativo;
        set((s) => ({
          servicos: s.servicos.map((sv) => sv.id === id ? { ...sv, ativo: novoAtivo } : sv),
        }));

        try {
          const supabase = createClient();
          await atualizarServicoQuery(supabase, id, { ativo: novoAtivo });
        } catch (err) {
          set((s) => ({
            servicos: s.servicos.map((sv) => sv.id === id ? { ...sv, ativo: !novoAtivo } : sv),
          }));
        }
      },

      excluirServico: async (id) => {
        const backup = get().servicos;
        set((s) => ({ servicos: s.servicos.filter((sv) => sv.id !== id) }));

        try {
          const supabase = createClient();
          await supabase.from('servicos').delete().eq('id', id);
        } catch (err) {
          set({ servicos: backup });
          throw err;
        }
      },

      setFiltro: (cat) => set({ filtroCategoria: cat }),
      abrirForm: (id) => set({ formAberto: true, editandoId: id ?? null }),
      fecharForm: () => set({ formAberto: false, editandoId: null }),

      servicosFiltrados: () => {
        const { servicos, filtroCategoria } = get();
        if (filtroCategoria === "todos") return servicos;
        return servicos.filter((s) => s.categoria === filtroCategoria);
      },

      getProfissionais: () => get().profissionais,
      getProdutos: () => get().produtos,
    }),
    { name: "servico-store" }
  )
);
