import { redirect } from "next/navigation";
import { reviewHref } from "@/modules/screen-library/config/auth-screens";

export default async function AuthenticationEntry({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const query = await searchParams;
  redirect(reviewHref("sign-in", query.mode === "mobile" ? "mobile" : "desktop"));
}
