// stores/gamificacaoStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Profissional } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import {
  getGamificacaoProfissionais,
  adicionarPontos as adicionarPontosQuery,
} from "@vellovy/shared/lib/supabase/queries/gamificacao";
import { PONTOS_TETO_DIARIO, NIVEIS_PONTOS } from "@vellovy/shared/lib/constants";
import { useAuthStore } from "./authStore";

export interface Badge {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
  conquistado: boolean;
}

export interface PontosEvento {
  acao: string;
  pontos: number;
  timestamp: string;
}

interface GamificacaoState {
  profissionais: Profissional[];
  pontosHoje: number;
  eventoRecente: PontosEvento | null;
  toastVisivel: boolean;
  isLoading: boolean;

  fetchGamificacao: () => Promise<void>;
  adicionarPontos: (profId: string, acao: string, pontos: number) => Promise<void>;
  fecharToast: () => void;

  getBadges: (profId: string) => Badge[];
  getNivel: (pontos: number) => number;
  getProgresso: (pontos: number) => { nivel: number; atual: number; proximo: number; percentual: number };
  getRanking: () => Profissional[];
}

const ALL_BADGES: Omit<Badge, "conquistado">[] = [
  { id: "primeiro_passo", nome: "Primeiro Passo", emoji: "🌱", descricao: "Primeiro atendimento realizado" },
  { id: "especialista", nome: "Especialista", emoji: "⭐", descricao: "10 avaliações positivas" },
  { id: "fidelizador", nome: "Fidelizador", emoji: "💛", descricao: "10 clientes com 3+ visitas" },
  { id: "agenda_cheia", nome: "Agenda Cheia", emoji: "📅", descricao: "5 dias com ≥6 atendimentos" },
  { id: "consistente", nome: "Consistente", emoji: "🔥", descricao: "15 dias seguidos" },
  { id: "cem_atendimentos", nome: "100 Atendimentos", emoji: "💎", descricao: "Marco real de volume" },
  { id: "mestre_salao", nome: "Mestre do Salão", emoji: "👑", descricao: "500 atendimentos (lendário)" },
];

export const useGamificacaoStore = create<GamificacaoState>()(
  devtools(
    (set, get) => ({
      profissionais: [],
      pontosHoje: 0,
      eventoRecente: null,
      toastVisivel: false,
      isLoading: false,

      fetchGamificacao: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true });
        try {
          const supabase = createClient();
          const profissionais = await getGamificacaoProfissionais(supabase, salaoId);
          set({ profissionais, isLoading: false });
        } catch (err) {
          console.error("Gamificação fetch error:", err);
          set({ isLoading: false });
        }
      },

      adicionarPontos: async (profId, acao, pontos) => {
        const { pontosHoje } = get();
        const restante = PONTOS_TETO_DIARIO - pontosHoje;
        const pontosEfetivos = Math.min(pontos, restante);
        if (pontosEfetivos <= 0) return;

        // Optimistic update
        set((s) => ({
          profissionais: s.profissionais.map((p) =>
            p.id === profId ? { ...p, pontos_total: p.pontos_total + pontosEfetivos } : p
          ),
          pontosHoje: s.pontosHoje + pontosEfetivos,
          eventoRecente: { acao, pontos: pontosEfetivos, timestamp: new Date().toISOString() },
          toastVisivel: true,
        }));

        // Auto-hide toast após 4s
        setTimeout(() => set({ toastVisivel: false }), 4000);

        try {
          const supabase = createClient();
          await adicionarPontosQuery(supabase, profId, pontosEfetivos);
        } catch (err) {
          console.error("Erro ao salvar pontos:", err);
        }
      },

      fecharToast: () => set({ toastVisivel: false }),

      getBadges: (profId) => {
        const prof = get().profissionais.find((p) => p.id === profId);
        const badges = prof?.badges ?? [];
        return ALL_BADGES.map((b) => ({
          ...b,
          conquistado: badges.includes(b.id),
        }));
      },

      getNivel: (pontos) => {
        let nivel = 1;
        for (let i = NIVEIS_PONTOS.length - 1; i >= 0; i--) {
          if (pontos >= NIVEIS_PONTOS[i]) { nivel = (i + 1) as 1 | 2 | 3 | 4 | 5; break; }
        }
        return nivel;
      },

      getProgresso: (pontos) => {
        const { getNivel } = get();
        const nivel = getNivel(pontos);
        const atual = NIVEIS_PONTOS[nivel - 1] ?? 0;
        const proximo = NIVEIS_PONTOS[nivel] ?? NIVEIS_PONTOS[NIVEIS_PONTOS.length - 1];
        const range = proximo - atual;
        const percentual = range > 0 ? Math.min(Math.round(((pontos - atual) / range) * 100), 100) : 100;
        return { nivel, atual, proximo, percentual };
      },

      getRanking: () => {
        return [...get().profissionais].sort((a, b) => b.pontos_total - a.pontos_total);
      },
    }),
    { name: "gamificacao-store" }
  )
);
