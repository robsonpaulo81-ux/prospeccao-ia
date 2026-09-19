"use client";
import { useEffect, useState } from "react";
import { FASE_LABEL, IMOVEL_LABEL, CIDADE_LABEL } from "@/lib/labels";
type Lead = {
  id: string;
  nome: string | null;
  telefone?: string | null;
  fase: string;
  tipo_imovel: string | null;
  cidade_interesse: string | null;
  tem_restricao: boolean;
  motivo_sem_interesse: string | null;
  criado_em?: string | null;
  dias_desde_indicacao?: number | null;
};
const POR_PAGINA = 50;
function corDiasIndicacao(dias: number | null | undefined) {
  if (dias == null) return "#999";
  if (dias <= 7) return "#0f9d78";
  if (dias <= 20) return "#e8973a";
  return "#c0392b";
}
export default function ListaLeads({ leads }: { leads: Lead[] }) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(leads.length / POR_PAGINA));

  // Se a busca reduzir a lista, volta pra uma página válida.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [pagina, totalPaginas]);

  const visiveis = leads.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "var(--text)" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
            <th style={{ padding: "8px 6px", color: "var(--accent-2)" }}>Nome</th>
            <th style={{ padding: "8px 6px", color: "var(--accent-2)" }}>Telefone</th>
            <th style={{ padding: "8px 6px", color: "var(--accent-2)" }}>Fase</th>
            <th style={{ padding: "8px 6px", color: "var(--accent-2)" }}>Imóvel</th>
            <th style={{ padding: "8px 6px", color: "var(--accent-2)" }}>Cidade</th>
            <th style={{ padding: "8px 6px", color: "var(--accent-2)" }}>Dias</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((lead) => (
            <tr key={lead.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "8px 6px", fontWeight: 500 }}>{lead.nome ?? "Lead sem nome"}</td>
              <td style={{ padding: "8px 6px" }}>{lead.telefone ?? "—"}</td>
              <td style={{ padding: "8px 6px" }}>{FASE_LABEL[lead.fase] ?? lead.fase}</td>
              <td style={{ padding: "8px 6px" }}>{lead.tipo_imovel ? IMOVEL_LABEL[lead.tipo_imovel] : "—"}</td>
              <td style={{ padding: "8px 6px" }}>{lead.cidade_interesse ? CIDADE_LABEL[lead.cidade_interesse] : "—"}</td>
              <td style={{ padding: "8px 6px" }}>
                {lead.dias_desde_indicacao != null ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: corDiasIndicacao(lead.dias_desde_indicacao), background: corDiasIndicacao(lead.dias_desde_indicacao) + "22", padding: "2px 6px", borderRadius: 8 }}>
                    {lead.dias_desde_indicacao}d
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "12px 6px", color: "var(--text-muted)" }}>Nenhum lead encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPaginas > 1 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 12, fontSize: 12 }}>
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{ fontSize: 12, padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--card-bg)", color: "var(--text)", cursor: pagina === 1 ? "default" : "pointer", opacity: pagina === 1 ? 0.5 : 1 }}
          >
            ← Anterior
          </button>
          <span style={{ color: "var(--text-muted)" }}>
            Página {pagina} de {totalPaginas} ({leads.length} leads)
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{ fontSize: 12, padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--card-bg)", color: "var(--text)", cursor: pagina === totalPaginas ? "default" : "pointer", opacity: pagina === totalPaginas ? 0.5 : 1 }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
