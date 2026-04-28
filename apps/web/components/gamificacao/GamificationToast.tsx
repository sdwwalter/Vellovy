// components/gamificacao/GamificationToast.tsx
"use client";

import { useEffect } from "react";
import { X, Zap } from "lucide-react";
import { useGamificacaoStore } from "@/stores/gamificacaoStore";
import { cn } from "@/lib/utils/cn";

/**
 * Toast não-invasivo de gamificação.
 * Aparece por 4s no topo da tela, não bloqueia nada.
 * Renderizar uma vez no layout.
 */
export function GamificationToast() {
  const { toastVisivel, eventoRecente, fecharToast } = useGamificacaoStore();

  if (!toastVisivel || !eventoRecente) return null;

  return (
    <div className={cn(
      "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-full px-4",
      "animate-in slide-in-from-top-2 duration-300"
    )}>
      <div className="bg-white rounded-2xl shadow-xl border border-primary-200/60 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white shrink-0">
          <Zap size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{eventoRecente.acao}</p>
          <p className="text-xs text-primary-500 font-bold">+{eventoRecente.pontos} pontos ⚡</p>
        </div>
        <button onClick={fecharToast}
          className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-300 hover:text-neutral-500 cursor-pointer transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
