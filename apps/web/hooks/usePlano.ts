"use client";

import { useState, useEffect } from 'react';
import {
  parsePlanoInfo,
  podeCriarProfissional as checkPodeCriar,
  type PlanoInfo,
} from '@vellovy/shared/hooks/usePlano';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface UsePlanoReturn {
  plano: string | null;
  planoInfo: PlanoInfo | null;
  loading: boolean;
  podeCriarProfissional: (quantidadeAtual: number) => boolean;
}

export function usePlano(): UsePlanoReturn {
  const { salaoId } = useAuthStore();
  const [planoInfo, setPlanoInfo] = useState<PlanoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaoId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    supabase
      .from('planos_salao')
      .select('*')
      .eq('salao_id', salaoId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setPlanoInfo(parsePlanoInfo(data));
        }
        setLoading(false);
      });
  }, [salaoId]);

  return {
    plano: planoInfo?.plano ?? null,
    planoInfo,
    loading,
    podeCriarProfissional: (quantidadeAtual: number) =>
      planoInfo ? checkPodeCriar(planoInfo, quantidadeAtual) : false,
  };
}