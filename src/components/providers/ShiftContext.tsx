"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  openShiftDB,
  closeShiftDB,
  getActiveShiftDB,
} from "@/lib/actions/actionsPos";
import { useEmployee } from "@/components/providers/EmployeeContext"; // 🌟 1. นำเข้า useEmployee

export interface ShiftData {
  id: number;
  shiftNumber: string;
  status: "OPEN" | "CLOSED";
  startingCash: number;
  expectedCash?: number | null;
  endingCash?: number | null;
  cashDifference?: number | null;
  totalSales?: number | null;
  cashSales?: number | null;
  qrSales?: number | null;
  cardSales?: number | null;
  memberSales?: number | null;
  openedBy: string;
  closedBy?: string | null;
  openedAt: Date;
  closedAt?: Date | null;
}

interface ShiftContextType {
  activeShift: ShiftData | null;
  isLoading: boolean;
  openShift: (
    startingCash: number,
    openedBy: string,
  ) => Promise<{ success: boolean; message?: string }>;
  closeShift: (
    endingCash: number,
    closedBy: string,
    note?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  refreshShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

// 🌟 2. ลบ organizationId ออกจาก Props
export function ShiftProvider({ children }: { children: ReactNode }) {
  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 🌟 3. ดึง organizationId จาก EmployeeContext โดยตรง
  const { organizationId } = useEmployee();

  const fetchActiveShift = useCallback(async () => {
    // 🌟 4. ถ้ายังไม่มี ID ร้านค้า (เช่น เพิ่งเปิดเว็บ) ให้หยุดไว้ก่อน ป้องกันบั๊ก
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getActiveShiftDB(organizationId);
      if (res.success && res.shift) {
        setActiveShift(res.shift as ShiftData);
      } else {
        setActiveShift(null);
      }
    } catch (error) {
      console.error("Fetch active shift error:", error);
      setActiveShift(null);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]); // 🌟 ผูกกับ organizationId ถ้าเปลี่ยนร้าน ข้อมูลกะก็จะโหลดใหม่

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  const openShift = async (startingCash: number, openedBy: string) => {
    // 🌟 5. เช็กกันเหนียวตอนกดเปิดกะ
    if (!organizationId) {
      return {
        success: false,
        message: "ไม่พบข้อมูลร้านค้า กรุณาเข้าสู่ระบบใหม่",
      };
    }

    setIsLoading(true);
    try {
      const res = await openShiftDB({
        startingCash,
        openedBy,
        organizationId, // 🌟 โยน organizationId ที่ดึงมาเข้าไปใช้
      });

      if (res.success && res.shift) {
        setActiveShift(res.shift as ShiftData);
        return { success: true };
      } else {
        return { success: false, message: res.message || "ไม่สามารถเปิดกะได้" };
      }
    } catch (error: any) {
      return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
    } finally {
      setIsLoading(false);
    }
  };

  const closeShift = async (
    endingCash: number,
    closedBy: string,
    note?: string,
  ) => {
    if (!activeShift) {
      return { success: false, message: "ไม่มีกะที่กำลังเปิดอยู่" };
    }

    setIsLoading(true);
    try {
      const res = await closeShiftDB({
        shiftId: activeShift.id,
        endingCash,
        closedBy,
        note,
      });

      if (res.success) {
        setActiveShift(null);
        return { success: true };
      } else {
        return { success: false, message: res.message || "ไม่สามารถปิดกะได้" };
      }
    } catch (error: any) {
      return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        activeShift,
        isLoading,
        openShift,
        closeShift,
        refreshShift: fetchActiveShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
}
