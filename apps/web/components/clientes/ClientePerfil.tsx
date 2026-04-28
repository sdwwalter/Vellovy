// components/clientes/ClientePerfil.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Calendar, MapPin, Cake,
  TrendingUp, Hash, Heart, Clock, Scissors,
  MessageCircle, CalendarPlus, Edit3, Trash2,
  AlertTriangle,
} from "lucide-react";
import { useClienteStore } from "@/stores/clienteStore";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { PremiumEmpty } from "@/components/ui/PremiumEmpty";
import { fmtBRL, fmtData, fmtTelefone } from "@vellovy/shared/lib/formatters";
import { SEGMENTO_LABELS } from "@vellovy/shared/lib/constants";
import { diasSemVisita, isAniversarioHoje, aniversarioEm } from "@vellovy/shared/lib/segmentacao";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface ClientePerfilProps {
  clienteId: string;
}

export function ClientePerfil({ clienteId }: ClientePerfilProps) {
  const { getCliente, getHistorico, fetchClientes, abrirForm, excluirCliente } = useClienteStore();
  const [pendingDel, setPendingDel] = useState(false);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const c = getCliente(clienteId);
  const historico = getHistorico(clienteId);

  if (!c) {
    return (
      <div className="py-16">
        <PremiumEmpty
          icon={<AlertTriangle size={28} />}
          title="Cliente não encontrado"
          actionLabel="Voltar à lista"
        />
      </div>
    );
  }

  const dias = diasSemVisita(c.ultima_visita);
  const niver = isAniversarioHoje(c.data_nascimento);
  const niverProximo = aniversarioEm(c.data_nascimento, 7);
  const ticketMedio = c.total_visitas > 0 ? Math.round(c.total_gasto / c.total_visitas) : 0;

  // Serviço favorito (mais frequente no histórico)
  const servicoCount: Record<string, number> = {};
  historico.forEach((h) => { servicoCount[h.servico] = (servicoCount[h.servico] ?? 0) + 1; });
  const servicoFavorito = Object.entries(servicoCount).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";

  // Frequência média (dias entre visitas)
  const frequenciaMedia = c.total_visitas > 1 && c.ultima_visita
    ? Math.round(diasSemVisita(c.ultima_visita) / c.total_visitas)
    : null;

  const handleDel = () => {
    if (!pendingDel) { setPendingDel(true); return; }
    excluirCliente(c.id);
    toast("Cliente removido");
    window.location.href = "/clientes";
  };

  return (
    <div className="animate-in">
      {/* Back link */}
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> Voltar à lista
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar grande */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 relative",
            c.segmento === "fiel" ? "bg-amber-100 text-amber-700" :
            c.segmento === "ausente" ? "bg-orange-100 text-orange-700" :
            c.segmento === "inativa" ? "bg-neutral-100 text-neutral-400" :
            c.segmento === "nova" ? "bg-blue-100 text-blue-700" :
            "bg-neutral-100 text-neutral-600"
          )}>
            {c.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
            {niver && (
              <span className="absolute -top-2 -right-2 w-7 h-7 bg-rose-400 rounded-full flex items-center justify-center text-white shadow-md">
                <Cake size={14} />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)] truncate">{c.nome}</h1>
              <PremiumBadge variant={c.segmento} label={SEGMENTO_LABELS[c.segmento]} size="md" dot />
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary mt-2">
              {c.telefone && (
                <span className="flex items-center gap-1.5"><Phone size={14} /> {fmtTelefone(c.telefone)}</span>
              )}
              {c.email && (
                <span className="flex items-center gap-1.5"><Mail size={14} /> {c.email}</span>
              )}
              {c.data_nascimento && (
                <span className="flex items-center gap-1.5">
                  <Cake size={14} className={niver ? "text-rose-500" : ""} />
                  {fmtData(c.data_nascimento)}
                  {niver && <span className="text-rose-500 font-medium">🎂 Hoje!</span>}
                  {!niver && niverProximo && <span className="text-rose-400 text-xs font-medium">em breve</span>}
                </span>
              )}
            </div>

            {/* Risk alert */}
            {(c.segmento === "ausente" || c.segmento === "inativa") && dias > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2.5 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertTriangle size={14} className="text-warning shrink-0" />
                <p className="text-xs text-warning font-medium">
                  {dias} dias sem visita — {c.segmento === "ausente" ? "considere uma mensagem de reativação" : "cliente perdido, vale tentar promoção especial"}
                </p>
              </div>
            )}

            {/* Observações */}
            {c.observacoes && (
              <p className="text-xs text-text-secondary mt-3 italic bg-neutral-50 rounded-lg px-3 py-2">
                📝 {c.observacoes}
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-neutral-100">
          {c.telefone && (
            <a
              href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PremiumButton variant="secondary" size="sm" leftIcon={<MessageCircle size={14} />}>
                WhatsApp
              </PremiumButton>
            </a>
          )}
          <Link href="/agenda">
            <PremiumButton variant="secondary" size="sm" leftIcon={<CalendarPlus size={14} />}>
              Agendar
            </PremiumButton>
          </Link>
          <PremiumButton variant="ghost" size="sm" leftIcon={<Edit3 size={14} />} onClick={() => abrirForm(c.id)}>
            Editar
          </PremiumButton>
          <PremiumButton
            variant={pendingDel ? "danger" : "ghost"}
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={handleDel}
          >
            {pendingDel ? "Confirmar exclusão" : "Excluir"}
          </PremiumButton>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3 mb-6">
        <PremiumCard padding="md">
          <div className="text-center">
            <TrendingUp size={18} className="text-primary-300 mx-auto mb-1.5" />
            <p className="text-xs text-text-secondary">Total gasto</p>
            <p className="text-lg font-bold text-text-primary tabular-nums">{fmtBRL(c.total_gasto)}</p>
          </div>
        </PremiumCard>
        <PremiumCard padding="md">
          <div className="text-center">
            <Hash size={18} className="text-primary-300 mx-auto mb-1.5" />
            <p className="text-xs text-text-secondary">Visitas</p>
            <p className="text-lg font-bold text-text-primary">{c.total_visitas}</p>
          </div>
        </PremiumCard>
        <PremiumCard padding="md">
          <div className="text-center">
            <TrendingUp size={18} className="text-primary-300 mx-auto mb-1.5" />
            <p className="text-xs text-text-secondary">Ticket médio</p>
            <p className="text-lg font-bold text-text-primary tabular-nums">{fmtBRL(ticketMedio)}</p>
          </div>
        </PremiumCard>
        <PremiumCard padding="md">
          <div className="text-center">
            <Scissors size={18} className="text-primary-300 mx-auto mb-1.5" />
            <p className="text-xs text-text-secondary">Favorito</p>
            <p className="text-sm font-bold text-text-primary truncate">{servicoFavorito}</p>
          </div>
        </PremiumCard>
      </div>

      {/* Timeline de atendimentos */}
      <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)] mb-3">
        Histórico de atendimentos
      </h2>

      {historico.length === 0 ? (
        <PremiumEmpty
          icon={<Clock size={28} />}
          title="Sem histórico ainda"
          description="Os atendimentos aparecerão aqui conforme forem registrados."
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200" />

          <div className="space-y-0">
            {historico.map((h, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 relative">
                {/* Timeline dot */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-primary-200 flex items-center justify-center shrink-0">
                  <Scissors size={14} className="text-primary-400" />
                </div>
                {/* Content */}
                <PremiumCard padding="sm" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{h.servico}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {h.profissional} · {fmtData(h.data)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums">{fmtBRL(h.valor)}</span>
                  </div>
                </PremiumCard>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
