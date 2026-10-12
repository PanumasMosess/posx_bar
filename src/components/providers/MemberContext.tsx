"use client";

import React, { createContext, useContext, useState } from "react";
import { searchMemberDB } from "@/lib/actions/actionsMember";
import { useEmployee } from "./EmployeeContext";

export interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  balance: number;
  discountPercent: number;
}

interface MemberContextType {
  selectedMember: Member | null;
  isSearchingMember: boolean;
  searchError: string | null;
  searchMember: (query: string) => Promise<boolean>;
  clearSelectedMember: () => void;
  setSelectedMember: (member: Member | null) => void;
}

const MemberContext = createContext<MemberContextType>({
  selectedMember: null,
  isSearchingMember: false,
  searchError: null,
  searchMember: async () => false,
  clearSelectedMember: () => {},
  setSelectedMember: () => {},
});

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const { organizationId } = useEmployee();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchMember = async (query: string): Promise<boolean> => {
    if (!query.trim()) {
      setSearchError("กรุณากรอกเบอร์โทรหรือชื่อสมาชิก");
      return false;
    }

    setIsSearchingMember(true);
    setSearchError(null);

    try {
      const res = await searchMemberDB(query, organizationId);

      if (res.success && res.data) {
        // ข้อมูลถูก Map มาจาก Action แล้ว สามารถ Set ได้เลย
        setSelectedMember(res.data);
        setIsSearchingMember(false);
        return true;
      } else {
        setSearchError(res.message || "ไม่พบสมาชิก");
        setIsSearchingMember(false);
        return false;
      }
    } catch (err) {
      console.error(err);
      setSearchError("เกิดข้อผิดพลาดในการค้นหา");
      setIsSearchingMember(false);
      return false;
    }
  };

  const clearSelectedMember = () => {
    setSelectedMember(null);
    setSearchError(null);
  };

  return (
    <MemberContext.Provider
      value={{
        selectedMember,
        isSearchingMember,
        searchError,
        searchMember,
        clearSelectedMember,
        setSelectedMember,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
