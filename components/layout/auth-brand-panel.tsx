import Image from "next/image";
import { BrandMark } from "./brand-mark";

export function AuthBrandPanel() {
  return <aside className="auth-brand-panel" aria-label="iFranchise CRM">
    <div className="auth-brand-heading"><BrandMark /></div>
    <figure className="auth-brand-scene">
      <div className="auth-brand-art"><Image src="/illustrations/franchise-storefront.png" alt="" width={1280} height={1280} sizes="(min-width: 901px) 400px, 1px" /></div>
      <figcaption className="auth-brand-copy">
        <h2><span>Your franchise growth</span>{" "}<span>in one CRM.</span></h2>
        <p>Manage brands, leads, meetings, and approvals in one powerful platform for franchise growth.</p>
      </figcaption>
    </figure>
  </aside>;
}
