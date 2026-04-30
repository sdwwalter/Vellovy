// app/(dashboard)/clientes/[id]/page.tsx
"use client";

import { use } from "react";
import { ClientePerfil } from "@/components/clientes/ClientePerfil";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default function ClientePerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <ClientePerfil clienteId={id} />
      <ClienteForm />
    </>
  );
}
