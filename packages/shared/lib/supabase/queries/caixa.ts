import type { SupabaseInstance } from '../types';
import type { LancamentoCaixa, FormaPagamento } from '../../../types';

export async function getLancamentosDoDia(
  supabase: SupabaseInstance,
  salaoId: string,
  data: string
): Promise<LancamentoCaixa[]> {
  const { data: rows, error } = await supabase
    .from('lancamentos_caixa')
    .select(`*, profissional:profissionais(id, nome, funcao)`)
    .eq('salao_id', salaoId)
    .eq('data', data)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []) as LancamentoCaixa[];
}

export async function criarLancamento(
  supabase: SupabaseInstance,
  payload: Omit<LancamentoCaixa, 'id' | 'created_at' | 'profissional'>
): Promise<LancamentoCaixa> {
  const { data, error } = await supabase
    .from('lancamentos_caixa')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LancamentoCaixa;
}

export async function excluirLancamento(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase.from('lancamentos_caixa').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
