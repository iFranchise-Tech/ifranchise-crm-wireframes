# iFranchise CRM — Authentication & Screen Library

A standalone Next.js, TypeScript and Tailwind CSS application. Authentication is the first reviewable module. This repository is independent of the other projects in the parent directory.

## Run locally

Use Node.js 24. Install with `npm install`, then start with `npm run dev`.

- Screen library: http://127.0.0.1:4173/library
- Authentication overview: http://127.0.0.1:4173/library/authentication
- Clean sign-in: http://127.0.0.1:4173/sign-in
- Example mobile review: http://127.0.0.1:4173/library/authentication/sign-in?mode=mobile

`npm run typecheck` checks TypeScript. `npm run build` creates a production build using webpack. With the preview running, `npm run check:routes` checks all 80 routes and unknown-state handling.

## Review experience

The internal library contains 31 authentication screens and states, grouped into six journeys. A compact desktop sidebar, expandable groups, previous/next controls and direct screen links make all states reachable. The Desktop and Mobile switch uses an iframe viewport, so it exercises the actual responsive pages rather than emulating mobile through parent CSS. Desktop previews scale to fit smaller review windows; mobile previews retain natural touch sizing and scroll within the frame.

Clean auth routes do not include the library navigation. The root route opens the review library for this stage of development. The future production entry can be changed independently.

The remaining 16 modules reflect CRM PRODUCT.pdf sections 02–17. Their scope pages are summaries of the PRD, not implemented CRM functionality. Section 01 is the product overview; Authentication is the first delivery slice across the access and security requirements.

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

The session reader returns no session, and authorization denies all requests. These previews do not grant protected CRM access. Integrate the approved identity provider and enforce authentication, role/team/record/department/brand/field/action authorization on the server. Verify recovery and invitation tokens server-side, apply the approved password and MFA policies, implement email delivery, audit events and session revocation before enabling real authentication.

The PRD does not specify numerical lockout thresholds, OTP lifetime, password composition rules or MFA recovery methods. No such values are presented as production policy. Authentication UI errors shown from direct review routes are fixtures, not responses from a real account service.

## Brand provenance

`public/brand/ifranchise-wordmark.svg` is the original wordmark from https://ifranchise.in/assets/ifranchise-wordmark.svg, retrieved from the official website. The primary purple `#32159b` comes from that asset and the website palette. The visual composition is original CSS; no external reference artwork, brand logos or heavy animation libraries were added.
