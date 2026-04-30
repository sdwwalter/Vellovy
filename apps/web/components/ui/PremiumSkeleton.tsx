// components/ui/PremiumSkeleton.tsx
import { cn } from "@/lib/utils/cn";

interface PremiumSkeletonProps {
  rows?: number;
  variant?: "card" | "list" | "text" | "kpi";
  className?: string;
}

/**
 * PremiumSkeleton — Loading state shimmer.
 * Usa a animação shimmer definida em globals.css.
 */
export function PremiumSkeleton({
  rows = 3,
  variant = "list",
  className,
}: PremiumSkeletonProps) {
  if (variant === "kpi") {
    return (
      <div className={cn("grid grid-cols-2 desktop:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200/60 p-5">
            <div className="shimmer h-3 w-20 rounded mb-3" />
            <div className="shimmer h-8 w-28 rounded mb-2" />
            <div className="shimmer h-2.5 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200/60 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="shimmer h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-4 w-32 rounded" />
                <div className="shimmer h-3 w-24 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="shimmer h-3 w-full rounded" />
              <div className="shimmer h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-4 rounded"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    );
  }

  // Default: list variant
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white rounded-xl border border-neutral-200/60 p-4"
        >
          <div className="shimmer h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-4 w-36 rounded" />
            <div className="shimmer h-3 w-24 rounded" />
          </div>
          <div className="shimmer h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
