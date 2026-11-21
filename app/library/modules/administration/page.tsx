import { AdministrationWorkspace } from "@/modules/administration/components/administration-workspace";

export const metadata = { title: "IT & System Administration · iFranchise CRM" };

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string; status?: string }> }) {
  const { view, status } = await searchParams;
  return <AdministrationWorkspace view={view} status={status} />;
}
