// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta! 👋");
        window.location.href = "/agenda";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Redireciona para o callback que troca o code PKCE por sessão
        redirectTo: `${window.location.origin}/auth/callback?next=/agenda`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding (desktop only) */}
      <div className="hidden desktop:flex w-1/2 bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-rose-300/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Sparkles size={40} className="text-rose-200" />
          </div>
          <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-display)] mb-4">
            Vellovy
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Software de gestão que faz o profissional de beleza se sentir poderoso.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4 text-left">
            {[
              "📅 Agenda inteligente com detecção de conflitos",
              "💰 Caixa integrado com formas de pagamento",
              "🤖 Bot Telegram para consultar de qualquer lugar",
              "🏆 Gamificação que reconhece seu trabalho",
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-3 text-white/60 text-sm"
              >
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-page">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="desktop:hidden flex items-center justify-center gap-3 mb-10">
            <Sparkles size={28} className="text-primary-400" />
            <span className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
              Vellovy
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
              {isSignUp ? "Criar conta" : "Entrar"}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {isSignUp
                ? "Comece a gerenciar seu salão agora."
                : "Acesse seu painel de gestão."}
            </p>
          </div>

          {/* Google OAuth */}
          <PremiumButton
            variant="secondary"
            className="w-full mb-6"
            size="lg"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </PremiumButton>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <PremiumInput
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              id="login-email"
            />

            <div className="relative">
              <PremiumInput
                label="Senha"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={18} />}
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <PremiumButton
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              {isSignUp ? "Criar conta" : "Entrar"}
            </PremiumButton>
          </form>

          {/* Toggle sign up / sign in */}
          <p className="text-center text-sm text-text-secondary mt-6">
            {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-400 font-semibold hover:underline cursor-pointer"
            >
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
