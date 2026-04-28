// packages/shared/lib/constants/planos.ts

export interface PlanoConfig {
  id: string;
  nome: string;
  preco_mensal: number;        // centavos
  preco_anual_mes: number;     // centavos
  profissionais_max: number;
  agendamentos_mes: number;
  tem_bot_telegram: boolean;
  tem_whatsapp_api: boolean;
  tem_relatorios: boolean;
}

export const PLANOS: Record<string, PlanoConfig> = {
  free: {
    id: 'free',
    nome: 'Free',
    preco_mensal: 0,
    preco_anual_mes: 0,
    profissionais_max: 1,
    agendamentos_mes: 50,
    tem_bot_telegram: false,
    tem_whatsapp_api: false,
    tem_relatorios: false,
  },
  essencial: {
    id: 'essencial',
    nome: 'Essencial',
    preco_mensal: 3900,
    preco_anual_mes: 3200,
    profissionais_max: 3,
    agendamentos_mes: Infinity,
    tem_bot_telegram: false,
    tem_whatsapp_api: false,
    tem_relatorios: true,
  },
  profissional: {
    id: 'profissional',
    nome: 'Profissional',
    preco_mensal: 6900,
    preco_anual_mes: 5700,
    profissionais_max: 5,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: false,
    tem_relatorios: true,
  },
  premium: {
    id: 'premium',
    nome: 'Premium',
    preco_mensal: 11900,
    preco_anual_mes: 9700,
    profissionais_max: 15,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: true,
    tem_relatorios: true,
  },
  ilimitado: {
    id: 'ilimitado',
    nome: 'Ilimitado',
    preco_mensal: 18900,
    preco_anual_mes: 15500,
    profissionais_max: 9999,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: true,
    tem_relatorios: true,
  },
} as const;

export type PlanoId = keyof typeof PLANOS;

export function podeCriarProfissional(
  planoAtual: PlanoId,
  quantidadeAtual: number
): boolean {
  return quantidadeAtual < PLANOS[planoAtual].profissionais_max;
}

export function temRecurso(
  planoAtual: PlanoId,
  recurso: 'tem_bot_telegram' | 'tem_whatsapp_api' | 'tem_relatorios'
): boolean {
  return PLANOS[planoAtual][recurso];
}
