"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@operatio/ui/components/ui/button";
import { Input } from "@operatio/ui/components/ui/input";
import { toast } from "@operatio/ui/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@operatio/ui/components/ui/dialog";
import { useSubscribeStatusPage, useUnsubscribeStatusPage } from "../hooks/use-public-status";

interface SubscribeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  statusPageName: string;
  slug?: string;
  initialMode?: "subscribe" | "unsubscribe";
}

export function SubscribeDialog({
  isOpen,
  onClose,
  statusPageName,
  slug,
  initialMode = "subscribe",
}: SubscribeDialogProps) {
  const [mode, setMode] = useState<"subscribe" | "unsubscribe">(initialMode);
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const subscribeMutation = useSubscribeStatusPage(slug);
  const unsubscribeMutation = useUnsubscribeStatusPage(slug);

  const isPending =
    mode === "subscribe"
      ? subscribeMutation.isPending
      : unsubscribeMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode === "subscribe") {
      subscribeMutation.mutate(trimmed, {
        onSuccess: (res) => {
          setIsSuccess(true);
          toast.success(res?.message || "Subscribed successfully!");
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Failed to subscribe";
          toast.error(message);
        },
      });
    } else {
      unsubscribeMutation.mutate(trimmed, {
        onSuccess: (res) => {
          setIsSuccess(true);
          toast.success(res?.message || "Unsubscribed successfully!");
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Failed to unsubscribe";
          toast.error(message);
        },
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setIsSuccess(false);
      setEmail("");
      setMode(initialMode);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
              <Bell className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {mode === "subscribe"
                  ? "Get status notifications"
                  : "Unsubscribe from notifications"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {mode === "subscribe"
                  ? `Receive notifications when ${statusPageName} has updates.`
                  : `Stop receiving incident notifications for ${statusPageName}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSuccess ? (
          <div className="my-4 rounded-lg border border-status-operational/30 bg-status-operational/5 p-4 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-status-operational" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {mode === "subscribe"
                ? "You're subscribed!"
                : "You've been unsubscribed"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {mode === "subscribe" ? (
                <>
                  We'll send updates directly to{" "}
                  <strong className="text-foreground">{email}</strong> whenever
                  an incident is reported or resolved.
                </>
              ) : (
                <>
                  <strong className="text-foreground">{email}</strong> will no
                  longer receive alerts for this status page.
                </>
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label
                htmlFor="subscribe-email"
                className="text-xs font-medium text-foreground"
              >
                Your email address
              </label>
              <Input
                id="subscribe-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                {mode === "subscribe"
                  ? "We'll only email you when services go down or when maintenance is scheduled."
                  : "Enter the email address you previously used to subscribe."}
              </p>
            </div>

            <div className="text-[11px] text-muted-foreground">
              {mode === "subscribe" ? (
                <span>
                  Already subscribed?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("unsubscribe")}
                    className="text-foreground underline hover:text-primary transition-colors cursor-pointer"
                  >
                    Unsubscribe here
                  </button>
                </span>
              ) : (
                <span>
                  Want notifications instead?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("subscribe")}
                    className="text-foreground underline hover:text-primary transition-colors cursor-pointer"
                  >
                    Subscribe here
                  </button>
                </span>
              )}
            </div>

            <DialogFooter className="pt-2 border-t border-border/40 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant={mode === "unsubscribe" ? "destructive" : "default"}
                loading={isPending}
                disabled={!email.trim() || isPending}
              >
                {mode === "subscribe" ? "Subscribe" : "Unsubscribe"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {isSuccess && (
          <DialogFooter className="pt-2 border-t border-border/40 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
