"use client";
import { FASE_LABEL } from "@/lib/labels";

// Link wa.me client-safe: abre a conversa no WhatsApp do lead sem expor
// credenciais Twilio (envio automático continua server-side em lib/twilio.ts).
export function WhatsAppButton({
  telefone,
  nome,
  leadId,
  pequeno,
}: {
  telefone?: string | null;
  nome?: string | null;
  leadId?: string;
  pequeno?: boolean;
}) {
  if (!telefone) return null;

  const digitos = telefone.replace(/\D/g, "");
  const numero = digitos.length === 10 || digitos.length === 11 ? "55" + digitos : digitos;
  if (!numero) return null;

  const mensagem = nome
    ? encodeURIComponent(`Olá, ${nome}! Tudo bem?`)
    : "";

  function registrarEvento() {
    if (!leadId) return;
    // Fire-and-forget: falha ao logar o evento não pode atrapalhar a conversa
    fetch(`/api/leads/${leadId}/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "whatsapp", descricao: "WhatsApp aberto pelo CRM" }),
    }).catch(() => {});
  }

  return (
    <a
      href={`https://wa.me/${numero}${mensagem ? `?text=${mensagem}` : ""}`}
      target="_blank"
      rel="noreferrer"
      onClick={registrarEvento}
      title={`Abrir WhatsApp para ${nome || "lead"}`}
      aria-label={`Abrir WhatsApp para ${nome || "lead"}`}
      style={{
        display: "inline-block",
        fontSize: pequeno ? 10 : 12,
        padding: pequeno ? "3px 7px" : "5px 10px",
        border: "1px solid #0f9d78",
        borderRadius: 4,
        background: "rgba(15,157,120,0.1)",
        color: "#0f9d78",
        textDecoration: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      💬 WhatsApp
    </a>
  );
}

export function faseTitulo(fase: string | null | undefined): string {
  return FASE_LABEL[fase ?? ""] ?? fase ?? "—";
}
