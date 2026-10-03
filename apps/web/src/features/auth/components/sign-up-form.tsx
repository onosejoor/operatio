"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@operatio/ui/components/field";
import { Input } from "@operatio/ui/components/ui/input";
import { toast } from "@operatio/ui/components/ui/sonner";
import { signUp } from "../api/auth";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  {
    label: "One special character (@$!%*?&)",
    test: (v: string) => /[@$!%*?&]/.test(v),
  },
];

interface SignUpValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignUpForm() {
  const router = useRouter();

  const form = useForm<SignUpValues>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: (_, values) =>
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`),
    onError: (error) => toast.error(error.message),
  });

  function onSubmit({ name, email, password }: SignUpValues) {
    mutation.mutate({ name: name.trim(), email: email.trim(), password });
  }

  return (
    <form
      id="sign-up-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          rules={{
            validate: (value) =>
              value.trim().length >= 2 ||
              "Enter your name (at least 2 characters).",
          }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
              <Input
                {...field}
                id="sign-up-name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
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
              <FieldLabel htmlFor="sign-up-email">Email address</FieldLabel>
              <Input
                {...field}
                id="sign-up-email"
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
          rules={{
            validate: (value) =>
              passwordRules.every((rule) => rule.test(value)) ||
              "Password doesn't meet all the requirements.",
            deps: ["confirmPassword"],
          }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
              <Input
                {...field}
                id="sign-up-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={form.control}
          rules={{
            required: "Confirm your password.",
            validate: (value) =>
              value === form.getValues("password") || "Passwords do not match.",
          }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-confirm-password">
                Confirm password
              </FieldLabel>
              <Input
                {...field}
                id="sign-up-confirm-password"
                type="password"
                autoComplete="new-password"
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
        {mutation.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="pt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
