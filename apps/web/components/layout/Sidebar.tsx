// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  Users,
  BarChart3,
  Scissors,
  Trophy,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { href: "/agenda",        label: "Agenda",       icon: CalendarDays },
  { href: "/caixa",         label: "Caixa",        icon: Wallet },
  { href: "/clientes",      label: "Clientes",     icon: Users },
  { href: "/servicos",      label: "Serviços",     icon: Scissors },
  { href: "/financeiro",    label: "Financeiro",   icon: BarChart3 },
  { href: "/conquistas",    label: "Conquistas",   icon: Trophy },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

/**
 * Sidebar — Navegação desktop.
 * Colapsada (64px, só ícones) em tablet.
 * Expandida (240px, ícone + label) em desktop.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden tablet:flex flex-col h-full bg-gradient-noir text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <Sparkles size={24} className="text-rose-300 shrink-0" />
        <span className="font-[family-name:var(--font-display)] text-lg font-bold hidden desktop:block">
          Vellovy
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                "hover:bg-white/10",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className="hidden desktop:block">{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-300 hidden desktop:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150 w-full cursor-pointer"
        >
          <LogOut size={20} className="shrink-0" />
          <span className="hidden desktop:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
