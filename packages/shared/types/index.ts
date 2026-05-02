// ============================================================
// TIPOS PRINCIPAIS — @vellovy/shared/types
// Alinhado com supabase/migrations/* (fonte da verdade)
// ============================================================

export type PlanoId = 'free' | 'essencial' | 'profissional' | 'premium' | 'ilimitado';

// Alinhado com migration v2: 'agendado'|'confirmado'|'realizado'|'cancelado'|'no_show'
export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'realizado'
  | 'cancelado'
  | 'no_show';

export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro';

export type CategoriaServico = 'cabelo' | 'unhas' | 'estetica' | 'barba' | 'outro';

// Alinhado com FinanceiroDespesas.tsx + custos_fixos
export type CategoriaDespesa =
  | 'aluguel'
  | 'agua_luz'
  | 'produtos'
  | 'equipamentos'
  | 'marketing'
  | 'impostos'
  | 'manutencao'
  | 'folha_pagamento'
  | 'pessoal'
  | 'outros';

// Alinhado com migration: 'nova'|'regular'|'fiel'|'ausente'|'inativa'
// Mantemos 'vip' e 'em_risco' como extensão do TS para segmentação avançada
export type SegmentoCliente = 'vip' | 'fiel' | 'regular' | 'novo' | 'nova' | 'inativo' | 'inativa' | 'ausente' | 'em_risco';

export interface Salao {
  id: string;
  nome: string;
  slug?: string;
  telefone?: string;
  endereco?: string;
  created_at: string;
}

// Alinhado com migration v2: sem especialidades/comissao_percentual/avatar_url
// funcao substituiu especialidades, ultima_atividade substituiu ultimo_atendimento
export interface Profissional {
  id: string;
  salao_id: string;
  nome: string;
  funcao?: string;
  ativo: boolean;
  pontos_total: number;
  nivel: 1 | 2 | 3 | 4 | 5;
  streak_dias: number;
  badges: string[];
  ultima_atividade?: string | null;
  valor_hora?: number; // Frontend-only: usado para cálculo de precificação
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
  created_at?: string;
}

export interface ProdutoUsado {
  nome: string;
  custo: number;
  quantidade: number;
  produto_id?: string;
  produto?: Produto;
  gramas?: number;
}

// Alinhado com migration v2: preco→preco_ideal, custo_estimado, sem descricao/produtos_usados
export interface Servico {
  id: string;
  salao_id: string;
  nome: string;
  duracao_minutos: number;
  preco_ideal: number;
  custo_estimado?: number;
  categoria: CategoriaServico;
  ativo: boolean;
  // Frontend-only: campos de precificação avançada
  custo_mao_obra?: number;
  custo_produtos?: number;
  margem_desejada?: number;
  produtos_usados?: ProdutoUsado[];
  created_at?: string;
}

export interface Produto {
  id: string;
  salao_id: string;
  nome: string;
  marca?: string;
  custo_unitario?: number;
  preco_compra?: number;
  peso_gramas?: number;
  custo_grama?: number;
  unidade?: string;
  estoque_atual: number;
  ativo?: boolean;
  created_at?: string;
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
  forma_pagamento?: FormaPagamento;
  observacoes?: string;
  created_at: string;
  // Joins opcionais
  cliente?: Cliente;
  profissional?: Profissional;
  servico?: Servico;
}

// Alinhado com migration v2: lancamentos_caixa
// cliente_nome substitui descricao; tipo: 'servico'|'produto'
export interface LancamentoCaixa {
  id: string;
  salao_id: string;
  agendamento_id?: string;
  profissional_id?: string;
  cliente_nome: string;
  servico_id?: string;
  descricao?: string; // alias legacy para compatibilidade de UI
  valor: number;
  forma_pagamento: FormaPagamento;
  tipo: 'servico' | 'produto';
  data: string;
  created_at: string;
  profissional?: Profissional;
}

// Alinhado com migration v2: custos_fixos
export interface Despesa {
  id: string;
  salao_id: string;
  descricao?: string;
  categoria: CategoriaDespesa;
  valor: number;
  mes_ano: string;
  data_vencimento?: string;
  pago: boolean;
  recorrente?: boolean;
  created_at?: string;
}

// Alinhado com migration v2: repasses
export interface Repasse {
  id: string;
  salao_id: string;
  profissional_id: string;
  mes_ano: string;
  valor_total: number;
  percentual: number;
  valor_repasse: number;
  pago: boolean;
  created_at: string;
  profissional?: Profissional;
}

// Alinhado com financeiroStore e FinanceiroResumo
export interface ResumoMensal {
  mes_ano: string;
  receita_servicos: number;
  receita_produtos: number;
  receita_total: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  despesas_total: number;
  repasses_total: number;
  lucro_bruto: number;
  lucro_liquido: number;
  margem_lucro: number;
  ticket_medio: number;
  total_atendimentos: number;
  por_forma_pagamento?: Partial<Record<FormaPagamento, number>>;
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
