import { BrandMark } from "@/components/layout/brand-mark";
import { Icon } from "./icon";
import { AuthLink } from "./auth-navigation-context";
export function WorkspacePreview() {
  return <section className="workspace-home" aria-label="Sample workspace">
    <header className="workspace-home-header"><BrandMark /><span className="workspace-review-label">Design review</span><AuthLink href="/sign-in">Sign out</AuthLink></header>
    <div className="workspace-home-content">
      <span className="workspace-eyebrow">WORKSPACE</span><h1>Welcome to iFranchise</h1><p>Choose where you’d like to start.</p>
      <div className="workspace-destinations">
        <AuthLink href="/library/modules/leads"><Icon name="user" /><div><strong>Leads</strong><span>Contacts and opportunities</span></div><Icon name="chevron" /></AuthLink>
        <AuthLink href="/library/modules/brands"><Icon name="building" /><div><strong>Brands</strong><span>Your franchise network</span></div><Icon name="chevron" /></AuthLink>
        <AuthLink href="/library/modules/meetings"><Icon name="calendar" /><div><strong>Meetings</strong><span>Conversations and follow-ups</span></div><Icon name="chevron" /></AuthLink>
      </div>
      <p className="workspace-review-note">Sample workspace. These modules open their product scope; live account services and CRM data are not connected.</p>
    </div>
  </section>;
}
