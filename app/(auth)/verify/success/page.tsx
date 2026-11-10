import { redirect } from "next/navigation";

export default function VerificationSuccessPage() {
  redirect("/demo/authenticated");
}
