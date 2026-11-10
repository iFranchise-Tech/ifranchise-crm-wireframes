import type { NextConfig } from "next";
import { authScreens, reviewHref } from "./modules/screen-library/config/auth-screens";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  // Direct links and new tabs must enter the review workspace too. Keep the
  // isolated /auth-preview surface outside these redirects to avoid nesting it.
  redirects() {
    const legacyScreens = [
      ["/welcome", "sign-in"],
      ["/status/temporarily-suspended", "sign-in"],
      ["/sign-in/email-validation", "sign-in"],
      ["/sign-in/password-validation", "password"],
      ["/sign-in/password-visibility", "password"],
      ["/reset-password/validation", "reset-password"],
      ["/invitation/review", "invitation"],
      ["/verify/success", "authenticated"],
    ];
    return [
      ...authScreens.map(screen => ({ source: screen.href, destination: reviewHref(screen.id), permanent: false })),
      ...legacyScreens.map(([source, id]) => ({ source, destination: reviewHref(id), permanent: false })),
      ...["welcome", "suspended"].map(screen => ({ source: `/auth-preview/${screen}`, destination: "/auth-preview/sign-in", permanent: false })),
      { source: "/auth-preview/verify-success", destination: "/auth-preview/authenticated", permanent: false },
      { source: "/invitation/success", destination: "/demo/workspace", permanent: false },
    ];
  },
};

export default nextConfig;
