// components/ui/PremiumInput.tsx
"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

/**
 * PremiumInput — Input padrão com label, ícone e erro inline.
 * Acessível: htmlFor + id, aria-describedby, aria-invalid.
 */
export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, error, hint, leftIcon, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn(
              "w-full h-10 px-3 rounded-lg border text-sm text-text-primary bg-white",
              "placeholder:text-neutral-400",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400",
              "disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed",
              error
                ? "border-error ring-1 ring-error/20"
                : "border-neutral-200 hover:border-neutral-300",
              leftIcon ? "pl-10" : "",
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p id={errorId} className="text-xs text-error flex items-center gap-1" role="alert">
            <span>⚠</span> {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = "PremiumInput";
