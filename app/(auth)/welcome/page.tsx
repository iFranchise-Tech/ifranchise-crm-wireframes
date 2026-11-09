import Link from "next/link";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner } from "@/modules/auth/components/status-message";
import { PreviewStateLinks } from "@/modules/auth/components/preview-state-links";

export default function WelcomePage() {
  return <>
    <DemoBanner />
    <AuthCard eyebrow="YOUR iFRANCHISE WORKSPACE" title="Welcome to a clearer way forward." description="One considered sign-in for the people and work moving every franchise forward.">
      <PrimaryLink href="/sign-in">Continue with work email <span aria-hidden="true">→</span></PrimaryLink>
      <div className="form-between" style={{ marginTop: 18 }}>
        <span className="form-note">Joining your team?</span>
        <Link className="text-action" href="/invitation">Accept an invitation</Link>
      </div>
    </AuthCard>
    <PreviewStateLinks />
  </>;
}
