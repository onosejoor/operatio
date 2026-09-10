"use client";

import { Bell } from "lucide-react";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@operatio/ui/components/dialog";

interface SubscribeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  statusPageName: string;
}

export function SubscribeDialog({
  isOpen,
  onClose,
  statusPageName,
}: SubscribeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
              <Bell className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Subscribe to Updates
              </DialogTitle>
              <DialogDescription className="text-xs">
                Real-time operational alerts for {statusPageName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            Notification Subscriptions Coming Soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Automated alerts via email, webhook, and SMS will be enabled in an upcoming release.
          </p>
        </div>

        <DialogFooter className="pt-2 border-t border-border/40 sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
