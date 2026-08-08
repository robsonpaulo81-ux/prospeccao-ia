export const metadata = {
  title: "Prospecção IA",
  description: "Dashboard de prospecção com agentes de IA de voz e texto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f7f6f2" }}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: "100vh" }}>
          <nav style={{ background: "#fff", borderRight: "1px solid #e5e3da", padding: "1rem" }}>
            <p style={{ fontWeight: 600, marginBottom: "1.5rem" }}>Prospecção IA</p>
            <a href="/" style={{ display: "block", padding: "8px 0", color: "#333", textDecoration: "none" }}>Visão geral</a>
            <a href="/campanhas" style={{ display: "block", padding: "8px 0", color: "#333", textDecoration: "none" }}>Campanhas</a>
            <a href="/leads" style={{ display: "block", padding: "8px 0", color: "#333", textDecoration: "none" }}>Leads</a>
          </nav>
          <main style={{ padding: "1.5rem" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
