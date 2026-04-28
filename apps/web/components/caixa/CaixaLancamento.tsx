// components/caixa/CaixaLancamento.tsx
"use client";

import { useState } from "react";
import { Trash2, CreditCard, Banknote, Smartphone, Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LancamentoCaixa, FormaPagamento } from "@vellovy/shared/types";
import { fmtBRL, fmtHora } from "@vellovy/shared/lib/formatters";
import { FORMA_PAGAMENTO_LABELS } from "@vellovy/shared/lib/constants";

interface CaixaLancamentoProps {
  lancamento: LancamentoCaixa;
  onDelete: (id: string) => void;
}

const pagIcons: Record<FormaPagamento, React.ReactNode> = {
  dinheiro: <Banknote size={16} className="text-emerald-500" />,
  pix: <Smartphone size={16} className="text-blue-500" />,
  debito: <CreditCard size={16} className="text-amber-500" />,
  credito: <CreditCard size={16} className="text-purple-500" />,
  outro: <Receipt size={16} className="text-neutral-400" />,
};

const pagBg: Record<FormaPagamento, string> = {
  dinheiro: "bg-emerald-50 border-emerald-200/60",
  pix: "bg-blue-50 border-blue-200/60",
  debito: "bg-amber-50 border-amber-200/60",
  credito: "bg-purple-50 border-purple-200/60",
  outro: "bg-neutral-50 border-neutral-200/60",
};

export function CaixaLancamento({ lancamento: lc, onDelete }: CaixaLancamentoProps) {
  const [pendingDel, setPendingDel] = useState(false);

  const handleDel = () => {
    if (!pendingDel) { setPendingDel(true); return; }
    onDelete(lc.id);
    setPendingDel(false);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/60 transition-all duration-200 hover:shadow-md animate-in group">
      <div className="flex items-center gap-3 p-4">
        {/* Ícone pagamento */}
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border shrink-0", pagBg[lc.forma_pagamento])}>
          {pagIcons[lc.forma_pagamento]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{lc.cliente_nome}</h3>
          <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
            <span>{FORMA_PAGAMENTO_LABELS[lc.forma_pagamento]}</span>
            <span className="text-neutral-300">·</span>
            <span>{fmtHora(lc.created_at)}</span>
            <span className="text-neutral-300">·</span>
            <span className="capitalize">{lc.tipo}</span>
          </p>
        </div>

        {/* Valor + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold text-emerald-600 tabular-nums">{fmtBRL(lc.valor)}</span>
          <button
            onClick={handleDel}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
              pendingDel ? "bg-red-100 text-error" : "text-neutral-300 hover:text-error hover:bg-red-50 opacity-0 group-hover:opacity-100"
            )}
            aria-label={pendingDel ? "Confirmar exclusão" : "Excluir"}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
