export const VisualPlaceholder = ({ kind = "Screenshot", title, children }) => (
  <div
    role="img"
    aria-label={`${kind} coming soon: ${title}`}
    style={{
      aspectRatio: "12 / 7",
      border: "1px dashed currentColor",
      borderRadius: "16px",
      opacity: 0.6,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "24px",
      margin: "24px 0",
      textAlign: "center",
    }}
  >
    <span style={{ fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {kind} coming soon
    </span>
    <strong style={{ fontSize: "16px" }}>{title}</strong>
    {children ? <span style={{ fontSize: "14px", maxWidth: "36rem" }}>{children}</span> : null}
  </div>
);
