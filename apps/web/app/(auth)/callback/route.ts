// app/(auth)/callback/route.ts
// Route Handler para troca do PKCE code por sessão (OAuth + Magic Link)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Destino após autenticação — padrão: /agenda
  const next = searchParams.get("next") ?? "/agenda";

  if (!code) {
    // Sem code — erro de autenticação
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Pode ser ignorado — o middleware refreshará a sessão na próxima requisição
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Erro ao trocar code por sessão:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // Redirecionar para a rota solicitada (ou agenda por padrão)
  // Usar URL relativa para respeitar o ambiente (dev/prod)
  const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/agenda`;
  return NextResponse.redirect(redirectUrl);
}
