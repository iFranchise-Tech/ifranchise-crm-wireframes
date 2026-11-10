import { WorkspacePreview } from "@/modules/auth/components/workspace-preview";
import { AuthNavigation } from "@/modules/screen-library/components/auth-navigation";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { authScreens, reviewHref } from "@/modules/screen-library/config/auth-screens";
export const metadata = { title: "Workspace · iFranchise CRM" };
export default async function WorkspacePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const query = await searchParams;
  const mode = query.mode === "mobile" ? "mobile" : "desktop";
  return <ReviewShell moduleName="Authentication" icon="lock" subtitle={`${authScreens.length} screens & states`} overviewHref={reviewHref("overview", mode)} title="Workspace" navigation={<AuthNavigation screenId="workspace" mode={mode} />}>
    <div className="review-workspace-content"><WorkspacePreview /></div>
  </ReviewShell>;
}
