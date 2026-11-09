"use server";

import { authProviderCapabilities } from "@/modules/auth/services/auth-service";

export async function getAuthProviderCapabilities() {
  return authProviderCapabilities;
}
