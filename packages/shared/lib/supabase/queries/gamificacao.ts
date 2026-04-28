// packages/shared/lib/supabase/queries/gamificacao.ts
import type { SupabaseInstance } from '../types';
import type { Profissional } from '../../../types';

/** Buscar dados de gamificação dos profissionais */
export async function getGamificacaoProfissionais(
  supabase: SupabaseInstance,
  salaoId: string
): Promise<Profissional[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('pontos_total', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Profissional[];
}

/** Adicionar pontos a um profissional */
export async function adicionarPontos(
  supabase: SupabaseInstance,
  profissionalId: string,
  pontosAdicionais: number
): Promise<void> {
  // Usar RPC para incremento atômico, ou buscar + somar
  const { data: prof } = await supabase
    .from('profissionais')
    .select('pontos_total')
    .eq('id', profissionalId)
    .single();

  if (!prof) return;

  const { error } = await supabase
    .from('profissionais')
    .update({
      pontos_total: prof.pontos_total + pontosAdicionais,
      ultima_atividade: new Date().toISOString(),
    })
    .eq('id', profissionalId);

  if (error) throw new Error(error.message);
}

/** Desbloquear badge */
export async function desbloquearBadge(
  supabase: SupabaseInstance,
  profissionalId: string,
  badgeId: string
): Promise<void> {
  const { data: prof } = await supabase
    .from('profissionais')
    .select('badges')
    .eq('id', profissionalId)
    .single();

  if (!prof) return;
  const badges = prof.badges || [];
  if (badges.includes(badgeId)) return;

  const { error } = await supabase
    .from('profissionais')
    .update({ badges: [...badges, badgeId] })
    .eq('id', profissionalId);

  if (error) throw new Error(error.message);
}
