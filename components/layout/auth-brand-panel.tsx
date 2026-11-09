import Image from "next/image";
import { BrandMark } from "./brand-mark";
import { AuthInformation } from "@/modules/auth/components/auth-information";

export function AuthBrandPanel() {
  return <aside className="auth-brand-panel" aria-label="iFranchise CRM">
    <div className="auth-brand-heading"><BrandMark /><AuthInformation variant="badge" /></div>
    <figure className="auth-brand-scene">
      <div className="auth-brand-art"><Image src="/illustrations/franchise-storefront.png" alt="" width={1280} height={1280} sizes="(min-width: 901px) 440px, 1px" /></div>
      <figcaption><ol className="franchise-flow" aria-label="Franchise CRM workflow">
        <li>Leads</li><li>Meetings</li><li>Franchises</li>
      </ol></figcaption>
    </figure>
  </aside>;
}
