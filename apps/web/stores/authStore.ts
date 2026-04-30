// apps/web/stores/authStore.ts
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  salaoId: string | null;
  role: 'owner' | 'profissional' | 'recepcionista' | null;
  profissionalId: string | null;
  isLoading: boolean;

  loadSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  salaoId: null,
  role: null,
  profissionalId: null,
  isLoading: true,

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();

      // Usar getUser() — valida JWT no servidor (mais seguro que getSession())
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        set({ user: null, salaoId: null, role: null, profissionalId: null, isLoading: false });
        return;
      }

      const { data: membro } = await supabase
        .from('membros_salao')
        .select('salao_id, role, profissional_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      set({
        user,
        salaoId: membro?.salao_id ?? null,
        role: (membro?.role as AuthStore['role']) ?? 'owner',
        profissionalId: membro?.profissional_id ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error('[authStore] Erro ao carregar sessão:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, salaoId: null, role: null, profissionalId: null, isLoading: false });
    // Redirecionar para login e limpar todo o estado do router
    window.location.href = '/login';
  },
}));
