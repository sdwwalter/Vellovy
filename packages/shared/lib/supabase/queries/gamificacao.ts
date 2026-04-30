import { createClient } from '../client';
import type { Profissional } from '../../../types';

export async function getGamificacaoProfissionais(
  salaoId: string
): Promise<Profissional[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, nome, avatar_url, pontos_total, nivel, streak_dias, badges, ultimo_atendimento')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('pontos_total', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Profissional[];
}

export async function adicionarPontos(
  profissionalId: string,
  pontos: number,
  novoNivel?: 1 | 2 | 3 | 4 | 5,
  novoStreak?: number
): Promise<void> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};

  if (novoNivel !== undefined) updates.nivel = novoNivel;
  if (novoStreak !== undefined) updates.streak_dias = novoStreak;
  updates.ultimo_atendimento = new Date().toISOString();

  const { error } = await supabase.rpc('incrementar_pontos', {
    p_profissional_id: profissionalId,
    p_pontos: pontos,
  });

  if (error) {
    // Fallback: update direto se a função RPC não existir ainda
    const { data: prof } = await supabase
      .from('profissionais')
      .select('pontos_total')
      .eq('id', profissionalId)
      .single();

    if (prof) {
      await supabase
        .from('profissionais')
        .update({ pontos_total: (prof.pontos_total ?? 0) + pontos, ...updates })
        .eq('id', profissionalId);
    }
  } else if (Object.keys(updates).length > 0) {
    await supabase
      .from('profissionais')
      .update(updates)
      .eq('id', profissionalId);
  }
}
