import { createClient } from '../client';

export async function getDespesasDoMes(salaoId, mes) {
  const supabase = createClient();
  const inicio = `${mes}-01`;
  const { data, error } = await supabase.from('despesas').select('*')
    .eq('salao_id', salaoId).gte('data', inicio).order('data', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarDespesa(payload) {
  const supabase = createClient();
  const { data, error } = await supabase.from('despesas').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirDespesa(id) {
  const supabase = createClient();
  const { error } = await supabase.from('despesas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getRepassesDoMes(salaoId, mes) {
  const supabase = createClient();
  const { data, error } = await supabase.from('repasses')
    .select(`*, profissional:profissionais(id, nome)`)
    .eq('salao_id', salaoId).eq('mes_referencia', mes).order('created_at');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function toggleRepassePago(id, pago) {
  const supabase = createClient();
  const { error } = await supabase.from('repasses')
    .update({ pago, pago_em: pago ? new Date().toISOString() : null }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getReceitaDoMes(salaoId, mes) {
  const supabase = createClient();
  const { data, error } = await supabase.from('agendamentos').select('valor')
    .eq('salao_id', salaoId).eq('status', 'concluido').gte('data_hora', `${mes}-01T00:00:00`);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((s, a) => s + a.valor, 0);
}
