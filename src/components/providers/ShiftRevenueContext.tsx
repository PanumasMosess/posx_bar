"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useShift } from "./ShiftContext";
import { getShiftSalesSummaryDB } from "@/lib/actions/actionsShiftRevenue";

interface SalesSummary {
  cashSales: number;
  qrSales: number;
  cardSales: number;
  memberSales: number;
  totalRevenue: number;
}

interface ShiftRevenueContextType {
  salesSummary: SalesSummary;
  isLoadingRevenue: boolean;
  refreshRevenue: () => Promise<void>;
}

const defaultSummary: SalesSummary = {
  cashSales: 0,
  qrSales: 0,
  cardSales: 0,
  memberSales: 0,
  totalRevenue: 0,
};

const ShiftRevenueContext = createContext<ShiftRevenueContextType>({
  salesSummary: defaultSummary,
  isLoadingRevenue: false,
  refreshRevenue: async () => {},
});

export function ShiftRevenueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeShift } = useShift();
  const [salesSummary, setSalesSummary] =
    useState<SalesSummary>(defaultSummary);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

  const fetchRevenue = useCallback(async () => {
    const targetShiftId = activeShift?.id;

    if (!targetShiftId) {
      setSalesSummary(defaultSummary);
      return;
    }

    setIsLoadingRevenue(true);
    const res = await getShiftSalesSummaryDB(targetShiftId);

    if (res.success && res.data) {
      setSalesSummary(res.data);
    } else {
      console.error("❌ ดึงข้อมูลพลาด:", res.message);
    }

    setIsLoadingRevenue(false);
  }, [activeShift]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return (
    <ShiftRevenueContext.Provider
      value={{ salesSummary, isLoadingRevenue, refreshRevenue: fetchRevenue }}
    >
      {children}
    </ShiftRevenueContext.Provider>
  );
}

export function useShiftRevenue() {
  return useContext(ShiftRevenueContext);
}
