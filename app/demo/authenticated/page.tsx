import { AuthShell } from "@/components/layout/auth-shell";
import { AuthenticatedScreen } from "@/modules/auth/components/authenticated-screen";
export default function AuthenticatedPreviewPage() { return <AuthShell><AuthenticatedScreen /></AuthShell>; }
