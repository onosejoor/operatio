import { Suspense } from "react";
import { AuthLayout } from "@app/features/auth/components/auth-layout";
import { SignInForm } from "@app/features/auth/components/sign-in-form";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";

export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your Operatio workspace."
    >
      <Suspense fallback={<LoaderDisplay fullScreen />}>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}
