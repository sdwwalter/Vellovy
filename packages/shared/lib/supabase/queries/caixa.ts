import { createClient } from '../client';
import type { LancamentoCaixa, FormaPagamento } from '../../../types';

export async function getLancamentosDoDia(
  salaoId: string,
  data: string
): Promise<LancamentoCaixa[]> {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from('lancamentos_caixa')
    .select(`*, profissional:profissionais(id, nome)`)
    .eq('salao_id', salaoId)
    .eq('data', data)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (rows ?? []) as unknown as LancamentoCaixa[];
}

export async function criarLancamento(
  payload: Omit<LancamentoCaixa, 'id' | 'created_at' | 'profissional'>
): Promise<LancamentoCaixa> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lancamentos_caixa')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as LancamentoCaixa;
}

export async function excluirLancamento(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('lancamentos_caixa')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
