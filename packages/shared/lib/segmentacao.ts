import type { Cliente, SegmentoCliente } from '../types';

// ============================================================
// SEGMENTAÇÃO DE CLIENTES — @vellovy/shared/lib/segmentacao
// ============================================================

/**
 * Retorna quantos dias se passaram desde a última visita do cliente.
 * Retorna null se nunca visitou.
 */
export function diasSemVisita(cliente: Cliente): number | null {
  if (!cliente.ultima_visita) return null;
  const ultima = new Date(cliente.ultima_visita);
  const hoje = new Date();
  const diff = hoje.getTime() - ultima.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se hoje é o aniversário do cliente.
 */
export function isAniversarioHoje(cliente: Cliente): boolean {
  if (!cliente.data_nascimento) return false;
  const nascimento = new Date(cliente.data_nascimento);
  const hoje = new Date();
  return (
    nascimento.getMonth() === hoje.getMonth() &&
    nascimento.getDate() === hoje.getDate()
  );
}

/**
 * Retorna quantos dias faltam para o aniversário do cliente.
 * Retorna null se não tem data cadastrada.
 */
export function aniversarioEm(cliente: Cliente): number | null {
  if (!cliente.data_nascimento) return null;

  const nascimento = new Date(cliente.data_nascimento);
  const hoje = new Date();
  const proximoAniversario = new Date(
    hoje.getFullYear(),
    nascimento.getMonth(),
    nascimento.getDate()
  );

  // Se já passou este ano, calcular para o próximo
  if (proximoAniversario < hoje) {
    proximoAniversario.setFullYear(hoje.getFullYear() + 1);
  }

  const diff = proximoAniversario.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula o segmento do cliente baseado em comportamento.
 *
 * Regras:
 * - VIP:      total_gasto > R$500 E ultima_visita ≤ 60 dias
 * - Fiel:     total_visitas ≥ 5 E ultima_visita ≤ 60 dias
 * - Regular:  ultima_visita ≤ 90 dias
 * - Em risco: ultima_visita entre 91–180 dias
 * - Inativo:  ultima_visita > 180 dias
 * - Novo:     total_visitas ≤ 1
 */
export function calcularSegmento(cliente: Cliente): SegmentoCliente {
  const dias = diasSemVisita(cliente);

  // Nunca visitou ou só veio uma vez
  if (cliente.total_visitas <= 1) return 'novo';

  // Sem registro de visita
  if (dias === null) return 'novo';

  // Inativo: mais de 6 meses sem aparecer
  if (dias > 180) return 'inativo';

  // Em risco: entre 3 e 6 meses
  if (dias > 90) return 'em_risco';

  // VIP: alto gasto e recente (total_gasto em centavos, 50000 = R$500)
  if (cliente.total_gasto >= 50000 && dias <= 60) return 'vip';

  // Fiel: muitas visitas e recente
  if (cliente.total_visitas >= 5 && dias <= 60) return 'fiel';

  // Regular: visita nos últimos 90 dias
  return 'regular';
}
