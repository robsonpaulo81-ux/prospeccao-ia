export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import AutoAtualizar from "../components/AutoAtualizar";

type CampanhaSMS = {
  id: number;
  nome: string;
  mensagem: string;
  status: string;
  criado_em: string;
  total_destinatarios: string;
  enviados: string;
  falhas: string;
};

export default async function MensagensPage() {
  let campanhas: CampanhaSMS[] = [];
  try {
    campanhas = await query(`
      SELECT
        c.id,
        c.nome,
        c.mensagem,
        c.status,
        c.criado_em,
        COUNT(d.id)::int AS total_destinatarios,
        COUNT(d.id) FILTER (WHERE d.status = 'enviado')::int AS enviados,
        COUNT(d.id) FILTER (WHERE d.status = 'falhou')::int AS falhas
      FROM campanhas_sms c
      LEFT JOIN campanha_sms_destinatarios d ON d.campanha_id = c.id
      GROUP BY c.id
      ORDER BY c.criado_em DESC
    `);
  } catch (err) {
    // Se a tabela ainda não existir no Postgres, não derruba a página
    console.error("Erro ao carregar campanhas SMS:", err);
    campanhas = [];
  }

  return (
    <div>
      <AutoAtualizar />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 2 }}>Mensagens & Disparos SMS</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Campanhas de texto disparadas para os leads via Twilio
          </p>
        </div>
        <a
          href="/campanhas-sms/nova"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          + Nova campanha SMS
        </a>
      </div>

      {campanhas.length === 0 ? (
        <div
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>
            Nenhuma campanha disparada ainda
          </p>
          <p style={{ fontSize: 13, maxWidth: 460, margin: "0 auto 16px" }}>
            Crie campanhas de SMS segmentadas por fase do lead, cidade ou tipo de imóvel para reengajar contatos frios.
          </p>
          <a
            href="/campanhas-sms/nova"
            style={{
              fontSize: 13,
              padding: "8px 14px",
              background: "var(--accent-2)",
              color: "#1a1a1a",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Criar primeira campanha
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {campanhas.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{c.nome}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 8,
                    background: c.status === "concluida" ? "#e1f5ee" : "#faeeda",
                    color: c.status === "concluida" ? "#085041" : "#633806",
                  }}
                >
                  {c.status}
                </span>
              </div>

              <p style={{ fontSize: 13, color: "var(--text)", background: "var(--bg)", padding: 8, borderRadius: 4, marginBottom: 8, fontStyle: "italic" }}>
                "{c.mensagem}"
              </p>

              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                <span>👥 {c.total_destinatarios} destinatários</span>
                <span>✅ {c.enviados} enviados</span>
                {Number(c.falhas) > 0 && <span style={{ color: "#c0392b" }}>❌ {c.falhas} falhas</span>}
                <span>📅 {new Date(c.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
