// packages/shared/lib/supabase/types.ts
// Re-export do client Supabase para uso nas queries
// O client real é injetado pelo app (web ou mobile)

import type { SupabaseClient } from '@supabase/supabase-js';

export type SupabaseInstance = SupabaseClient;
