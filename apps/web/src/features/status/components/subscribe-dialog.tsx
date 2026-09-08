"use client";

import { useState, type FormEvent } from "react";
import { Mail, Webhook, MessageSquare, Check, Bell } from "lucide-react";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@operatio/ui/components/dialog";
import { Tabs, TabsList, TabsTrigger } from "@operatio/ui/components/tabs";

interface SubscribeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  statusPageName: string;
}

type Channel = "email" | "webhook" | "sms";

interface FormState {
  channel: Channel;
  target: string;
  isSubmitting: boolean;
  isSuccess: boolean;
}

const initialFormState: FormState = {
  channel: "email",
  target: "",
  isSubmitting: false,
  isSuccess: false,
};

const channelConfigByChannel = {
  email: {
    icon: Mail,
    label: "Email",
    inputLabel: "Email address",
    type: "email",
    placeholder: "infra-team@company.com",
    helpText:
      "Receive notifications for incident status updates and resolutions.",
  },
  webhook: {
    icon: Webhook,
    label: "Webhook",
    inputLabel: "Webhook endpoint URL",
    type: "url",
    placeholder: "https://api.yourdomain.com/webhooks/status",
    helpText:
      "HTTP POST payloads signed with real-time incident event payloads.",
  },
  sms: {
    icon: MessageSquare,
    label: "SMS",
    inputLabel: "Phone number (E.164)",
    type: "tel",
    placeholder: "+1 (555) 000-0000",
    helpText: "Direct SMS alerts sent immediately during critical outages.",
  },
} satisfies Record<Channel, object>;

export function SubscribeDialog({
  isOpen,
  onClose,
  statusPageName,
}: SubscribeDialogProps) {
  const [form, setForm] = useState<FormState>(initialFormState);

  const handleChannelChange = (channel: Channel) => {
    setForm((prev) => ({ ...prev, channel, target: "", isSuccess: false }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, isSubmitting: true }));

    setTimeout(() => {
      setForm((prev) => ({ ...prev, isSubmitting: false, isSuccess: true }));
      setTimeout(() => {
        setForm(initialFormState);
        onClose();
      }, 1500);
    }, 500);
  };

  const channelConfig = channelConfigByChannel[form.channel];

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

        <Tabs
          value={form.channel}
          onValueChange={(value) => handleChannelChange(value as Channel)}
          className="mt-2"
        >
          <TabsList className="w-full">
            {(["email"] as const).map((channel) => {
              const Icon = channelConfigByChannel[channel].icon;

              return (
                <TabsTrigger key={channel} value={channel} className="py-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {channelConfigByChannel[channel].label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {form.isSuccess ? (
          <div className="my-6 flex flex-col items-center justify-center text-center">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-status-operational/15 text-status-operational">
              <Check className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Subscribed successfully
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Alerts will be dispatched to your configured {form.channel}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {channelConfig.inputLabel}
              </label>
              <input
                type={channelConfig.type}
                required
                value={form.target}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, target: e.target.value }))
                }
                placeholder={channelConfig.placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {channelConfig.helpText}
              </p>
            </div>

            <DialogFooter className="pt-2 border-t border-border/40 sm:justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={form.isSubmitting || !form.target.trim()}
              >
                {form.isSubmitting ? "Subscribing..." : "Subscribe to alerts"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
