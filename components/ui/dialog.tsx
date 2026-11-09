"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "@/modules/auth/components/icon";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} className="auth-dialog" aria-labelledby={titleId} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <div className="auth-dialog-body">
      <button type="button" className="auth-dialog-close" aria-label="Close dialog" onClick={() => ref.current?.close()}><Icon name="close" /></button>
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  </dialog>;
}
