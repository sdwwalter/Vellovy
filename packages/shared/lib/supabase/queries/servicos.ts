import type { SupabaseInstance } from '../types';
import type { Servico, Profissional } from '../../../types';

export async function getServicos(
  supabase: SupabaseInstance,
  salaoId: string
): Promise<Servico[]> {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw new Error(error.message);
  return (data ?? []) as Servico[];
}

export async function criarServico(
  supabase: SupabaseInstance,
  payload: Omit<Servico, 'id' | 'created_at'>
): Promise<Servico> {
  const { data, error } = await supabase
    .from('servicos')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Servico;
}

export async function atualizarServico(
  supabase: SupabaseInstance,
  id: string,
  payload: Partial<Servico>
): Promise<Servico> {
  const { data, error } = await supabase
    .from('servicos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Servico;
}

export async function getProfissionais(
  supabase: SupabaseInstance,
  salaoId: string
): Promise<Profissional[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw new Error(error.message);
  return (data ?? []) as Profissional[];
}
