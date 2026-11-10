/** Decorative layers use only transform/opacity motion; the form never moves. */
export function EarthScene() {
  return <div className="earth-scene" aria-hidden="true">
    <div className="earth-orbit"><img src="/images/orbital-earth.webp" alt="" width="1536" height="1024" fetchPriority="high" /></div>
    <div className="earth-stars earth-stars-near" />
    <div className="earth-stars earth-stars-far" />
    <div className="earth-clouds" />
    <div className="earth-horizon" />
    <div className="earth-shade" />
  </div>;
}
