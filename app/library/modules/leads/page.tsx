import { LeadsWorkspace } from "@/modules/leads/components/leads-workspace";

export const metadata = { title: "Lead Management · iFranchise CRM" };

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <LeadsWorkspace view={view} />;
}
