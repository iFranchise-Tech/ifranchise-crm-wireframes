import { AuthShell } from "@/components/layout/auth-shell";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";

export default function AuthenticatedPreviewPage() {
  return <AuthShell>
    <DemoBanner>Demo access only. No credentials were checked, sent, or saved, and no CRM session was created.</DemoBanner>
    <AuthCard eyebrow="DEMO SIGN-IN COMPLETE" title="You’re into the preview." description="Any non-empty email and password opens this local preview so you can review the next authentication state.">
      <StatusMessage tone="success" title="Preview only">This does not verify an identity or grant real CRM access. Connect server-side authentication and authorization before production.</StatusMessage>
      <div style={{ marginTop: 19 }}><PrimaryLink href="/sign-in">Return to sign in</PrimaryLink></div>
    </AuthCard>
  </AuthShell>;
}
