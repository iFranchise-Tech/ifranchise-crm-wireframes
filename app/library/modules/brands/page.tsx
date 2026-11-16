import { BrandWorkspace } from "@/modules/brands/components/brand-workspace";

export const metadata = { title: "Brand Portal · iFranchise CRM" };

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string; stage?: string; focus?: string }> }) {
  const { view, stage, focus } = await searchParams;
  return <BrandWorkspace view={view} stage={stage} focus={focus} />;
}
