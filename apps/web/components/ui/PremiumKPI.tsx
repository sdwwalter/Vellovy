// components/ui/PremiumKPI.tsx
"use client";

import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PremiumKPIProps {
  label: string;
  value: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  icon?: React.ReactNode;
  className?: string;
}

/**
 * PremiumKPI — Card de métrica com trend indicator.
 * Usado no Dashboard e no Financeiro.
 */
export function PremiumKPI({
  label,
  value,
  trend,
  icon,
  className,
}: PremiumKPIProps) {
  const trendIcons = {
    up: <TrendingUp size={14} />,
    down: <TrendingDown size={14} />,
    neutral: <Minus size={14} />,
  };

  const trendColors = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-neutral-500 bg-neutral-100",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-neutral-200/60 p-5 transition-all duration-200 hover:shadow-premium",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span className="text-primary-300">{icon}</span>
        )}
      </div>

      <p className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-1">
        {value}
      </p>

      {trend && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            trendColors[trend.direction]
          )}
        >
          {trendIcons[trend.direction]}
          {trend.value}
        </span>
      )}
    </div>
  );
}
