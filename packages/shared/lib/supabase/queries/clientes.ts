import { createClient } from '../client';
import type { Cliente } from '../../../types';

export async function getClientes(salaoId: string): Promise<Cliente[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('salao_id', salaoId)
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Cliente[];
}

export async function buscarClientes(
  salaoId: string,
  termo: string
): Promise<Cliente[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('salao_id', salaoId)
    .ilike('nome', `%${termo}%`)
    .order('nome')
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Cliente[];
}

export async function criarCliente(
  payload: Omit<Cliente, 'id' | 'created_at'>
): Promise<Cliente> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Cliente;
}

export async function atualizarCliente(
  id: string,
  payload: Partial<Cliente>
): Promise<Cliente> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Cliente;
}

export async function excluirCliente(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
