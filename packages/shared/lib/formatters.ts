// packages/shared/lib/formatters.ts
// Formatadores BR — usados tanto no web quanto no futuro app nativo

/**
 * Formata centavos para BRL.
 * 10000 → "R$ 100,00"
 */
export function fmtBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

/**
 * Formata data ISO para exibição BR.
 * "2026-04-23" → "23/04/2026"
 */
export function fmtData(iso: string): string {
  const [ano, mes, dia] = iso.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora de ISO datetime.
 * "2026-04-23T14:30:00" → "14:30"
 */
export function fmtHora(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata telefone BR.
 * "11999887766" → "(11) 99988-7766"
 */
export function fmtTelefone(tel: string): string {
  const clean = tel.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return tel;
}

/**
 * Formata duração em minutos para texto legível.
 * 90 → "1h30"
 * 60 → "1h"
 * 30 → "30min"
 */
export function fmtDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD.
 */
export function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retorna o mês/ano atual no formato "2026-04".
 */
export function mesAnoAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}
