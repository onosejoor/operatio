"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@operatio/ui/components/ui/button";
import { Input } from "@operatio/ui/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@operatio/ui/components/ui/card";
import { toast } from "@operatio/ui/components/ui/sonner";
import { useUnsubscribeStatusPage } from "../hooks/use-public-status";
import type { PublicStatusResponse } from "../types/public-status";

interface UnsubscribeViewProps {
  slug: string;
  initialData?: PublicStatusResponse;
  initialEmail?: string;
}

export function UnsubscribeView({
  slug,
  initialData,
  initialEmail = "",
}: UnsubscribeViewProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isSuccess, setIsSuccess] = useState(false);
  const unsubscribeMutation = useUnsubscribeStatusPage(slug);

  const statusPageName = initialData?.statusPage.name || "Status Page";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    unsubscribeMutation.mutate(trimmed, {
      onSuccess: (res) => {
        setIsSuccess(true);
        toast.success(res?.message || "Successfully unsubscribed.");
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to unsubscribe.";
        toast.error(message);
      },
    });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
              <BellOff className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Unsubscribe from updates
              </CardTitle>
              <CardDescription className="text-xs">
                {statusPageName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4 pt-2 text-center">
            <div className="rounded-lg border border-status-operational/30 bg-status-operational/5 p-6">
              <div className="flex justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-status-operational" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                You're unsubscribed
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{email}</strong> will no
                longer receive incident alerts or maintenance notifications for{" "}
                {statusPageName}.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/status/${slug}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-full gap-2",
                })}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Status Page
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="unsubscribe-email"
                  className="text-xs font-medium text-foreground"
                >
                  Email address
                </label>
                <Input
                  id="unsubscribe-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={unsubscribeMutation.isPending}
                  autoFocus={!initialEmail}
                />
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Enter the email address you used when subscribing to{" "}
                  {statusPageName}.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="w-full"
                loading={unsubscribeMutation.isPending}
                disabled={!email.trim() || unsubscribeMutation.isPending}
              >
                Unsubscribe
              </Button>
              <Link
                href={`/status/${slug}`}
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "w-full text-xs text-muted-foreground",
                })}
              >
                Cancel and return to status page
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </main>
  );
}
