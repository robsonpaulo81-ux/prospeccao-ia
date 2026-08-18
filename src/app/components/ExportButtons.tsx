'use client';

export default function ExportButtons({ csvUrl }: { csvUrl: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <a
        href={csvUrl}
        style={{
          fontSize: 13,
          padding: "6px 12px",
          border: "1px solid #ddd",
          borderRadius: 6,
          textDecoration: "none",
          color: "#333",
          background: "#fff",
        }}
      >
        Baixar Excel
      </a>
      <button
        onClick={() => window.print()}
        style={{
          fontSize: 13,
          padding: "6px 12px",
          border: "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
          color: "#333",
        }}
      >
        Imprimir / Salvar PDF
      </button>
    </div>
  );
}
