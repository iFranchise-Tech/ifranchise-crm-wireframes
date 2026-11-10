/** Decorative scenery is present in the first render, with no canvas handoff. */
export function GlassScene() {
  return (
    <div className="glass-scene" aria-hidden="true">
      <img
        className="glass-scene-landscape"
        src="/images/auth-pearl-landscape.webp"
        alt=""
        width="1672"
        height="941"
        loading="eager"
        fetchPriority="high"
      />
      <div className="glass-scene-light" />
    </div>
  );
}
