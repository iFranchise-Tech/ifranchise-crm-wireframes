import Link from "next/link";
import { Icon } from "@/modules/auth/components/icon";
import { AuthNavigation } from "@/modules/screen-library/components/auth-navigation";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { authScreenGroups, authScreens, reviewHref } from "@/modules/screen-library/config/auth-screens";

export const metadata = { title: "Authentication overview · iFranchise review" };

export default async function AuthenticationOverview({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const query = await searchParams;
  const mode = query.mode === "mobile" ? "mobile" : "desktop";
  return <ReviewShell moduleName="Authentication" icon="lock" subtitle={`${authScreens.length} screens & states`} overviewHref={reviewHref("overview", mode)} title="Module overview" navigation={<AuthNavigation screenId="overview" mode={mode} />} controls={<span className="review-toolbar-status"><span className="status-dot" />Ready for review</span>}>
    <div className="review-information"><div className="module-overview">
      <div className="module-summary"><div><h2>Authentication</h2><p>{authScreens.length} screens across sign-in, recovery, setup and account access.</p></div><Link className="library-primary" href={reviewHref("sign-in", mode)}>Open first screen <Icon name="arrow" /></Link></div>
      <div className="module-metrics" aria-label="Authentication module details">
        <div><strong>{authScreens.length}</strong><span>Screens & states</span></div>
        <div><strong>{authScreenGroups.length}</strong><span>Journeys</span></div>
        <div><Icon name="desktop" /><strong>Desktop & mobile</strong><span>Responsive previews</span></div>
        <div><Icon name="layers" /><strong>Shared component system</strong><span>Reusable UI components</span></div>
      </div>
      <section aria-labelledby="journeys-title"><div className="overview-section-heading"><h2 id="journeys-title">Explore the journeys</h2><span>Every screen, organized by flow</span></div>
        <div className="overview-journeys">{authScreenGroups.map((group, index) => <Link className="overview-journey" href={reviewHref(group.screens[0].id, mode)} key={group.id}><div className="journey-heading"><span className="module-icon"><Icon name={group.icon} /></span><span className="journey-number">0{index + 1}</span></div><h3>{group.title}</h3><p>{group.description}</p><div className="overview-journey-footer"><span>{group.screens.length} screens & states</span><Icon name="arrow" /></div></Link>)}</div>
      </section>
      <aside className="review-note"><Icon name="eye" /><p><strong>Interactive design preview.</strong> Authentication services are not connected. This preview does not create accounts, send emails or establish authenticated sessions.</p></aside>
    </div></div>
  </ReviewShell>;
}
