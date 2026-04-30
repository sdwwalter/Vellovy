import { createClient } from '../client';
import type { Servico, Profissional, Produto } from '../../../types';

export async function getServicos(salaoId: string): Promise<Servico[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('nome');

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Servico[];
}

export async function criarServico(
  payload: Omit<Servico, 'id' | 'created_at'>
): Promise<Servico> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('servicos')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Servico;
}

export async function atualizarServico(
  id: string,
  payload: Partial<Servico>
): Promise<Servico> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('servicos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Servico;
}

export async function getProfissionais(salaoId: string): Promise<Profissional[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('ativo', true)
    .order('nome');

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Profissional[];
}

export async function getProdutos(salaoId: string): Promise<Produto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('salao_id', salaoId)
    .order('nome');

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Produto[];
}
