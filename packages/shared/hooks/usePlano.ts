import type { PlanoSalao, PlanoId } from '../types';

export interface PlanoInfo {
  plano: PlanoId;
  profissionais_max: number;
  tem_bot_telegram: boolean;
  tem_whatsapp_api: boolean;
  tem_relatorios: boolean;
  status: PlanoSalao['status'];
}

/**
 * Verifica se o salão pode adicionar mais um profissional.
 */
export function podeCriarProfissional(
  planoInfo: PlanoInfo,
  quantidadeAtual: number
): boolean {
  return quantidadeAtual < planoInfo.profissionais_max;
}

/**
 * Verifica se o plano tem acesso a um recurso específico.
 */
export function temRecurso(
  planoInfo: PlanoInfo,
  recurso: 'tem_bot_telegram' | 'tem_whatsapp_api' | 'tem_relatorios'
): boolean {
  return planoInfo[recurso];
}

/**
 * Retorna o label do plano para exibição.
 */
export function getPlanoLabel(planoId: PlanoId): string {
  const labels: Record<PlanoId, string> = {
    free: 'Free',
    essencial: 'Essencial',
    profissional: 'Profissional',
    premium: 'Premium',
    ilimitado: 'Ilimitado',
  };
  return labels[planoId] ?? planoId;
}

/**
 * Converte registro do banco em PlanoInfo tipado.
 */
export function parsePlanoInfo(plano: PlanoSalao): PlanoInfo {
  return {
    plano: plano.plano,
    profissionais_max: plano.profissionais_max,
    tem_bot_telegram: plano.tem_bot_telegram,
    tem_whatsapp_api: plano.tem_whatsapp_api,
    tem_relatorios: plano.plano !== 'free',
    status: plano.status,
  };
}