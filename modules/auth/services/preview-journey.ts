/** Visual-review behavior only. This service never verifies identity or creates a session. */
export const localSignInPreviewEnabled = process.env.NODE_ENV !== "production";
export async function completePreviewStep(): Promise<{ status: "preview-complete" }> {
  await new Promise(resolve => setTimeout(resolve, 350));
  return { status: "preview-complete" };
}
