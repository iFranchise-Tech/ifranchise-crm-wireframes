import { AuthShell } from "@/components/layout/auth-shell";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";

export default function AuthenticatedPreviewPage() {
  return <AuthShell>
    <DemoBanner>Success screen preview only. This route does not create a session or grant CRM access.</DemoBanner>
    <AuthCard eyebrow="AUTHENTICATION SUCCESS · PREVIEW" title="Your workspace is ready." description="After a real server-validated sign-in, iFranchise can route each person to their authorized workspace.">
      <StatusMessage tone="success" title="Role-aware entry">Sales, Finance, Marketing, MIS, HR, IT and brand users should see only their assigned modules and data.</StatusMessage>
      <div style={{ marginTop: 19 }}><PrimaryLink href="/welcome">Return to welcome</PrimaryLink></div>
    </AuthCard>
  </AuthShell>;
}
