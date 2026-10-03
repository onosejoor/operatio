"use client";

import { Controller, useForm } from "react-hook-form";
import type { StatusPageSummary } from "@app/features/status/api/status-pages";
import type {
  MaintenanceWindow,
  MaintenanceWindowInput,
} from "../api/maintenance";
import {
  useCreateMaintenanceWindow,
  useUpdateMaintenanceWindow,
} from "../hooks/maintenance-queries";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@operatio/ui/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@operatio/ui/components/ui/field";
import { Input } from "@operatio/ui/components/ui/input";
import { Textarea } from "@operatio/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@operatio/ui/components/ui/select";
import { toast } from "@operatio/ui/components/ui/sonner";

type FormValues = Omit<MaintenanceWindowInput, "startsAt" | "endsAt"> & {
  startsAt: string;
  endsAt: string;
};

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function defaultDateTimes() {
  const starts = new Date();
  starts.setMinutes(0, 0, 0);
  starts.setHours(starts.getHours() + 1);
  const ends = new Date(starts.getTime() + 60 * 60 * 1000);
  return {
    startsAt: localDateTime(starts.toISOString()),
    endsAt: localDateTime(ends.toISOString()),
  };
}

export function MaintenanceWindowDialog({
  organizationId,
  statusPages,
  window,
  open,
  onOpenChange,
}: {
  organizationId: string;
  statusPages: StatusPageSummary[];
  window?: MaintenanceWindow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateMaintenanceWindow(organizationId);
  const update = useUpdateMaintenanceWindow(organizationId);
  const dates = defaultDateTimes();
  const form = useForm<FormValues>({
    defaultValues: window
      ? {
          title: window.title,
          description: window.description ?? "",
          statusPageId: window.statusPage.id,
          startsAt: localDateTime(window.startsAt),
          endsAt: localDateTime(window.endsAt),
        }
      : { title: "", description: "", statusPageId: "", ...dates },
    mode: "onBlur",
  });
  const saving = create.isPending || update.isPending;

  function submit(values: FormValues) {
    const input: MaintenanceWindowInput = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      statusPageId: values.statusPageId,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
    };
    if (window) {
      update.mutate(
        { id: window.id, input },
        {
          onSuccess: () => {
            toast.success("Maintenance updated");
            onOpenChange(false);
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success("Maintenance scheduled");
          form.reset({
            title: "",
            description: "",
            statusPageId: "",
            ...defaultDateTimes(),
          });
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {window ? "Edit maintenance" : "Schedule maintenance"}
          </DialogTitle>
          <DialogDescription>
            The status page will show this notice during the next 30 days. Make
            the page public when you are ready to notify visitors.
          </DialogDescription>
        </DialogHeader>
        <form
          id="maintenance-window-form"
          className="space-y-5"
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          <FieldGroup className="gap-4">
            <Controller
              name="title"
              control={form.control}
              rules={{
                required: "Add a short title.",
                maxLength: {
                  value: 120,
                  message: "Use 120 characters or fewer.",
                },
                validate: (value) => !!value.trim() || "Add a short title.",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="maintenance-title">
                    Maintenance title
                  </FieldLabel>
                  <Input
                    {...field}
                    id="maintenance-title"
                    placeholder="Database upgrade"
                    maxLength={120}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="statusPageId"
              control={form.control}
              rules={{
                required: "Choose the public status page for this notice.",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Status page</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={statusPages.map((page) => ({
                      value: page.id,
                      label: `${page.name} · ${page.isPublic ? "Public" : "Private"}`,
                    }))}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Choose a status page" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                          {page.isPublic ? " · Public" : " · Private"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              rules={{
                maxLength: {
                  value: 1000,
                  message: "Use 1,000 characters or fewer.",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="maintenance-description">
                    What should visitors know?
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="maintenance-description"
                    placeholder="Some services may be temporarily unavailable while we complete this work."
                    maxLength={1000}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    This appears on the public status page.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="startsAt"
                control={form.control}
                rules={{ required: "Choose when maintenance starts." }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="maintenance-start">Starts</FieldLabel>
                    <Input
                      {...field}
                      id="maintenance-start"
                      type="datetime-local"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="endsAt"
                control={form.control}
                rules={{
                  required: "Choose when maintenance ends.",
                  validate: (value) =>
                    new Date(value).getTime() >
                      new Date(form.getValues("startsAt")).getTime() ||
                    "End time must be after the start.",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="maintenance-end">Ends</FieldLabel>
                    <Input
                      {...field}
                      id="maintenance-end"
                      type="datetime-local"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Times use your browser’s local timezone.
            </p>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="maintenance-window-form"
            loading={saving}
            disabled={statusPages.length === 0}
          >
            {window ? "Save changes" : "Schedule maintenance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
