// app/(dashboard)/configuracoes/page.tsx
"use client";

import { useState } from "react";
import {
  Settings, Building2, Users, Scissors, Bot,
  Trophy, CreditCard, MessageCircle, Palette,
  AlertTriangle, ChevronRight, Save
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { usePlano } from "@/hooks/usePlano";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";

// Seções extraídas para componentes < 300 linhas
import { SecaoSalao } from "@/components/configuracoes/SecaoSalao";
import { SecaoWhatsApp } from "@/components/configuracoes/SecaoWhatsApp";
import { SecaoEquipe } from "@/components/configuracoes/SecaoEquipe";

type SecaoConfig = "salao" | "profissionais" | "whatsapp" | "telegram" | "gamificacao" | "plano" | "whitelabel" | "perigo" | null;

interface SecaoItem {
  id: SecaoConfig & string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}

export default function ConfiguracoesPage() {
  const [secao, setSecao] = useState<SecaoConfig>(null);
  const { plano, planoInfo, loading: planoLoading, podeCriarProfissional } = usePlano();
  const { salaoId, user } = useAuthStore();
  const [criandoCheckout, setCriandoCheckout] = useState(false);

  const sections: SecaoItem[] = [
    { id: "salao", icon: Building2, title: "Dados do Salão", desc: "Nome, telefone e fuso horário", color: "text-primary-400" },
    { id: "whitelabel", icon: Palette, title: "Personalização", desc: "Cores e marca (White-label)", color: "text-primary-500" },
    { id: "profissionais", icon: Users, title: "Profissionais", desc: "Equipe, funções e valor/hora", color: "text-blue-500" },
    { id: "whatsapp", icon: MessageCircle, title: "WhatsApp", desc: "Template de confirmação", color: "text-emerald-500" },
    { id: "telegram", icon: Bot, title: "Bot Telegram", desc: "Vincular e configurar", color: "text-blue-400" },
    { id: "gamificacao", icon: Trophy, title: "Gamificação", desc: "Pontos, badges e celebrações", color: "text-amber-500" },
    { id: "plano", icon: CreditCard, title: "Plano", desc: "Free — ver upgrade", color: "text-rose-500" },
    { id: "perigo", icon: AlertTriangle, title: "Zona de Perigo", desc: "Apagar dados do salão", color: "text-red-500" },
  ];

  // ─── Menu principal ──────────────────────────────────────
  if (secao === null) {
    return (
      <>
        <PageHeader title="Configurações" />
        <div className="grid gap-3 animate-in">
          {sections.map((s) => (
            <PremiumCard key={s.id} hoverable padding="md">
              <button onClick={() => setSecao(s.id as SecaoConfig)} className="flex items-center justify-between w-full text-left cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-50", s.color)}>
                    <s.icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{s.title}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{s.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </button>
            </PremiumCard>
          ))}
        </div>
      </>
    );
  }

  // ─── Botão voltar ──────────────────────────────────────
  const BotaoVoltar = (
    <div className="flex items-center gap-2 mb-4">
      <button onClick={() => setSecao(null)} className="text-sm text-primary-500 hover:text-primary-700 cursor-pointer">
        ← Voltar
      </button>
    </div>
  );

  return (
    <>
      {BotaoVoltar}

      {secao === "salao" && <SecaoSalao />}
      {secao === "whatsapp" && <SecaoWhatsApp plano={planoInfo} />}
      {secao === "profissionais" && (
        <SecaoEquipe plano={planoInfo} podeCriarProfissional={podeCriarProfissional} irParaPlano={() => setSecao("plano")} />
      )}

      {/* Telegram */}
      {secao === "telegram" && (
        <SecaoTelegram />
      )}

      {/* Gamificação */}
      {secao === "gamificacao" && (
        <SecaoGamificacao />
      )}

      {/* Plano */}
      {secao === "plano" && (
        <SecaoPlano
          plano={planoInfo}
          planoLoading={planoLoading}
          salaoId={salaoId}
          userEmail={user?.email}
          criandoCheckout={criandoCheckout}
          setCriandoCheckout={setCriandoCheckout}
        />
      )}

      {/* White-label */}
      {secao === "whitelabel" && <SecaoWhiteLabel />}

      {/* Zona de Perigo */}
      {secao === "perigo" && (
        <div className="animate-in space-y-4">
          <PageHeader title="Zona de Perigo" subtitle="Ações destrutivas" />
          <PremiumCard padding="lg" className="border-red-200 bg-red-50/30">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-red-700">Apagar todos os dados do salão</h3>
                <p className="text-xs text-red-600/80 mt-1">Isso apagará permanentemente todos os dados. Esta ação não pode ser desfeita.</p>
              </div>
              <PremiumButton onClick={() => toast.error("Por segurança, entre em contato com o suporte.")} variant="ghost" className="w-full text-red-600 bg-red-100 hover:bg-red-200 hover:text-red-700">
                Apagar Dados
              </PremiumButton>
            </div>
          </PremiumCard>
        </div>
      )}
    </>
  );
}

// ─── Inline sub-components (pequenos o suficiente para ficar aqui) ──

function SecaoTelegram() {
  const [telegramToken, setTelegramToken] = useState("");
  return (
    <div className="animate-in space-y-4">
      <PageHeader title="Bot Telegram" subtitle="Vincular ao salão" />
      <PremiumCard padding="lg">
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700 font-medium mb-2">Como vincular:</p>
            <ol className="text-[11px] text-blue-600 space-y-1 list-decimal list-inside">
              <li>Clique em &quot;Gerar Token&quot; abaixo</li>
              <li>Abra o bot <strong>@VellovyBot</strong> no Telegram</li>
              <li>Envie: <code>/vincular SEU_TOKEN</code></li>
              <li>Pronto! Receba resumos diários no chat</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <input value={telegramToken} readOnly placeholder="Clique para gerar..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-mono bg-neutral-50" />
            <PremiumButton size="md" onClick={() => {
              const token = Math.random().toString(36).slice(2, 8).toUpperCase();
              setTelegramToken(token);
              toast(`Token gerado: ${token}`);
            }}>Gerar Token</PremiumButton>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <PremiumBadge variant="agendado" label="Não vinculado" size="sm" />
            <span className="text-xs text-text-secondary">Vincule para usar /agenda, /caixa, /fechar</span>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}

function SecaoGamificacao() {
  const [gamificacaoAtiva, setGamificacaoAtiva] = useState(true);
  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="w-10 h-5 rounded-full bg-neutral-300 checked:bg-primary-400 appearance-none cursor-pointer relative transition-all
          before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-all before:shadow-sm checked:before:translate-x-5" />
    </label>
  );

  return (
    <div className="animate-in space-y-4">
      <PageHeader title="Gamificação" subtitle="Preferências de motivação" />
      <PremiumCard padding="lg">
        <div className="space-y-4">
          <Toggle checked={gamificacaoAtiva} onChange={setGamificacaoAtiva} label="Sistema de pontos" desc="Ganhe pontos por ações no salão" />
          <Toggle checked={true} onChange={() => { }} label="Celebrações sonoras" desc="Som ao ganhar badge ou subir nível" />
          <Toggle checked={true} onChange={() => { }} label="Toast de pontos" desc="Notificação visual ao ganhar pontos" />
          <PremiumButton onClick={() => toast.success("Salvo ✅")} leftIcon={<Save size={14} />} className="w-full">Salvar</PremiumButton>
        </div>
      </PremiumCard>
    </div>
  );
}

function SecaoWhiteLabel() {
  const [corPrimaria, setCorPrimaria] = useState("#7B4F8E");
  const [corSecundaria, setCorSecundaria] = useState("#C4879A");

  return (
    <div className="animate-in space-y-4">
      <PageHeader title="Personalização" subtitle="Cores da marca" />
      <PremiumCard padding="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Cor Primária</label>
            <div className="flex gap-2">
              <input type="color" value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
              <input value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-sm font-mono uppercase" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Cor Secundária</label>
            <div className="flex gap-2">
              <input type="color" value={corSecundaria} onChange={(e) => setCorSecundaria(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
              <input value={corSecundaria} onChange={(e) => setCorSecundaria(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-sm font-mono uppercase" />
            </div>
          </div>
          <PremiumButton onClick={() => toast.success("Cores salvas ✅")} leftIcon={<Save size={14} />} className="w-full">Salvar Cores</PremiumButton>
        </div>
      </PremiumCard>
    </div>
  );
}

function SecaoPlano({ plano, planoLoading, salaoId, userEmail, criandoCheckout, setCriandoCheckout }: {
  plano: { plano: string; profissionais_max: number; stripe_customer_id?: string } | null;
  planoLoading: boolean;
  salaoId: string | null;
  userEmail?: string;
  criandoCheckout: boolean;
  setCriandoCheckout: (v: boolean) => void;
}) {
  return (
    <div className="animate-in space-y-4">
      <PageHeader title="Seu Plano" subtitle="Gestão de assinatura" />
      {planoLoading ? (
        <div className="flex justify-center p-8"><span className="animate-pulse text-text-secondary">Carregando plano...</span></div>
      ) : (
        <>
          <PremiumCard padding="lg" className="bg-gradient-to-br from-primary-50 to-primary-100/30 border-primary-200">
            <div className="text-center py-4">
              <PremiumBadge variant="confirmado" label={(plano?.plano ?? "FREE").toUpperCase()} size="md" />
              <h3 className="text-xl font-bold text-text-primary mt-3">Plano {plano?.plano ?? "Free"}</h3>
              <p className="text-sm text-text-secondary mt-1">Até {plano?.profissionais_max ?? 1} profissional(is)</p>
            </div>
          </PremiumCard>

          {!plano?.stripe_customer_id && (
            <PremiumCard padding="lg" className="border-amber-200">
              <div className="text-center py-4">
                <span className="text-2xl">🚀</span>
                <h3 className="text-lg font-bold text-amber-700 mt-2">Fazer Upgrade</h3>
                <p className="text-sm text-text-secondary mt-1">Desbloqueie recursos avançados</p>
                <PremiumButton
                  className="w-full mt-4"
                  isLoading={criandoCheckout}
                  onClick={async () => {
                    setCriandoCheckout(true);
                    try {
                      const supabase = createClient();
                      const { data, error } = await supabase.functions.invoke("criar-checkout", {
                        body: { planoId: "profissional", ciclo: "mensal", salaoId, origin: window.location.origin, ownerEmail: userEmail },
                      });
                      if (error) throw error;
                      window.location.href = data.url;
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : "Erro ao iniciar checkout";
                      toast.error(msg);
                      setCriandoCheckout(false);
                    }
                  }}
                >
                  Fazer upgrade
                </PremiumButton>
              </div>
            </PremiumCard>
          )}
        </>
      )}
    </div>
  );
}
