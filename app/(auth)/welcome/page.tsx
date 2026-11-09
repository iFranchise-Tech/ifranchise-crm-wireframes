import Link from "next/link";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner } from "@/modules/auth/components/status-message";
import { Icon } from "@/modules/auth/components/icon";

export default function WelcomePage() {
  return <><DemoBanner>Interactive preview · Authentication services are not connected.</DemoBanner>
    <AuthCard eyebrow="WELCOME TO iFRANCHISE CRM" title="Your next chapter starts here." description="A shared space for the relationships and opportunities that move your business forward.">
      <div className="welcome-features"><div className="welcome-feature"><span><Icon name="users" /></span><div><strong>People. Partnerships. Possibilities.</strong><small>Bring your franchise journey together.</small></div></div><div className="welcome-feature"><span><Icon name="shield" /></span><div><strong>A workspace built around your role.</strong><small>Your team. Your work. One shared direction.</small></div></div></div>
      <PrimaryLink href="/sign-in">Let’s get started <Icon name="arrow" /></PrimaryLink>
      <div className="auth-divider" /><div className="form-between"><span className="form-note">Joining your team?</span><Link className="text-action" href="/invitation">Accept an invitation</Link></div>
    </AuthCard></>;
}
