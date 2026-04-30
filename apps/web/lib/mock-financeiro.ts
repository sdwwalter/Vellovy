// lib/mock-financeiro.ts
// Mock data financeiro — receitas via caixa + despesas + repasses + 12 meses
import type { Despesa, Repasse, LancamentoCaixa, ResumoMensal, CategoriaDespesa } from "@vellovy/shared/types";
import { MOCK_PROFISSIONAIS } from "./mock-data";

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const mesAnterior = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ─── Despesas fixas do mês atual ────────────────────────────────
export const MOCK_DESPESAS: Despesa[] = [
  { id: "desp-1", salao_id: "salao-1", descricao: "Aluguel do imóvel", valor: 350000, categoria: "aluguel", mes_ano: mesAtual(), data_vencimento: `${mesAtual()}-10`, pago: true, recorrente: true },
  { id: "desp-2", salao_id: "salao-1", descricao: "Energia elétrica", valor: 48000, categoria: "agua_luz", mes_ano: mesAtual(), data_vencimento: `${mesAtual()}-15`, pago: true, recorrente: true },
  { id: "desp-3", salao_id: "salao-1", descricao: "Água e esgoto", valor: 12000, categoria: "agua_luz", mes_ano: mesAtual(), data_vencimento: `${mesAtual()}-20`, pago: false, recorrente: true },
  { id: "desp-4", salao_id: "salao-1", descricao: "Produtos (tintas, shampoo)", valor: 85000, categoria: "produtos", mes_ano: mesAtual(), pago: true, recorrente: false },
  { id: "desp-5", salao_id: "salao-1", descricao: "Internet + telefone", valor: 18000, categoria: "outros", mes_ano: mesAtual(), data_vencimento: `${mesAtual()}-05`, pago: true, recorrente: true },
  { id: "desp-6", salao_id: "salao-1", descricao: "DAS Simples Nacional", valor: 65000, categoria: "impostos", mes_ano: mesAtual(), data_vencimento: `${mesAtual()}-20`, pago: false, recorrente: true },
  { id: "desp-7", salao_id: "salao-1", descricao: "Instagram Ads", valor: 30000, categoria: "marketing", mes_ano: mesAtual(), pago: true, recorrente: true },
  { id: "desp-8", salao_id: "salao-1", descricao: "Manutenção secadores", valor: 22000, categoria: "manutencao", mes_ano: mesAtual(), pago: false, recorrente: false },
];

// ─── Repasses do mês ────────────────────────────────────────────
export const MOCK_REPASSES: Repasse[] = [
  { id: "rep-1", salao_id: "salao-1", profissional_id: "prof-1", profissional: MOCK_PROFISSIONAIS[0], mes_ano: mesAtual(), valor_total: 480000, percentual: 40, valor_repasse: 192000, pago: false },
  { id: "rep-2", salao_id: "salao-1", profissional_id: "prof-2", profissional: MOCK_PROFISSIONAIS[1], mes_ano: mesAtual(), valor_total: 220000, percentual: 35, valor_repasse: 77000, pago: true },
  { id: "rep-3", salao_id: "salao-1", profissional_id: "prof-3", profissional: MOCK_PROFISSIONAIS[2], mes_ano: mesAtual(), valor_total: 140000, percentual: 30, valor_repasse: 42000, pago: false },
];

// ─── Receitas simuladas para 12 meses ────────────────────────────
export const MOCK_RECEITAS_12_MESES: Array<{
  mes_ano: string;
  receita_servicos: number;
  receita_produtos: number;
  despesas: number;
  repasses: number;
  atendimentos: number;
}> = Array.from({ length: 12 }, (_, i) => {
  const offset = 11 - i;
  const base = 600000 + Math.round(Math.random() * 300000);
  const produtos = Math.round(base * 0.12);
  const despesas = 400000 + Math.round(Math.random() * 200000);
  const repasses = Math.round((base + produtos) * 0.35);
  return {
    mes_ano: mesAnterior(offset),
    receita_servicos: base,
    receita_produtos: produtos,
    despesas,
    repasses,
    atendimentos: 50 + Math.round(Math.random() * 40),
  };
});

// ─── Receitas do mês atual consolidadas ─────────────────────────
// Simulam o que viria de lancamentos_caixa agrupados por forma
export const MOCK_RECEITAS_MES: {
  porForma: Record<string, number>;
  porTipo: { servico: number; produto: number };
  porProfissional: Array<{ nome: string; valor: number; atendimentos: number }>;
  porServico: Array<{ nome: string; valor: number; count: number; custo: number }>;
} = {
  porForma: {
    pix: 320000,
    dinheiro: 180000,
    credito: 150000,
    debito: 120000,
    outro: 30000,
  },
  porTipo: {
    servico: 700000,
    produto: 100000,
  },
  porProfissional: [
    { nome: "Ana Silva", valor: 480000, atendimentos: 38 },
    { nome: "Carlos Mendes", valor: 220000, atendimentos: 22 },
    { nome: "Beatriz Oliveira", valor: 140000, atendimentos: 18 },
  ],
  porServico: [
    { nome: "Corte Feminino", valor: 240000, count: 30, custo: 45000 },
    { nome: "Escova Progressiva", valor: 175000, count: 7, custo: 56000 },
    { nome: "Coloração", valor: 150000, count: 10, custo: 50000 },
    { nome: "Manicure + Pedicure", valor: 98000, count: 14, custo: 16800 },
    { nome: "Corte Masculino", valor: 75000, count: 15, custo: 12000 },
    { nome: "Barba Completa", valor: 62000, count: 13, custo: 7800 },
  ],
};

export function calcularDRE(mesAno: string): ResumoMensal {
  const totalDespesas = MOCK_DESPESAS
    .filter((d) => d.mes_ano === mesAno)
    .reduce((s, d) => s + d.valor, 0);
  const totalRepasses = MOCK_REPASSES
    .filter((r) => r.mes_ano === mesAno)
    .reduce((s, r) => s + r.valor_repasse, 0);
  const receitaServicos = MOCK_RECEITAS_MES.porTipo.servico;
  const receitaProdutos = MOCK_RECEITAS_MES.porTipo.produto;
  const receitaTotal = receitaServicos + receitaProdutos;
  const lucroBruto = receitaTotal - totalDespesas;
  const lucroLiquido = lucroBruto - totalRepasses;
  const totalAtend = MOCK_RECEITAS_MES.porProfissional.reduce((s, p) => s + p.atendimentos, 0);

  return {
    mes_ano: mesAno,
    receita_servicos: receitaServicos,
    receita_produtos: receitaProdutos,
    receita_total: receitaTotal,
    despesas_fixas: totalDespesas,
    despesas_variaveis: 0,
    despesas_total: totalDespesas,
    repasses_total: totalRepasses,
    lucro_bruto: lucroBruto,
    lucro_liquido: lucroLiquido,
    margem_lucro: receitaTotal > 0 ? Math.round((lucroLiquido / receitaTotal) * 100) : 0,
    ticket_medio: totalAtend > 0 ? Math.round(receitaTotal / totalAtend) : 0,
    total_atendimentos: totalAtend,
  };
}
