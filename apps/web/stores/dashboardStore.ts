// stores/dashboardStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Agendamento } from "@vellovy/shared/types";
import { createClient } from "@/lib/supabase/client";
import { getDashboardData } from "@vellovy/shared/lib/supabase/queries/dashboard";
import { useAuthStore } from "./authStore";

interface OnboardingStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

interface DashboardState {
  isLoading: boolean;
  agendaHoje: number;
  receitaHoje: number;
  clientesNoMes: number;
  ticketMedio: number;
  agendaAmanha: Agendamento[];
  saudacao: string;
  onboarding: OnboardingStep[];
  onboardingCompleto: boolean;

  fetchDashboard: () => Promise<void>;
}

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      isLoading: false,
      agendaHoje: 0,
      receitaHoje: 0,
      clientesNoMes: 0,
      ticketMedio: 0,
      agendaAmanha: [],
      saudacao: getSaudacao(),
      onboarding: [],
      onboardingCompleto: true,

      fetchDashboard: async () => {
        const salaoId = useAuthStore.getState().salaoId;
        if (!salaoId) return;

        set({ isLoading: true });
        try {
          const supabase = createClient();
          const data = await getDashboardData(supabase, salaoId);

          const steps: OnboardingStep[] = [
            { key: "servico", label: "Cadastrar primeiro serviço", done: true, href: "/configuracoes" },
            { key: "profissional", label: "Adicionar profissional", done: true, href: "/configuracoes" },
            { key: "agendamento", label: "Criar primeiro agendamento", done: data.agendaHoje > 0, href: "/agenda" },
            { key: "lancamento", label: "Registrar primeiro lançamento", done: data.receitaHoje > 0, href: "/caixa" },
          ];

          set({
            agendaHoje: data.agendaHoje,
            receitaHoje: data.receitaHoje,
            clientesNoMes: data.clientesNoMes,
            ticketMedio: data.ticketMedio,
            agendaAmanha: data.agendaAmanha,
            saudacao: getSaudacao(),
            onboarding: steps,
            onboardingCompleto: steps.every((s) => s.done),
            isLoading: false,
          });
        } catch (err) {
          console.error("Dashboard fetch error:", err);
          set({ isLoading: false });
        }
      },
    }),
    { name: "dashboard-store" }
  )
);
