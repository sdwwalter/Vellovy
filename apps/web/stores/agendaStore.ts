// stores/agendaStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Agendamento, StatusAgendamento } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import {
  getAgendamentosDoDia,
  criarAgendamento as criarAgendamentoQuery,
  atualizarStatusAgendamento,
  excluirAgendamento as excluirAgendamentoQuery,
} from "@vellovy/shared/lib/supabase/queries/agenda";
import { useAuthStore } from "./authStore";

interface AgendaState {
  // Data
  agendamentos: Agendamento[];
  dataSelecionada: string; // YYYY-MM-DD
  filtroStatus: StatusAgendamento | "todos";
  filtroProfissional: string | "todos";
  isLoading: boolean;
  error: string | null;

  // Sheet state
  formAberto: boolean;
  editandoId: string | null;
  realizadoParaCaixa: Agendamento | null;

  // Actions
  setData: (data: string) => void;
  irParaHoje: () => void;
  irParaDiaAnterior: () => void;
  irParaProximoDia: () => void;
  setFiltroStatus: (status: StatusAgendamento | "todos") => void;
  setFiltroProfissional: (id: string | "todos") => void;

  fetchAgendamentos: () => Promise<void>;
  criarAgendamento: (dados: Omit<Agendamento, "id" | "created_at" | "cliente" | "profissional" | "servico">) => Promise<void>;
  atualizarStatus: (id: string, status: StatusAgendamento) => Promise<void>;
  excluirAgendamento: (id: string) => Promise<void>;

  verificarConflito: (
    profissionalId: string,
    dataHora: string,
    duracaoMinutos: number,
    excludeId?: string
  ) => boolean;

  abrirForm: (editId?: string) => void;
  fecharForm: () => void;
  setRealizadoParaCaixa: (ag: Agendamento | null) => void;

  // Computed getters
  agendamentosFiltrados: () => Agendamento[];
  totalDia: () => number;
  countPorStatus: () => Record<string, number>;
}

const hoje = () => new Date().toISOString().split("T")[0];

export const useAgendaStore = create<AgendaState>()(
  devtools(
    (set, get) => ({
      agendamentos: [],
      dataSelecionada: hoje(),
      filtroStatus: "todos",
      filtroProfissional: "todos",
      isLoading: false,
      error: null,
      formAberto: false,
      editandoId: null,
      realizadoParaCaixa: null,

      // ─── Navegação de data ────────────────────────────────
      setData: (data) => {
        set({ dataSelecionada: data });
        get().fetchAgendamentos();
      },
      irParaHoje: () => {
        set({ dataSelecionada: hoje() });
        get().fetchAgendamentos();
      },
      irParaDiaAnterior: () => {
        const current = new Date(get().dataSelecionada);
        current.setDate(current.getDate() - 1);
        const nova = current.toISOString().split("T")[0];
        set({ dataSelecionada: nova });
        get().fetchAgendamentos();
      },
      irParaProximoDia: () => {
        const current = new Date(get().dataSelecionada);
        current.setDate(current.getDate() + 1);
        const nova = current.toISOString().split("T")[0];
        set({ dataSelecionada: nova });
        get().fetchAgendamentos();
      },

      // ─── Filtros ──────────────────────────────────────────
      setFiltroStatus: (status) => set({ filtroStatus: status }),
      setFiltroProfissional: (id) => set({ filtroProfissional: id }),

      // ─── CRUD ─────────────────────────────────────────────
      fetchAgendamentos: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const data = get().dataSelecionada;
          const agendamentos = await getAgendamentosDoDia(supabase, salaoId, data);
          set({ agendamentos, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      criarAgendamento: async (dados) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const novo = await criarAgendamentoQuery(supabase, dados);
          set((s) => ({
            agendamentos: [...s.agendamentos, novo].sort((a, b) =>
              a.data_hora.localeCompare(b.data_hora)
            ),
            formAberto: false,
            editandoId: null,
            isLoading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      atualizarStatus: async (id, status) => {
        // Optimistic update
        const original = get().agendamentos.find((a) => a.id === id);
        set((s) => ({
          agendamentos: s.agendamentos.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        }));

        try {
          const supabase = createClient();
          await atualizarStatusAgendamento(supabase, id, status);

          // Se marcou como "realizado", prepara fluxo Agenda→Caixa
          if (status === "realizado") {
            const ag = get().agendamentos.find((a) => a.id === id);
            if (ag) set({ realizadoParaCaixa: { ...ag, status: "realizado" } });
          }
        } catch (err) {
          // Rollback
          if (original) {
            set((s) => ({
              agendamentos: s.agendamentos.map((a) =>
                a.id === id ? { ...a, status: original.status } : a
              ),
            }));
          }
          throw err;
        }
      },

      excluirAgendamento: async (id) => {
        const backup = get().agendamentos;
        set((s) => ({
          agendamentos: s.agendamentos.filter((a) => a.id !== id),
        }));

        try {
          const supabase = createClient();
          await excluirAgendamentoQuery(supabase, id);
        } catch (err) {
          set({ agendamentos: backup }); // Rollback
          throw err;
        }
      },

      // ─── Conflito (local — para UX rápida) ────────────────
      verificarConflito: (profissionalId, dataHora, duracaoMinutos, excludeId) => {
        const inicio = new Date(dataHora).getTime();
        const fim = inicio + duracaoMinutos * 60000;

        return get().agendamentos.some((a) => {
          if (a.id === excludeId) return false;
          if (a.profissional_id !== profissionalId) return false;
          if (a.status === "cancelado") return false;

          const aInicio = new Date(a.data_hora).getTime();
          const aFim = aInicio + a.duracao_minutos * 60000;

          return inicio < aFim && fim > aInicio;
        });
      },

      // ─── Form ─────────────────────────────────────────────
      abrirForm: (editId) =>
        set({ formAberto: true, editandoId: editId ?? null }),
      fecharForm: () => set({ formAberto: false, editandoId: null }),
      setRealizadoParaCaixa: (ag) => set({ realizadoParaCaixa: ag }),

      // ─── Computed ─────────────────────────────────────────
      agendamentosFiltrados: () => {
        const { agendamentos, filtroStatus, filtroProfissional } = get();
        return agendamentos.filter((a) => {
          if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
          if (filtroProfissional !== "todos" && a.profissional_id !== filtroProfissional)
            return false;
          return true;
        });
      },

      totalDia: () => {
        return get()
          .agendamentos.filter((a) => a.status !== "cancelado")
          .reduce((sum, a) => sum + a.valor, 0);
      },

      countPorStatus: () => {
        const counts: Record<string, number> = {};
        get().agendamentos.forEach((a) => {
          counts[a.status] = (counts[a.status] ?? 0) + 1;
        });
        return counts;
      },
    }),
    { name: "agenda-store" }
  )
);
