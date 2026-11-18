export const Scene = ({ name, width, height, alt }) => (
  <div style={{ maxWidth: `${width}px`, margin: "24px auto" }}>
    <iframe
      src={`/scenes/${name}/index.html`}
      title={alt}
      width={width}
      height={height}
      loading="lazy"
      style={{ border: 0, width: "100%", height: `${height}px`, display: "block", background: "transparent", colorScheme: "light" }}
    />
  </div>
);
