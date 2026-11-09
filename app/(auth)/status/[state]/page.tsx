import { notFound } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { Icon, type IconName } from "@/modules/auth/components/icon";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { PreviewStateLinks } from "@/modules/auth/components/preview-state-links";

const states = {
  "invalid-credentials": {
    eyebrow: "SIGN-IN RESPONSE · PREVIEW", title: "We couldn’t verify those details.",
    description: "A connected identity service would return a safe, generic credential error here.",
    note: "No credentials were checked in this preview. The account’s existence and status were not queried.", tone: "error", icon: "key",
  },
  locked: {
    eyebrow: "ACCOUNT ACCESS · PREVIEW", title: "Sign-in is temporarily locked.",
    description: "Your organization can review the account and advise on the next step.",
    note: "The PRD calls for failed-attempt monitoring and account suspension; lockout thresholds are not specified.", tone: "warning", icon: "lock",
  },
  "temporarily-suspended": {
    eyebrow: "ACCOUNT ACCESS · PREVIEW", title: "This account is suspended.",
    description: "Access is paused while an administrator reviews the account status.",
    note: "A connected service must check current membership and suspension state on the server.", tone: "warning", icon: "clock",
  },
  deactivated: {
    eyebrow: "ACCOUNT ACCESS · PREVIEW", title: "This account is deactivated.",
    description: "Contact your organization administrator if you believe access should be restored.",
    note: "Deactivation should revoke access while retaining historical business records.", tone: "error", icon: "user",
  },
  "access-restricted": {
    eyebrow: "ACCESS CONTROL · PREVIEW", title: "You don’t have access to this area.",
    description: "Access is limited to the modules, records and actions assigned to your role.",
    note: "Role, team, record, department, brand, field and action checks must be enforced server-side.", tone: "info", icon: "shield",
  },
  "session-expired": {
    eyebrow: "SESSION · PREVIEW", title: "Your session has ended.",
    description: "Sign in again to continue. Your previous session is not restored by this preview.",
    note: "Session expiry and revocation require a configured server-side session service.", tone: "info", icon: "clock",
  },
} as const satisfies Record<string, { eyebrow: string; title: string; description: string; note: string; tone: "info" | "error" | "warning"; icon: IconName }>;

export function generateStaticParams() {
  return Object.keys(states).map(state => ({ state }));
}

export default async function AuthenticationStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  if (!(state in states)) notFound();
  const view = states[state as keyof typeof states];
  return <>
    <DemoBanner />
    <div className="status-icon"><Icon name={view.icon} /></div>
    <AuthCard eyebrow={view.eyebrow} title={view.title} description={view.description}>
      <StatusMessage tone={view.tone}>{view.note}</StatusMessage>
      <div className="status-actions">
        <PrimaryLink href="/sign-in">Back to sign in</PrimaryLink>
        <p className="form-note">Need help? Contact your organization administrator.</p>
      </div>
    </AuthCard>
    <PreviewStateLinks />
  </>;
}
