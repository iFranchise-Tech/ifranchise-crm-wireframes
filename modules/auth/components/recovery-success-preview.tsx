import { ResultScreen } from "@/modules/auth/components/result-screen";
export function RecoverySuccessPreview() {
  return <ResultScreen eyebrow="A FRESH START" title="Your password is reset." description="You’re ready to return to your workspace. Use your new password the next time you sign in." note="Success state preview · No password was changed." action="Back to sign in" href="/sign-in" icon="key" />;
}
