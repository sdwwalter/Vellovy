// ============================================================
// FORMATADORES — @vellovy/shared/lib/formatters
// ============================================================

/**
 * Formata valor em centavos para moeda BRL.
 * Ex: 9900 → "R$ 99,00"
 */
export function fmtBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

/**
 * Formata string ISO 8601 para hora no formato HH:mm.
 * Ex: "2024-05-15T14:30:00" → "14:30"
 */
export function fmtHora(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

/**
 * Formata string ISO ou 'YYYY-MM-DD' para data no formato DD/MM/YYYY.
 * Ex: "2024-05-15" → "15/05/2024"
 */
export function fmtData(dateString: string): string {
  try {
    // Força parsing como data local para evitar UTC offset
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

/**
 * Formata data para exibição curta: "15 mai."
 */
export function fmtDataCurta(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formata número de telefone brasileiro.
 * Ex: "11987654321" → "(11) 98765-4321"
 */
export function fmtTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return tel;
}

/**
 * Formata duração em minutos para texto legível.
 * Ex: 90 → "1h 30min" | 45 → "45min"
 */
export function fmtDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Formata percentual.
 * Ex: 0.15 → "15%" | 30 → "30%"
 */
export function fmtPercent(value: number, isDecimal = false): string {
  const v = isDecimal ? value * 100 : value;
  return `${v.toFixed(0)}%`;
}

/**
 * Retorna saudação baseada no horário.
 */
export function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}
