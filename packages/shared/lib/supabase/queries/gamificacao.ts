import type { SupabaseInstance } from '../types';
import type { Profissional } from '../../../types';

export async function getGamificacaoProfissionais(
  supabase: SupabaseInstance,
  salaoId: string
): Promise<Profissional[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, nome, funcao, pontos_total, nivel, streak_dias, badges, ultima_atividade')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('pontos_total', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profissional[];
}

export async function adicionarPontos(
  supabase: SupabaseInstance,
  profissionalId: string,
  pontos: number
): Promise<void> {
  const { data: prof } = await supabase
    .from('profissionais')
    .select('pontos_total')
    .eq('id', profissionalId)
    .single();

  if (prof) {
    await supabase
      .from('profissionais')
      .update({
        pontos_total: (prof.pontos_total ?? 0) + pontos,
        ultima_atividade: new Date().toISOString(),
      })
      .eq('id', profissionalId);
  }
}
