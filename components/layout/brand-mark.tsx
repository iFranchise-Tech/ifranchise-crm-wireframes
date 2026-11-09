import { Icon } from "@/modules/auth/components/icon";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-wordmark${compact ? " mobile-wordmark" : ""}`}>
      {/* Original wordmark supplied by ifranchise.in. Explicit dimensions prevent layout shift. */}
      <img src="/brand/ifranchise-wordmark.svg" width="162" height="40" alt="iFranchise — Connect. Expand. Grow." />
    </span>
  );
}

export function BrandPanel() {
  return (
    <aside className="brand-panel" aria-label="About iFranchise CRM">
      <div className="brand-panel-inner">
        <BrandMark />
        <div className="brand-copy">
          <p className="brand-kicker"><span /> THE iFRANCHISE WORKSPACE</p>
          <h2 className="brand-headline">Great partnerships.<br /><span>Connected.</span></h2>
          <p className="brand-description">The people, conversations and opportunities behind your next chapter. Together in one place.</p>
          <div className="brand-composition" aria-hidden="true">
            <div className="connection-orbit orbit-one" /><div className="connection-orbit orbit-two" />
            <div className="connection-node node-one"><Icon name="user" /></div>
            <div className="connection-node node-two"><Icon name="building" /></div>
            <div className="connection-node node-three"><Icon name="chart" /></div>
            <div className="brand-art-card">
              <span className="brand-art-icon"><Icon name="layers" /></span>
              <div><strong>A shared direction.</strong><span>One connected workspace.</span></div>
              <span className="brand-art-check"><Icon name="check" /></span>
            </div>
            <div className="brand-art-caption"><span /> Built around your team</div>
          </div>
        </div>
      </div>
      <div className="brand-footer"><span>RELATIONSHIPS INTO POSSIBILITIES</span><span>CRM / 01</span></div>
    </aside>
  );
}
