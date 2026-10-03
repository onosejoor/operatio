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
  "name" | "url" | "interval" | "isPublic"
> & { timeoutSeconds: number; isActive: boolean };

const createValues: MonitorFormValues = {
  name: "",
  url: "",
  interval: 60,
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
      "Enter an HTTP or HTTPS URL."
    );
  } catch {
    return "Enter a valid URL, including https://.";
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
            interval: monitor.interval,
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
    if (!monitor) {
      const payload: CreateMonitorInput = {
        name: input.name.trim(),
        url: input.url.trim(),
        interval: input.interval,
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
    if (input.interval !== monitor.interval) changes.interval = input.interval;
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
            {isEditing ? "Edit monitor" : "Add monitor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the endpoint and check settings for ${monitor.name}.`
              : "Track an HTTP or HTTPS endpoint for availability and response time."}
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
                  <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={`${idPrefix}-name`}
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
                  <FieldLabel htmlFor={`${idPrefix}-url`}>URL</FieldLabel>
                  <Input
                    {...field}
                    id={`${idPrefix}-url`}
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
                    <FieldLabel htmlFor={`${idPrefix}-interval`}>
                      Check interval
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${idPrefix}-interval`}
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
                name="timeoutSeconds"
                control={form.control}
                rules={{
                  validate: (value) =>
                    (Number.isInteger(value) && value >= 1 && value <= 60) ||
                    "Choose a timeout from 1 to 60 seconds.",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${idPrefix}-timeout`}>
                      Timeout
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${idPrefix}-timeout`}
                      type="number"
                      min={1}
                      max={60}
                      step={1}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Seconds (1–60)</FieldDescription>
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
                    aria-label="Allow this monitor on public status pages"
                  />
                  <div className="space-y-1">
                    <FieldLabel htmlFor={`${idPrefix}-public`}>
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
                      aria-label="Enable monitor checks"
                    />
                    <div className="space-y-1">
                      <FieldLabel htmlFor={`${idPrefix}-active`}>
                        Monitor enabled
                      </FieldLabel>
                      <FieldDescription>
                        Turn this off to pause scheduled checks. Turn it back on
                        to resume monitoring.
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
