"use client";
import Image from "next/image";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export function SocialSignIn({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="social-sign-in">
    <div className="sign-in-separator"><span>or</span></div>
    <button type="button" className="provider-button" disabled={disabled} onClick={() => setOpen(true)}>
      <Image src="/brand/providers/google-mark.svg" alt="" width={20} height={20} unoptimized />
      <span>Continue with Google</span>
    </button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Google sign-in">
      <p>Google sign-in hasn’t been enabled for this workspace. Please use your work email or employee ID.</p>
      <button className="button-primary" type="button" onClick={() => setOpen(false)}>Return to sign in</button>
    </Dialog>
  </div>;
}
