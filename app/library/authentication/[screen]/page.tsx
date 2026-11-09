import { notFound } from "next/navigation";
import { ScreenViewer } from "@/modules/screen-library/components/screen-viewer";
import { authScreens, getAuthScreen } from "@/modules/screen-library/config/auth-screens";

export function generateStaticParams() { return authScreens.map(screen => ({ screen: screen.id })); }
export async function generateMetadata({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  return { title: `${getAuthScreen(screen)?.title ?? "Screen"} · iFranchise review` };
}
export default async function ScreenReviewPage({ params, searchParams }: { params: Promise<{ screen: string }>; searchParams: Promise<{ mode?: string }> }) {
  const [{ screen: id }, query] = await Promise.all([params, searchParams]);
  const screen = getAuthScreen(id);
  if (!screen) notFound();
  return <ScreenViewer screen={screen} initialMode={query.mode === "mobile" ? "mobile" : "desktop"} />;
}
