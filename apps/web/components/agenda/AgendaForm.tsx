// components/agenda/AgendaForm.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PremiumSheet } from "@/components/ui/PremiumSheet";
import { useAgendaStore } from "@/stores/agendaStore";
import { useServicoStore } from "@/stores/servicoStore";
import { useClienteStore } from "@/stores/clienteStore";
import { fmtBRL } from "@vellovy/shared/lib/formatters";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export function AgendaForm() {
  const { formAberto, fecharForm, criarAgendamento, dataSelecionada, verificarConflito } = useAgendaStore();
  const { servicos, profissionais, fetchServicos } = useServicoStore();
  const { clientes, fetchClientes } = useClienteStore();
  const { salaoId } = useAuthStore();

  const [clienteId, setClienteId] = useState("");
  const [profId, setProfId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [hora, setHora] = useState("09:00");
  const [obs, setObs] = useState("");
  const [conflito, setConflito] = useState(false);

  // Fetch data when form opens
  useEffect(() => {
    if (formAberto) {
      fetchServicos();
      fetchClientes();
    }
  }, [formAberto, fetchServicos, fetchClientes]);

  const servicoSel = servicos.find((s) => s.id === servicoId);
  const duracao = servicoSel?.duracao_minutos ?? 60;
  const valor = servicoSel?.preco_ideal ?? 0;

  const checkConflito = (pId: string, h: string, d: number) => {
    if (!pId || !h) return;
    const dt = `${dataSelecionada}T${h}:00`;
    setConflito(verificarConflito(pId, dt, d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !profId || !servicoId || !salaoId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (conflito) {
      toast.error("⚠️ Há conflito de horário para este profissional!");
      return;
    }
    try {
      await criarAgendamento({
        salao_id: salaoId,
        cliente_id: clienteId,
        profissional_id: profId,
        servico_id: servicoId,
        data_hora: `${dataSelecionada}T${hora}:00`,
        duracao_minutos: duracao,
        status: "agendado",
        valor,
        observacoes: obs.trim() || undefined,
      });
      toast.success("✓ Agendamento criado com sucesso");
      resetForm();
    } catch {
      toast.error("Erro ao criar agendamento");
    }
  };

  const resetForm = () => {
    setClienteId(""); setProfId(""); setServicoId("");
    setHora("09:00"); setObs(""); setConflito(false);
  };

  return (
    <PremiumSheet open={formAberto} onClose={() => { fecharForm(); resetForm(); }} title="Novo Agendamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Horário */}
        <PremiumInput label="Horário" type="time" value={hora} onChange={(e) => { setHora(e.target.value); checkConflito(profId, e.target.value, duracao); }} id="ag-hora" />

        {/* Cliente */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Cliente</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all" id="ag-cliente">
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
          </select>
        </div>

        {/* Profissional */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Profissional</label>
          <div className="grid grid-cols-1 gap-2">
            {profissionais.filter(p => p.ativo).map((p) => (
              <button key={p.id} type="button" onClick={() => { setProfId(p.id); checkConflito(p.id, hora, duracao); }}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${profId === p.id ? "border-primary-400 bg-primary-50 ring-1 ring-primary-200" : "border-neutral-200 hover:border-neutral-300"}`}>
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">{p.nome.charAt(0)}</div>
                <div><p className="text-sm font-medium text-text-primary">{p.nome}</p><p className="text-xs text-text-secondary">{p.funcao}</p></div>
              </button>
            ))}
          </div>
        </div>

        {/* Conflito warning */}
        {conflito && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle size={16} className="text-warning shrink-0" />
            <p className="text-xs text-warning font-medium">Já existe um agendamento neste horário para este profissional.</p>
          </div>
        )}

        {/* Serviço */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Serviço</label>
          <div className="grid grid-cols-2 gap-2">
            {servicos.filter(s => s.ativo).map((s) => (
              <button key={s.id} type="button" onClick={() => { setServicoId(s.id); checkConflito(profId, hora, s.duracao_minutos); }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${servicoId === s.id ? "border-primary-400 bg-primary-50 ring-1 ring-primary-200" : "border-neutral-200 hover:border-neutral-300"}`}>
                <p className="text-sm font-medium text-text-primary truncate">{s.nome}</p>
                <p className="text-xs text-text-secondary mt-0.5">{s.duracao_minutos}min · {fmtBRL(s.preco_ideal)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <PremiumInput label="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: cliente prefere sem secador" id="ag-obs" />

        {/* Resumo + Submit */}
        {servicoSel && (
          <div className="bg-primary-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-primary-700 font-medium">Total</span>
            <span className="text-lg font-bold text-primary-800">{fmtBRL(valor)}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <PremiumButton type="button" variant="ghost" onClick={() => { fecharForm(); resetForm(); }} className="flex-1">Cancelar</PremiumButton>
          <PremiumButton type="submit" className="flex-1" disabled={!clienteId || !profId || !servicoId || conflito}>Agendar</PremiumButton>
        </div>
      </form>
    </PremiumSheet>
  );
}
