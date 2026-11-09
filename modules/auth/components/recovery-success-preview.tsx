import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryButton, PrimaryLink } from "@/modules/auth/components/button";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";

export function RecoverySuccessPreview({ onReviewForm }: { onReviewForm?: () => void }) {
  return <>
    <DemoBanner>Password reset success preview only. No recovery token was checked and no password was changed.</DemoBanner>
    <AuthCard eyebrow="PASSWORD RESET · PREVIEW" title="Reset flow complete." description="This screen shows the state a connected recovery flow could display after server-side verification.">
      <StatusMessage tone="info" title="No account was changed">The recovery token and password update are not connected in this preview.</StatusMessage>
      <div style={{ marginTop: 19 }}>
        {onReviewForm
          ? <PrimaryButton type="button" onClick={onReviewForm}>Review the form again</PrimaryButton>
          : <PrimaryLink href="/sign-in">Return to sign in</PrimaryLink>}
      </div>
    </AuthCard>
  </>;
}
