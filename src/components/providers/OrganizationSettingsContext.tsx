"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getOrganizationSettingsDB } from "@/lib/actions/actionsSettings";

export interface PaymentSettings {
  id: number;
  promptPayName?: string | null;
  promptPayNumber?: string | null;
  qrImageUrl?: string | null;
  creditCardFee?: number | null;
  organizationId: number;
}

export interface OrganizationSettings {
  id?: number;
  currencyCode: string;
  openTime?: string | null;
  closeTime?: string | null;
  isManualOpenClose: boolean;
  phone?: string | null;
  address?: string | null;
  receiptFooter?: string | null;
  taxId?: string | null;
  organizationId: number;
  payments_settings?: PaymentSettings | null;
}

interface OrgSettingsContextType {
  settings: OrganizationSettings | null;
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const OrganizationSettingsContext = createContext<
  OrgSettingsContextType | undefined
>(undefined);

export function OrganizationSettingsProvider({
  children,
  organizationId,
}: {
  children: ReactNode;
  organizationId: number;
}) {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const res = await getOrganizationSettingsDB(organizationId);
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch org settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [organizationId]);

  const formatCurrency = (amount: number) => {
    const code = settings?.currencyCode || "LAK";
    return `${amount.toLocaleString()} ${code}`;
  };

  return (
    <OrganizationSettingsContext.Provider
      value={{
        settings,
        isLoading,
        refetchSettings: fetchSettings,
        formatCurrency,
      }}
    >
      {children}
    </OrganizationSettingsContext.Provider>
  );
}

export function useOrgSettings() {
  const context = useContext(OrganizationSettingsContext);
  if (!context) {
    throw new Error(
      "useOrgSettings must be used within an OrganizationSettingsProvider",
    );
  }
  return context;
}
