// apps/web/app/convite/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useAuthStore } from "@/stores/authStore";

function ConviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conviteData, setConviteData] = useState<any>(null);
  const [senha, setSenha] = useState("");
  const { user } = useAuthStore();

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        toast.error("Link de convite inválido ou ausente.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("convites")
        .select("*, salao:saloes(nome)")
        .eq("token", token)
        .eq("usado", false)
        .gt("expira_em", new Date().toISOString())
        .single();

      if (error || !data) {
        toast.error("Convite expirado ou já utilizado.");
      } else {
        setConviteData(data);
      }
      setLoading(false);
    }

    checkToken();
  }, [token]);

  const aceitarConvite = async () => {
    if (!conviteData) return;
    setLoading(true);
    const supabase = createClient();

    try {
      let finalUser = user;

      // Se não estiver logado, cria a conta ou faz login (simplificado: cria conta com senha preenchida)
      if (!finalUser) {
        if (senha.length < 6) {
          toast.error("A senha deve ter no mínimo 6 caracteres.");
          setLoading(false);
          return;
        }
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: conviteData.email,
          password: senha,
        });

        if (authError) throw authError;
        finalUser = authData.user;
      }

      if (!finalUser) throw new Error("Falha ao autenticar usuário.");

      // Inserir membro no salão
      const { error: membroError } = await supabase
        .from("membros_salao")
        .insert({
          salao_id: conviteData.salao_id,
          user_id: finalUser.id,
          role: conviteData.role,
          aceito_em: new Date().toISOString(),
        });

      if (membroError) {
        // Ignora erro de unicidade (se o usuário já é membro do salão)
        if (membroError.code !== '23505') throw membroError;
      }

      // Marcar convite como usado
      await supabase
        .from("convites")
        .update({ usado: true })
        .eq("id", conviteData.id);

      toast.success("Convite aceito com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao aceitar o convite.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page">
        <p className="text-text-secondary animate-pulse">Carregando convite...</p>
      </div>
    );
  }

  if (!conviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page p-4">
        <PremiumCard padding="lg" className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600">Convite Inválido</h2>
          <p className="text-sm text-text-secondary mt-2">
            Este link expirou ou já foi utilizado. Peça um novo convite ao administrador do salão.
          </p>
          <PremiumButton className="w-full mt-6" onClick={() => router.push("/login")}>
            Voltar para o Login
          </PremiumButton>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-page p-4">
      <PremiumCard padding="lg" className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Você foi convidado!</h1>
          <p className="text-sm text-text-secondary mt-2">
            O salão <strong className="text-primary-600">{conviteData.salao?.nome}</strong> convidou você para participar da equipe.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Seu E-mail</label>
            <input 
              disabled 
              value={conviteData.email} 
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-neutral-50 text-text-disabled" 
            />
          </div>

          {!user && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Crie uma Senha</label>
              <input 
                type="password"
                value={senha} 
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all" 
              />
              <p className="text-xs text-text-secondary mt-2">
                Como você ainda não tem uma conta no Vellovy, defina uma senha para começar.
              </p>
            </div>
          )}

          {user && (
            <p className="text-sm text-text-secondary p-3 bg-primary-50 rounded-lg text-center">
              Você já está logado como <strong className="text-text-primary">{user.email}</strong>.
            </p>
          )}

          <PremiumButton onClick={aceitarConvite} disabled={loading} className="w-full mt-2">
            {loading ? "Aceitando..." : "Aceitar Convite"}
          </PremiumButton>
        </div>
      </PremiumCard>
    </div>
  );
}

export default function ConvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <ConviteContent />
    </Suspense>
  );
}
