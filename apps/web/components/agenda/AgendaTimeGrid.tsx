// components/agenda/AgendaTimeGrid.tsx
"use client";

import { useMemo } from "react";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import type { Agendamento, Profissional, StatusAgendamento } from "@vellovy/shared/types";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { STATUS_LABELS } from "@vellovy/shared/lib/constants";

interface AgendaTimeGridProps {
  agendamentos: Agendamento[];
  profissionais: Profissional[];
  onSlotClick: (profissionalId: string, hora: string) => void;
  onAgendamentoClick: (id: string) => void;
  onChangeStatus: (id: string, status: StatusAgendamento) => void;
  horaInicio?: number;  // ex: 8 (8h)
  horaFim?: number;     // ex: 20 (20h)
  intervaloMinutos?: number; // ex: 30
}

interface SlotInfo {
  agendamento?: Agendamento;
  spanSlots: number; // Quantos slots esse agendamento ocupa
  isStart: boolean;  // É o primeiro slot do agendamento
  isContinuation: boolean; // Continuação de um agendamento que começou antes
}

/**
 * Grade horária visual — exibe profissionais como colunas e horários como linhas.
 * Slots de 30min com estados visuais claros.
 */
export function AgendaTimeGrid({
  agendamentos,
  profissionais,
  onSlotClick,
  onAgendamentoClick,
  onChangeStatus,
  horaInicio = 8,
  horaFim = 20,
  intervaloMinutos = 30,
}: AgendaTimeGridProps) {
  // Gerar array de horários do dia
  const horarios = useMemo(() => {
    const slots: string[] = [];
    for (let h = horaInicio; h < horaFim; h++) {
      for (let m = 0; m < 60; m += intervaloMinutos) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots;
  }, [horaInicio, horaFim, intervaloMinutos]);

  // Profissionais ativos — filtrar
  const profsAtivos = useMemo(
    () => profissionais.filter((p) => p.ativo),
    [profissionais]
  );

  // Mapear agendamentos por profissional+hora
  const gridMap = useMemo(() => {
    const map = new Map<string, SlotInfo>();

    agendamentos.forEach((ag) => {
      if (ag.status === "cancelado") return; // Cancelados não ocupam grade

      const start = new Date(ag.data_hora);
      const startH = start.getHours();
      const startM = start.getMinutes();
      const startKey = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
      const spanSlots = Math.ceil(ag.duracao_minutos / intervaloMinutos);

      // Marcar o slot inicial
      const key = `${ag.profissional_id}__${startKey}`;
      map.set(key, { agendamento: ag, spanSlots, isStart: true, isContinuation: false });

      // Marcar slots de continuação
      for (let i = 1; i < spanSlots; i++) {
        const contDate = new Date(start.getTime() + i * intervaloMinutos * 60000);
        const contKey = `${ag.profissional_id}__${String(contDate.getHours()).padStart(2, "0")}:${String(contDate.getMinutes()).padStart(2, "0")}`;
        map.set(contKey, { agendamento: ag, spanSlots: 0, isStart: false, isContinuation: true });
      }
    });

    return map;
  }, [agendamentos, intervaloMinutos]);

  // Verificar se o horário atual está "em andamento"
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

  if (profsAtivos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <User size={32} className="mb-2 opacity-40" />
        <p className="text-sm">Nenhum profissional ativo</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-white">
      <table className="w-full border-collapse min-w-[480px]">
        {/* Cabeçalho — profissionais */}
        <thead>
          <tr className="bg-neutral-50/80">
            <th className="sticky left-0 z-10 bg-neutral-50/80 w-16 px-2 py-3 text-xs font-semibold text-text-secondary border-b border-neutral-200/60">
              <Clock size={14} className="mx-auto" />
            </th>
            {profsAtivos.map((prof) => (
              <th
                key={prof.id}
                className="px-2 py-3 text-center border-b border-l border-neutral-200/60 min-w-[140px]"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                    {prof.nome.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">
                    {prof.nome}
                  </span>
                  {prof.funcao && (
                    <span className="text-[10px] text-text-secondary">{prof.funcao}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Corpo — horários */}
        <tbody>
          {horarios.map((hora, rowIdx) => {
            const isHoraCheia = hora.endsWith(":00");
            const isAgora = hora <= horaAtual && (horarios[rowIdx + 1] ? horaAtual < horarios[rowIdx + 1] : true);

            return (
              <tr
                key={hora}
                className={cn(
                  "transition-colors",
                  isAgora && "bg-primary-50/30",
                  isHoraCheia && "border-t border-neutral-200/60"
                )}
              >
                {/* Label do horário */}
                <td
                  className={cn(
                    "sticky left-0 z-10 w-16 px-2 py-0 text-right border-r border-neutral-200/60",
                    isAgora ? "bg-primary-50/30" : "bg-white",
                    isHoraCheia ? "text-xs font-semibold text-text-primary" : "text-[10px] text-text-secondary"
                  )}
                >
                  <span className="tabular-nums">{hora}</span>
                  {isAgora && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  )}
                </td>

                {/* Cells por profissional */}
                {profsAtivos.map((prof) => {
                  const key = `${prof.id}__${hora}`;
                  const slot = gridMap.get(key);

                  // Slot de continuação — não renderizar (coberto pelo rowSpan)
                  if (slot?.isContinuation) return null;

                  const ag = slot?.agendamento;
                  const spanSlots = slot?.spanSlots ?? 1;

                  if (ag) {
                    // Determinar se está em andamento
                    const agStart = new Date(ag.data_hora);
                    const agEnd = new Date(agStart.getTime() + ag.duracao_minutos * 60000);
                    const emAndamento = ag.status === "confirmado" && agora >= agStart && agora < agEnd;

                    return (
                      <td
                        key={key}
                        rowSpan={spanSlots}
                        className="border-l border-neutral-200/60 p-0.5 align-top"
                      >
                        <button
                          onClick={() => onAgendamentoClick(ag.id)}
                          className={cn(
                            "w-full h-full rounded-lg p-2 text-left transition-all cursor-pointer",
                            "border hover:shadow-md hover:-translate-y-px",
                            emAndamento && "border-rose-300 bg-rose-50 ring-1 ring-rose-200",
                            ag.status === "agendado" && "border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100",
                            ag.status === "confirmado" && !emAndamento && "border-primary-200 bg-primary-50/80 hover:bg-primary-100",
                            ag.status === "realizado" && "border-emerald-200 bg-emerald-50/80",
                            ag.status === "no_show" && "border-red-200 bg-red-50/80"
                          )}
                        >
                          {/* Indicador "em andamento" */}
                          {emAndamento && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                              </span>
                              <span className="text-[10px] font-semibold text-rose-600">Em andamento</span>
                            </div>
                          )}

                          <p className="text-xs font-semibold text-text-primary truncate">
                            {ag.cliente?.nome ?? "Cliente"}
                          </p>
                          <p className="text-[10px] text-text-secondary truncate mt-0.5">
                            {ag.servico?.nome ?? "Serviço"}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-medium text-primary-500">
                              {fmtBRL(ag.valor)}
                            </span>
                            <PremiumBadge
                              variant={emAndamento ? "confirmado" : ag.status}
                              label={emAndamento ? "Em andamento" : (STATUS_LABELS[ag.status] ?? ag.status)}
                              size="sm"
                              dot
                            />
                          </div>
                        </button>
                      </td>
                    );
                  }

                  // Slot livre
                  return (
                    <td
                      key={key}
                      className="border-l border-neutral-200/60 p-0.5"
                    >
                      <button
                        onClick={() => onSlotClick(prof.id, hora)}
                        className={cn(
                          "w-full h-full min-h-[36px] rounded-lg transition-all cursor-pointer",
                          "border border-dashed border-neutral-200/50",
                          "hover:border-primary-300 hover:bg-primary-50/40",
                          "flex items-center justify-center",
                          "group"
                        )}
                        title={`Agendar ${prof.nome} às ${hora}`}
                      >
                        <span className="text-[10px] text-neutral-300 group-hover:text-primary-400 transition-colors">
                          +
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
