import { AuthLayout } from "@app/features/auth/components/auth-layout";
import { SignUpForm } from "@app/features/auth/components/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Start monitoring your services with Operatio."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
