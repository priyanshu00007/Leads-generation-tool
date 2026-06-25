"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#faf8f5", color: "#2c2620" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 600 }}>Something went wrong</h2>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
              {error.message || "A critical error occurred."}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                background: "#2c2620",
                color: "#f5efe6",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
