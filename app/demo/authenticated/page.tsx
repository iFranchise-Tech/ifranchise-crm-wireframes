import { AuthShell } from "@/components/layout/auth-shell";
import { ResultScreen } from "@/modules/auth/components/result-screen";
export default function AuthenticatedPreviewPage() {
  return <AuthShell><ResultScreen title="Sign-in complete" description="You’ve completed the authentication preview." action="Back to sign in" href="/sign-in" /></AuthShell>;
}
