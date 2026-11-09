import Image from "next/image";
import { BrandMark } from "./brand-mark";

export function AuthBrandPanel() {
  return <aside className="auth-brand-panel" aria-label="iFranchise CRM">
    <BrandMark />
    <div className="auth-brand-art"><Image src="/illustrations/franchise-storefront.png" alt="" width={1280} height={1280} sizes="(min-width: 901px) 440px, 1px" /></div>
    <span className="auth-brand-caption">iFranchise CRM</span>
  </aside>;
}
