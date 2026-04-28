// components/ui/PremiumCard.tsx
"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "soft" | "outlined" | "elevated";
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * PremiumCard — Card base do Design System Vellovy.
 * Sombra premium plum, variantes para diferentes contextos.
 */
export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      variant = "default",
      hoverable = false,
      padding = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const base = "rounded-xl transition-all duration-200";

    const variants: Record<string, string> = {
      default: "bg-white shadow-sm border border-neutral-200/60",
      soft: "bg-surface-soft border border-primary-100/40",
      outlined: "bg-white border-2 border-neutral-200",
      elevated: "bg-white shadow-premium",
    };

    const paddings: Record<string, string> = {
      none: "",
      sm: "p-3",
      md: "p-5",
      lg: "p-6",
    };

    const hover = hoverable
      ? "hover:shadow-premium hover:-translate-y-0.5 cursor-pointer"
      : "";

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], paddings[padding], hover, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";
