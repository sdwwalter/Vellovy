// middleware.ts
// Proteção de rotas — redireciona para login se não autenticado
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup", "/api"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — não proteger
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Assets estáticos — não proteger
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // DEV: skip auth para testes visuais locais
  if (process.env.DEV_SKIP_AUTH === "true") {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Não autenticado → redireciona para login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar papel do usuário
  const { data: membro } = await supabase
    .from("membros_salao")
    .select("role")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .single();

  const role = membro?.role || 'profissional';

  const ROTAS_OWNER_ONLY = ['/financeiro', '/configuracoes', '/relatorios'];

  if (ROTAS_OWNER_ONLY.some(r => pathname.startsWith(r)) && role !== 'owner') {
    return NextResponse.redirect(new URL('/agenda', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
