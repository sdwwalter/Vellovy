// components/providers/AuthProvider.tsx
// Provider global de autenticação — inicializa sessão e escuta mudanças de auth
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { loadSession, isLoading } = useAuthStore();

  useEffect(() => {
    // Carregar sessão ao montar
    loadSession();

    // Listener para mudanças de estado de auth (login, logout, token refresh)
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        loadSession();
      }
      if (event === "SIGNED_OUT") {
        useAuthStore.setState({
          user: null,
          salaoId: null,
          role: null,
          profissionalId: null,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSession]);

  // Skeleton de carregamento enquanto a sessão é verificada
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
          <p className="text-sm text-text-secondary animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
