export default function ProcessingStatus({ title, subtitle, steps = [], progress = 0 }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <section style={styles.wrap} aria-live="polite">
      <div style={styles.header}>
        <h2 style={styles.h2}>{title || "Analyzing Your Dissertation"}</h2>
        <p style={styles.p}>{subtitle || "This typically takes a few minutes (depending on length)."}</p>
      </div>

      <div style={styles.barOuter} role="progressbar" aria-valuenow={safeProgress} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ ...styles.barInner, width: `${safeProgress}%` }} />
      </div>

      {steps?.length > 0 && (
        <ul style={styles.list}>
          {steps.slice(-8).map((s, i) => (
            <li key={`${s}-${i}`} style={styles.item}>
              <span style={styles.dot} />
              <span style={styles.text}>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const styles = {
  wrap: {
    marginTop: 22,
    padding: "18px 18px 14px",
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(6px)",
  },
  header: { textAlign: "center", marginBottom: 14 },
  h2: {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  p: { margin: "8px 0 0", color: "rgba(0,0,0,0.65)" },
  barOuter: {
    height: 10,
    borderRadius: 999,
    background: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  barInner: {
    height: "100%",
    borderRadius: 999,
    background: "rgba(90,70,229,0.9)",
    transition: "width 250ms ease",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: "14px 0 0",
    display: "grid",
    gap: 10,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "rgba(0,0,0,0.75)",
    fontSize: 15,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: "rgba(90,70,229,0.9)",
    flex: "0 0 9px",
  },
  text: { lineHeight: 1.25 },
};
