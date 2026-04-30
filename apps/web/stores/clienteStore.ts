// stores/clienteStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Cliente, SegmentoCliente } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import {
  getClientes,
  criarCliente as criarClienteQuery,
  atualizarCliente as atualizarClienteQuery,
  excluirCliente as excluirClienteQuery,
  buscarClientes,
} from "@vellovy/shared/lib/supabase/queries/clientes";

import { calcularSegmento, aniversarioEm, diasSemVisita } from "@vellovy/shared/lib/segmentacao";
import { useAuthStore } from "./authStore";

export type OrdenacaoCliente = "nome" | "ultimo_visita" | "total_gasto" | "total_visitas";

interface ClienteState {
  clientes: Cliente[];
  busca: string;
  filtroSegmento: SegmentoCliente | "todos";
  ordenacao: OrdenacaoCliente;
  isLoading: boolean;
  error: string | null;
  formAberto: boolean;
  editandoId: string | null;
  perfilAberto: string | null;

  setBusca: (termo: string) => void;
  setFiltroSegmento: (seg: SegmentoCliente | "todos") => void;
  setOrdenacao: (ord: OrdenacaoCliente) => void;
  fetchClientes: () => Promise<void>;
  criarCliente: (dados: Omit<Cliente, "id" | "segmento" | "total_gasto" | "ultima_visita" | "total_visitas">) => Promise<void>;
  atualizarCliente: (id: string, dados: Partial<Cliente>) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;

  abrirForm: (editId?: string) => void;
  fecharForm: () => void;
  abrirPerfil: (id: string) => void;
  fecharPerfil: () => void;

  // Computed
  clientesFiltrados: () => Cliente[];
  countPorSegmento: () => Record<string, number>;
  getCliente: (id: string) => Cliente | undefined;
  getHistorico: (id: string) => { servico: string; profissional: string; data: string; valor: number }[];
  stats: () => {
    total: number;
    fieis: number;
    ausentes: number;
    inativas: number;
    novas: number;
    taxaRetencao: number;
    ticketMedio: number;
    aniversariantes: Cliente[];
    emRisco: Cliente[];
  };
}

export const useClienteStore = create<ClienteState>()(
  devtools(
    (set, get) => ({
      clientes: [],
      busca: "",
      filtroSegmento: "todos",
      ordenacao: "nome",
      isLoading: false,
      error: null,
      formAberto: false,
      editandoId: null,
      perfilAberto: null,

      setBusca: (termo) => set({ busca: termo }),
      setFiltroSegmento: (seg) => set({ filtroSegmento: seg }),
      setOrdenacao: (ord) => set({ ordenacao: ord }),

      fetchClientes: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const { busca, filtroSegmento } = get();

          let clientes: Cliente[];
          if (busca.trim()) {
            clientes = await buscarClientes(supabase, salaoId, busca);
          } else {
            clientes = await getClientes(
              supabase,
              salaoId,
              filtroSegmento !== "todos" ? filtroSegmento : undefined
            );
          }

          // Recalcular segmento localmente para exibição
          const atualizados = clientes.map((c) => ({
            ...c,
            segmento: calcularSegmento(c.total_visitas, c.ultima_visita),
          }));

          set({ clientes: atualizados, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      criarCliente: async (dados) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const novo = await criarClienteQuery(supabase, dados);
          set((s) => ({
            clientes: [...s.clientes, { ...novo, segmento: "nova" as SegmentoCliente }],
            formAberto: false,
            editandoId: null,
            isLoading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      atualizarCliente: async (id, dados) => {
        try {
          const supabase = createClient();
          await atualizarClienteQuery(supabase, id, dados);
          set((s) => ({
            clientes: s.clientes.map((c) => c.id === id ? { ...c, ...dados } : c),
          }));
        } catch (err) {
          throw err;
        }
      },

      excluirCliente: async (id) => {
        const backup = get().clientes;
        set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) }));

        try {
          const supabase = createClient();
          await excluirClienteQuery(supabase, id);
        } catch (err) {
          set({ clientes: backup });
          throw err;
        }
      },

      abrirForm: (editId) =>
        set({ formAberto: true, editandoId: editId ?? null }),
      fecharForm: () => set({ formAberto: false, editandoId: null }),
      abrirPerfil: (id) => set({ perfilAberto: id }),
      fecharPerfil: () => set({ perfilAberto: null }),

      clientesFiltrados: () => {
        const { clientes, filtroSegmento, busca, ordenacao } = get();
        let resultado = clientes.filter((c) => {
          if (filtroSegmento !== "todos" && c.segmento !== filtroSegmento) return false;
          if (busca.trim()) {
            const term = busca.toLowerCase();
            return c.nome.toLowerCase().includes(term) || c.telefone.includes(term);
          }
          return true;
        });

        resultado.sort((a, b) => {
          switch (ordenacao) {
            case "nome": return a.nome.localeCompare(b.nome);
            case "ultimo_visita": return new Date(b.ultima_visita || 0).getTime() - new Date(a.ultima_visita || 0).getTime();
            case "total_gasto": return b.total_gasto - a.total_gasto;
            case "total_visitas": return b.total_visitas - a.total_visitas;
            default: return 0;
          }
        });
        return resultado;
      },

      countPorSegmento: () => {
        const counts: Record<string, number> = {};
        get().clientes.forEach((c) => {
          counts[c.segmento] = (counts[c.segmento] ?? 0) + 1;
        });
        return counts;
      },

      getCliente: (id) => get().clientes.find((c) => c.id === id),

      getHistorico: () => {
        // Histórico de atendimentos — será populado quando
        // houver integração com agendamentos concluídos
        return [];
      },

      stats: () => {
        const { clientes } = get();
        const total = clientes.length;
        if (total === 0) return { total: 0, fieis: 0, ausentes: 0, inativas: 0, novas: 0, taxaRetencao: 0, ticketMedio: 0, aniversariantes: [], emRisco: [] };

        let fieis = 0, ausentes = 0, inativas = 0, novas = 0;
        let gastoTotal = 0, visitasTotal = 0;
        const aniversariantes: Cliente[] = [];
        const emRisco: Cliente[] = [];

        clientes.forEach((c) => {
          if (c.segmento === "fiel") fieis++;
          else if (c.segmento === "ausente") ausentes++;
          else if (c.segmento === "inativa") inativas++;
          else if (c.segmento === "nova") novas++;

          gastoTotal += c.total_gasto;
          visitasTotal += c.total_visitas;

          if (aniversarioEm(c.data_nascimento, 7)) {
            aniversariantes.push(c);
          }

          if (c.segmento === "ausente" && diasSemVisita(c.ultima_visita) > 60) {
            emRisco.push(c);
          }
        });

        emRisco.sort((a, b) => b.total_gasto - a.total_gasto);

        const taxaRetencao = Math.round(((total - novas - inativas) / total) * 100);
        const ticketMedio = visitasTotal > 0 ? Math.round(gastoTotal / visitasTotal) : 0;

        return {
          total, fieis, ausentes, inativas, novas, taxaRetencao, ticketMedio, aniversariantes, emRisco,
        };
      },
    }),
    { name: "cliente-store" }
  )
);
