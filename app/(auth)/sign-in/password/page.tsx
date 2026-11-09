import { SignInFlow } from "@/modules/auth/components/sign-in-flow";

export default function PasswordEntryPreviewPage() {
  return <SignInFlow initialStep="password" initialEmail="preview.user@ifranchise.test" />;
}
