// lib/mock-clientes.ts
// Mock data expandido para CRM — clientes realistas com segmentos variados
import type { Cliente, Agendamento } from "@vellovy/shared/types";

const d = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

export const MOCK_CRM_CLIENTES: Cliente[] = [
  // ─── Fiéis ────────────────────────────────────────────────────
  {
    id: "cli-1", salao_id: "salao-1", nome: "Maria Eduarda Santos",
    telefone: "11999887766", email: "maria.edu@email.com",
    data_nascimento: "1992-07-15", segmento: "fiel",
    total_gasto: 248000, ultima_visita: d(3), total_visitas: 32,
    observacoes: "Prefere horários pela manhã. Alergia a amônia.",
  },
  {
    id: "cli-5", salao_id: "salao-1", nome: "Patricia Lima Ferreira",
    telefone: "11955443322", email: "patricia.lf@gmail.com",
    data_nascimento: "1988-12-01", segmento: "fiel",
    total_gasto: 195000, ultima_visita: d(1), total_visitas: 25,
    observacoes: "Cliente VIP. Sempre pede café.",
  },
  {
    id: "cli-8", salao_id: "salao-1", nome: "Amanda Ribeiro Costa",
    telefone: "11944332211", email: "amanda.rc@outlook.com",
    data_nascimento: "1995-03-22", segmento: "fiel",
    total_gasto: 167500, ultima_visita: d(5), total_visitas: 18,
  },
  {
    id: "cli-12", salao_id: "salao-1", nome: "Camila Pereira",
    telefone: "11933221100", email: "",
    data_nascimento: "1990-09-10", segmento: "fiel",
    total_gasto: 134000, ultima_visita: d(7), total_visitas: 15,
    observacoes: "Corte e coloração todo mês.",
  },
  // ─── Regulares ────────────────────────────────────────────────
  {
    id: "cli-2", salao_id: "salao-1", nome: "João Pedro Almeida",
    telefone: "11988776655", segmento: "regular",
    total_gasto: 45000, ultima_visita: d(12), total_visitas: 7,
  },
  {
    id: "cli-4", salao_id: "salao-1", nome: "Lucas Martins Silva",
    telefone: "11966554433", email: "lucas.ms@email.com",
    data_nascimento: "1998-04-23", segmento: "regular",
    total_gasto: 32000, ultima_visita: d(8), total_visitas: 5,
  },
  {
    id: "cli-9", salao_id: "salao-1", nome: "Bruna Oliveira",
    telefone: "11922110099", segmento: "regular",
    total_gasto: 28000, ultima_visita: d(15), total_visitas: 4,
  },
  {
    id: "cli-10", salao_id: "salao-1", nome: "Rafael Souza",
    telefone: "11911009988", data_nascimento: "2001-01-30", segmento: "regular",
    total_gasto: 22500, ultima_visita: d(20), total_visitas: 3,
  },
  // ─── Novas ────────────────────────────────────────────────────
  {
    id: "cli-3", salao_id: "salao-1", nome: "Fernanda Costa Lima",
    telefone: "11977665544", segmento: "nova",
    total_gasto: 8000, ultima_visita: null, total_visitas: 1,
    observacoes: "Veio por indicação da Maria Eduarda.",
  },
  {
    id: "cli-11", salao_id: "salao-1", nome: "Isabela Nakamura",
    telefone: "11900998877", email: "isa.naka@gmail.com", segmento: "nova",
    total_gasto: 0, ultima_visita: null, total_visitas: 0,
  },
  // ─── Ausentes ─────────────────────────────────────────────────
  {
    id: "cli-6", salao_id: "salao-1", nome: "Carla Dias Mendonça",
    telefone: "11944556677", email: "carla.dm@email.com",
    data_nascimento: "1985-06-08", segmento: "ausente",
    total_gasto: 89000, ultima_visita: d(52), total_visitas: 11,
    observacoes: "Era fiel, parou de vir. Enviar mensagem.",
  },
  {
    id: "cli-13", salao_id: "salao-1", nome: "Roberta Gomes",
    telefone: "11955667788", segmento: "ausente",
    total_gasto: 42000, ultima_visita: d(60), total_visitas: 6,
  },
  // ─── Inativas ─────────────────────────────────────────────────
  {
    id: "cli-7", salao_id: "salao-1", nome: "Daniela Fonseca",
    telefone: "11933445566", segmento: "inativa",
    total_gasto: 35000, ultima_visita: d(120), total_visitas: 4,
  },
  {
    id: "cli-14", salao_id: "salao-1", nome: "Mariana Teixeira",
    telefone: "11977889900", segmento: "inativa",
    total_gasto: 15000, ultima_visita: d(150), total_visitas: 2,
  },
];

// Histórico de agendamentos simulado por cliente
export const MOCK_HISTORICO: Record<string, Array<{
  data: string; servico: string; profissional: string;
  valor: number; status: string;
}>> = {
  "cli-1": [
    { data: d(3), servico: "Corte Feminino", profissional: "Ana Silva", valor: 8000, status: "realizado" },
    { data: d(33), servico: "Coloração", profissional: "Ana Silva", valor: 15000, status: "realizado" },
    { data: d(63), servico: "Corte Feminino", profissional: "Ana Silva", valor: 8000, status: "realizado" },
    { data: d(93), servico: "Escova Progressiva", profissional: "Ana Silva", valor: 25000, status: "realizado" },
    { data: d(120), servico: "Corte Feminino", profissional: "Ana Silva", valor: 7500, status: "realizado" },
  ],
  "cli-5": [
    { data: d(1), servico: "Manicure + Pedicure", profissional: "Beatriz Oliveira", valor: 7000, status: "realizado" },
    { data: d(15), servico: "Corte Feminino", profissional: "Ana Silva", valor: 8000, status: "realizado" },
    { data: d(45), servico: "Coloração", profissional: "Ana Silva", valor: 15000, status: "realizado" },
    { data: d(75), servico: "Manicure + Pedicure", profissional: "Beatriz Oliveira", valor: 7000, status: "realizado" },
  ],
  "cli-6": [
    { data: d(52), servico: "Corte Feminino", profissional: "Ana Silva", valor: 8000, status: "realizado" },
    { data: d(82), servico: "Coloração", profissional: "Ana Silva", valor: 15000, status: "realizado" },
    { data: d(112), servico: "Escova Progressiva", profissional: "Ana Silva", valor: 25000, status: "realizado" },
  ],
};
