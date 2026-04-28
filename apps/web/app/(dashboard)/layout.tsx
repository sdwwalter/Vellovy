// app/(dashboard)/layout.tsx
// Shell principal com navegação adaptativa (Sidebar + BottomNav)
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { GamificationToast } from "@/components/gamificacao/GamificationToast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {/* Sidebar — desktop & tablet */}
      <div className="hidden tablet:block tablet:w-16 desktop:w-60 shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 tablet:pb-0">
        <div className="max-w-6xl mx-auto px-4 tablet:px-6 desktop:px-8 py-6">
          {children}
        </div>
      </main>

      {/* BottomNav — mobile only */}
      <BottomNav />

      {/* Gamificação — toast global */}
      <GamificationToast />
    </div>
  );
}
