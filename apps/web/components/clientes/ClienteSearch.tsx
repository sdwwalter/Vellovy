// components/clientes/ClienteSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ClienteSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function ClienteSearch({ value, onChange }: ClienteSearchProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(local), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [local, onChange]);

  return (
    <div className="relative mb-4">
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Buscar por nome, telefone ou email..."
        className={cn(
          "w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-200 bg-white",
          "text-sm text-text-primary placeholder:text-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400",
          "transition-all duration-150"
        )}
        id="crm-busca"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 cursor-pointer transition-colors"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
