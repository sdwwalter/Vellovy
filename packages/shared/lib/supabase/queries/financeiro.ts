import type { SupabaseInstance } from '../types';
import type { Despesa, Repasse } from '../../../types';

export async function getDespesasDoMes(
  supabase: SupabaseInstance,
  salaoId: string,
  mes: string
): Promise<Despesa[]> {
  // Tabela no banco: custos_fixos (não "despesas")
  const { data, error } = await supabase
    .from('custos_fixos')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('mes_ano', mes)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Despesa[];
}

export async function criarDespesa(
  supabase: SupabaseInstance,
  payload: {
    salao_id: string;
    categoria: string;
    descricao?: string;
    valor: number;
    mes_ano: string;
    data_vencimento?: string;
    pago?: boolean;
    recorrente?: boolean;
  }
): Promise<Despesa> {
  const { data, error } = await supabase
    .from('custos_fixos')
    .insert({ ...payload, pago: payload.pago ?? false })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Despesa;
}

export async function excluirDespesa(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase.from('custos_fixos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getRepassesDoMes(
  supabase: SupabaseInstance,
  salaoId: string,
  mes: string
): Promise<Repasse[]> {
  const { data, error } = await supabase
    .from('repasses')
    .select(`*, profissional:profissionais(id, nome, funcao)`)
    .eq('salao_id', salaoId)
    .eq('mes_ano', mes)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as Repasse[];
}

export async function toggleRepassePago(
  supabase: SupabaseInstance,
  id: string,
  pago: boolean
): Promise<void> {
  const { error } = await supabase
    .from('repasses')
    .update({ pago })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getReceitaDoMes(
  supabase: SupabaseInstance,
  salaoId: string,
  mes: string
): Promise<number> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('valor')
    .eq('salao_id', salaoId)
    .eq('status', 'realizado')
    .gte('data_hora', `${mes}-01T00:00:00`);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((s: number, a: { valor: number }) => s + a.valor, 0);
}
