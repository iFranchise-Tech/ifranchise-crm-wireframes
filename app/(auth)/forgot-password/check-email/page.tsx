import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";

export default function CheckEmailPage() {
  return <>
    <DemoBanner>Email delivery is not connected. No recovery message was sent.</DemoBanner>
    <AuthCard eyebrow="ACCOUNT RECOVERY · PREVIEW" title="Check your email." description="In production, recovery instructions would be sent only when the address matches an account.">
      <StatusMessage tone="info" title="Nothing has been sent">This screen is a design preview. Connect a server-side recovery flow and email provider before enabling password reset.</StatusMessage>
      <div style={{ marginTop: 19 }}><PrimaryLink href="/sign-in">Return to sign in</PrimaryLink></div>
    </AuthCard>
  </>;
}
