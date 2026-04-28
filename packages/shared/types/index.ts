// packages/shared/types/index.ts
// Contrato de dados do Vellovy SaaS — SCLC-G
// Toda feature nova exige campo novo AQUI PRIMEIRO.

// ─── Enums de domínio ───────────────────────────────────────────

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'realizado'
  | 'cancelado'
  | 'no_show';

export type SegmentoCliente =
  | 'nova'
  | 'regular'
  | 'fiel'
  | 'ausente'
  | 'inativa';

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'debito'
  | 'credito'
  | 'outro';

export type CategoriaServico =
  | 'cabelo'
  | 'unhas'
  | 'estetica'
  | 'barba'
  | 'outro';

export type PlanoSalao = 'free' | 'essencial' | 'profissional' | 'premium' | 'ilimitado';

export interface MembroSalao {
  id: string;
  salao_id: string;
  user_id: string;
  profissional_id?: string;
  role: 'owner' | 'profissional' | 'recepcionista';
  ativo: boolean;
  convidado_em: string;
  aceito_em?: string;
}

export interface Convite {
  id: string;
  salao_id: string;
  email: string;
  role: 'owner' | 'profissional' | 'recepcionista';
  token: string;
  usado: boolean;
  expira_em: string;
  created_at: string;
}

export interface PlanoSalaoAssinatura {
  id: string;
  salao_id: string;
  plano: PlanoSalao;
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

// ─── Entidades ──────────────────────────────────────────────────

export interface Salao {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  plano: PlanoSalao;
  cor_primaria: string;
  cor_secundaria: string;
  fuso_horario: string;
  telegram_chat_id?: string;
  whatsapp_template?: string;
  created_at: string;
}

export interface Profissional {
  id: string;
  salao_id: string;
  nome: string;
  funcao: string;
  ativo: boolean;
  valor_hora: number;  // centavos — usado na precificação
  // Gamificação
  pontos_total: number;
  nivel: 1 | 2 | 3 | 4 | 5;
  streak_dias: number;
  badges: string[];
  ultima_atividade: string | null;
}

export interface Cliente {
  id: string;
  salao_id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  segmento: SegmentoCliente;
  total_gasto: number;   // centavos — nunca float
  ultima_visita: string | null;
  total_visitas: number;
  observacoes?: string;
}

export interface Servico {
  id: string;
  salao_id: string;
  nome: string;
  preco_ideal: number;      // centavos — preço final sugerido
  custo_estimado: number;   // centavos — custo total calculado
  duracao_minutos: number;
  categoria: CategoriaServico;
  ativo: boolean;
  // Precificação inteligente
  custo_mao_obra: number;     // centavos (duracao/60 * valor_hora)
  custo_produtos: number;     // centavos (soma produtos usados)
  margem_desejada: number;    // percentual (ex: 100 = 100% de markup)
  produtos_usados?: ProdutoUsado[];
}

/** Produto do estoque — insumos de salão */
export interface Produto {
  id: string;
  salao_id: string;
  nome: string;
  marca?: string;
  preco_compra: number;     // centavos — preço total da embalagem
  peso_gramas: number;      // gramas na embalagem
  custo_grama: number;      // centavos — calculado (preco_compra / peso_gramas)
  estoque_atual?: number;   // gramas restantes (opcional)
  ativo: boolean;
}

/** Produto usado em um serviço — com gramas consumidas */
export interface ProdutoUsado {
  produto_id: string;
  produto?: Produto;
  gramas: number;           // gramas usadas por atendimento
  custo: number;            // centavos — calculado (gramas * custo_grama)
}

export interface Agendamento {
  id: string;
  salao_id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora: string;          // ISO 8601
  duracao_minutos: number;
  status: StatusAgendamento;
  valor: number;              // centavos
  forma_pagamento?: FormaPagamento;
  observacoes?: string;
  criado_via_caixa: boolean;
  created_at: string;
  // Joins (quando carregado com relações)
  cliente?: Cliente;
  profissional?: Profissional;
  servico?: Servico;
}

export interface LancamentoCaixa {
  id: string;
  salao_id: string;
  agendamento_id?: string;
  data: string;               // YYYY-MM-DD
  cliente_nome: string;
  servico_id?: string;
  profissional_id?: string;
  valor: number;              // centavos
  forma_pagamento: FormaPagamento;
  tipo: 'servico' | 'produto';
  produto_id?: string;
  created_at: string;
}

export interface CustoFixo {
  id: string;
  salao_id: string;
  categoria: string;
  descricao: string;
  valor: number;    // centavos
  mes_ano: string;  // "2026-04"
}

export interface Repasse {
  id: string;
  salao_id: string;
  profissional_id: string;
  profissional?: Profissional;
  mes_ano: string;
  valor_total: number;    // centavos (base de cálculo)
  percentual: number;     // ex: 40 = 40%
  valor_repasse: number;  // centavos (calculado)
  pago: boolean;
}

export type CategoriaDespesa =
  | 'aluguel'
  | 'agua_luz'
  | 'produtos'
  | 'equipamentos'
  | 'marketing'
  | 'impostos'
  | 'manutencao'
  | 'folha_pagamento'
  | 'outros';

export interface Despesa {
  id: string;
  salao_id: string;
  descricao: string;
  valor: number;            // centavos
  categoria: CategoriaDespesa;
  mes_ano: string;          // "2026-04"
  data_vencimento?: string; // YYYY-MM-DD
  pago: boolean;
  recorrente: boolean;
}

/** Resumo financeiro mensal (DRE simplificada) */
export interface ResumoMensal {
  mes_ano: string;
  receita_servicos: number;     // centavos
  receita_produtos: number;     // centavos
  receita_total: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  despesas_total: number;
  repasses_total: number;
  lucro_bruto: number;          // receita - custos
  lucro_liquido: number;        // receita - custos - repasses
  margem_lucro: number;         // percentual
  ticket_medio: number;
  total_atendimentos: number;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Tipo para formulários — remove campos auto-gerados */
export type AgendamentoForm = Omit<Agendamento, 'id' | 'created_at' | 'cliente' | 'profissional' | 'servico'>;
export type ClienteForm = Omit<Cliente, 'id' | 'segmento' | 'total_gasto' | 'ultima_visita' | 'total_visitas'>;
export type ServicoForm = Omit<Servico, 'id'>;
export type ProdutoForm = Omit<Produto, 'id' | 'custo_grama'>;
export type LancamentoCaixaForm = Omit<LancamentoCaixa, 'id' | 'created_at'>;
