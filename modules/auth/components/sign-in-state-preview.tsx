import { SignInFlow, type SignInPreviewState } from "@/modules/auth/components/sign-in-flow";
export function SignInStatePreview({ state }: { state: SignInPreviewState }) { return <SignInFlow previewState={state} />; }
