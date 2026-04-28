// components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Início",     icon: LayoutDashboard },
  { href: "/agenda",        label: "Agenda",     icon: CalendarDays },
  { href: "/caixa",         label: "Caixa",      icon: Wallet },
  { href: "/clientes",      label: "Clientes",   icon: Users },
  { href: "/financeiro",    label: "Financeiro", icon: BarChart3 },
] as const;

/**
 * BottomNav — Navegação mobile (≤767px).
 * 5 abas fixas na parte inferior.
 * Touch targets ≥ 48px.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="tablet:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors duration-150",
                "active:bg-primary-50/50",
                isActive ? "text-primary-400" : "text-neutral-400"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
