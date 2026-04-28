// packages/shared/lib/segmentacao.ts
// Cálculo de segmento de cliente conforme regra de negócio SCLC-G
import type { SegmentoCliente } from '../types';

/**
 * Calcula o segmento do cliente baseado em:
 * - total_visitas: número de visitas totais
 * - ultima_visita: ISO string da última visita (ou null)
 *
 * Regras:
 *  0 visitas            → "nova"
 *  1-2 visitas          → "regular"
 *  3+ visitas           → "fiel"
 *  30-90 dias sem visita → "ausente"
 *  90+ dias sem visita  → "inativa"
 */
export function calcularSegmento(
  totalVisitas: number,
  ultimaVisita: string | null
): SegmentoCliente {
  if (totalVisitas === 0) return 'nova';

  if (ultimaVisita) {
    const diffDias = Math.floor(
      (Date.now() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDias > 90) return 'inativa';
    if (diffDias > 30) return 'ausente';
  }

  if (totalVisitas >= 3) return 'fiel';
  return 'regular';
}

/**
 * Retorna quantos dias se passaram desde a última visita.
 * Se não houver data, retorna -1.
 */
export function diasSemVisita(ultimaVisita: string | null): number {
  if (!ultimaVisita) return -1;
  return Math.floor(
    (Date.now() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Verifica se a data de nascimento corresponde a hoje (aniversário).
 */
export function isAniversarioHoje(dataNascimento: string | null | undefined): boolean {
  if (!dataNascimento) return false;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  return hoje.getMonth() === nasc.getMonth() && hoje.getDate() === nasc.getDate();
}

/**
 * Verifica se o aniversário está dentro dos próximos N dias.
 */
export function aniversarioEm(dataNascimento: string | null | undefined, dias: number): boolean {
  if (!dataNascimento) return false;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  // Ajustar para o ano corrente
  nasc.setFullYear(hoje.getFullYear());
  // Se já passou, verificar no próximo ano
  if (nasc < hoje) nasc.setFullYear(hoje.getFullYear() + 1);

  const diff = Math.floor((nasc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= dias;
}
