// packages/shared/lib/supabase/queries/servicos.ts
import type { SupabaseInstance } from '../types';
import type { Servico, Profissional } from '../../../types';

/** Buscar serviços ativos do salão */
export async function getServicos(
  supabase: SupabaseInstance,
  salaoId: string
): Promise<Servico[]> {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .eq('salao_id', salaoId)
    .order('nome');

  if (error) throw new Error(error.message);
  return (data ?? []) as Servico[];
}

/** Criar serviço */
export async function criarServico(
  supabase: SupabaseInstance,
  dados: Omit<Servico, 'id'>
): Promise<Servico> {
  const { data, error } = await supabase
    .from('servicos')
    .insert(dados)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Servico;
}

/** Atualizar serviço */
export async function atualizarServico(
  supabase: SupabaseInstance,
  id: string,
  dados: Partial<Servico>
): Promise<void> {
  const { error } = await supabase
    .from('servicos')
    .update(dados)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Buscar profissionais do salão */
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
