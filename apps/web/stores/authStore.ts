// apps/web/stores/authStore.ts
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        set({ user: null, salaoId: null, role: null, profissionalId: null, isLoading: false });
        return;
      }

      const { data: membro } = await supabase
        .from('membros_salao')
        .select('salao_id, role, profissional_id')
        .eq('user_id', session.user.id)
        .eq('ativo', true)
        .single();

      set({
        user: session.user,
        salaoId: membro?.salao_id || null,
        role: membro?.role || 'owner', // Default fallback para migração
        profissionalId: membro?.profissional_id || null,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading session:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, salaoId: null, role: null, profissionalId: null });
  }
}));
