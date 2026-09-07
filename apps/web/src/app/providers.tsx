"use client";

import { ThemeProvider } from "@operatio/ui/components/theme-provider";
import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@app/lib/query/client'

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  // Keep server requests isolated and preserve the browser cache across renders.
  if (typeof window === 'undefined') return createQueryClient()
  browserQueryClient ??= createQueryClient()
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
