import { ResultScreen } from "@/modules/auth/components/result-screen";
export function RecoverySuccessPreview() {
  return <ResultScreen title="Password reset" description="Sign in with your new password." action="Back to sign in" href="/sign-in" icon="key" />;
}
