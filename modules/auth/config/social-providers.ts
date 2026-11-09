export const socialProviders = [
  { id: "google", name: "Google" },
  { id: "microsoft", name: "Microsoft" },
  { id: "apple", name: "Apple" },
] as const;

export type SocialProviderId = typeof socialProviders[number]["id"];

// UI catalog only. OAuth must start through a server-owned authorization endpoint
// once provider credentials, callbacks, state and PKCE validation are integrated.
export function getSocialSignInAvailability(provider: SocialProviderId) {
  return { provider, status: "not-configured" as const };
}
