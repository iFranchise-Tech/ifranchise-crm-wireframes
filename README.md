# iFranchise CRM — Authentication & Screen Library

A standalone Next.js, TypeScript and Tailwind CSS application. Authentication is the first reviewable module. This repository is independent of the other projects in the parent directory.

## Run locally

Use Node.js 24. Install with `npm install`, then start with `npm run dev`. Development uses Webpack because the local Turbopack preview was serving stale CSS after edits.

- Screen library: http://127.0.0.1:4173/library
- Authentication viewer: http://127.0.0.1:4173/library/authentication/welcome
- In-workspace overview: http://127.0.0.1:4173/library/authentication/overview
- Clean sign-in: http://127.0.0.1:4173/sign-in
- Example mobile review: http://127.0.0.1:4173/library/authentication/sign-in?mode=mobile

`npm run typecheck` checks TypeScript. `npm run build` creates a production build using webpack. With the preview running, `npm run check:routes` checks the registered clean, embedded, review, scope and overview routes and unknown-state handling.

## Review experience

The internal library contains 24 authentication screens and states, grouped into six journeys. A compact desktop sidebar, expandable groups and direct screen links make all states reachable. The viewer has no bottom pager or external-open button. The Desktop and Mobile switch uses a real iframe viewport with the same authentication components as the clean routes. This surface stays mounted during screen navigation, so switching screens does not reload the app, assets or fonts. Review URLs and browser back/forward remain synchronized. Email validation, password validation, visibility and mismatch feedback happen in the forms instead of separate navigation entries. Desktop previews scale to fit smaller review windows; mobile previews retain natural touch sizing and scroll within the frame.

Clean auth routes do not include the library navigation. The root route opens the review library for this stage of development. The future production entry can be changed independently.

Module cards open directly into the shared review workspace. Authentication starts on Welcome; its sidebar overview contains screen counts, journeys and preview details. Other modules open their product scope, with module-specific information available from the same sidebar. The former `/library/authentication` landing URL redirects to Welcome and preserves the preview mode.

The remaining 16 modules reflect CRM PRODUCT.pdf sections 02–17. Their scope views are summaries of the PRD, not implemented CRM functionality. Section 01 is the product overview; Authentication is the first delivery slice across the access and security requirements.

## Architecture

- `app/(auth)/`: clean authentication routes
- `app/library/`: internal catalog, module scope and screen review routes
- `app/auth-preview/`: persistent embedded review surface
- `app/demo/`: isolated success and sample workspace handoff
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

No identity provider, database, email delivery, MFA provider or session store is connected. Development sign-in accepts any non-empty identifier and password to open the local success preview; it does not check, transmit or persist credentials. This shortcut is disabled in production builds. Recovery, setup and OTP interactions only navigate through explicit visual-preview states. They never change an account or create a session.

Google is the only provider button, shown as a full-width “Continue with Google” action. Until OAuth is integrated it opens a clear unavailable dialog; it never redirects, transmits credentials or fabricates a provider session. Sign-in and recovery accept work email or employee ID. The identifier stays editable on the password step. Invitations are opened from email; there is no invitation CTA on Welcome or sign-in.

Password creation and reset use the requested review policy: 8–15 characters, uppercase and lowercase letters, a number and a special character. A stable checklist updates during typing, then crossfades to the confirmation field when all rules are met. Matching passwords receive an inline check and confirmation; mismatches remain editable. Password reset success animates an opening lock. A shared authentication success state shows a drawn checkmark, then automatically open the sample workspace after 1.6 seconds without another CTA. First-time setup opens the sample workspace directly, without another success/sign-in step. This destination lives outside the authentication review navigation, links to module scope pages and explicitly distinguishes itself from a live CRM. The former Workspace review entry has been removed; old review links redirect to Authentication success.

`npm test` exercises identifier handling, password length boundaries, composition, confirmation and sign-in validation using Node.js 24.

The product footer opens Privacy and Help panels; these describe this review environment and direct users to their administrator for their organization's actual privacy policy. No unpublished legal policy or live security guarantees are invented. Authentication service status is explained in these panels and provider feedback without an extra Preview button in the interface.

The session reader returns no session, and authorization denies all requests. These previews do not grant protected CRM access. Integrate the approved identity provider and enforce authentication, role/team/record/department/brand/field/action authorization on the server. Verify recovery and invitation tokens server-side, apply the approved password and MFA policies, implement email delivery, audit events and session revocation before enabling real authentication.

The PRD does not specify numerical lockout thresholds, OTP lifetime, password composition rules or MFA recovery methods. The 8–15 character form policy above is a later product-review requirement, not a backend security guarantee. Other numerical policies are not invented. Authentication UI errors shown from direct review routes are fixtures, not responses from a real account service.

## Brand provenance

`public/brand/ifranchise-wordmark.svg` is the official wordmark, with its tagline removed for the product UI, from https://ifranchise.in/assets/ifranchise-wordmark.svg, retrieved from the official website. The primary purple `#32159b` comes from that asset and the website palette. Desktop authentication pairs a dark purple brand panel with the form on the right. Two original illustrated slides cover CRM collaboration and account protection, with concise explanatory copy. Slides advance every three seconds with a synchronized progress fill and a 420ms crossfade. Compact dot controls support manual selection and arrow keys. Playback pauses on hover, keyboard focus and hidden tabs; reduced-motion preferences disable automatic rotation. Mobile uses a focused single column; the carousel stays hidden. The illustrations have explicit dimensions and responsive image sizes, are optimized by Next.js and stay mounted while switching review screens. The product footer uses the legal name iFranchise Services Private Limited.

Form labels sit six pixels above their controls. Compact field spacing retains a reserved validation line so ordinary inline errors do not move the controls below them. The password recovery link shares the password label row. Verification uses a short, cancellable checking animation, inline retry feedback and a drawn success checkmark, with reduced-motion support. All motion uses CSS; no animation dependencies were added. General screen changes do not animate their position.

### Illustration assets

- `public/illustrations/crm-collaboration-refined.png`: revised CRM scene with natural skin tones and refined details.
- `public/illustrations/account-security.png`: matching account-protection scene.
- Both are 1254 × 1254 transparent PNGs created with the built-in image generation tool. The previous collaboration image remains as the original source.
- Exact generation/edit prompts and file paths: [illustration generation notes](docs/illustration-generation.json).

Interface icons use locally bundled Google Material Symbols Rounded (24px, weight 400, unfilled), sourced from the [official repository](https://github.com/google/material-design-icons). Only the required symbols are included, with no external font or icon requests. Their Apache-2.0 license is in `public/licenses/material-symbols-LICENSE.txt`.

Invitation and status icons are centered on flat, softly tinted circles above their headings. Sign-in, password recovery, expired links, inactive accounts and service outages use contextual Material Symbols instead of a generic key. Google’s asset comes from https://developers.google.com/static/identity/images/signin-assets.zip and is displayed through a small CSS window to preserve the supplied mark. Before enabling live OAuth, review current provider branding requirements and use a provider-rendered button where appropriate.

Headings, body copy, navigation, buttons and fields use Inter. The variable Latin WOFF2 font is bundled in `app/fonts/` and loaded through `next/font/local`, with preloading and adjusted fallbacks. Browsers do not contact Google Fonts. The font was sourced from Google Fonts; its SIL Open Font License is included beside it.

The transparent favicon in `app/icon.svg` uses the iF letter outlines from the official wordmark. It adapts to light and dark browser tabs; `app/favicon.ico` supplies transparent 16px, 32px and 48px fallbacks.
