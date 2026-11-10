/** Decorative scenery is present in the first render, with no canvas handoff. */
export function WaveScene() {
  return (
    <div className="wave-scene" aria-hidden="true">
      <img
        className="wave-scene-landscape"
        src="/images/auth-purple-waves.webp"
        alt=""
        width="1671"
        height="941"
        loading="eager"
        fetchPriority="high"
      />
      <div className="wave-scene-light" />
    </div>
  );
}
