"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@operatio/ui/components/ui/dialog";
import { Button } from "@operatio/ui/components/ui/button";
import { Input } from "@operatio/ui/components/ui/input";
import { Textarea } from "@operatio/ui/components/ui/textarea";
import { Label } from "@operatio/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@operatio/ui/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@operatio/ui/components/ui/dropdown-menu";
import {
  useCreateIncident,
  useMonitors,
} from "@app/features/monitors/hooks/dashboard-queries";
import { useStatusPages } from "@app/features/status/hooks/status-pages-queries";
import { toast } from "sonner";
import { Lock, Globe, ChevronsUpDown } from "lucide-react";

interface CreateIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function CreateIncidentDialog({
  open,
  onOpenChange,
  organizationId,
}: CreateIncidentDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"MINOR" | "MAJOR" | "CRITICAL">("MINOR");
  const [status, setStatus] = useState<
    "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED"
  >("INVESTIGATING");
  const [monitorId, setMonitorId] = useState<string>("none");
  const [isInternal, setIsInternal] = useState(true);
  const [selectedStatusPageIds, setSelectedStatusPageIds] = useState<string[]>([]);

  const monitorsQuery = useMonitors(organizationId);
  const statusPagesQuery = useStatusPages(organizationId);
  const createMutation = useCreateIncident(organizationId);

  const statusPages = statusPagesQuery.data ?? [];

  const toggleStatusPage = (id: string) => {
    setSelectedStatusPageIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setSeverity("MINOR");
    setStatus("INVESTIGATING");
    setMonitorId("none");
    setIsInternal(true);
    setSelectedStatusPageIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an incident title");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        message: message.trim() || undefined,
        severity,
        status,
        monitorId: monitorId === "none" ? undefined : monitorId,
        isInternal,
        statusPageIds:
          !isInternal && selectedStatusPageIds.length > 0
            ? selectedStatusPageIds
            : undefined,
      });

      toast.success(isInternal ? "Issue reported" : "Incident published");
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Failed to create incident";
      toast.error(errMessage);
    }
  };

  const targetPagesLabel =
    selectedStatusPageIds.length === 0
      ? "All status pages"
      : selectedStatusPageIds.length === 1
        ? statusPages.find((p) => p.id === selectedStatusPageIds[0])?.name ??
          "1 selected"
        : `${selectedStatusPageIds.length} status pages selected`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="incident-title">Title</Label>
            <Input
              id="incident-title"
              placeholder="e.g. Email notifications delayed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Visibility toggle */}
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsInternal(true)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isInternal
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Internal
              </button>
              <button
                type="button"
                onClick={() => setIsInternal(false)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !isInternal
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Public
              </button>
            </div>
          </div>

          {/* Target Status Pages Multi-Select (shadcn DropdownMenu with CheckboxItems) */}
          {!isInternal && statusPages.length > 0 && (
            <div className="space-y-1.5">
              <Label>Target status pages</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs hover:bg-accent hover:text-accent-foreground font-normal">
                  <span className="truncate">{targetPagesLabel}</span>
                  <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--anchor-width]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                      Select target pages (leave empty for all)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statusPages.map((page) => {
                      const isChecked = selectedStatusPageIds.includes(page.id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={page.id}
                          checked={isChecked}
                          onCheckedChange={() => toggleStatusPage(page.id)}
                          className="text-xs"
                        >
                          {page.name}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Severity & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select
                value={severity}
                onValueChange={(val) =>
                  setSeverity(val as "MINOR" | "MAJOR" | "CRITICAL")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(val) =>
                  setStatus(
                    val as
                      | "INVESTIGATING"
                      | "IDENTIFIED"
                      | "MONITORING"
                      | "RESOLVED",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="IDENTIFIED">Identified</SelectItem>
                  <SelectItem value="MONITORING">Monitoring</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Related Monitor */}
          <div className="space-y-1.5">
            <Label>Affected monitor</Label>
            <Select value={monitorId} onValueChange={setMonitorId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(monitorsQuery.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="incident-msg">Message</Label>
            <Textarea
              id="incident-msg"
              placeholder="What's happening?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[72px] resize-none text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting…" : "Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
