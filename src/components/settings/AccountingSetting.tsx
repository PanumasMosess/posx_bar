"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useEmployee } from "@/components/providers/EmployeeContext";
import { getAccountingSettingDataAction } from "@/lib/actions/actionAccounting";
import {
  AccountItem,
  AccountCategoryItem,
  AccountTransactionItem,
} from "@/lib/types";
import SettingAccountingPage from "./accounting/SettingAccountingPage";

interface AccountingSettingProps {
  organizationId: number;
}

export default function AccountingSetting({ organizationId }: AccountingSettingProps) {
  const { employeeId } = useEmployee();
  const [data, setData] = useState<{
    accounts: AccountItem[];
    categories: AccountCategoryItem[];
    txLogs: AccountTransactionItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await getAccountingSettingDataAction(organizationId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error refreshing accounting settings:", err);
    }
  }, [organizationId]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (!organizationId) return;
      try {
        const res = await getAccountingSettingDataAction(organizationId);
        if (isMounted) {
          if (res.success && res.data) {
            setData(res.data);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading accounting settings:", err);
        if (isMounted) setLoading(false);
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">กำลังโหลดข้อมูลบัญชีและการเงิน...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        ไม่พบข้อมูลบัญชี กรุณาลองใหม่อีกครั้ง
      </div>
    );
  }

  return (
    <div className="w-full">
      <SettingAccountingPage
        accounts={data.accounts}
        categories={data.categories}
        txLogs={data.txLogs}
        userId={Number(employeeId || 1)}
        organizationId={organizationId}
        onRefresh={loadData}
        isEmbedded={true}
      />
    </div>
  );
}
