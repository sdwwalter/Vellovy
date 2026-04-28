// packages/shared/hooks/usePlano.ts
// Hook para buscar e enforçar limites do plano do salão.
// Nota: Este hook depende de libs do app (supabase client e authStore),
// então é usado como "recipe" — o app importa e usa diretamente.
import { useEffect, useState } from 'react';
import type { PlanoId } from '../lib/constants/planos';
import { PLANOS } from '../lib/constants/planos';

export interface PlanoSalaoData {
  plano: PlanoId;
  profissionais_max: number;
  tem_bot_telegram: boolean;
  tem_whatsapp_api: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

/**
 * Hook para buscar plano do salão.
 * Recebe o supabase client e salaoId como parâmetros
 * para evitar dependência de path aliases do app.
 */
export function usePlano(
  supabaseClient: { from: (table: string) => unknown } | null,
  salaoId: string | null
) {
  const [plano, setPlano] = useState<PlanoSalaoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaoId || !supabaseClient) {
      setLoading(false);
      return;
    }

    async function fetchPlano() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabaseClient as any;
      const { data, error } = await sb
        .from('planos_salao')
        .select('*')
        .eq('salao_id', salaoId)
        .single();

      if (error) {
        console.error('Erro ao buscar plano:', error);
      } else if (data) {
        setPlano({
          plano: data.plano as PlanoId,
          profissionais_max: data.profissionais_max,
          tem_bot_telegram: data.tem_bot_telegram,
          tem_whatsapp_api: data.tem_whatsapp_api,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id,
        });
      }
      setLoading(false);
    }

    fetchPlano();
  }, [salaoId, supabaseClient]);

  return {
    plano,
    loading,
    podeCriarProfissional: (qtdAtual: number) => {
      if (!plano) return false;
      return qtdAtual < plano.profissionais_max;
    },
    temTelegram: plano?.tem_bot_telegram ?? false,
    temWhatsApp: plano?.tem_whatsapp_api ?? false,
  };
}
