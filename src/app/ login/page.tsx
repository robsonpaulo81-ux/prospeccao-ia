export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <form
        action="/api/login"
        method="POST"
        style={{
          width: "100%",
          maxWidth: 320,
          background: "var(--card-bg)",
          borderRadius: 16,
          padding: "28px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>
          Prospecção IA
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Área restrita — digite a senha
        </p>

        <input
          type="password"
          name="senha"
          placeholder="Senha"
          autoFocus
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 15,
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxSizing: "border-box",
            background: "var(--card-bg)",
            color: "var(--text)",
            marginBottom: 12,
          }}
        />

        {searchParams?.erro && (
          <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 12 }}>Senha incorreta.</p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            background: "#1a1a1a",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
