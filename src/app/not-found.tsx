export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Página não encontrada
      </h2>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        A página que você está procurando não existe.
      </p>
      <a
        href="/dashboard"
        style={{
          padding: "12px 24px",
          backgroundColor: "#1d2b48",
          color: "white",
          borderRadius: "6px",
          textDecoration: "none",
        }}
      >
        Voltar ao início
      </a>
    </div>
  );
}
