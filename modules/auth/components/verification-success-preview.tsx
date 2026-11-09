import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";

export function VerificationSuccessPreview() {
  return <>
    <DemoBanner>Verification success preview only. No code was verified and no session was created.</DemoBanner>
    <AuthCard eyebrow="ADDITIONAL VERIFICATION · PREVIEW" title="Verification complete." description="A connected provider must validate the challenge on the server before continuing to protected CRM areas.">
      <StatusMessage tone="info" title="Identity not verified">This state is available for design review only; it does not grant access.</StatusMessage>
      <div style={{ marginTop: 19 }}><PrimaryLink href="/sign-in">Return to sign in</PrimaryLink></div>
    </AuthCard>
  </>;
}
