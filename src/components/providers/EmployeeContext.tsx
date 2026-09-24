"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface EmployeeSession {
  id: number;
  name: string;
  role: string;
  img?: string | null;
  permission?: any;
}

interface EmployeeContextType {
  currentEmployee: EmployeeSession | null;
  setEmployeeSession: (employee: EmployeeSession) => void;
  clearEmployeeSession: () => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined,
);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [currentEmployee, setCurrentEmployee] =
    useState<EmployeeSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("posx_active_employee");
    if (saved) {
      try {
        setCurrentEmployee(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("posx_active_employee");
      }
    }
  }, []);

  const setEmployeeSession = (employee: EmployeeSession) => {
    setCurrentEmployee(employee);
    localStorage.setItem("posx_active_employee", JSON.stringify(employee));
  };

  const clearEmployeeSession = () => {
    setCurrentEmployee(null);
    localStorage.removeItem("posx_active_employee");
  };

  return (
    <EmployeeContext.Provider
      value={{ currentEmployee, setEmployeeSession, clearEmployeeSession }}
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
