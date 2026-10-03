"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@operatio/ui/components/ui/field";
import { Input } from "@operatio/ui/components/ui/input";
import { toast } from "@operatio/ui/components/ui/sonner";
import { ApiError } from "@app/lib/api/client";
import { getOrganizations } from "../api/auth";
import { useSignInMutation } from "../hooks/auth-mutations";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

interface SignInValues {
  email: string;
  password: string;
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();

  const form = useForm<SignInValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const mutation = useSignInMutation();

  async function handleSignInSuccess() {
    const next = params.get("next");
    if (next?.startsWith("/") && !next.startsWith("//")) {
      router.replace(next);
      return;
    }

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
  }

  function handleSignInError(error: Error, values: SignInValues) {
    if (
      error instanceof ApiError &&
      (error.body as { code?: string } | undefined)?.code ===
        "EMAIL_NOT_VERIFIED"
    ) {
      toast.info(
        "Your email needs verification. You can resend the link there.",
      );
      router.replace(
        `/verify-email?email=${encodeURIComponent(values.email)}&reason=unverified`,
      );
      return;
    }

    toast.error(error.message);
  }

  function onSubmit({ email, password }: SignInValues) {
    mutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: handleSignInSuccess,
        onError: (error, values) => handleSignInError(error, values),
      },
    );
  }

  return (
    <form
      id="sign-in-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          rules={{
            validate: (value) =>
              EMAIL_PATTERN.test(value.trim()) ||
              "Enter a valid email address.",
          }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-in-email">Email address</FieldLabel>
              <Input
                {...field}
                id="sign-in-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          rules={{ required: "Enter your password." }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
              <Input
                {...field}
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button
        className="h-10 w-full"
        type="submit"
        loading={mutation.isPending}
      >
        {mutation.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="pt-2 text-center text-sm text-muted-foreground">
        New to Operatio?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/sign-up"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
