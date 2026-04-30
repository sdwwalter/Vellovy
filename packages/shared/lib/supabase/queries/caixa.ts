import { createClient } from '../client';

export async function getLancamentosDoDia(salaoId, data) {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from('lancamentos_caixa').select(`*, profissional:profissionais(id, nome)`)
    .eq('salao_id', salaoId).eq('data', data).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function criarLancamento(payload) {
  const supabase = createClient();
  const { data, error } = await supabase.from('lancamentos_caixa').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirLancamento(id) {
  const supabase = createClient();
  const { error } = await supabase.from('lancamentos_caixa').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
