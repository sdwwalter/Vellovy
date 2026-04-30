// components/gamificacao/GamificacaoView.tsx
"use client";

import { useEffect } from "react";
import {
  Trophy, Flame, Star, Medal, Crown, Zap,
  Target, TrendingUp,
} from "lucide-react";
import { useGamificacaoStore, type Badge } from "@/stores/gamificacaoStore";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumSkeleton } from "@/components/ui/PremiumSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { NIVEIS_PONTOS } from "@vellovy/shared/lib/constants";
import { cn } from "@/lib/utils/cn";

const nivelLabels = ["Iniciante", "Aprendiz", "Profissional", "Especialista", "Mestre"];
const nivelColors = [
  "from-neutral-300 to-neutral-400",
  "from-blue-400 to-blue-600",
  "from-primary-400 to-primary-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-yellow-400",
];

export function GamificacaoView() {
  const {
    isLoading, profissionais, pontosHoje,
    fetchGamificacao, getBadges, getProgresso, getRanking,
  } = useGamificacaoStore();

  useEffect(() => { fetchGamificacao(); }, [fetchGamificacao]);

  const ranking = getRanking();

  return (
    <>
      <PageHeader title="Conquistas" subtitle="Reconhece trabalho real. Nunca pune." />

      {isLoading ? (
        <PremiumSkeleton variant="card" rows={4} />
      ) : (
        <div className="space-y-6 animate-in">
          {/* Pontos hoje */}
          <PremiumCard padding="lg" className="bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-200">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={20} className="text-primary-500" />
              <h2 className="text-sm font-bold text-primary-700">Pontos hoje</h2>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-primary-600 tabular-nums">{pontosHoje}</span>
              <span className="text-sm text-primary-400 mb-1">/ 200 (teto diário)</span>
            </div>
            <div className="mt-2 bg-white/60 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
                style={{ width: `${Math.min((pontosHoje / 200) * 100, 100)}%` }} />
            </div>
          </PremiumCard>

          {/* Ranking */}
          <div>
            <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)] mb-3 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> Ranking
            </h2>
            <div className="space-y-3">
              {ranking.map((prof, i) => {
                const prog = getProgresso(prof.pontos_total);
                const badges = getBadges(prof.id);
                const conquistados = badges.filter((b) => b.conquistado);
                const initials = prof.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

                return (
                  <PremiumCard key={prof.id} padding="lg">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {/* Position medal */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                        i === 0 ? "bg-amber-100 text-amber-600" :
                        i === 1 ? "bg-neutral-200 text-neutral-600" :
                        i === 2 ? "bg-orange-100 text-orange-600" :
                        "bg-neutral-100 text-neutral-400"
                      )}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                      </div>

                      {/* Avatar + Level */}
                      <div className="relative">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br",
                          nivelColors[prog.nivel - 1]
                        )}>
                          {initials}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-bold text-primary-600 border border-primary-200">
                          {prog.nivel}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text-primary">{prof.nome}</h3>
                        <p className="text-xs text-text-secondary">{prof.funcao} · {nivelLabels[prog.nivel - 1]}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-text-primary tabular-nums">{prof.pontos_total.toLocaleString()}</p>
                        <p className="text-[10px] text-text-secondary">pontos</p>
                      </div>
                    </div>

                    {/* Streak */}
                    {prof.streak_dias > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Flame size={14} className="text-orange-500" />
                        <span className="text-xs font-semibold text-orange-600">{prof.streak_dias} dias seguidos 🔥</span>
                      </div>
                    )}

                    {/* Level progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-text-secondary">Nível {prog.nivel} → {prog.nivel < 5 ? prog.nivel + 1 : "MAX"}</span>
                        <span className="text-[10px] text-text-secondary tabular-nums">{prog.percentual}%</span>
                      </div>
                      <div className="bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", nivelColors[prog.nivel - 1])}
                          style={{ width: `${prog.percentual}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] text-text-secondary tabular-nums">{NIVEIS_PONTOS[prog.nivel - 1]?.toLocaleString()}</span>
                        <span className="text-[9px] text-text-secondary tabular-nums">{(NIVEIS_PONTOS[prog.nivel] ?? NIVEIS_PONTOS[NIVEIS_PONTOS.length - 1])?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Conquistas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {badges.map((b) => (
                          <span key={b.id} className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all",
                            b.conquistado
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-neutral-50 border-neutral-200 text-neutral-400"
                          )} aria-label={b.descricao}>
                            <span>{b.emoji}</span>
                            <span>{b.nome}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </PremiumCard>
                );
              })}
            </div>
          </div>

          {/* Points legend */}
          <PremiumCard padding="lg">
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Target size={16} className="text-primary-400" /> Como ganhar pontos
            </h3>
            <div className="space-y-2">
              {[
                { acao: "Agendamento realizado", pontos: 80, trigger: "status → realizado" },
                { acao: "Caixa fechada no dia", pontos: 50, trigger: 'botão "Fechar Caixa"' },
                { acao: "Cliente novo fidelizado", pontos: 30, trigger: "3ª visita do cliente" },
                { acao: "Dia cheio (≥6 atendimentos)", pontos: 50, trigger: "cron diário" },
                { acao: "Semana sem no-show", pontos: 60, trigger: "cron semanal" },
                { acao: "Streak de 7 dias", pontos: 100, trigger: "bônus único" },
                { acao: "Streak de 15 dias", pontos: 150, trigger: "bônus único" },
              ].map((item) => (
                <div key={item.acao} className="flex items-center justify-between py-1.5 border-b border-neutral-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-text-primary">{item.acao}</p>
                    <p className="text-[10px] text-text-secondary">{item.trigger}</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">+{item.pontos}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary mt-3 italic">Teto diário: 200 pontos. Nunca decrementamos. 💜</p>
          </PremiumCard>
        </div>
      )}
    </>
  );
}
