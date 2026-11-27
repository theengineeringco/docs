// An interactive static scene of the app. `scene` comes from a generated snippet in
// snippets/scenes/ (built by .claude/skills/flow-product-docs/scenes/build.js); the
// document is self-contained, so it renders through srcdoc with no other requests.
// Place it inside <Frame>; the full width keeps Frame's flex centering from shrinking it.
export const Scene = ({ scene, alt }) => (
  <div style={{ width: "100%", maxWidth: `${scene.width}px`, margin: "0 auto" }}>
    <iframe
      srcDoc={scene.html}
      title={alt || scene.title}
      width={scene.width}
      height={scene.height}
      loading="lazy"
      style={{ border: 0, width: "100%", height: `${scene.height}px`, display: "block", background: "transparent", colorScheme: "light" }}
    />
  </div>
);
