"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { socialProviders, getSocialSignInAvailability, type SocialProviderId } from "@/modules/auth/config/social-providers";
import { localSignInPreviewEnabled } from "@/modules/auth/services/preview-journey";

function ProviderIcon({ provider }: { provider: SocialProviderId }) {
  if (provider === "google") return <span className="provider-google-mark"><Image src="/brand/providers/google-button.png" alt="" width={40} height={40} unoptimized /></span>;
  if (provider === "microsoft") return <Image src="/brand/providers/microsoft.svg" alt="" width={20} height={20} unoptimized />;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.536c.031 3.25 2.85 4.331 2.881 4.345-.024.076-.45 1.541-1.485 3.055-.895 1.31-1.824 2.615-3.288 2.642-1.439.026-1.902-.854-3.548-.854-1.645 0-2.16.827-3.522.88-1.413.054-2.49-1.416-3.393-2.721-1.845-2.67-3.256-7.545-1.362-10.836.94-1.635 2.622-2.67 4.447-2.697 1.39-.026 2.702.934 3.548.934.847 0 2.436-1.155 4.111-.985.701.029 2.669.283 3.932 2.132-.102.063-2.348 1.367-2.322 4.105ZM14.345 4.531c.75-.908 1.254-2.172 1.116-3.43-1.08.043-2.387.72-3.162 1.627-.695.803-1.304 2.088-1.14 3.321 1.204.093 2.435-.613 3.186-1.518Z" /></svg>;
}

export function SocialSignIn({ disabled = false }: { disabled?: boolean }) {
  const [selected, setSelected] = useState<typeof socialProviders[number]>(socialProviders[0]);
  const [open, setOpen] = useState(false);

  return <div className="social-sign-in">
    <div className="sign-in-separator"><span>or continue with</span></div>
    <div className="provider-buttons" aria-label="Other sign-in options">
      {socialProviders.map(provider => <button key={provider.id} type="button" className="provider-button" aria-label={`Sign in with ${provider.name}`} title={`Sign in with ${provider.name}`} disabled={disabled} onClick={() => {
        if (getSocialSignInAvailability(provider.id).status === "not-configured") { setSelected(provider); setOpen(true); }
      }}><ProviderIcon provider={provider.id} /></button>)}
    </div>
    <Dialog open={open} onClose={() => setOpen(false)} title={`${selected.name} sign-in`}>
      <span className="dialog-service-label">Not connected</span>
      <p>{selected.name} sign-in hasn’t been enabled for this workspace. No account details have been shared with {selected.name}.</p>
      <p className="dialog-detail">{localSignInPreviewEnabled ? "You can return to the email form to continue the local preview." : "Your workspace administrator will need to enable this sign-in method."}</p>
      <button className="button-primary" type="button" onClick={() => setOpen(false)}>Back to email sign-in</button>
    </Dialog>
  </div>;
}
