// packages/shared/lib/precificacao.ts
// Motor de precificação inteligente para serviços de salão
import type { ProdutoUsado } from "../types";

/**
 * Calcula custo por grama de um produto.
 * preco_compra (centavos) / peso_gramas = custo_grama (centavos/grama)
 */
export function calcularCustoGrama(precoCompra: number, pesoGramas: number): number {
  if (pesoGramas <= 0) return 0;
  return Math.ceil(precoCompra / pesoGramas);
}

/**
 * Calcula custo de mão de obra do serviço.
 * (duração em minutos / 60) * valor_hora do profissional
 */
export function calcularCustoMaoObra(duracaoMinutos: number, valorHora: number): number {
  return Math.round((duracaoMinutos / 60) * valorHora);
}

/**
 * Calcula custo total dos produtos usados em um serviço.
 * Soma (gramas * custo_grama) de cada produto
 */
export function calcularCustoProdutos(produtosUsados: ProdutoUsado[]): number {
  return produtosUsados.reduce((total, p) => total + Math.round(p.gramas * (p.produto?.custo_grama ?? 0)), 0);
}

/**
 * Calcula o custo total do serviço (mão de obra + produtos).
 */
export function calcularCustoTotal(custoMaoObra: number, custoProdutos: number): number {
  return custoMaoObra + custoProdutos;
}

/**
 * Calcula preço ideal com base no custo total + margem desejada.
 * precoIdeal = custoTotal * (1 + margem/100)
 * Ex: custo R$ 50 + margem 100% = R$ 100
 */
export function calcularPrecoIdeal(custoTotal: number, margemDesejada: number): number {
  return Math.round(custoTotal * (1 + margemDesejada / 100));
}

/**
 * Calcula a margem real dado preço e custo.
 * margem = ((preco - custo) / custo) * 100
 */
export function calcularMargemReal(preco: number, custo: number): number {
  if (custo <= 0) return preco > 0 ? 999 : 0;
  return Math.round(((preco - custo) / custo) * 100);
}

/**
 * Precificação completa de um serviço.
 * Recebe inputs do formulário e retorna todos os valores calculados.
 */
export function precificarServico(params: {
  duracaoMinutos: number;
  valorHoraProfissional: number;
  produtosUsados: ProdutoUsado[];
  margemDesejada: number;
}) {
  const custoMaoObra = calcularCustoMaoObra(params.duracaoMinutos, params.valorHoraProfissional);
  const custoProdutos = calcularCustoProdutos(params.produtosUsados);
  const custoTotal = calcularCustoTotal(custoMaoObra, custoProdutos);
  const precoIdeal = calcularPrecoIdeal(custoTotal, params.margemDesejada);

  return {
    custoMaoObra,
    custoProdutos,
    custoTotal,
    precoIdeal,
    margemReal: calcularMargemReal(precoIdeal, custoTotal),
  };
}
