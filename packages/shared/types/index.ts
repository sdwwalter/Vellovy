// ============================================================
// TIPOS PRINCIPAIS — @vellovy/shared/types
// ============================================================

export type PlanoId = 'free' | 'essencial' | 'profissional' | 'premium' | 'ilimitado';

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'no_show';

export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro';

export type CategoriaServico = 'cabelo' | 'unhas' | 'estetica' | 'barba' | 'outro';

export type CategoriaDespesa =
  | 'aluguel'
  | 'produtos'
  | 'equipamentos'
  | 'marketing'
  | 'pessoal'
  | 'outros';

export type SegmentoCliente = 'vip' | 'fiel' | 'regular' | 'novo' | 'inativo' | 'em_risco';

export interface Salao {
  id: string;
  nome: string;
  slug: string;
  telefone?: string;
  endereco?: string;
  created_at: string;
}

export interface Profissional {
  id: string;
  salao_id: string;
  nome: string;
  especialidades: string[];
  avatar_url?: string;
  ativo: boolean;
  comissao_percentual: number;
  pontos_total: number;
  nivel: 1 | 2 | 3 | 4 | 5;
  streak_dias: number;
  badges: string[];
  ultimo_atendimento: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  salao_id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  segmento: SegmentoCliente;
  ultima_visita?: string;
  total_visitas: number;
  total_gasto: number;
  observacoes?: string;
  created_at: string;
}

export interface ProdutoUsado {
  nome: string;
  custo: number;
  quantidade: number;
}

export interface Servico {
  id: string;
  salao_id: string;
  nome: string;
  descricao?: string;
  duracao_minutos: number;
  preco: number;
  categoria: CategoriaServico;
  ativo: boolean;
  produtos_usados?: ProdutoUsado[];
  custo_mao_obra?: number;
  created_at: string;
}

export interface Produto {
  id: string;
  salao_id: string;
  nome: string;
  custo_unitario: number;
  unidade: string;
  estoque_atual: number;
  created_at: string;
}

export interface Agendamento {
  id: string;
  salao_id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora: string;
  duracao_minutos: number;
  status: StatusAgendamento;
  valor: number;
  observacoes?: string;
  created_at: string;
  cliente?: Cliente;
  profissional?: Profissional;
  servico?: Servico;
}

export interface LancamentoCaixa {
  id: string;
  salao_id: string;
  agendamento_id?: string;
  profissional_id?: string;
  descricao: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  tipo: 'entrada' | 'saida';
  data: string;
  created_at: string;
  profissional?: Profissional;
}

export interface Despesa {
  id: string;
  salao_id: string;
  descricao: string;
  valor: number;
  categoria: CategoriaDespesa;
  data: string;
  created_at: string;
}

export interface Repasse {
  id: string;
  salao_id: string;
  profissional_id: string;
  valor: number;
  mes_referencia: string;
  pago: boolean;
  pago_em?: string;
  created_at: string;
  profissional?: Profissional;
}

export interface ResumoMensal {
  receita_total: number;
  despesas_total: number;
  lucro_liquido: number;
  total_atendimentos: number;
  ticket_medio: number;
  por_forma_pagamento: Record<FormaPagamento, number>;
}

export interface PlanoSalao {
  id: string;
  salao_id: string;
  plano: PlanoId;
  status: 'ativo' | 'cancelado' | 'suspenso' | 'trial';
  profissionais_max: number;
  tem_bot_telegram: boolean;
  tem_whatsapp_api: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  trial_fim?: string;
  created_at: string;
  updated_at: string;
}
