// components/ui/PremiumBadge.tsx
import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "agendado"
  | "confirmado"
  | "realizado"
  | "cancelado"
  | "no_show"
  | "nova"
  | "regular"
  | "fiel"
  | "ausente"
  | "inativa"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "plum"
  | "rose";

interface PremiumBadgeProps {
  variant?: BadgeVariant;
  label: string;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Status agendamento
  agendado:   "bg-neutral-100 text-neutral-600 border-neutral-200",
  confirmado: "bg-primary-50 text-primary-700 border-primary-200",
  realizado:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelado:  "bg-neutral-100 text-neutral-400 border-neutral-200 line-through",
  no_show:    "bg-red-50 text-red-600 border-red-200",
  // Segmento cliente
  nova:     "bg-blue-50 text-blue-600 border-blue-200",
  regular:  "bg-neutral-100 text-neutral-600 border-neutral-200",
  fiel:     "bg-amber-50 text-amber-700 border-amber-200",
  ausente:  "bg-orange-50 text-orange-600 border-orange-200",
  inativa:  "bg-neutral-100 text-neutral-400 border-neutral-200",
  // Genéricos
  success:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning:  "bg-amber-50 text-amber-700 border-amber-200",
  error:    "bg-red-50 text-red-600 border-red-200",
  info:     "bg-blue-50 text-blue-600 border-blue-200",
  neutral:  "bg-neutral-100 text-neutral-600 border-neutral-200",
  plum:     "bg-primary-50 text-primary-700 border-primary-200",
  rose:     "bg-rose-50 text-rose-600 border-rose-200",
};

const dotColors: Record<BadgeVariant, string> = {
  agendado: "bg-neutral-400", confirmado: "bg-primary-400", realizado: "bg-emerald-500",
  cancelado: "bg-neutral-300", no_show: "bg-red-500",
  nova: "bg-blue-500", regular: "bg-neutral-400", fiel: "bg-amber-500",
  ausente: "bg-orange-500", inativa: "bg-neutral-300",
  success: "bg-emerald-500", warning: "bg-amber-500", error: "bg-red-500",
  info: "bg-blue-500", neutral: "bg-neutral-400", plum: "bg-primary-400", rose: "bg-rose-400",
};

/**
 * PremiumBadge — Badge de status colorido.
 * Mapeia direto com StatusAgendamento e SegmentoCliente.
 */
export function PremiumBadge({
  variant = "neutral",
  label,
  size = "sm",
  dot = false,
  className,
}: PremiumBadgeProps) {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        variantStyles[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
      )}
      {label}
    </span>
  );
}
