// lib/utils/cn.ts
// Utility for conditional class names — lightweight alternative to clsx+twMerge

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
