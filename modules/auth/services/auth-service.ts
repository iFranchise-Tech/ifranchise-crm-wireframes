import type { AuthProviderCapabilities } from "@/modules/auth/types";

export const authProviderCapabilities: AuthProviderCapabilities = {
  signIn: false,
  passwordRecovery: false,
  invitations: false,
  multiFactor: false,
  sessions: false,
};

export function isAuthenticationConfigured(): boolean {
  return Object.values(authProviderCapabilities).some(Boolean);
}
