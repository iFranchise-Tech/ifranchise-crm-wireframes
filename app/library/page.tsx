import Link from "next/link";
import { LibraryHeader } from "@/modules/screen-library/components/library-header";
import { ModuleCatalog } from "@/modules/screen-library/components/module-catalog";
import { Icon } from "@/modules/auth/components/icon";
import { authScreens, authScreenGroups } from "@/modules/screen-library/config/auth-screens";

export const metadata = { title: "Screen library · iFranchise CRM" };
export default function LibraryPage() {
  return <div className="library-page"><LibraryHeader /><main className="library-main">
    <div className="library-intro"><div><p className="section-eyebrow">iFRANCHISE CRM / PRODUCT EXPERIENCE</p><h1>Every detail.<br /><span>One shared vision.</span></h1><p>A home for the experiences we’re building.<br className="desktop-break" /> Explore the screens, follow the journeys, and shape what comes next.</p></div><div className="library-edition"><span className="edition-line" /><strong>01</strong><span>AUTHENTICATION<br />FIRST RELEASE</span></div></div>
    <Link className="featured-module" href="/library/authentication">
      <div className="featured-copy"><span className="availability-badge"><span />READY FOR REVIEW</span><h2>A better beginning.</h2><p>Authentication</p><span className="featured-description">A complete experience from the first welcome to secure account access. Every screen. Every state.</span><div className="featured-meta"><span>{authScreens.length} screens & states</span><span>{authScreenGroups.length} journeys</span><span>Desktop + mobile</span></div><span className="featured-button">Explore authentication <Icon name="arrow" /></span></div>
      <div className="featured-art" aria-hidden="true"><div className="mini-orbit" /><div className="mini-auth-card"><div className="mini-lock"><Icon name="lock" /></div><span className="mini-eyebrow">YOUR NEXT CHAPTER</span><strong>Welcome back.</strong><span className="mini-description">Good to see you again.</span><div className="mini-input"><Icon name="mail" />you@company.com</div><div className="mini-button">Continue <Icon name="arrow" /></div><span className="mini-bottom">Connect. Expand. Grow.</span></div><div className="mini-floating-check"><Icon name="check" /><span>Thoughtfully connected.</span></div></div>
    </Link>
    <ModuleCatalog />
    <footer className="library-footer"><span>iFranchise CRM · Screen library</span><span>Designed around the product requirements.</span></footer>
  </main></div>;
}
