"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface EmployeeSession {
  id: number; // 👈 ตรงนี้คือ ID ของพนักงานอยู่แล้ว
  name: string;
  role: string;
  img?: string | null;
  permission?: any;
  organizationId?: number;
}

interface EmployeeContextType {
  currentEmployee: EmployeeSession | null;
  employeeId: number | null; // 🌟 1. เพิ่มตัวแปร employeeId ให้เรียกใช้ง่ายๆ (ถ้ายังไม่ล็อกอินจะเป็น null)
  activeOrgId: number;
  organizationId: number;
  isPinExpired: boolean;
  setOrgId: (id: number) => void;
  setEmployeeSession: (employee: EmployeeSession) => void;
  clearEmployeeSession: () => void;
  renewEmployeeSession: () => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined,
);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [currentEmployee, setCurrentEmployee] =
    useState<EmployeeSession | null>(null);
  const [activeOrgId, setActiveOrgIdState] = useState<number>(0);
  const [isPinExpired, setIsPinExpired] = useState<boolean>(false);

  // ดึงค่าตั้งต้นตอนโหลดแอป
  useEffect(() => {
    const savedEmployee = localStorage.getItem("posx_active_employee");
    const savedTime = localStorage.getItem("posx_employee_last_active");
    const savedOrgId = localStorage.getItem("posx_active_org_id");

    if (savedOrgId) {
      setActiveOrgIdState(Number(savedOrgId));
    }

    if (savedEmployee && savedTime) {
      try {
        const parsedEmployee = JSON.parse(savedEmployee);
        const lastActiveTime = Number(savedTime);
        const now = Date.now();

        if (now - lastActiveTime > ONE_HOUR_MS) {
          setCurrentEmployee(parsedEmployee);
          setIsPinExpired(true);
        } else {
          setCurrentEmployee(parsedEmployee);
          setIsPinExpired(false);
        }
      } catch (e) {
        clearEmployeeSession();
      }
    }
  }, []);

  const setOrgId = useCallback((id: number) => {
    setActiveOrgIdState(id);
    localStorage.setItem("posx_active_org_id", String(id));
  }, []);

  const setEmployeeSession = useCallback((employee: EmployeeSession) => {
    const now = Date.now();
    const newEmployee = { ...employee };

    localStorage.setItem("posx_active_employee", JSON.stringify(newEmployee));
    localStorage.setItem("posx_employee_last_active", String(now));

    setCurrentEmployee(newEmployee);
    setIsPinExpired(false);
  }, []);

  const renewEmployeeSession = useCallback(() => {
    const now = Date.now();
    setIsPinExpired(false);
    localStorage.setItem("posx_employee_last_active", String(now));
  }, []);

  const clearEmployeeSession = useCallback(() => {
    setCurrentEmployee(null);
    setIsPinExpired(false);
    localStorage.removeItem("posx_active_employee");
    localStorage.removeItem("posx_employee_last_active");
  }, []);

  return (
    <EmployeeContext.Provider
      value={{
        currentEmployee,
        employeeId: currentEmployee?.id || null, // 🌟 2. ดึง id จากพนักงานปัจจุบันมาให้เรียกใช้ตรงๆ
        activeOrgId,
        organizationId: activeOrgId,
        isPinExpired,
        setOrgId,
        setEmployeeSession,
        clearEmployeeSession,
        renewEmployeeSession,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useEmployee must be used within EmployeeProvider");
  }
  return context;
}
