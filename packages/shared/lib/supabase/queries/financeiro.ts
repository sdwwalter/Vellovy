// packages/shared/lib/supabase/queries/financeiro.ts
import type { SupabaseInstance } from '../types';
import type { Despesa, Repasse, LancamentoCaixa, CustoFixo } from '../../../types';

/** Buscar despesas do mês */
export async function getDespesasDoMes(
  supabase: SupabaseInstance,
  salaoId: string,
  mesAno: string // "2026-04"
): Promise<Despesa[]> {
  const { data, error } = await supabase
    .from('custos_fixos')
    .select('*')
    .eq('salao_id', salaoId)
    .eq('mes_ano', mesAno)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  // Mapear custos_fixos para interface Despesa
  return (data ?? []).map((d) => ({
    id: d.id,
    salao_id: d.salao_id,
    descricao: d.descricao || d.categoria,
    valor: d.valor,
    categoria: d.categoria as Despesa['categoria'],
    mes_ano: d.mes_ano,
    pago: true,
    recorrente: false,
  }));
}

/** Criar despesa */
export async function criarDespesa(
  supabase: SupabaseInstance,
  dados: { salao_id: string; categoria: string; descricao: string; valor: number; mes_ano: string }
): Promise<void> {
  const { error } = await supabase
    .from('custos_fixos')
    .insert(dados);

  if (error) throw new Error(error.message);
}

/** Excluir despesa */
export async function excluirDespesa(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('custos_fixos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Buscar repasses do mês */
export async function getRepassesDoMes(
  supabase: SupabaseInstance,
  salaoId: string,
  mesAno: string
): Promise<Repasse[]> {
  const { data, error } = await supabase
    .from('repasses')
    .select(`
      *,
      profissional:profissionais(id, nome)
    `)
    .eq('salao_id', salaoId)
    .eq('mes_ano', mesAno)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Repasse[];
}

/** Marcar repasse como pago/não-pago */
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

/** Buscar receita total do mês (soma de lançamentos do caixa) */
export async function getReceitaDoMes(
  supabase: SupabaseInstance,
  salaoId: string,
  mesAno: string // "2026-04"
): Promise<number> {
  const inicioMes = `${mesAno}-01`;
  const [ano, mes] = mesAno.split('-').map(Number);
  const fimMes = `${ano}-${String(mes).padStart(2, '0')}-31`;

  const { data, error } = await supabase
    .from('lancamentos_caixa')
    .select('valor')
    .eq('salao_id', salaoId)
    .gte('data', inicioMes)
    .lte('data', fimMes);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, l) => sum + (l.valor || 0), 0);
}
