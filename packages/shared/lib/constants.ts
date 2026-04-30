import type { StatusAgendamento, FormaPagamento, CategoriaServico, CategoriaDespesa, SegmentoCliente } from '../types';

// ============================================================
// LABELS DE EXIBIÇÃO
// ============================================================

export const STATUS_LABELS: Record<StatusAgendamento, string> = {
  agendado:     'Agendado',
  confirmado:   'Confirmado',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
  no_show:      'Não compareceu',
};

export const STATUS_CORES: Record<StatusAgendamento, string> = {
  agendado:     'bg-blue-100 text-blue-700',
  confirmado:   'bg-green-100 text-green-700',
  em_andamento: 'bg-yellow-100 text-yellow-700',
  concluido:    'bg-emerald-100 text-emerald-700',
  cancelado:    'bg-neutral-100 text-neutral-500',
  no_show:      'bg-red-100 text-red-600',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix:      'PIX',
  debito:   'Débito',
  credito:  'Crédito',
  outro:    'Outro',
};

export const CATEGORIA_LABELS: Record<CategoriaServico, string> = {
  cabelo:   'Cabelo',
  unhas:    'Unhas',
  estetica: 'Estética',
  barba:    'Barba',
  outro:    'Outro',
};

export const CATEGORIA_DESPESA_LABELS: Record<CategoriaDespesa, string> = {
  aluguel:      'Aluguel',
  produtos:     'Produtos',
  equipamentos: 'Equipamentos',
  marketing:    'Marketing',
  pessoal:      'Pessoal',
  outros:       'Outros',
};

export const SEGMENTO_LABELS: Record<SegmentoCliente, string> = {
  vip:      'VIP',
  fiel:     'Fiel',
  regular:  'Regular',
  novo:     'Novo',
  inativo:  'Inativo',
  em_risco: 'Em risco',
};

export const SEGMENTO_CORES: Record<SegmentoCliente, string> = {
  vip:      'bg-yellow-100 text-yellow-700',
  fiel:     'bg-green-100 text-green-700',
  regular:  'bg-blue-100 text-blue-700',
  novo:     'bg-purple-100 text-purple-700',
  inativo:  'bg-neutral-100 text-neutral-500',
  em_risco: 'bg-red-100 text-red-600',
};

// ============================================================
// GAMIFICAÇÃO
// ============================================================

/** Pontos mínimos para cada nível (índice 0 = nível 1) */
export const NIVEIS_PONTOS = [0, 600, 1500, 3000, 6000] as const;

export const NIVEL_LABELS = [
  'Iniciante',
  'Aprendiz',
  'Profissional',
  'Especialista',
  'Mestre',
] as const;

/** Teto diário de pontos para evitar exploração */
export const PONTOS_TETO_DIARIO = 200;

export const PONTOS_POR_ACAO = {
  ATENDIMENTO_CONCLUIDO:   80,
  AVALIACAO_5_ESTRELAS:    120,
  DIA_COMPLETO:            50,
  STREAK_5_DIAS:           40,
  STREAK_15_DIAS:          80,
  CLIENTE_FIDELIZADO:      30,
  SEM_CANCELAMENTOS:       60,
} as const;

// ============================================================
// PLANOS
// ============================================================

export const PLANOS_CONFIG = {
  free: {
    profissionais_max: 1,
    agendamentos_mes: 50,
    tem_bot_telegram: false,
    tem_whatsapp_api: false,
    tem_relatorios: false,
  },
  essencial: {
    profissionais_max: 3,
    agendamentos_mes: Infinity,
    tem_bot_telegram: false,
    tem_whatsapp_api: false,
    tem_relatorios: true,
  },
  profissional: {
    profissionais_max: 5,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: false,
    tem_relatorios: true,
  },
  premium: {
    profissionais_max: 15,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: true,
    tem_relatorios: true,
  },
  ilimitado: {
    profissionais_max: 9999,
    agendamentos_mes: Infinity,
    tem_bot_telegram: true,
    tem_whatsapp_api: true,
    tem_relatorios: true,
  },
} as const;
