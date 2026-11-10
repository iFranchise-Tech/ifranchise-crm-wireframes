import { ResultScreen } from "@/modules/auth/components/result-screen";
import { PasswordResetMark } from "./password-reset-mark";
export function RecoverySuccessPreview() {
  return <ResultScreen title="Password reset" description="Sign in with your new password." action="Back to sign in" href="/sign-in" mark={<PasswordResetMark />} />;
}
