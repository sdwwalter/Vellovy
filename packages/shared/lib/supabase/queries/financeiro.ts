import { createClient } from '../client';
import type { Despesa, Repasse, ResumoMensal } from '../../../types';

export async function getDespesasDoMes(
  salaoId: string,
  mes: string // 'YYYY-MM'
): Promise<Despesa[]> {
  const supabase = createClient();
  const inicio = `${mes}-01`;
  const fim = new Date(
    parseInt(mes.split('-')[0]),
    parseInt(mes.split('-')[1]),
    0
  )
    .toISOString()
    .split('T')[0];

  const { data, error } = await supabase
    .from('despesas')
    .select('*')
    .eq('salao_id', salaoId)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Despesa[];
}

export async function criarDespesa(
  payload: Omit<Despesa, 'id' | 'created_at'>
): Promise<Despesa> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('despesas')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Despesa;
}

export async function excluirDespesa(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('despesas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getRepassesDoMes(
  salaoId: string,
  mes: string
): Promise<Repasse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('repasses')
    .select(`*, profissional:profissionais(id, nome)`)
    .eq('salao_id', salaoId)
    .eq('mes_referencia', mes)
    .order('created_at');

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Repasse[];
}

export async function toggleRepassePago(
  id: string,
  pago: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('repasses')
    .update({ pago, pago_em: pago ? new Date().toISOString() : null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getReceitaDoMes(
  salaoId: string,
  mes: string
): Promise<number> {
  const supabase = createClient();
  const inicio = `${mes}-01T00:00:00`;
  const fim = new Date(
    parseInt(mes.split('-')[0]),
    parseInt(mes.split('-')[1]),
    0,
    23,
    59,
    59
  ).toISOString();

  const { data, error } = await supabase
    .from('agendamentos')
    .select('valor')
    .eq('salao_id', salaoId)
    .eq('status', 'concluido')
    .gte('data_hora', inicio)
    .lte('data_hora', fim);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, a: { valor: number }) => sum + a.valor, 0);
}
