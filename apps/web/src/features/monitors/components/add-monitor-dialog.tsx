"use client";

import { Controller, useForm } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@operatio/ui/components/field";
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
import { useCreateMonitor } from "@app/features/monitors/hooks/dashboard-queries";

interface AddMonitorValues {
  name: string;
  url: string;
  interval: number;
  timeout: number;
  isPublic: boolean;
}

interface AddMonitorDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultValues: AddMonitorValues = {
  name: "",
  url: "",
  interval: 60,
  timeout: 10_000,
  isPublic: true,
};

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

export function AddMonitorDialog({
  organizationId,
  open,
  onOpenChange,
}: AddMonitorDialogProps) {
  const createMonitor = useCreateMonitor(organizationId);
  const form = useForm<AddMonitorValues>({ defaultValues, mode: "onBlur" });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && createMonitor.isPending) return;
    onOpenChange(nextOpen);
    if (!nextOpen) form.reset();
  }

  function onSubmit(values: AddMonitorValues) {
    createMonitor.mutate(
      {
        ...values,
        name: values.name.trim(),
        url: values.url.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Monitor added");
          form.reset();
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
          <DialogTitle>Add monitor</DialogTitle>
          <DialogDescription>
            Track an HTTP or HTTPS endpoint for availability and response time.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-monitor-form"
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
                  !!value.trim() || "Enter a name for this monitor.",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="add-monitor-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="add-monitor-name"
                    placeholder="Production API"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    maxLength={120}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="url"
              control={form.control}
              rules={{
                required: "Enter the URL to monitor.",
                validate: isValidMonitorUrl,
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="add-monitor-url">URL</FieldLabel>
                  <Input
                    {...field}
                    id="add-monitor-url"
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="https://api.example.com/health"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                    <FieldLabel htmlFor="add-monitor-interval">
                      Check interval
                    </FieldLabel>
                    <Input
                      {...field}
                      id="add-monitor-interval"
                      type="number"
                      min={30}
                      max={3600}
                      step={1}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Seconds (30–3600)</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    <FieldLabel htmlFor="add-monitor-timeout">
                      Timeout
                    </FieldLabel>
                    <Input
                      {...field}
                      id="add-monitor-timeout"
                      type="number"
                      min={1000}
                      max={60_000}
                      step={1}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Milliseconds (1000–60000)</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    id="add-monitor-public"
                    name={field.name}
                    checked={field.value}
                    onBlur={field.onBlur}
                    onCheckedChange={field.onChange}
                    ref={field.ref}
                    aria-label="Allow this monitor on public status pages"
                  />
                  <div className="space-y-1">
                    <FieldLabel htmlFor="add-monitor-public">
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
            disabled={createMonitor.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-monitor-form"
            loading={createMonitor.isPending}
          >
            Add monitor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
