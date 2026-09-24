"use client";

import { ThemeProvider } from "next-themes";
import { EmployeeProvider } from "@/components/providers/EmployeeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark", "teal"]}
    >
      <EmployeeProvider>{children}</EmployeeProvider>
    </ThemeProvider>
  );
}
