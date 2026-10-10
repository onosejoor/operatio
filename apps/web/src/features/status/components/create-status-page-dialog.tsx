"use client";

import { Controller, useForm } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@operatio/ui/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@operatio/ui/components/ui/dialog";
import { Button } from "@operatio/ui/components/ui/button";
import { Input } from "@operatio/ui/components/ui/input";
import { Switch } from "@operatio/ui/components/ui/switch";
import { Textarea } from "@operatio/ui/components/ui/textarea";
import { toast } from "@operatio/ui/components/ui/sonner";
import { getPublicStatusUrl } from "@app/features/status/lib/public-status-url";
import { useCreateStatusPage, useUpdateStatusPage } from "../hooks/status-pages-queries";
import type { StatusPageInput, StatusPageSummary } from "../api/status-pages";

interface StatusPageDialogProps {
  organizationId: string;
  page?: StatusPageSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaults: StatusPageInput = {
  name: "",
  slug: "",
  description: "",
  isPublic: false,
  brandColor: "#2563eb",
};

export function StatusPageDialog({ organizationId, page, open, onOpenChange }: StatusPageDialogProps) {
  const create = useCreateStatusPage(organizationId);
  const update = useUpdateStatusPage(organizationId, page?.id ?? "");
  const form = useForm<StatusPageInput>({
    defaultValues: page
      ? { name: page.name, slug: page.slug, description: page.description ?? "", isPublic: page.isPublic, brandColor: page.brandColor ?? defaults.brandColor }
      : defaults,
    mode: "onBlur",
  });
  const isPending = create.isPending || update.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
    if (!nextOpen) form.reset(page
      ? { name: page.name, slug: page.slug, description: page.description ?? "", isPublic: page.isPublic, brandColor: page.brandColor ?? defaults.brandColor }
      : defaults);
  }

  function onSubmit(values: StatusPageInput) {
    const payload: StatusPageInput = {
      name: values.name.trim(),
      slug: values.slug.trim().toLowerCase(),
      description: values.description?.trim() || "",
      isPublic: values.isPublic,
      brandColor: values.brandColor,
    };
    if (!page) {
      create.mutate(payload, {
        onSuccess: () => { toast.success("Status page created"); form.reset(defaults); onOpenChange(false); },
        onError: (error) => toast.error(error.message),
      });
      return;
    }

    const changed = Object.fromEntries(
      (Object.keys(payload) as (keyof StatusPageInput)[])
        .filter((key) => payload[key] !== (key === "description" ? (page.description ?? "") : key === "brandColor" ? (page.brandColor ?? defaults.brandColor) : page[key]))
        .map((key) => [key, payload[key]]),
    ) as Partial<StatusPageInput>;
    if (Object.keys(changed).length === 0) {
      onOpenChange(false);
      return;
    }
    update.mutate(changed, {
      onSuccess: () => { toast.success("Status page updated"); onOpenChange(false); },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{page ? "Edit status page" : "Create a status page"}</DialogTitle>
          <DialogDescription>
            {page
              ? "Change the appearance and web link for your public status page."
              : "Give your customers a clean, branded page where they can see live updates and service health."}
          </DialogDescription>
        </DialogHeader>
        <form id="status-page-form" className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <Controller name="name" control={form.control} rules={{ required: "Give your status page a name.", maxLength: { value: 120, message: "Use 120 characters or fewer." }, validate: (value) => !!value.trim() || "Give your status page a name." }} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="status-page-name">Company or service name</FieldLabel>
                <Input {...field} id="status-page-name" placeholder="e.g. Acme Status" maxLength={120} aria-invalid={fieldState.invalid} />
                <FieldDescription>The main title displayed at the top of your page.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="slug" control={form.control} rules={{ required: "Choose a web address for your page.", maxLength: { value: 100, message: "Use 100 characters or fewer." }, validate: (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim().toLowerCase()) || "Use lowercase letters, numbers, and hyphens." }} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="status-page-slug">Web address shortcut</FieldLabel>
                <Input {...field} id="status-page-slug" placeholder="acme" autoCapitalize="none" aria-invalid={fieldState.invalid} onChange={(event) => field.onChange(event.target.value.toLowerCase().replace(/\s+/g, "-"))} />
                <FieldDescription>Your customers will visit: <span className="font-medium text-foreground">{getPublicStatusUrl(form.watch("slug") || "your-company")}</span></FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="description" control={form.control} rules={{ maxLength: { value: 500, message: "Use 500 characters or fewer." } }} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="status-page-description">Welcome message</FieldLabel>
                <Textarea {...field} id="status-page-description" placeholder="Welcome! We keep this page updated with live status and maintenance notices." maxLength={500} aria-invalid={fieldState.invalid} />
                <FieldDescription>A short note shown to your visitors below the title.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="brandColor" control={form.control} rules={{ required: "Choose your brand color.", pattern: { value: /^#[0-9a-fA-F]{6}$/, message: "Enter a six-digit color code (e.g. #2563eb)." } }} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="status-page-color">Brand accent color</FieldLabel>
                <div className="flex items-center gap-3">
                  <Input {...field} id="status-page-color" type="color" className="h-10 w-14 cursor-pointer p-1" aria-label="Pick brand color" />
                  <Input value={field.value} onChange={field.onChange} className="max-w-36 font-mono uppercase" aria-label="Color hex code" />
                </div>
                <FieldDescription>The accent color used for headers and buttons on your status page.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="isPublic" control={form.control} render={({ field }) => (
              <Field orientation="horizontal" className="items-start gap-3">
                <Switch id="status-page-public" checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} ref={field.ref} aria-label="Make status page public" />
                <div className="space-y-1">
                  <FieldLabel htmlFor="status-page-public">Make page public</FieldLabel>
                  <FieldDescription>Turn on when you are ready to let anyone with the link view the page. Keep it off while setting things up.</FieldDescription>
                </div>
              </Field>
            )} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="status-page-form" loading={isPending}>{page ? "Save changes" : "Create page"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
