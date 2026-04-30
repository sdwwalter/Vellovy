// apps/web/hooks/usePlano.ts
"use client";

import { useMemo } from 'react';
import { usePlano as usePlanoBase } from '@vellovy/shared/hooks/usePlano';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// ✅ Correto: Interface exata recomendada pelo Claude
interface UsePlanoReturn {
  plano: string | null;
  loading: boolean;
  podeCriarProfissional: boolean;
}

export function usePlano(): UsePlanoReturn {
  const { salaoId } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);

  // Chama a lógica do hook base
  // O "as any" previne que o TS trave aqui caso o shared esteja retornando boolean por engano
  const baseResult = usePlanoBase(supabase, salaoId) as any;

  // ✅ Retorno explícito do objeto exigido pelo Claude
  return {
    plano: baseResult?.plano ?? null,
    loading: baseResult?.loading ?? false,
    podeCriarProfissional: baseResult?.podeCriarProfissional ?? false,
  };
}