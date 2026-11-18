import { LeadsWorkspace } from "@/modules/leads/components/leads-workspace";

export const metadata = { title: "Lead Management · iFranchise CRM" };

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string; enquiry?: string }> }) {
  const { view, enquiry } = await searchParams;
  return <LeadsWorkspace view={view} enquiryId={enquiry} />;
}
