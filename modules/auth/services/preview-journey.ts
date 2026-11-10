/** Visual-review behavior only. This service never verifies identity or creates a session. */
export const localSignInPreviewEnabled = process.env.NODE_ENV !== "production";
export async function completePreviewStep(): Promise<{ status: "preview-complete" }> {
  return { status: "preview-complete" };
}

/** A cancellable UI demonstration. No code is accepted, transmitted or verified here. */
export function completeVerificationPreview(signal: AbortSignal): Promise<{ status: "preview-complete" }> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve({ status: "preview-complete" });
    }, 600);
    signal.addEventListener("abort", cancel, { once: true });
  });
}
