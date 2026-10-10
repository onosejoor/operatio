"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@operatio/ui/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@operatio/ui/components/ui/dialog";
import { Switch } from "@operatio/ui/components/ui/switch";
import { Input } from "@operatio/ui/components/ui/input";
import { Button } from "@operatio/ui/components/ui/button";
import { toast } from "@operatio/ui/components/ui/sonner";
import type {
  CreateMonitorInput,
  MonitorDetail,
  UpdateMonitorInput,
} from "../api/monitors";
import { useCreateMonitor, useUpdateMonitor } from "../hooks/dashboard-queries";

interface MonitorDialogProps {
  organizationId: string;
  monitor?: MonitorDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MonitorFormValues = Pick<
  CreateMonitorInput,
  "name" | "url" | "isPublic"
> & {
  intervalMinutes: number;
  timeoutSeconds: number;
  isActive: boolean;
};

const createValues: MonitorFormValues = {
  name: "",
  url: "",
  intervalMinutes: 1,
  timeoutSeconds: 10,
  isPublic: true,
  isActive: true,
};

function isValidMonitorUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      "Enter a web address starting with http:// or https://."
    );
  } catch {
    return "Enter a valid website or API address (for example: https://example.com).";
  }
}

export function MonitorDialog({
  organizationId,
  monitor,
  open,
  onOpenChange,
}: MonitorDialogProps) {
  const isEditing = !!monitor;
  const createMonitor = useCreateMonitor(organizationId);
  const updateMonitor = useUpdateMonitor(organizationId, monitor?.id ?? "");
  const isPending = isEditing
    ? updateMonitor.isPending
    : createMonitor.isPending;
  const values = useMemo<MonitorFormValues>(
    () =>
      monitor
        ? {
            name: monitor.name,
            url: monitor.url,
            // Convert seconds from backend to minutes for customer-friendly UI (minimum 0.5 min = 30s)
            intervalMinutes: Math.max(
              0.5,
              Math.round((monitor.interval / 60) * 10) / 10,
            ),
            timeoutSeconds: monitor.timeout / 1000,
            isPublic: monitor.isPublic,
            isActive: monitor.isActive,
          }
        : createValues,
    [monitor],
  );
  const form = useForm<MonitorFormValues>({
    defaultValues: values,
    values,
    mode: "onBlur",
  });
  const idPrefix = isEditing ? "edit-monitor" : "add-monitor";

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
    if (!nextOpen) form.reset(values);
  }

  function onSubmit(input: MonitorFormValues) {
    // Convert minutes into seconds (integer between 30 and 3600 seconds)
    const intervalSeconds = Math.min(
      3600,
      Math.max(30, Math.round(input.intervalMinutes * 60)),
    );

    if (!monitor) {
      const payload: CreateMonitorInput = {
        name: input.name.trim(),
        url: input.url.trim(),
        interval: intervalSeconds,
        timeout: input.timeoutSeconds * 1000,
        isPublic: input.isPublic,
      };
      createMonitor.mutate(payload, {
        onSuccess: () => {
          toast.success("Monitor added");
          form.reset(createValues);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      });
      return;
    }

    const changes: UpdateMonitorInput = {};
    const name = input.name.trim();
    const url = input.url.trim();
    if (name !== monitor.name) changes.name = name;
    if (url !== monitor.url) changes.url = url;
    if (intervalSeconds !== monitor.interval)
      changes.interval = intervalSeconds;
    const timeout = input.timeoutSeconds * 1000;
    if (timeout !== monitor.timeout) changes.timeout = timeout;
    if (input.isPublic !== monitor.isPublic) changes.isPublic = input.isPublic;
    if (input.isActive !== monitor.isActive) changes.isActive = input.isActive;

    if (Object.keys(changes).length === 0) {
      toast.info("No monitor settings were changed");
      onOpenChange(false);
      return;
    }

    updateMonitor.mutate(changes, {
      onSuccess: () => {
        toast.success("Monitor updated");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit monitor" : "Add a new monitor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update check settings and web address for ${monitor.name}.`
              : "Keep an eye on your website or API so you know immediately when it goes down."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={`${idPrefix}-form`}
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup className="gap-4">
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "Give your monitor a friendly name.",
                maxLength: {
                  value: 120,
                  message: "Monitor names must be 120 characters or fewer.",
                },
                validate: (value) =>
                  !!value.trim() || "Give your monitor a friendly name.",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${idPrefix}-name`}>
                    Friendly name
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${idPrefix}-name`}
                    placeholder="e.g. Main Website or Customer API"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    maxLength={120}
                  />
                  <FieldDescription>
                    A simple name to easily identify what you are checking.
                  </FieldDescription>
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
                required: "Enter the web address to check.",
                validate: isValidMonitorUrl,
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${idPrefix}-url`}>
                    Web address (URL)
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${idPrefix}-url`}
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="https://example.com"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    The page or API endpoint to check automatically.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="intervalMinutes"
                control={form.control}
                rules={{
                  validate: (value) =>
                    (value >= 0.5 && value <= 60) ||
                    "Check frequency must be between 1 and 60 minutes.",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${idPrefix}-interval`}>
                      Check every
                    </FieldLabel>
                    <div className="relative flex items-center">
                      <Input
                        {...field}
                        id={`${idPrefix}-interval`}
                        type="number"
                        min={0.5}
                        max={60}
                        step={0.5}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const val = event.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
                        mins
                      </span>
                    </div>
                    <FieldDescription>
                      How often we check (e.g. 1 min, 5 mins).
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="timeoutSeconds"
                control={form.control}
                rules={{
                  validate: (value) =>
                    (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 60) ||
                    "Timeout must be between 1 and 60 seconds.",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${idPrefix}-timeout`}>
                      Alert timeout
                    </FieldLabel>
                    <div className="relative flex items-center">
                      <Input
                        {...field}
                        id={`${idPrefix}-timeout`}
                        type="number"
                        min={1}
                        max={60}
                        step={1}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const val = event.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
                        secs
                      </span>
                    </div>
                    <FieldDescription>
                      Mark as down if no response in this time.
                    </FieldDescription>
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
                  <Switch
                    id={`${idPrefix}-public`}
                    name={field.name}
                    checked={field.value}
                    onBlur={field.onBlur}
                    onCheckedChange={field.onChange}
                    ref={field.ref}
                    aria-label="Show on public status pages"
                  />
                  <div className="space-y-1">
                    <FieldLabel htmlFor={`${idPrefix}-public`}>
                      Show on public status page
                    </FieldLabel>
                    <FieldDescription>
                      Allow customers to see this service's status on your
                      public page.
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />

            {isEditing && (
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="items-start gap-3">
                    <Switch
                      id={`${idPrefix}-active`}
                      name={field.name}
                      checked={field.value}
                      onBlur={field.onBlur}
                      onCheckedChange={field.onChange}
                      ref={field.ref}
                      aria-label="Turn monitoring on or off"
                    />
                    <div className="space-y-1">
                      <FieldLabel htmlFor={`${idPrefix}-active`}>
                        Active monitoring
                      </FieldLabel>
                      <FieldDescription>
                        Turn this off if you need to temporarily pause automatic
                        checks.
                      </FieldDescription>
                    </div>
                  </Field>
                )}
              />
            )}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={`${idPrefix}-form`} loading={isPending}>
            {isEditing ? "Save changes" : "Add monitor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
