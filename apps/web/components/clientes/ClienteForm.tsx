// components/clientes/ClienteForm.tsx
"use client";

import { useState, useEffect } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PremiumSheet } from "@/components/ui/PremiumSheet";
import { useClienteStore } from "@/stores/clienteStore";
import { toast } from "sonner";

export function ClienteForm() {
  const { formAberto, fecharForm, editandoId, criarCliente, atualizarCliente, getCliente } = useClienteStore();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [obs, setObs] = useState("");

  const isEdit = !!editandoId;

  useEffect(() => {
    if (editandoId) {
      const c = getCliente(editandoId);
      if (c) {
        setNome(c.nome);
        setTelefone(c.telefone ?? "");
        setEmail(c.email ?? "");
        setNascimento(c.data_nascimento ?? "");
        setObs(c.observacoes ?? "");
      }
    }
  }, [editandoId, getCliente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!telefone.trim()) { toast.error("Telefone é obrigatório"); return; }

    if (isEdit && editandoId) {
      atualizarCliente(editandoId, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        data_nascimento: nascimento || undefined,
        observacoes: obs.trim() || undefined,
      });
      toast.success("✓ Cliente atualizado");
    } else {
      criarCliente({
        salao_id: "salao-1",
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        data_nascimento: nascimento || undefined,
        observacoes: obs.trim() || undefined,
      });
      toast.success("✓ Cliente cadastrado");
    }
    resetForm();
  };

  const resetForm = () => {
    setNome(""); setTelefone(""); setEmail("");
    setNascimento(""); setObs("");
  };

  return (
    <PremiumSheet
      open={formAberto}
      onClose={() => { fecharForm(); resetForm(); }}
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PremiumInput label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Eduarda Santos" id="cl-nome" />
        <PremiumInput label="Telefone (WhatsApp)" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99988-7766" type="tel" id="cl-tel" hint="Usado para contato via WhatsApp" />
        <PremiumInput label="E-mail (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@email.com" type="email" id="cl-email" />
        <PremiumInput label="Data de nascimento (opcional)" value={nascimento} onChange={(e) => setNascimento(e.target.value)} type="date" id="cl-nasc" hint="Receba alertas de aniversário" />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Observações (opcional)</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: Prefere horários pela manhã. Alergia a amônia."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm text-text-primary bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all resize-none"
            id="cl-obs"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <PremiumButton type="button" variant="ghost" onClick={() => { fecharForm(); resetForm(); }} className="flex-1">Cancelar</PremiumButton>
          <PremiumButton type="submit" className="flex-1" disabled={!nome.trim() || !telefone.trim()}>
            {isEdit ? "Salvar" : "Cadastrar"}
          </PremiumButton>
        </div>
      </form>
    </PremiumSheet>
  );
}
