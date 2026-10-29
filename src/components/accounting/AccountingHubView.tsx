"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import {
  AccountingTabKey,
  AccountingHubViewProps,
} from "@/lib/types";

import MemberPaymentPage from "./MemberPaymentPage";
import AccountingHistoryPage from "./AccountingHistoryPage";
import ProfitLossPage from "./ProfitLossPage";
import AccountingReportPage from "./AccountingReportPage";

export default function AccountingHubView({
  initialMembers,
  accounts,
  txLogs,
  reportData,
  userId,
  organizationId,
  initialStartDate,
  initialEndDate,
  defaultTab = "member_payment",
}: AccountingHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useOrgSettings();
  const currency = settings?.currencyCode || "";

  const tabParam = searchParams.get("tab") as AccountingTabKey | null;
  const activeTab: AccountingTabKey =
    tabParam && ["member_payment", "history", "profit_loss", "report"].includes(tabParam)
      ? tabParam
      : defaultTab;

  const handleSelectTab = (tab: AccountingTabKey) => {
    router.replace(`/accounting?tab=${tab}`, { scroll: false });
  };

  const navTabs: {
    key: AccountingTabKey;
    label: string;
    sub: string;
    icon: string;
    badge?: number;
  }[] = [
    {
      key: "member_payment",
      label: "รับชำระหนี้ / เครดิต",
      sub: "จัดการลูกหนี้ · อายุหนี้ AR · บันทึกชำระ",
      icon: "💳",
      badge: initialMembers.filter((m) => m.creditBalance < 0).length,
    },
    {
      key: "history",
      label: "รายการเดินบัญชี",
      sub: "Statement · เงินเข้า-ออก · ตรวจสอบ",
      icon: "🏛️",
    },
    {
      key: "profit_loss",
      label: "สรุปกำไร-ขาดทุน",
      sub: "รายรับจากการขาย · รายจ่ายจริง",
      icon: "📊",
    },
    {
      key: "report",
      label: "รายงานภาพรวมบัญชี",
      sub: "P&L Breakdown · กราฟแท่ง · สัดส่วน",
      icon: "📈",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-pos-bg text-pos-text font-sans p-3 sm:p-5 flex flex-col gap-4">
      {/* TOP HEADER */}
      <div className="w-full bg-pos-surface border border-pos-border rounded-2xl px-5 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/30 flex items-center justify-center text-xl shrink-0">
            🏛️
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-pos-text leading-tight">
              ระบบบัญชีและการเงิน (Accounting)
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              จัดการบัญชีร้านค้า, สรุปผลกำไร-ขาดทุน, ติดตามอายุหนี้ลูกหนี้ และตรวจสอบ Statement
            </p>
          </div>
        </div>

        {/* Quick info badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-pos-bg border border-pos-border font-medium text-slate-500">
            จำนวนบัญชี: <strong className="text-pos-text">{accounts.length}</strong> บัญชี
          </span>
          <span className="px-3 py-1 rounded-lg bg-pos-bg border border-pos-border font-medium text-slate-500">
            ยอดคงเหลือรวม:{" "}
            <strong className="text-emerald-500">
              {accounts.reduce((s, a) => s + (a.balance || 0), 0).toLocaleString()} {currency}
            </strong>
          </span>
        </div>
      </div>

      {/* MOBILE / TABLET HORIZONTAL TAB BAR */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleSelectTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-transparent shadow-xs"
                  : "bg-pos-surface border-pos-border text-slate-600 dark:text-slate-300 hover:bg-pos-hover"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2-COLUMN LAYOUT ON DESKTOP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 items-start min-h-0">
        {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
        <div className="hidden lg:flex w-[280px] xl:w-[310px] shrink-0 flex-col gap-2">
          <div className="bg-pos-surface border border-pos-border rounded-2xl shadow-xs p-3 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1.5">
              เมนูระบบบัญชี
            </p>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleSelectTab(tab.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left cursor-pointer group select-none border ${
                    isActive
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold"
                      : "border-transparent hover:bg-pos-hover text-pos-text"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-xl shrink-0">{tab.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs truncate ${isActive ? "font-bold" : "font-semibold"}`}>
                        {tab.label}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {tab.sub}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs ${
                      isActive ? "text-sky-500" : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    &gt;
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CONTENT VIEW */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === "member_payment" && (
            <MemberPaymentPage
              initialMembers={initialMembers}
              shopAccounts={accounts}
              userId={userId}
              organizationId={organizationId}
            />
          )}

          {activeTab === "history" && (
            <AccountingHistoryPage
              accounts={accounts}
              defaultTxLogs={txLogs}
              organizationId={organizationId}
              initialStartDate={initialStartDate}
              initialEndDate={initialEndDate}
            />
          )}

          {activeTab === "profit_loss" && (
            <ProfitLossPage
              accounts={accounts}
              defaultTxLogs={txLogs.filter((t) =>
                ["SALES", "INCOME", "AR_PAYMENT", "EXPENSE"].includes(t.type)
              )}
              organizationId={organizationId}
              initialStartDate={initialStartDate}
              initialEndDate={initialEndDate}
            />
          )}

          {activeTab === "report" && (
            <AccountingReportPage
              organizationId={organizationId}
              initialStartDate={initialStartDate}
              initialEndDate={initialEndDate}
              initialData={reportData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
