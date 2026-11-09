import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { Icon } from "@/modules/auth/components/icon";
import { DemoBanner, StatusMessage } from "@/modules/auth/components/status-message";
import { accessStates } from "@/modules/auth/config/access-states";

export function generateStaticParams() { return Object.keys(accessStates).map(state => ({ state })); }
export default async function AuthenticationStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  if (!Object.hasOwn(accessStates, state)) notFound();
  const view = accessStates[state as keyof typeof accessStates];
  return <><DemoBanner>State preview · No account, session or service status has been checked.</DemoBanner><div className="status-icon" data-tone={view.tone}><Icon name={view.icon} /></div>
    <AuthCard eyebrow={view.eyebrow} title={view.title} description={view.description}>
      <StatusMessage tone={view.tone}>{view.note}</StatusMessage>
      <div className="status-actions"><PrimaryLink href={view.href}>{view.action}<Icon name="arrow" /></PrimaryLink>{state === "invalid-credentials" ? <Link className="text-action center-note" href="/forgot-password">Forgot your password?</Link> : null}</div>
    </AuthCard></>;
}
