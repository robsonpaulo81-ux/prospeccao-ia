import { query } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function DetalheChamadaPage({ params }: { params: { id: string } }) {
  const [chamada] = await query(
    `
    SELECT c.*, l.nome AS lead_nome, camp.nome AS campanha_nome,
           a.sentimento, a.score_interesse, a.objecoes, a.resumo
    FROM chamadas c
    LEFT JOIN leads l ON l.id = c.lead_id
    LEFT JOIN campanhas camp ON camp.id = c.campanha_id
    LEFT JOIN analises_chamada a ON a.chamada_id = c.id
    WHERE c.id = $1
    `,
    [params.id]
  );

  if (!chamada) return notFound();

  const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e3da", borderRadius: 8, padding: "1rem" };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{chamada.lead_nome ?? "Lead sem nome"}</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: "1rem" }}>{chamada.campanha_nome} · {chamada.resultado ?? "sem resultado"}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>Transcrição</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{chamada.transcricao ?? "Sem transcrição disponível."}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>Análise comportamental</p>
          <p style={{ fontSize: 12, color: "#777" }}>Sentimento</p>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{chamada.sentimento ?? "—"}</p>
          <p style={{ fontSize: 12, color: "#777" }}>Score de interesse</p>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{chamada.score_interesse ?? "—"}</p>
          <p style={{ fontSize: 12, color: "#777" }}>Objeções</p>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{chamada.objecoes?.join(", ") || "Nenhuma"}</p>
          <p style={{ fontSize: 12, color: "#777" }}>Resumo</p>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{chamada.resumo ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
