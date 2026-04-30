// components/dashboard/DashboardView.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays, DollarSign, Users, TrendingUp,
  ArrowRight, Clock, CheckCircle2, Circle,
  Sparkles, MessageCircle,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { PremiumKPI } from "@/components/ui/PremiumKPI";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { STATUS_LABELS } from "@vellovy/shared/lib/constants";
import { cn } from "@/lib/utils/cn";

export function DashboardView() {
  const {
    isLoading, saudacao, agendaHoje, receitaHoje,
    clientesNoMes, ticketMedio, agendaAmanha,
    onboarding, onboardingCompleto, fetchDashboard,
  } = useDashboardStore();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <div className="animate-in">
      {/* Hero greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          {saudacao} 👋
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Aqui está o resumo do seu salão hoje
        </p>
      </div>

      {isLoading ? (
        <PremiumSkeleton variant="card" rows={4} />
      ) : (
        <>
          {/* Onboarding */}
          {!onboardingCompleto && (
            <PremiumCard padding="lg" className="mb-6 border-primary-200 bg-primary-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-primary-400" />
                <h2 className="text-sm font-bold text-text-primary">Primeiros passos</h2>
              </div>
              <div className="space-y-2">
                {onboarding.map((step) => (
                  <Link key={step.key} href={step.href}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                      step.done ? "opacity-60" : "hover:bg-primary-50 cursor-pointer"
                    )}>
                    {step.done
                      ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      : <Circle size={18} className="text-neutral-300 shrink-0" />
                    }
                    <span className={cn("text-sm", step.done ? "text-text-secondary line-through" : "text-text-primary font-medium")}>
                      {step.label}
                    </span>
                    {!step.done && <ArrowRight size={14} className="text-primary-300 ml-auto" />}
                  </Link>
                ))}
              </div>
            </PremiumCard>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3 mb-6">
            <Link href="/agenda">
              <PremiumKPI
                label="Agenda Hoje"
                value={String(agendaHoje)}
                icon={<CalendarDays size={18} />}
                trend={{ value: "atendimentos", direction: agendaHoje > 0 ? "up" : "neutral" }}
              />
            </Link>
            <Link href="/caixa">
              <PremiumKPI
                label="Receita Hoje"
                value={fmtBRL(receitaHoje)}
                icon={<DollarSign size={18} />}
                trend={{ value: receitaHoje > 0 ? "Registrado" : "Vazio", direction: receitaHoje > 0 ? "up" : "neutral" }}
              />
            </Link>
            <Link href="/clientes">
              <PremiumKPI
                label="Clientes Novos"
                value={String(clientesNoMes)}
                icon={<Users size={18} />}
                trend={{ value: "este mês", direction: clientesNoMes > 0 ? "up" : "neutral" }}
              />
            </Link>
            <Link href="/financeiro">
              <PremiumKPI
                label="Ticket Médio"
                value={fmtBRL(ticketMedio)}
                icon={<TrendingUp size={18} />}
              />
            </Link>
          </div>

          {/* Agenda de amanhã */}
          <PremiumCard padding="lg" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Clock size={16} className="text-primary-400" />
                Agenda de amanhã
              </h2>
              <Link href="/agenda">
                <PremiumButton variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Ver tudo
                </PremiumButton>
              </Link>
            </div>

            {agendaAmanha.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-4">
                Nenhum agendamento para amanhã ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {agendaAmanha.map((ag) => (
                  <div key={ag.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="text-center shrink-0">
                      <p className="text-sm font-bold text-primary-600 tabular-nums">
                        {ag.data_hora.split("T")[1]?.slice(0, 5)}
                      </p>
                      <p className="text-[10px] text-text-secondary">{ag.duracao_minutos}min</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {ag.cliente?.nome ?? "Cliente"}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {ag.servico?.nome ?? "Serviço"} · {ag.profissional?.nome ?? "Prof."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-text-primary tabular-nums">{fmtBRL(ag.valor)}</span>
                      <PremiumBadge variant={ag.status} label={STATUS_LABELS[ag.status] ?? ag.status} size="sm" />
                    </div>
                  </div>
                ))}

                {/* Confirmar todos */}
                <div className="pt-2">
                  <PremiumButton variant="secondary" size="md" leftIcon={<MessageCircle size={14} />} className="w-full"
                    onClick={() => {
                      const nums = agendaAmanha
                        .map((a) => a.cliente?.telefone)
                        .filter(Boolean);
                      if (nums[0]) {
                        window.open(`https://wa.me/55${nums[0]?.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Confirmando seu horário para amanhã no salão. Podemos contar com sua presença? 💜")}`, "_blank");
                      }
                    }}
                  >
                    Confirmar via WhatsApp
                  </PremiumButton>
                </div>
              </div>
            )}
          </PremiumCard>

          {/* Quick links */}
          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
            {[
              { href: "/agenda", icon: <CalendarDays size={20} />, label: "Nova agenda", color: "text-primary-400" },
              { href: "/caixa", icon: <DollarSign size={20} />, label: "Abrir caixa", color: "text-emerald-500" },
              { href: "/clientes", icon: <Users size={20} />, label: "CRM", color: "text-blue-500" },
              { href: "/financeiro", icon: <TrendingUp size={20} />, label: "Financeiro", color: "text-amber-500" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <PremiumCard padding="md" className="text-center hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className={cn("mx-auto mb-2", link.color)}>{link.icon}</div>
                  <p className="text-xs font-medium text-text-primary">{link.label}</p>
                </PremiumCard>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
