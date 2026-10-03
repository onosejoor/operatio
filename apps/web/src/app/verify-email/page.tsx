import { Suspense } from "react";
import { AuthLayout } from "@app/features/auth/components/auth-layout";
import { VerifyEmailForm } from "@app/features/auth/components/verify-email-form";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify your email"
      description="Confirm your email address to finish setting up your account."
    >
      <Suspense fallback={<LoaderDisplay fullScreen />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
