"use client";

import { ThemeProvider } from "next-themes";
import { EmployeeProvider } from "@/components/providers/EmployeeContext";
import { LanguageProvider } from "@/lib/language/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark", "teal"]}
    >
      <LanguageProvider>
        <EmployeeProvider>{children}</EmployeeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
