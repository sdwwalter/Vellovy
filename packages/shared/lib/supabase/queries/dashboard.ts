// packages/shared/lib/supabase/queries/dashboard.ts
import type { SupabaseInstance } from '../types';
import type { Agendamento } from '../../../types';

/** Dados do dashboard em queries paralelas */
export async function getDashboardData(
  supabase: SupabaseInstance,
  salaoId: string
) {
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const mesAtual = hoje.substring(0, 7); // "2026-04"
  const inicioMes = `${mesAtual}-01`;

  const [
    agendaHojeRes,
    receitaHojeRes,
    clientesMesRes,
    agendaAmanhaRes,
    lancamentosMesRes,
  ] = await Promise.all([
    // Agendamentos de hoje
    supabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('salao_id', salaoId)
      .gte('data_hora', `${hoje}T00:00:00`)
      .lte('data_hora', `${hoje}T23:59:59`)
      .neq('status', 'cancelado'),

    // Receita de hoje
    supabase
      .from('lancamentos_caixa')
      .select('valor')
      .eq('salao_id', salaoId)
      .eq('data', hoje),

    // Clientes novos no mês
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('salao_id', salaoId)
      .gte('created_at', `${inicioMes}T00:00:00`),

    // Agendamentos de amanhã
    supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(id, nome, telefone),
        servico:servicos(id, nome)
      `)
      .eq('salao_id', salaoId)
      .gte('data_hora', `${amanha}T00:00:00`)
      .lte('data_hora', `${amanha}T23:59:59`)
      .neq('status', 'cancelado')
      .order('data_hora'),

    // Lançamentos do mês (para ticket médio)
    supabase
      .from('lancamentos_caixa')
      .select('valor')
      .eq('salao_id', salaoId)
      .gte('data', inicioMes)
      .lte('data', hoje),
  ]);

  const receitaHoje = (receitaHojeRes.data ?? []).reduce((s, l) => s + (l.valor || 0), 0);
  const lancsMes = lancamentosMesRes.data ?? [];
  const receitaMes = lancsMes.reduce((s, l) => s + (l.valor || 0), 0);
  const ticketMedio = lancsMes.length > 0 ? Math.round(receitaMes / lancsMes.length) : 0;

  return {
    agendaHoje: agendaHojeRes.count ?? 0,
    receitaHoje,
    clientesNoMes: clientesMesRes.count ?? 0,
    agendaAmanha: (agendaAmanhaRes.data ?? []) as Agendamento[],
    ticketMedio,
  };
}
