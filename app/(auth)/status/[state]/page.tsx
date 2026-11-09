import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PrimaryLink } from "@/modules/auth/components/button";
import { Icon } from "@/modules/auth/components/icon";
import { accessStates } from "@/modules/auth/config/access-states";

export function generateStaticParams() { return Object.keys(accessStates).map(state => ({ state })); }
export default async function AuthenticationStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  if (!Object.hasOwn(accessStates, state)) notFound();
  const view = accessStates[state as keyof typeof accessStates];
  return <><div className="status-icon" data-tone={view.tone}><Icon name={view.icon} /></div>
    <AuthCard title={view.title} description={view.description}>
      <p className="form-note">{view.note}</p>
      <div className="status-actions"><PrimaryLink href={view.href}>{view.action}<Icon name="arrow" /></PrimaryLink>{state === "invalid-credentials" ? <Link className="text-action center-note" href="/forgot-password">Forgot your password?</Link> : null}</div>
    </AuthCard></>;
}
