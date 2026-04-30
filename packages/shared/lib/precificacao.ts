import type { ProdutoUsado } from '../types';

// ============================================================
// PRECIFICAÇÃO — @vellovy/shared/lib/precificacao
// ============================================================

/**
 * Calcula o custo de mão de obra baseado na comissão do profissional.
 * @param precoServico  Preço do serviço em centavos
 * @param comissaoPercentual  Ex: 40 para 40%
 */
export function calcularCustoMaoObra(
  precoServico: number,
  comissaoPercentual: number
): number {
  return Math.round((precoServico * comissaoPercentual) / 100);
}

/**
 * Calcula o custo total de produtos usados em um serviço.
 * @param produtos Lista de produtos com custo e quantidade
 */
export function calcularCustoProdutos(produtos: ProdutoUsado[]): number {
  return produtos.reduce(
    (total, p) => total + Math.round(p.custo * p.quantidade),
    0
  );
}

/**
 * Calcula o custo total do serviço (mão de obra + produtos).
 */
export function calcularCustoTotal(
  precoServico: number,
  comissaoPercentual: number,
  produtos: ProdutoUsado[] = []
): number {
  const maoObra = calcularCustoMaoObra(precoServico, comissaoPercentual);
  const produtosCusto = calcularCustoProdutos(produtos);
  return maoObra + produtosCusto;
}

/**
 * Calcula a margem real do serviço em percentual.
 * @returns Percentual de 0–100, pode ser negativo se prejuízo
 */
export function calcularMargemReal(
  precoServico: number,
  custoTotal: number
): number {
  if (precoServico === 0) return 0;
  return Math.round(((precoServico - custoTotal) / precoServico) * 100);
}

/**
 * Sugere um preço ideal para atingir a margem desejada.
 * @param custoTotal     Custo total em centavos
 * @param margemDesejada Margem desejada em percentual (ex: 40)
 */
export function calcularPrecoIdeal(
  custoTotal: number,
  margemDesejada: number
): number {
  if (margemDesejada >= 100) return custoTotal * 10; // salvaguarda
  return Math.round(custoTotal / (1 - margemDesejada / 100));
}
