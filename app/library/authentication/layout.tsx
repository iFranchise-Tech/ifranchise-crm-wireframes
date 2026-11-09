import { Suspense, type ReactNode } from "react";
import { AuthenticationWorkspace } from "@/modules/screen-library/components/authentication-workspace";

export default function AuthenticationReviewLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={children}><AuthenticationWorkspace>{children}</AuthenticationWorkspace></Suspense>;
}
