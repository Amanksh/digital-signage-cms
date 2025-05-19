// app/_not-found/page.tsx

export default function NotFound() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "1rem",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ fontSize: "1.25rem", color: "#666" }}>
        Sorry, the page you are looking for does not exist.
      </p>
    </div>
  );
}
