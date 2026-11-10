import type { IconName } from "@/modules/auth/components/icon";
export type AccessState = { title: string; description: string; tone: "info" | "error" | "warning"; icon: IconName; action: string; href?: string; help?: boolean };
export const accessStates: Record<string, AccessState> = {
  "invalid-credentials": { title: "Check your sign-in details", description: "Your account details don’t match. Try again.", tone: "error", icon: "alert", action: "Try again", href: "/sign-in/password" },
  locked: { title: "Account locked", description: "Too many unsuccessful sign-in attempts.", tone: "warning", icon: "lock", action: "Contact administrator", help: true },
  deactivated: { title: "Account deactivated", description: "Your organization has deactivated this account.", tone: "error", icon: "personOff", action: "Contact administrator", help: true },
  "access-restricted": { title: "Access restricted", description: "Your role doesn’t have access to this area.", tone: "info", icon: "block", action: "Contact administrator", help: true },
  "session-expired": { title: "Session expired", description: "Your session has timed out.", tone: "info", icon: "clock", action: "Sign in", href: "/sign-in" },
  "service-unavailable": { title: "Sign-in unavailable", description: "The service is temporarily offline.", tone: "warning", icon: "cloudOff", action: "Try again", href: "/sign-in" },
  "connection-error": { title: "Unable to connect", description: "Check your internet connection and try again.", tone: "warning", icon: "wifi", action: "Try again", href: "/sign-in" },
  "reset-link-expired": { title: "Reset link expired", description: "This link is no longer valid.", tone: "warning", icon: "linkOff", action: "Get a new reset link", href: "/forgot-password" },
  "invitation-expired": { title: "Invitation unavailable", description: "Ask your administrator for a new invitation.", tone: "warning", icon: "mailUnavailable", action: "Contact administrator", help: true },
  "verification-expired": { title: "Verification expired", description: "Your verification window has closed.", tone: "warning", icon: "timerOff", action: "Sign in again", href: "/sign-in" },
};
