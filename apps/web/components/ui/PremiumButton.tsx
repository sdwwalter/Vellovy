// components/ui/PremiumButton.tsx
"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "rose";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * PremiumButton — Botão padrão do Design System Vellovy.
 * Plum + Rose palette. WCAG 2.1 AA compliant.
 */
export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

    const variants: Record<string, string> = {
      primary:
        "bg-primary-400 text-white hover:bg-primary-500 focus-visible:ring-primary-400 shadow-sm hover:shadow-md",
      secondary:
        "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus-visible:ring-neutral-400 border border-neutral-200",
      ghost:
        "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:ring-neutral-400",
      danger:
        "bg-error text-white hover:bg-red-600 focus-visible:ring-error",
      rose:
        "bg-rose-400 text-white hover:bg-rose-500 focus-visible:ring-rose-400 shadow-sm hover:shadow-md",
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-sm min-w-[32px]",
      md: "h-10 px-4 text-sm min-w-[40px]",
      lg: "h-12 px-6 text-base min-w-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
