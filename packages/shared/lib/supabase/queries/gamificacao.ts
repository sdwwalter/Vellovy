import { createClient } from '../client';

export async function getGamificacaoProfissionais(salaoId) {
  const supabase = createClient();
  const { data, error } = await supabase.from('profissionais')
    .select('id, nome, avatar_url, pontos_total, nivel, streak_dias, badges, ultimo_atendimento')
    .eq('salao_id', salaoId).eq('ativo', true).order('pontos_total', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adicionarPontos(profissionalId, pontos, novoNivel, novoStreak) {
  const supabase = createClient();
  const updates = {};
  if (novoNivel !== undefined) updates.nivel = novoNivel;
  if (novoStreak !== undefined) updates.streak_dias = novoStreak;
  updates.ultimo_atendimento = new Date().toISOString();
  const { data: prof } = await supabase.from('profissionais')
    .select('pontos_total').eq('id', profissionalId).single();
  if (prof) {
    await supabase.from('profissionais')
      .update({ pontos_total: (prof.pontos_total ?? 0) + pontos, ...updates })
      .eq('id', profissionalId);
  }
}
