import Image from "next/image";
import { BrandMark } from "./brand-mark";
import { AuthInformation } from "@/modules/auth/components/auth-information";

export function AuthBrandPanel() {
  return <aside className="auth-brand-panel" aria-label="iFranchise CRM">
    <div className="auth-brand-heading"><BrandMark /><AuthInformation variant="badge" /></div>
    <figure className="auth-brand-scene">
      <figcaption className="auth-brand-copy">
        <h2>Your franchise growth <span>in one CRM.</span></h2>
        <p>Manage brands, leads, meetings, and approvals in one powerful platform for franchise growth.</p>
      </figcaption>
      <div className="auth-brand-art"><Image src="/illustrations/franchise-storefront.png" alt="" width={1280} height={1280} sizes="(min-width: 901px) 400px, 1px" /></div>
    </figure>
  </aside>;
}
