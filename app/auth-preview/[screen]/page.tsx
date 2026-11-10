import { notFound, redirect } from "next/navigation";
import { AuthPreviewSurface } from "@/modules/screen-library/components/auth-preview-surface";
import { authScreens, getAuthScreen } from "@/modules/screen-library/config/auth-screens";
export function generateStaticParams() { return authScreens.map(screen => ({ screen: screen.id })); }
export default async function AuthPreviewPage({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (screen === "verify-success") redirect("/auth-preview/authenticated");
  if (!getAuthScreen(screen)) notFound();
  return <AuthPreviewSurface initialScreen={screen} />;
}
