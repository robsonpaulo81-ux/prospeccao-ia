import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

export const metadata = {
  metadataBase: new URL("https://prospeccao-ia-nu.vercel.app"),
  title: "Prospecção IA",
  description: "Dashboard de prospecção com agentes de IA de voz e texto",
};

const scriptInicialTema = `
(function() {
  try {
    var tema = localStorage.getItem('tema') || 'automatico';
    var aplicado = tema === 'claro' ? 'light' : tema === 'escuro' ? 'dark' :
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', aplicado);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptInicialTema }} />
      </head>
      <body>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: "100vh" }}>
          <nav style={{ background: "var(--bg-nav)", borderRight: "1px solid var(--border)", padding: "1rem" }}>
            <p style={{ fontWeight: 600, marginBottom: "1.5rem" }}>Prospecção IA</p>
            <a href="/" style={{ display: "block", padding: "8px 0", textDecoration: "none" }}>Visão geral</a>
            <a href="/campanhas" style={{ display: "block", padding: "8px 0", textDecoration: "none" }}>Campanhas</a>
            <a href="/leads" style={{ display: "block", padding: "8px 0", textDecoration: "none" }}>Leads</a>
            <a href="/indicadores" style={{ display: "block", padding: "8px 0", textDecoration: "none" }}>Indicadores</a>
            <a href="/transacoes" style={{ display: "block", padding: "8px 0", textDecoration: "none" }}>Financeiro</a>
            <ThemeToggle />
          </nav>
          <main style={{ padding: "1.5rem" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
