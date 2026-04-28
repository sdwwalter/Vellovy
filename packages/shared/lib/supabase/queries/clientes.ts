// packages/shared/lib/supabase/queries/clientes.ts
import type { SupabaseInstance } from '../types';
import type { Cliente, SegmentoCliente } from '../../../types';

/** Buscar todos os clientes do salão */
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

/** Buscar cliente por ID */
export async function getClienteById(
  supabase: SupabaseInstance,
  id: string
): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Cliente;
}

/** Criar cliente */
export async function criarCliente(
  supabase: SupabaseInstance,
  dados: Omit<Cliente, 'id' | 'segmento' | 'total_gasto' | 'ultima_visita' | 'total_visitas'>
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(dados)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Cliente;
}

/** Atualizar cliente */
export async function atualizarCliente(
  supabase: SupabaseInstance,
  id: string,
  dados: Partial<Cliente>
): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .update(dados)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Excluir cliente */
export async function excluirCliente(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Buscar clientes por texto (nome ou telefone) */
export async function buscarClientes(
  supabase: SupabaseInstance,
  salaoId: string,
  termo: string
): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('salao_id', salaoId)
    .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%`)
    .order('nome')
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []) as Cliente[];
}
