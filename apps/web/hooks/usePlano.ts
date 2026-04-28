// apps/web/hooks/usePlano.ts
// Wrapper local que injeta o supabase client e salaoId do app
"use client";

import { useMemo } from 'react';
import { usePlano as usePlanoBase } from '@vellovy/shared/hooks/usePlano';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function usePlano() {
  const { salaoId } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);

  return usePlanoBase(supabase, salaoId);
}
