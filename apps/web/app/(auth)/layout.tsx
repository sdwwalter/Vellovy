// app/(auth)/layout.tsx
// Layout limpo para páginas de autenticação — sem sidebar/bottom nav
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
