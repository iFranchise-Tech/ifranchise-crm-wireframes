# iFranchise CRM — Authentication & Screen Library

A standalone Next.js, TypeScript and Tailwind CSS application. Authentication is the first reviewable module. This repository is independent of the other projects in the parent directory.

## Run locally

Use Node.js 24. Install with `npm install`, then start with `npm run dev`. Development uses Webpack because the local Turbopack preview was serving stale CSS after edits.

- Screen library: http://127.0.0.1:4173/library
- Authentication viewer: http://127.0.0.1:4173/library/authentication/welcome
- In-workspace overview: http://127.0.0.1:4173/library/authentication/overview
- Clean sign-in: http://127.0.0.1:4173/sign-in
- Example mobile review: http://127.0.0.1:4173/library/authentication/sign-in?mode=mobile

`npm run typecheck` checks TypeScript. `npm run build` creates a production build using webpack. With the preview running, `npm run check:routes` checks all 97 screen, scope and overview routes and unknown-state handling.

## Review experience

The internal library contains 31 authentication screens and states, grouped into six journeys. A compact desktop sidebar, expandable groups and direct screen links make all states reachable. The viewer has no bottom pager or external-open button. The Desktop and Mobile switch uses an iframe viewport, so it exercises the actual responsive pages rather than emulating mobile through parent CSS. Desktop previews scale to fit smaller review windows; mobile previews retain natural touch sizing and scroll within the frame.

Clean auth routes do not include the library navigation. The root route opens the review library for this stage of development. The future production entry can be changed independently.

Module cards open directly into the shared review workspace. Authentication starts on Welcome; its sidebar overview contains screen counts, journeys and preview details. Other modules open their product scope, with module-specific information available from the same sidebar. The former `/library/authentication` landing URL redirects to Welcome and preserves the preview mode.

The remaining 16 modules reflect CRM PRODUCT.pdf sections 02–17. Their scope views are summaries of the PRD, not implemented CRM functionality. Section 01 is the product overview; Authentication is the first delivery slice across the access and security requirements.

## Architecture

- `app/(auth)/`: clean authentication routes
- `app/library/`: internal catalog, module scope and screen review routes
- `app/demo/authenticated/`: isolated authentication-success preview
- `app/tokens.css`: centralized brand and semantic tokens
- `components/layout/`: brand identity and product auth shell
- `modules/auth/components/`: reusable fields, OTP, forms and result states
- `modules/auth/config/`: typed access-state content
- `modules/auth/schemas/`: form validation, independent of presentation
- `modules/auth/services/`: provider contract, capabilities and clearly isolated preview behavior
- `modules/auth/actions/`: server action boundary
- `modules/screen-library/config/`: one typed registry for screens, journeys and PRD modules
- `lib/auth/`: server session and default-deny authorization boundaries

## Authentication boundary

No identity provider, database, email delivery, MFA provider or session store is connected. Development sign-in accepts any non-empty email and password to open the local success preview; it does not check, transmit or persist credentials. This shortcut is disabled in production builds. Recovery, setup and OTP interactions only navigate through explicit visual-preview states. They never change an account or create a session.

Google, Microsoft and Apple options appear in one centered, logo-only row beneath both sign-in forms. Each retains an accessible name and opens a provider-specific unavailable dialog until OAuth is integrated; none redirects, transmits credentials or fabricates a provider session. Provider availability is separate from the button component in `modules/auth/config/social-providers.ts`. Live integration must use server-owned authorization endpoints and validated callbacks. The email remains directly editable on the password step, with empty-email validation on submission.

A small Preview badge explains the environment. The product footer opens Privacy and Help panels; the privacy panel describes this review environment and directs users to their administrator for their organization's actual privacy policy. No unpublished legal policy or live security guarantees are invented.

The session reader returns no session, and authorization denies all requests. These previews do not grant protected CRM access. Integrate the approved identity provider and enforce authentication, role/team/record/department/brand/field/action authorization on the server. Verify recovery and invitation tokens server-side, apply the approved password and MFA policies, implement email delivery, audit events and session revocation before enabling real authentication.

The PRD does not specify numerical lockout thresholds, OTP lifetime, password composition rules or MFA recovery methods. No such values are presented as production policy. Authentication UI errors shown from direct review routes are fixtures, not responses from a real account service.

## Brand provenance

`public/brand/ifranchise-wordmark.svg` is the original wordmark from https://ifranchise.in/assets/ifranchise-wordmark.svg, retrieved from the official website. The primary purple `#32159b` comes from that asset and the website palette. Desktop authentication pairs a purple gradient and storefront illustration on the left with the form on the right. Mobile uses one column with a gradient fading into white. Verification adds a short, cancellable checking sequence and an animated success checkmark, with reduced-motion support. The persistent review layout keeps embedded navigation from restarting that animation. All motion uses CSS; no animation dependencies were added.

`public/illustrations/franchise-storefront.png` was generated with the built-in image-generation tool for this project, then copied into the repository with its transparent background preserved. It is served through Next.js image optimization. Prompt: “A refined 3D miniature franchise storefront with porcelain walls, deep iFranchise purple (#32159b) and lavender striped awning, glass door and display window, two matching smaller stores behind it; three-quarter view, soft studio lighting, minimal premium product illustration, transparent background, no text, logos, people or decorative objects.”

The desktop artwork ends with a minimal leads / meetings / franchises line integrated into the gradient, without a separate card or fabricated customer data. Invitation and status icons are centered above their headings. Provider buttons follow the recognizable provider identity treatments; Google’s asset comes from https://developers.google.com/static/identity/images/signin-assets.zip and Microsoft's logo from https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg. The Google PNG is displayed through a small CSS window to preserve the supplied mark. Before enabling live OAuth, review the current provider branding requirements and use provider-rendered buttons where appropriate.

Headings use Sora; body copy, navigation, buttons and fields use Manrope. Both variable Latin WOFF2 fonts are bundled in `app/fonts/` and loaded through `next/font/local`, with preloading and adjusted fallbacks. Browsers do not contact Google Fonts. The files were sourced from Google Fonts; their SIL Open Font Licenses are included beside them.
