// components/clientes/ClienteDrawer.tsx
"use client";

import { X, Phone, Calendar, ArrowRight, History, DollarSign, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { fmtBRL, fmtData, fmtHora } from "@vellovy/shared/lib/formatters";
import type { ClienteQuickData } from "@/hooks/useClienteQuickView";

interface ClienteDrawerProps {
  data: ClienteQuickData | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Drawer lateral de quick-view do cliente.
 * Exibe resumo, últimas visitas, total gasto e próximo agendamento.
 */
export function ClienteDrawer({ data, isLoading, isOpen, onClose }: ClienteDrawerProps) {
  if (!isOpen) return null;

  const cliente = data?.cliente;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[rgba(44,22,84,0.3)] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/60 bg-neutral-50/50">
          <h3 className="text-sm font-semibold text-text-primary">Resumo do Cliente</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading ? (
            <LoadingSkeleton />
          ) : cliente ? (
            <>
              {/* Avatar + Nome */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg shrink-0">
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-text-primary truncate">
                    {cliente.nome}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                    <Phone size={11} />
                    <span>{cliente.telefone}</span>
                    {cliente.telefone && (
                      <a
                        href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-500 hover:text-emerald-600 font-medium ml-1"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* KPIs rápidos */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-primary-50/60 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary-700">
                    {fmtBRL(data?.totalGasto ?? cliente.total_gasto)}
                  </p>
                  <p className="text-[10px] text-text-secondary font-medium mt-0.5">Total gasto</p>
                </div>
                <div className="bg-rose-50/60 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-rose-700">
                    {cliente.total_visitas}
                  </p>
                  <p className="text-[10px] text-text-secondary font-medium mt-0.5">Visitas</p>
                </div>
              </div>

              {/* Últimas visitas */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <History size={13} className="text-text-secondary" />
                  <h5 className="text-xs font-semibold text-text-primary">Últimas visitas</h5>
                </div>
                {data?.ultimasVisitas && data.ultimasVisitas.length > 0 ? (
                  <div className="space-y-2">
                    {data.ultimasVisitas.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {v.servico}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            {fmtData(v.data)} · {v.profissional}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary-600 shrink-0 ml-2">
                          {fmtBRL(v.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary italic">Nenhuma visita registrada</p>
                )}
              </div>

              {/* Próximo agendamento */}
              {data?.proximoAgendamento && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Calendar size={13} className="text-text-secondary" />
                    <h5 className="text-xs font-semibold text-text-primary">Próximo agendamento</h5>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-2.5">
                    <p className="text-xs font-medium text-emerald-800">
                      {data.proximoAgendamento.servico}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      {fmtData(data.proximoAgendamento.data_hora)} às{" "}
                      {fmtHora(data.proximoAgendamento.data_hora)} ·{" "}
                      {data.proximoAgendamento.profissional}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
              <User size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Cliente não encontrado</p>
            </div>
          )}
        </div>

        {/* Footer — link para perfil completo */}
        {cliente && (
          <div className="px-5 py-4 border-t border-neutral-200/60">
            <PremiumButton
              variant="ghost"
              className="w-full justify-center"
              onClick={() => {
                window.location.href = `/clientes?perfil=${cliente.id}`;
                onClose();
              }}
            >
              <span>Ver perfil completo</span>
              <ArrowRight size={14} className="ml-1" />
            </PremiumButton>
          </div>
        )}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-3 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 bg-neutral-100 rounded-lg" />
        <div className="h-16 bg-neutral-100 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 rounded w-1/3" />
        <div className="h-12 bg-neutral-100 rounded-lg" />
        <div className="h-12 bg-neutral-100 rounded-lg" />
      </div>
    </div>
  );
}
