import { Icon } from "@/modules/auth/components/icon";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-wordmark${compact ? " mobile-wordmark" : ""}`} aria-label="iFranchise CRM">
      <span className="brand-glyph" aria-hidden="true">i<span>F</span></span>
      <span className="brand-name">iFranchise<small>CRM</small></span>
    </span>
  );
}

export function BrandPanel() {
  return (
    <aside className="brand-panel" aria-label="About iFranchise CRM">
      <div className="brand-panel-inner">
        <BrandMark />
        <div className="brand-copy">
          <p className="brand-kicker">A clearer way forward</p>
          <h1 className="brand-headline">Your franchise journey,<br /><span>connected with purpose.</span></h1>
          <p className="brand-description">A shared workspace for the people, partnerships and progress behind every franchise.</p>
          <div className="brand-detail"><Icon name="shield" /> Access shaped around your role</div>
        </div>
      </div>
      <div className="brand-footer"><span>iFranchise CRM</span><span>BUILT FOR BETTER BUSINESS</span></div>
    </aside>
  );
}
