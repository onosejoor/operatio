"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Building2, Mail, UserRound } from "lucide-react";
import { useCurrentUser, useOrganizations } from "@app/features/auth/hooks/auth-queries";
import type { AuthUser, Organization } from "@app/features/auth/api/auth";
import { useUpdateOrganization, useUpdateProfile } from "@app/features/settings/hooks/settings-queries";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@operatio/ui/components/ui/field";
import { Input } from "@operatio/ui/components/ui/input";
import { toast } from "@operatio/ui/components/ui/sonner";

export function SettingsView({ orgSlug }: { orgSlug: string }) {
  const user = useCurrentUser();
  const organizations = useOrganizations();
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );

  if (user.isPending || organizations.isPending) {
    return <LoaderDisplay message="Loading settings" />;
  }
  if (user.isError || organizations.isError) {
    const error = user.error ?? organizations.error;
    return (
      <ErrorDisplay
        title="Unable to load settings"
        message={error?.message ?? "Try again."}
        onRetry={() => {
          void user.refetch();
          void organizations.refetch();
        }}
      />
    );
  }
  if (!user.data || !organization) {
    return (
      <ErrorDisplay
        title="Workspace not found"
        message="This workspace is not available to your account."
      />
    );
  }

  const membership = user.data.memberships.find(
    (item) => item.organization.id === organization.id,
  );
  if (!membership) {
    return (
      <ErrorDisplay
        title="Workspace not found"
        message="This workspace is not available to your account."
      />
    );
  }

  return (
    <SettingsForm
      key={organization.id}
      user={user.data}
      organization={organization}
      role={membership.role}
    />
  );
}

function SettingsForm({
  user,
  organization,
  role,
}: {
  user: AuthUser;
  organization: Organization;
  role: AuthUser["memberships"][number]["role"];
}) {
  const router = useRouter();
  const isOwner = role === "OWNER";
  const profileForm = useForm<{ name: string }>({
    defaultValues: { name: user.name },
  });
  const workspaceForm = useForm<{ name: string }>({
    defaultValues: { name: organization.name },
  });

  const saveProfile = useUpdateProfile();
  const saveWorkspace = useUpdateOrganization(organization.id);

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and {organization.name} workspace.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold">
                Your profile
              </CardTitle>
              <CardDescription>
                Update the name shown in your workspace.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="space-y-5"
            onSubmit={profileForm.handleSubmit((values) =>
              saveProfile.mutate(values, {
                onSuccess: (profile) => {
                  profileForm.reset({ name: profile.name });
                  toast.success("Profile updated");
                },
                onError: (error) => toast.error(error.message),
              }),
            )}
          >
            <Field>
              <FieldLabel htmlFor="settings-name">Display name</FieldLabel>
              <Input
                id="settings-name"
                autoComplete="name"
                maxLength={100}
                {...profileForm.register("name", {
                  required: "Enter your name.",
                  validate: (value) => !!value.trim() || "Enter your name.",
                  maxLength: {
                    value: 100,
                    message: "Use 100 characters or fewer.",
                  },
                })}
                aria-invalid={!!profileForm.formState.errors.name}
              />
              {profileForm.formState.errors.name && (
                <FieldError errors={[profileForm.formState.errors.name]} />
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-email">Email address</FieldLabel>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="settings-email"
                  value={user.email}
                  readOnly
                  className="pl-9"
                />
              </div>
              <FieldDescription>
                Email address is used to sign in and cannot be changed here.
              </FieldDescription>
            </Field>
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={saveProfile.isPending}
                disabled={!profileForm.formState.isDirty}
              >
                Save profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold">
                Workspace settings
              </CardTitle>
              <CardDescription>
                Control the name and identity for this organization.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <form
            className="space-y-5"
            onSubmit={workspaceForm.handleSubmit((values) =>
              saveWorkspace.mutate(values, {
                onSuccess: (updated) => {
                  workspaceForm.reset({ name: updated.name });
                  toast.success("Workspace updated");
                  router.replace(`/${encodeURIComponent(updated.slug)}/dashboard/settings`);
                },
                onError: (error) => toast.error(error.message),
              }),
            )}
          >
            <Field>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input
                id="workspace-name"
                maxLength={120}
                {...workspaceForm.register("name", {
                  required: "Enter a workspace name.",
                  validate: (value) =>
                    !!value.trim() || "Enter a workspace name.",
                  maxLength: {
                    value: 120,
                    message: "Use 120 characters or fewer.",
                  },
                })}
                readOnly={!isOwner}
                aria-invalid={!!workspaceForm.formState.errors.name}
              />
              {!isOwner && (
                <FieldDescription>
                  Only workspace owners can change this name.
                </FieldDescription>
              )}
              {workspaceForm.formState.errors.name && (
                <FieldError errors={[workspaceForm.formState.errors.name]} />
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-url">Workspace URL</FieldLabel>
              <Input
                id="workspace-url"
                value={`/${organization.slug}`}
                readOnly
                className="font-mono"
              />
              <FieldDescription>
                Renaming the workspace updates this URL. After saving, you’ll
                be redirected to the new address.
              </FieldDescription>
            </Field>
            <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
              <p className="text-sm text-muted-foreground">
                Your role{" "}
                <span className="ml-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  {isOwner ? "Owner" : "Member"}
                </span>
              </p>
              {isOwner && (
                <Button
                  type="submit"
                  loading={saveWorkspace.isPending}
                  disabled={!workspaceForm.formState.isDirty}
                >
                  Save workspace
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
