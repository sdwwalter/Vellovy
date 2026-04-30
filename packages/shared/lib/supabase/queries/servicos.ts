import { createClient } from '../client';

export async function getServicos(salaoId) {
  const supabase = createClient();
  const { data, error } = await supabase.from('servicos').select('*')
    .eq('salao_id', salaoId).eq('ativo', true).order('nome');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarServico(payload) {
  const supabase = createClient();
  const { data, error } = await supabase.from('servicos').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function atualizarServico(id, payload) {
  const supabase = createClient();
  const { data, error } = await supabase.from('servicos').update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getProfissionais(salaoId) {
  const supabase = createClient();
  const { data, error } = await supabase.from('profissionais').select('*')
    .eq('salao_id', salaoId).eq('ativo', true).order('nome');
  if (error) throw new Error(error.message);
  return data ?? [];
}
