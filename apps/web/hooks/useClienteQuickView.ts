// hooks/useClienteQuickView.ts
"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Agendamento } from "@vellovy/shared/types";

export interface ClienteQuickData {
  cliente: Cliente;
  ultimasVisitas: {
    data: string;
    servico: string;
    profissional: string;
    valor: number;
  }[];
  totalGasto: number;
  proximoAgendamento: {
    data_hora: string;
    servico: string;
    profissional: string;
  } | null;
}

/**
 * Hook para carregar dados resumidos de um cliente para o drawer de quick-view.
 * Busca últimas 3 visitas (realizadas), total gasto e próximo agendamento.
 */
export function useClienteQuickView() {
  const [data, setData] = useState<ClienteQuickData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  const abrir = useCallback(async (id: string, clienteInfo?: Cliente) => {
    setClienteId(id);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Buscar cliente se não fornecido
      let cliente = clienteInfo;
      if (!cliente) {
        const { data: c } = await supabase
          .from("clientes")
          .select("*")
          .eq("id", id)
          .single();
        if (c) cliente = c as Cliente;
      }

      if (!cliente) {
        setIsLoading(false);
        return;
      }

      // Últimas 3 visitas realizadas (via agendamentos)
      const { data: visitas } = await supabase
        .from("agendamentos")
        .select("data_hora, valor, servico:servicos(nome), profissional:profissionais(nome)")
        .eq("cliente_id", id)
        .eq("status", "realizado")
        .order("data_hora", { ascending: false })
        .limit(3);

      const ultimasVisitas = (visitas ?? []).map((v: Record<string, unknown>) => ({
        data: v.data_hora as string,
        servico: (v.servico as Record<string, string>)?.nome ?? "Serviço",
        profissional: (v.profissional as Record<string, string>)?.nome ?? "Prof.",
        valor: v.valor as number,
      }));

      // Total gasto (soma dos lançamentos de caixa)
      const { data: caixaData } = await supabase
        .from("lancamentos_caixa")
        .select("valor")
        .eq("cliente_nome", cliente.nome);

      const totalGasto = (caixaData ?? []).reduce(
        (acc: number, l: { valor: number }) => acc + l.valor,
        0
      );

      // Próximo agendamento
      const agora = new Date().toISOString();
      const { data: proximo } = await supabase
        .from("agendamentos")
        .select("data_hora, servico:servicos(nome), profissional:profissionais(nome)")
        .eq("cliente_id", id)
        .in("status", ["agendado", "confirmado"])
        .gte("data_hora", agora)
        .order("data_hora", { ascending: true })
        .limit(1);

      const proximoAgendamento = proximo?.[0]
        ? {
            data_hora: (proximo[0] as Record<string, unknown>).data_hora as string,
            servico: ((proximo[0] as Record<string, unknown>).servico as Record<string, string>)?.nome ?? "Serviço",
            profissional: ((proximo[0] as Record<string, unknown>).profissional as Record<string, string>)?.nome ?? "Prof.",
          }
        : null;

      setData({
        cliente,
        ultimasVisitas,
        totalGasto: totalGasto || cliente.total_gasto,
        proximoAgendamento,
      });
    } catch (err) {
      console.error("[useClienteQuickView] Erro:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fechar = useCallback(() => {
    setClienteId(null);
    setData(null);
  }, []);

  return {
    data,
    isLoading,
    clienteId,
    abrir,
    fechar,
    isOpen: clienteId !== null,
  };
}
