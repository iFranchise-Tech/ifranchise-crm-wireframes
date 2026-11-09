import { AuthShell } from "@/components/layout/auth-shell";
import { ResultScreen } from "@/modules/auth/components/result-screen";
export default function AuthenticatedPreviewPage() {
  return <AuthShell><ResultScreen eyebrow="AUTHENTICATION COMPLETE" title="You’re all set." description="A good beginning to what comes next. You’ve reached the end of the authentication preview." note="Demo success · No credentials were verified, no session was created, and no CRM access is granted." action="Back to sign in" href="/sign-in" /></AuthShell>;
}
