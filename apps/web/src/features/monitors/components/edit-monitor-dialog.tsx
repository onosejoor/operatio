"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@operatio/ui/components/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@operatio/ui/components/dialog";
import { Checkbox } from "@operatio/ui/components/ui/checkbox";
import { Input } from "@operatio/ui/components/ui/input";
import { Button } from "@operatio/ui/components/ui/button";
import { toast } from "@operatio/ui/components/ui/sonner";
import type { MonitorDetail, UpdateMonitorInput } from "../api/monitors";
import { useUpdateMonitor } from "../hooks/dashboard-queries";

interface EditMonitorDialogProps {
  organizationId: string;
  monitor: MonitorDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isValidMonitorUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (
      (url.protocol === "http:" || url.protocol === "https:") ||
      "Enter an HTTP or HTTPS URL."
    );
  } catch {
    return "Enter a valid URL, including https://.";
  }
}

export function EditMonitorDialog({
  organizationId,
  monitor,
  open,
  onOpenChange,
}: EditMonitorDialogProps) {
  const updateMonitor = useUpdateMonitor(organizationId, monitor.id);
  const values = useMemo<UpdateMonitorInput>(
    () => ({
      name: monitor.name,
      url: monitor.url,
      interval: monitor.interval,
      timeout: monitor.timeout,
      isPublic: monitor.isPublic,
    }),
    [monitor],
  );
  const form = useForm<UpdateMonitorInput>({
    defaultValues: values,
    values,
    mode: "onBlur",
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && updateMonitor.isPending) return;
    onOpenChange(nextOpen);
  }

  function onSubmit(input: UpdateMonitorInput) {
    updateMonitor.mutate(
      {
        ...input,
        name: input.name?.trim(),
        url: input.url?.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Monitor updated");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit monitor</DialogTitle>
          <DialogDescription>
            Update the endpoint and check settings for {monitor.name}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-monitor-form"
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup className="gap-4">
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "Enter a name for this monitor.",
                maxLength: {
                  value: 120,
                  message: "Monitor names must be 120 characters or fewer.",
                },
                validate: (value) =>
                  !!value?.trim() || "Enter a name for this monitor.",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-monitor-name">Name</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="edit-monitor-name"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    maxLength={120}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="url"
              control={form.control}
              rules={{ required: "Enter the URL to monitor.", validate: isValidMonitorUrl }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-monitor-url">URL</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="edit-monitor-url"
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="interval"
                control={form.control}
                rules={{
                  validate: (value) =>
                    (Number.isInteger(value) && value >= 30 && value <= 3600) ||
                    "Choose an interval from 30 to 3600 seconds.",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-monitor-interval">
                      Check interval
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-monitor-interval"
                      type="number"
                      min={30}
                      max={3600}
                      step={1}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Seconds (30–3600)</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="timeout"
                control={form.control}
                rules={{
                  validate: (value) =>
                    (Number.isInteger(value) && value >= 1000 && value <= 60_000) ||
                    "Choose a timeout from 1000 to 60000 milliseconds.",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-monitor-timeout">Timeout</FieldLabel>
                    <Input
                      {...field}
                      id="edit-monitor-timeout"
                      type="number"
                      min={1000}
                      max={60_000}
                      step={1}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Milliseconds (1000–60000)</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="isPublic"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="items-start gap-3">
                  <Checkbox
                    id="edit-monitor-public"
                    name={field.name}
                    checked={field.value ?? false}
                    onBlur={field.onBlur}
                    onCheckedChange={field.onChange}
                    ref={field.ref}
                    aria-label="Allow this monitor on public status pages"
                  />
                  <div className="space-y-1">
                    <FieldLabel htmlFor="edit-monitor-public">
                      Allow on public status pages
                    </FieldLabel>
                    <FieldDescription>
                      This monitor only appears publicly when added to a public
                      status page.
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={updateMonitor.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-monitor-form"
            loading={updateMonitor.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
