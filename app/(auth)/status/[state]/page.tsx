import { notFound } from "next/navigation";
import { accessStates } from "@/modules/auth/config/access-states";
import { AccessStateScreen } from "@/modules/auth/components/access-state-screen";
export function generateStaticParams() { return Object.keys(accessStates).map(state => ({ state })); }
export default async function AuthenticationStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  if (!Object.hasOwn(accessStates, state)) notFound();
  return <AccessStateScreen state={state} />;
}
