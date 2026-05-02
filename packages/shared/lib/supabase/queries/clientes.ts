import type { SupabaseInstance } from '../types';
import type { Cliente, SegmentoCliente } from '../../../types';

export async function getClientes(
  supabase: SupabaseInstance,
  salaoId: string,
  filtroSegmento?: SegmentoCliente
): Promise<Cliente[]> {
  let query = supabase
    .from('clientes')
    .select('*')
    .eq('salao_id', salaoId)
    .order('nome', { ascending: true });

  if (filtroSegmento) {
    query = query.eq('segmento', filtroSegmento);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Cliente[];
}

export async function buscarClientes(
  supabase: SupabaseInstance,
  salaoId: string,
  termo: string
): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('salao_id', salaoId)
    .ilike('nome', `%${termo}%`)
    .order('nome')
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as Cliente[];
}

export async function criarCliente(
  supabase: SupabaseInstance,
  payload: Omit<Cliente, 'id' | 'segmento' | 'total_gasto' | 'total_visitas' | 'ultima_visita' | 'created_at'>
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function atualizarCliente(
  supabase: SupabaseInstance,
  id: string,
  payload: Partial<Cliente>
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function excluirCliente(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
