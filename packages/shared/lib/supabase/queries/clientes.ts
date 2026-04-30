import { createClient } from '../client';

export async function getClientes(salaoId) {
  const supabase = createClient();
  const { data, error } = await supabase.from('clientes').select('*')
    .eq('salao_id', salaoId).order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function buscarClientes(salaoId, termo) {
  const supabase = createClient();
  const { data, error } = await supabase.from('clientes').select('*')
    .eq('salao_id', salaoId).ilike('nome', `%${termo}%`).order('nome').limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarCliente(payload) {
  const supabase = createClient();
  const { data, error } = await supabase.from('clientes').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function atualizarCliente(id, payload) {
  const supabase = createClient();
  const { data, error } = await supabase.from('clientes').update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirCliente(id) {
  const supabase = createClient();
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
