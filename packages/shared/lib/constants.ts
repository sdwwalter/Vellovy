// packages/shared/lib/constants.ts
// Constantes do domínio Vellovy

export const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  no_show: 'Não compareceu',
};

export const SEGMENTO_LABELS: Record<string, string> = {
  nova: 'Nova',
  regular: 'Regular',
  fiel: 'Fiel',
  ausente: 'Ausente',
  inativa: 'Inativa',
};

export const CATEGORIA_LABELS: Record<string, string> = {
  cabelo: 'Cabelo',
  unhas: 'Unhas',
  estetica: 'Estética',
  barba: 'Barba',
  outro: 'Outro',
};

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  debito: 'Débito',
  credito: 'Crédito',
  outro: 'Outro',
};

export const PLANO_LABELS: Record<string, string> = {
  free: 'Grátis',
  essencial: 'Essencial',
  profissional: 'Profissional',
  premium: 'Premium',
  ilimitado: 'Ilimitado',
};

export const CATEGORIA_DESPESA_LABELS: Record<string, string> = {
  aluguel: 'Aluguel',
  agua_luz: 'Água / Luz',
  produtos: 'Produtos / Insumos',
  equipamentos: 'Equipamentos',
  marketing: 'Marketing',
  impostos: 'Impostos / Tributos',
  manutencao: 'Manutenção',
  folha_pagamento: 'Folha de Pagamento',
  outros: 'Outros',
};

/** Limite de pontos de gamificação por dia */
export const PONTOS_TETO_DIARIO = 200;

/** Mínimos de pontos por nível */
export const NIVEIS_PONTOS = [0, 600, 1500, 3000, 6000] as const;

/** Horas de funcionamento padrão */
export const HORARIO_PADRAO = {
  inicio: '08:00',
  fim: '20:00',
  intervalo: 30, // minutos
} as const;

// ─── Microcopy pt-BR ───────────────────────────────────────────

export const MSG = {
  AGENDA: {
    VAZIA: 'Nenhum atendimento hoje. Que tal adicionar o primeiro?',
    CRIADO: '✓ Agendamento criado com sucesso',
    CONFIRMADO: '✓ Agendamento confirmado',
    CANCELADO: 'Agendamento cancelado',
    ERRO_SALVAR: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    CONFLITO_HORARIO: '⚠️ Já existe um agendamento neste horário para este profissional.',
  },
  CLIENTE: {
    CADASTRADO: '✓ Cliente cadastrado',
    ATUALIZADO: '✓ Dados atualizados',
    DELETAR_CONFIRM: 'Tem certeza que quer remover este cliente? Esta ação não pode ser desfeita.',
  },
  FINANCEIRO: {
    RECEITA_REGISTRADA: '✓ Receita registrada',
    DESPESA_REGISTRADA: '✓ Despesa registrada',
    SALDO_NEGATIVO: '⚠️ Saldo em atenção este mês',
  },
  CAIXA: {
    FECHADO: '✓ Caixa fechado com sucesso',
    LANCAMENTO_CRIADO: '✓ Lançamento registrado',
    VAZIO: 'Nenhum lançamento hoje. Registre o primeiro!',
  },
  GAMIFICATION: {
    BADGE_DESBLOQUEADO: (nome: string) => `🏆 Badge conquistado: ${nome}!`,
    STREAK: (dias: number) => `🔥 ${dias} dias seguidos — Continue assim!`,
    NIVEL_UP: (nivel: number) => `🎊 Você subiu para o Nível ${nivel}!`,
    BEM_VINDO: 'Bem-vindo de volta! 👋',
  },
  ERROS: {
    GENERICO: 'Algo deu errado. Tente novamente.',
    SEM_CONEXAO: '📶 Sem conexão. Verifique sua internet.',
    NAO_AUTORIZADO: 'Sessão expirada. Faça login novamente.',
    CAMPO_OBRIGATORIO: (campo: string) => `${campo} é obrigatório`,
  },
} as const;
