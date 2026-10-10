"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@operatio/ui/components/ui/button";
import { Card } from "@operatio/ui/components/ui/card";
import { Input } from "@operatio/ui/components/ui/input";
import { toast } from "@operatio/ui/components/ui/sonner";
import { getOrganizations } from "../api/auth";
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "../hooks/auth-mutations";

export function VerifyEmailForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token")?.trim() ?? "";
  const needsVerification = params.get("reason") === "unverified";
  const attemptedToken = useRef<string | null>(null);
  const [email, setEmail] = useState(params.get("email") ?? "");

  const {
    mutate: verifyToken,
    isPending: isVerifying,
    isError: verificationFailed,
  } = useVerifyEmailMutation();
  const resend = useResendVerificationMutation();

  useEffect(() => {
    if (!token || attemptedToken.current === token) return;
    attemptedToken.current = token;
    verifyToken(token, {
      onSuccess: async () => {
        try {
          const organizations = await getOrganizations();
          const organization = organizations[0];
          if (!organization) {
            toast.error("Your account is not a member of an organization yet.");
            return;
          }

          router.replace(`/${encodeURIComponent(organization.slug)}/dashboard`);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load your workspace.",
          );
        }
      },
      onError: (error) => toast.error(error.message),
    });
  }, [token, verifyToken, router]);

  const verificationMessage = !token
    ? needsVerification
      ? "Your email address is not verified yet. Open your verification link or request another below."
      : "Open the verification link in your inbox to finish verifying your email."
    : verificationFailed
      ? "This verification link could not be used. It may be invalid or expired. Request a new link below."
      : "Verifying your email…";

  function handleResend() {
    resend.mutate(email.trim(), {
      onSuccess: (response) =>
        toast.success(
          response.message ??
            "If the account exists, a verification email has been sent.",
        ),
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="space-y-5">
      <Card
        className="bg-muted/40 p-4"
        aria-live="polite"
        aria-busy={isVerifying}
        role="status"
      >
        <p className="text-sm font-medium">
          {verificationFailed
            ? "Verification link unavailable"
            : token
              ? "Verifying your email"
              : needsVerification
                ? "Email verification required"
                : "Check your inbox"}
        </p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {verificationMessage}
          {email && !token && !needsVerification && (
            <>
              {" "}
              A verification link was sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          )}
        </p>
      </Card>

      <div className="border-t border-border pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {email
            ? "Need another verification link?"
            : "Enter your email to resend the verification link."}
        </p>
        <label className="mt-3 flex flex-col gap-1.5 text-left text-sm font-medium">
          Email address
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <Button
          className="mt-3 w-full"
          type="button"
          variant="outline"
          loading={resend.isPending}
          disabled={!/^\S+@\S+\.\S+$/.test(email)}
          onClick={handleResend}
        >
          {resend.isPending ? "Sending…" : "Resend verification email"}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        <Link className="underline-offset-4 hover:underline" href="/sign-up">
          Change email or go back
        </Link>
      </p>
    </div>
  );
}
