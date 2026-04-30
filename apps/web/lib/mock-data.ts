// lib/mock-data.ts
// Dados fictícios para desenvolvimento — será substituído por Supabase queries
import type {
  Agendamento,
  Cliente,
  Profissional,
  Servico,
  LancamentoCaixa,
} from "@vellovy/shared/types";

const hoje = new Date().toISOString().split("T")[0];

export const MOCK_PROFISSIONAIS: Profissional[] = [
  {
    id: "prof-1",
    salao_id: "salao-1",
    nome: "Ana Silva",
    funcao: "Cabeleireira",
    ativo: true,
    valor_hora: 5000, // R$ 50/hora
    pontos_total: 1200,
    nivel: 2,
    streak_dias: 7,
    badges: ["primeiro_passo", "consistente"],
    ultima_atividade: hoje,
  },
  {
    id: "prof-2",
    salao_id: "salao-1",
    nome: "Carlos Mendes",
    funcao: "Barbeiro",
    ativo: true,
    valor_hora: 4000, // R$ 40/hora
    pontos_total: 800,
    nivel: 2,
    streak_dias: 3,
    badges: ["primeiro_passo"],
    ultima_atividade: hoje,
  },
  {
    id: "prof-3",
    salao_id: "salao-1",
    nome: "Beatriz Oliveira",
    funcao: "Manicure",
    ativo: true,
    valor_hora: 3000, // R$ 30/hora
    pontos_total: 450,
    nivel: 1,
    streak_dias: 1,
    badges: [],
    ultima_atividade: null,
  },
];

export const MOCK_SERVICOS: Servico[] = [
  {
    id: "serv-1", salao_id: "salao-1", nome: "Corte Feminino",
    preco_ideal: 8000, custo_estimado: 1500, duracao_minutos: 45,
    categoria: "cabelo", ativo: true,
    custo_mao_obra: 3750, custo_produtos: 200, margem_desejada: 100,
  },
  {
    id: "serv-2", salao_id: "salao-1", nome: "Corte Masculino",
    preco_ideal: 5000, custo_estimado: 800, duracao_minutos: 30,
    categoria: "barba", ativo: true,
    custo_mao_obra: 2000, custo_produtos: 100, margem_desejada: 100,
  },
  {
    id: "serv-3", salao_id: "salao-1", nome: "Escova Progressiva",
    preco_ideal: 25000, custo_estimado: 8000, duracao_minutos: 120,
    categoria: "cabelo", ativo: true,
    custo_mao_obra: 10000, custo_produtos: 5000, margem_desejada: 67,
  },
  {
    id: "serv-4", salao_id: "salao-1", nome: "Manicure + Pedicure",
    preco_ideal: 7000, custo_estimado: 1200, duracao_minutos: 60,
    categoria: "unhas", ativo: true,
    custo_mao_obra: 3000, custo_produtos: 400, margem_desejada: 106,
  },
  {
    id: "serv-5", salao_id: "salao-1", nome: "Barba Completa",
    preco_ideal: 4500, custo_estimado: 600, duracao_minutos: 30,
    categoria: "barba", ativo: true,
    custo_mao_obra: 2000, custo_produtos: 150, margem_desejada: 109,
  },
  {
    id: "serv-6", salao_id: "salao-1", nome: "Coloração",
    preco_ideal: 15000, custo_estimado: 5000, duracao_minutos: 90,
    categoria: "cabelo", ativo: true,
    custo_mao_obra: 7500, custo_produtos: 3500, margem_desejada: 36,
  },
];

export const MOCK_CLIENTES: Cliente[] = [
  {
    id: "cli-1", salao_id: "salao-1", nome: "Maria Eduarda",
    telefone: "11999887766", email: "maria@email.com", segmento: "fiel",
    total_gasto: 120000, ultima_visita: hoje, total_visitas: 15,
  },
  {
    id: "cli-2", salao_id: "salao-1", nome: "João Pedro",
    telefone: "11988776655", segmento: "regular",
    total_gasto: 35000, ultima_visita: hoje, total_visitas: 5,
  },
  {
    id: "cli-3", salao_id: "salao-1", nome: "Fernanda Costa",
    telefone: "11977665544", segmento: "nova",
    total_gasto: 8000, ultima_visita: null, total_visitas: 1,
  },
  {
    id: "cli-4", salao_id: "salao-1", nome: "Lucas Martins",
    telefone: "11966554433", segmento: "regular",
    total_gasto: 22000, ultima_visita: hoje, total_visitas: 4,
  },
  {
    id: "cli-5", salao_id: "salao-1", nome: "Patricia Lima",
    telefone: "11955443322", segmento: "fiel",
    total_gasto: 95000, ultima_visita: hoje, total_visitas: 12,
  },
];

export const MOCK_AGENDAMENTOS: Agendamento[] = [
  {
    id: "ag-1", salao_id: "salao-1", cliente_id: "cli-1",
    profissional_id: "prof-1", servico_id: "serv-1",
    data_hora: `${hoje}T08:30:00`, duracao_minutos: 45,
    status: "confirmado", valor: 8000, criado_via_caixa: false,
    created_at: hoje,
    cliente: MOCK_CLIENTES[0], profissional: MOCK_PROFISSIONAIS[0], servico: MOCK_SERVICOS[0],
  },
  {
    id: "ag-2", salao_id: "salao-1", cliente_id: "cli-2",
    profissional_id: "prof-2", servico_id: "serv-2",
    data_hora: `${hoje}T09:00:00`, duracao_minutos: 30,
    status: "agendado", valor: 5000, criado_via_caixa: false,
    created_at: hoje,
    cliente: MOCK_CLIENTES[1], profissional: MOCK_PROFISSIONAIS[1], servico: MOCK_SERVICOS[1],
  },
  {
    id: "ag-3", salao_id: "salao-1", cliente_id: "cli-3",
    profissional_id: "prof-1", servico_id: "serv-3",
    data_hora: `${hoje}T10:00:00`, duracao_minutos: 120,
    status: "agendado", valor: 25000, criado_via_caixa: false,
    created_at: hoje,
    cliente: MOCK_CLIENTES[2], profissional: MOCK_PROFISSIONAIS[0], servico: MOCK_SERVICOS[2],
  },
  {
    id: "ag-4", salao_id: "salao-1", cliente_id: "cli-4",
    profissional_id: "prof-2", servico_id: "serv-5",
    data_hora: `${hoje}T10:30:00`, duracao_minutos: 30,
    status: "confirmado", valor: 4500, criado_via_caixa: false,
    created_at: hoje,
    cliente: MOCK_CLIENTES[3], profissional: MOCK_PROFISSIONAIS[1], servico: MOCK_SERVICOS[4],
  },
  {
    id: "ag-5", salao_id: "salao-1", cliente_id: "cli-5",
    profissional_id: "prof-3", servico_id: "serv-4",
    data_hora: `${hoje}T14:00:00`, duracao_minutos: 60,
    status: "realizado", valor: 7000, forma_pagamento: "pix",
    criado_via_caixa: false, created_at: hoje,
    cliente: MOCK_CLIENTES[4], profissional: MOCK_PROFISSIONAIS[2], servico: MOCK_SERVICOS[3],
  },
  {
    id: "ag-6", salao_id: "salao-1", cliente_id: "cli-1",
    profissional_id: "prof-1", servico_id: "serv-6",
    data_hora: `${hoje}T15:00:00`, duracao_minutos: 90,
    status: "agendado", valor: 15000, criado_via_caixa: false,
    created_at: hoje,
    cliente: MOCK_CLIENTES[0], profissional: MOCK_PROFISSIONAIS[0], servico: MOCK_SERVICOS[5],
  },
];

export const MOCK_LANCAMENTOS: LancamentoCaixa[] = [
  {
    id: "lc-1", salao_id: "salao-1", agendamento_id: "ag-5",
    data: hoje, cliente_nome: "Patricia Lima",
    servico_id: "serv-4", profissional_id: "prof-3",
    valor: 7000, forma_pagamento: "pix", tipo: "servico",
    created_at: `${hoje}T14:30:00`,
  },
];

// Helpers
export function findCliente(id: string) {
  return MOCK_CLIENTES.find((c) => c.id === id);
}

export function findProfissional(id: string) {
  return MOCK_PROFISSIONAIS.find((p) => p.id === id);
}

export function findServico(id: string) {
  return MOCK_SERVICOS.find((s) => s.id === id);
}
