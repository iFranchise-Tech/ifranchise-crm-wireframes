"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthNavigationContext } from "@/modules/auth/components/auth-navigation-context";
import { WelcomeScreen } from "@/modules/auth/components/welcome-screen";
import { SignInFlow } from "@/modules/auth/components/sign-in-flow";
import { RecoveryForm } from "@/modules/auth/components/recovery-form";
import { CheckEmailScreen } from "@/modules/auth/components/check-email-screen";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";
import { RecoverySuccessPreview } from "@/modules/auth/components/recovery-success-preview";
import { InvitationReview, InvitationSetupForm } from "@/modules/auth/components/invitation-flow";
import { VerificationForm } from "@/modules/auth/components/verification-form";
import { AuthenticatedScreen } from "@/modules/auth/components/authenticated-screen";
import { AccessStateScreen } from "@/modules/auth/components/access-state-screen";
import { authScreens, getAuthScreen } from "../config/auth-screens";

function ScreenContent({ id }: { id: string }) {
  switch (id) {
    case "welcome": return <WelcomeScreen />;
    case "sign-in": return <SignInFlow />;
    case "password": return <SignInFlow initialStep="password" initialEmail="alex@company.com" />;
    case "loading": return <SignInFlow previewState="loading" />;
    case "forgot-password": return <RecoveryForm />;
    case "check-email": return <CheckEmailScreen />;
    case "reset-password": return <ResetPasswordForm />;
    case "reset-success": return <RecoverySuccessPreview />;
    case "invitation": return <InvitationReview />;
    case "account-setup": return <InvitationSetupForm />;
    case "verify": return <VerificationForm />;
    case "invalid-code": return <VerificationForm showInvalid />;
    case "authenticated": return <AuthenticatedScreen />;
    default: return <AccessStateScreen state={getAuthScreen(id)!.href.split("/").at(-1)!} />;
  }
}

/** Only the review app uses this mounted surface. No credentials or sessions cross the frame boundary. */
export function AuthPreviewSurface({ initialScreen }: { initialScreen: string }) {
  const [id, setId] = useState(initialScreen);
  const select = useCallback((next: string) => { setId(next); window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === "ifranchise:select-screen" && typeof event.data.screen === "string" && getAuthScreen(event.data.screen)) select(event.data.screen);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "ifranchise:preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, [select]);
  const navigation = useMemo(() => ({
    push(href: string) {
      const aliases: Record<string, string> = { "/invitation/review": "/invitation", "/invitation/success": "/demo/workspace", "/verify/success": "/demo/authenticated" };
      const destination = authScreens.find(screen => screen.href === (aliases[href] ?? href));
      if (destination) {
        select(destination.id);
        window.parent.postMessage({ type: "ifranchise:screen-changed", screen: destination.id }, window.location.origin);
      } else if (href === "/demo/workspace" || href === "/invitation/success") {
        window.parent.postMessage({ type: "ifranchise:open-workspace" }, window.location.origin);
      } else if (href.startsWith("/library")) {
        window.parent.postMessage({ type: "ifranchise:open-library", href }, window.location.origin);
      }
    },
    prefetch() {},
  }), [select]);
  useEffect(() => {
    document.title = `${getAuthScreen(id)?.title ?? "Authentication"} · iFranchise`;
    document.querySelector<HTMLElement>(".auth-title")?.focus({ preventScroll: true });
  }, [id]);
  return <AuthNavigationContext.Provider value={navigation}>
    <AuthShell><ScreenContent key={id} id={id} /></AuthShell>
  </AuthNavigationContext.Provider>;
}
