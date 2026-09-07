"use client";

import { ThemeProvider } from "@operatio/ui/components/theme-provider";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </>
  );
}
