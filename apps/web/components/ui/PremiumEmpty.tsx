// components/ui/PremiumEmpty.tsx
import { cn } from "@/lib/utils/cn";
import { PremiumButton } from "./PremiumButton";

interface PremiumEmptyProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * PremiumEmpty — Estado vazio com ícone, mensagem e CTA.
 * SCLC-G: todo CRUD precisa de empty state.
 */
export function PremiumEmpty({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: PremiumEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center animate-in",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-400 mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-text-primary mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-text-secondary max-w-xs mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <PremiumButton onClick={onAction} size="md">
          {actionLabel}
        </PremiumButton>
      )}
    </div>
  );
}
