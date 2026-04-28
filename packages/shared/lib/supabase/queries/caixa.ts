// packages/shared/lib/supabase/queries/caixa.ts
import type { SupabaseInstance } from '../types';
import type { LancamentoCaixa } from '../../../types';

/** Buscar lançamentos do dia */
export async function getLancamentosDoDia(
  supabase: SupabaseInstance,
  salaoId: string,
  data: string // 'YYYY-MM-DD'
): Promise<LancamentoCaixa[]> {
  const { data: rows, error } = await supabase
    .from('lancamentos_caixa')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('data', data)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []) as LancamentoCaixa[];
}

/** Criar lançamento no caixa */
export async function criarLancamento(
  supabase: SupabaseInstance,
  dados: Omit<LancamentoCaixa, 'id' | 'created_at'>
): Promise<LancamentoCaixa> {
  const { data, error } = await supabase
    .from('lancamentos_caixa')
    .insert(dados)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LancamentoCaixa;
}

/** Excluir lançamento */
export async function excluirLancamento(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('lancamentos_caixa')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
