import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Icon } from "@/modules/auth/components/icon";

export function LibraryHeader() {
  return <header className="library-header">
    <Link href="/library" aria-label="iFranchise screen library"><BrandMark /></Link>
    <span className="library-header-divider" />
    <Link href="/library" className="library-header-title">Screen library</Link>
    <span className="internal-label"><span />Internal design review</span>
    <Link href="/sign-in" target="_blank" rel="noopener" className="library-open-link">Open sign in <Icon name="external" /></Link>
  </header>;
}
