import Link from "next/link";
import { LibraryHeader } from "@/modules/screen-library/components/library-header";
import { Icon } from "@/modules/auth/components/icon";
import { authScreenGroups, authScreens, reviewHref } from "@/modules/screen-library/config/auth-screens";

export const metadata = { title: "Authentication · Screen library" };
export default function AuthenticationOverview() {
  return <div className="library-page"><LibraryHeader /><main className="library-main auth-overview">
    <Link className="breadcrumb-back" href="/library"><span aria-hidden="true">←</span> All modules</Link>
    <div className="overview-intro"><div><span className="overview-module-icon"><Icon name="lock" /></span><p className="section-eyebrow">MODULE 01 / READY FOR REVIEW</p><h1>Authentication,<br /><span>from start to finish.</span></h1><p>A focused, consistent journey into the iFranchise workspace.<br />Explore every interaction on desktop and mobile.</p></div><Link className="library-primary" href={reviewHref("welcome")}>Start the walkthrough <Icon name="arrow" /></Link></div>
    <div className="overview-meta"><span><strong>{authScreens.length}</strong> screens & states</span><span><strong>{authScreenGroups.length}</strong> journeys</span><span><Icon name="desktop" /> Desktop & mobile</span><span><Icon name="layers" /> Shared component system</span></div>
    <aside className="review-note"><Icon name="eye" /><p><strong>Interactive design preview.</strong> Sign-in can open a local success preview using any non-empty credentials in development. No identity provider is connected; accounts, emails and sessions are not created.</p></aside>
    <div className="journey-grid">{authScreenGroups.map((group, index) => <section className="journey-card" key={group.id}><div className="journey-heading"><span className="module-icon"><Icon name={group.icon} /></span><span className="journey-number">0{index + 1}</span></div><h2>{group.title}</h2><p>{group.description}</p><ul>{group.screens.map(screen => <li key={screen.id}><Link href={reviewHref(screen.id)}><span>{screen.title}</span><span className="screen-kind">{screen.kind}</span><Icon name="chevron" /></Link></li>)}</ul></section>)}</div>
  </main></div>;
}
