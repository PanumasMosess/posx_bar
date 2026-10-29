"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEmployee } from "@/components/providers/EmployeeContext";
import {
  updateAccountStatus,
  updateAccountName,
  updateCategoryStatus,
  updateCategoryName,
} from "@/lib/actions/actionAccounting";
import {
  AccountItem,
  AccountCategoryItem,
  AccountTransactionItem,
} from "@/lib/types";

import DataTableSettingAccount from "./DataTableSettingAccount";
import DataTableSettingCategory from "./DataTableSettingCategory";
import DataTableSettingTxlog from "./DataTableSettingTxlog";

interface SettingAccountingPageProps {
  accounts: AccountItem[];
  categories: AccountCategoryItem[];
  txLogs: AccountTransactionItem[];
  userId: number;
  organizationId: number;
  onRefresh?: () => Promise<void> | void;
  isEmbedded?: boolean;
}

export default function SettingAccountingPage({
  accounts,
  categories,
  txLogs,
  userId,
  organizationId,
  onRefresh,
  isEmbedded = false,
}: SettingAccountingPageProps) {
  const router = useRouter();
  const { employeeId } = useEmployee();
  const effectiveUserId = Number(employeeId || userId || 1);

  // View state: split (2 columns) or tabs (full width)
  const [viewMode, setViewMode] = useState<"split" | "tabs">("split");
  const [activeSettingTab, setActiveSettingTab] = useState<"accounts" | "categories">("accounts");

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
    router.refresh();
  };

  // --- Handlers for Accounts ---
  const handleAccountStatus = async (id: number, status: string) => {
    const res = await updateAccountStatus(id, status);
    if (res.success) {
      showToast("อัปเดตสถานะบัญชีสำเร็จ", "success");
      await handleRefresh();
    } else {
      showToast("อัปเดตสถานะไม่สำเร็จ", "error");
    }
  };

  const handleAccountName = async (id: number, name: string) => {
    const res = await updateAccountName(id, name);
    if (res.success) {
      showToast("แก้ไขชื่อบัญชีสำเร็จ", "success");
      await handleRefresh();
    } else {
      showToast("แก้ไขชื่อไม่สำเร็จ", "error");
    }
  };

  // --- Handlers for Categories ---
  const handleCategoryStatus = async (id: number, status: string) => {
    const res = await updateCategoryStatus(id, status);
    if (res.success) {
      showToast("อัปเดตสถานะหมวดหมู่สำเร็จ", "success");
      await handleRefresh();
    } else {
      showToast("อัปเดตสถานะไม่สำเร็จ", "error");
    }
  };

  const handleCategoryName = async (id: number, name: string) => {
    const res = await updateCategoryName(id, name);
    if (res.success) {
      showToast("แก้ไขชื่อหมวดหมู่สำเร็จ", "success");
      await handleRefresh();
    } else {
      showToast("แก้ไขชื่อไม่สำเร็จ", "error");
    }
  };

  return (
    <div className={`w-full flex flex-col gap-6 ${isEmbedded ? "p-0 min-h-0" : "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen"}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                : "bg-rose-500 text-white border-rose-400 shadow-rose-500/20"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header / Breadcrumb navigation */}
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="w-9 h-9 rounded-xl bg-pos-surface border border-pos-border text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-95 shadow-xs"
              title="กลับไปหน้าตั้งค่า"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                ตั้งค่าบัญชีการเงิน
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                จัดการบัญชีธนาคาร ลิ้นชักเงินสด หมวดหมู่รายรับ-รายจ่าย และประวัติเงินเข้า-ออก
              </p>
            </div>
          </div>
        </div>
      )}

      {/* แถบสลับมุมมอง (2 คอลัมน์ vs แท็บเต็มจอ) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-pos-surface border border-pos-border dark:border-slate-700/80 p-2 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          {viewMode === "tabs" ? (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSettingTab("accounts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeSettingTab === "accounts"
                    ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>🏛️ บัญชีการเงิน</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-extrabold">
                  {accounts.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingTab("categories")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeSettingTab === "categories"
                    ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>🏷️ หมวดหมู่รายรับ-รายจ่าย</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold">
                  {categories.length}
                </span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>แสดงคู่กัน (บัญชีการเงิน & หมวดหมู่)</span>
            </div>
          )}
        </div>

        {/* ปุ่มสลับโหมด: 2 คอลัมน์ vs แยกแท็บเต็มจอ */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === "split"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="แสดงบัญชีและหมวดหมู่คู่กัน"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5 0h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <span className="hidden sm:inline">2 คอลัมน์</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("tabs")}
            className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === "tabs"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="แยกแท็บเต็มจอ เพื่อมุมมองที่กว้างขึ้น 100% สบายตา"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="hidden sm:inline">แยกแท็บเต็มจอ</span>
          </button>
        </div>
      </div>

      {/* ส่วนตาราง: สลับระหว่าง 2 คอลัมน์ (สัดส่วน 7:5) หรือ แท็บเต็มจอ */}
      {viewMode === "split" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* กล่องซ้าย: บัญชีการเงิน */}
          <div className="xl:col-span-7 rounded-2xl border border-pos-border dark:border-slate-700 bg-pos-surface shadow-2xs p-4 sm:p-5 flex flex-col h-full overflow-hidden">
            <DataTableSettingAccount
              data={accounts}
              userId={effectiveUserId}
              organizationId={organizationId}
              onUpdateStatus={handleAccountStatus}
              onUpdateName={handleAccountName}
              showToast={showToast}
              onRefresh={handleRefresh}
              viewMode="split"
            />
          </div>

          {/* กล่องขวา: หมวดหมู่รายรับ-รายจ่าย */}
          <div className="xl:col-span-5 rounded-2xl border border-pos-border dark:border-slate-700 bg-pos-surface shadow-2xs p-4 sm:p-5 flex flex-col h-full overflow-hidden">
            <DataTableSettingCategory
              data={categories}
              userId={effectiveUserId}
              organizationId={organizationId}
              onUpdateStatus={handleCategoryStatus}
              onUpdateName={handleCategoryName}
              showToast={showToast}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-pos-border dark:border-slate-700 bg-pos-surface shadow-2xs p-5 flex flex-col h-full overflow-hidden w-full">
          {activeSettingTab === "accounts" ? (
            <DataTableSettingAccount
              data={accounts}
              userId={effectiveUserId}
              organizationId={organizationId}
              onUpdateStatus={handleAccountStatus}
              onUpdateName={handleAccountName}
              showToast={showToast}
              onRefresh={handleRefresh}
              viewMode="tabs"
            />
          ) : (
            <DataTableSettingCategory
              data={categories}
              userId={effectiveUserId}
              organizationId={organizationId}
              onUpdateStatus={handleCategoryStatus}
              onUpdateName={handleCategoryName}
              showToast={showToast}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      )}

      {/* ส่วนล่าง เต็มจอ: ประวัติการจัดการเงินบัญชี (Log) */}
      <div className="grid grid-cols-1 gap-5">
        <div className="rounded-2xl border border-pos-border dark:border-slate-700 bg-pos-surface shadow-2xs p-5 flex flex-col overflow-hidden w-full">
          <DataTableSettingTxlog
            data={txLogs}
            title="ประวัติจัดการเงินในบัญชี"
            subtitle="ประวัติการปรับเพิ่ม ลด และโอนเงินจากเมนูตั้งค่า"
          />
        </div>
      </div>
    </div>
  );
}

