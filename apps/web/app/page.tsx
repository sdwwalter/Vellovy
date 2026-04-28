// app/page.tsx
// Root page — redireciona para a agenda (rota principal do salão)
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/agenda");
}
