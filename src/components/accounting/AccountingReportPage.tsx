"use client";

import React, { useState, useMemo } from "react";
import { getAccountingReportData } from "@/lib/actions/actionAccountingReport";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { AccountingReportData, AccountingReportPageProps } from "@/lib/types";

export default function AccountingReportPage({
  organizationId,
  initialStartDate,
  initialEndDate,
  initialData,
}: AccountingReportPageProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AccountingReportData | null>(initialData);

  const { settings } = useOrgSettings();
  const currency = settings?.currencyCode || "";

  // Drilldown modal state
  const [drillDownCategory, setDrillDownCategory] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await getAccountingReportData({ startDate, endDate, organizationId });
    if (res.success && res.data) {
      setReportData(res.data);
    } else {
      showToast("ดึงข้อมูลรายงานล้มเหลว", "error");
    }
    setLoading(false);
  };

  const summary = useMemo(
    () =>
      reportData?.summary || {
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        totalARPayment: 0,
        totalOutstandingAR: 0,
      },
    [reportData]
  );

  const netMarginPercent = useMemo(() => {
    if (!summary.totalIncome || summary.totalIncome === 0) return "0.00";
    return ((summary.netProfit / summary.totalIncome) * 100).toFixed(2);
  }, [summary]);

  const pAndLStructure = useMemo(() => {
    if (!reportData)
      return { incomeItems: [], cogs: 0, grossProfit: 0, opex: 0, opexItems: [] };

    const { expenseCategoryData, transactions } = reportData;
    const incomeItems: { name: string; value: number; type: string }[] = [];

    if (transactions && transactions.length > 0) {
      const salesSum = transactions
        .filter((t) => t.type === "SALES")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const arSum = transactions
        .filter((t) => t.type === "AR_PAYMENT")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const manualIncomeSum = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      if (salesSum > 0)
        incomeItems.push({
          name: "ยอดขายหน้าร้านอัตโนมัติ (SALES)",
          value: salesSum,
          type: "SALES",
        });
      if (arSum > 0)
        incomeItems.push({
          name: "รายรับชำระหนี้สมาชิก (AR_PAYMENT)",
          value: arSum,
          type: "AR_PAYMENT",
        });
      if (manualIncomeSum > 0)
        incomeItems.push({
          name: "รายรับอื่นๆ กรอกมือ (INCOME)",
          value: manualIncomeSum,
          type: "INCOME",
        });
    }

    const cogsItem = expenseCategoryData?.find(
      (e) => e.name.includes("วัตถุดิบ") || e.name.includes("ต้นทุน")
    );
    const cogs = cogsItem ? cogsItem.value : 0;
    const grossProfit = summary.totalIncome - cogs;
    const opex = summary.totalExpense - cogs;
    const opexItems =
      expenseCategoryData?.filter(
        (e) => !(e.name.includes("วัตถุดิบ") || e.name.includes("ต้นทุน"))
      ) || [];

    return { incomeItems, cogs, grossProfit, opex, opexItems };
  }, [reportData, summary]);

  // Max value for daily bar chart scaling
  const maxDailyValue = useMemo(() => {
    if (!reportData?.dailyChartData?.length) return 1;
    return Math.max(
      ...reportData.dailyChartData.map((d) => Math.max(d.income, d.expense)),
      100
    );
  }, [reportData]);

  // Transactions for drill down
  const drillDownTransactions = useMemo(() => {
    if (!drillDownCategory || !reportData) return [];
    return reportData.transactions.filter(
      (tx) =>
        tx.categoryName === drillDownCategory ||
        tx.type === drillDownCategory ||
        tx.title.includes(drillDownCategory)
    );
  }, [drillDownCategory, reportData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-zinc-100 font-sans">
      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "warning"
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          />
          <span className="text-slate-800 dark:text-white">{toast.message}</span>
        </div>
      )}

      {/* HEADER & FILTER */}
      <div className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="text-2xl">📈</span> รายงานภาพรวมและสรุปบัญชี
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              สรุปงบการเงิน รายรับ รายจ่าย กำไรสุทธิ และยอดหนี้คงค้าง
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-center gap-2 self-start md:self-auto"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
              <span>วันที่:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                disabled={loading}
                className="h-9 px-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs cursor-pointer"
              />
              <span>ถึง</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                disabled={loading}
                className="h-9 px-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              {loading ? "กำลังโหลด..." : "ค้นหา"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              🖨️ พิมพ์รายงาน
            </button>
          </form>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            รายรับรวม
          </p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            รายจ่ายรวม
          </p>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400">
            {summary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            กำไรสุทธิ
          </p>
          <p
            className={`text-xl font-black ${
              summary.netProfit >= 0
                ? "text-sky-600 dark:text-sky-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </p>
          <span className="text-[10px] text-slate-400">
            มาร์จิ้น: {netMarginPercent}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            รับชำระหนี้เครดิต
          </p>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400">
            {summary.totalARPayment.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-xs col-span-2 md:col-span-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            หนี้ค้างสะสมทั้งหมด
          </p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            {summary.totalOutstandingAR.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        </div>
      </div>

      {/* 2 COLUMNS: DAILY CHART & EXPENSE CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DAILY TREND CHART (Pure CSS / SVG responsive chart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                แนวโน้มรายรับ - รายจ่าย รายวัน
              </h3>
              <p className="text-xs text-slate-400">เปรียบเทียบกระแสเงินเข้าและเงินออก</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> รายรับ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500" /> รายจ่าย
              </span>
            </div>
          </div>

          {reportData?.dailyChartData && reportData.dailyChartData.length > 0 ? (
            <div className="w-full h-64 flex items-end gap-2 pt-6 pb-2 overflow-x-auto">
              {reportData.dailyChartData.map((d, i) => {
                const incHeight = Math.max((d.income / maxDailyValue) * 100, 3);
                const expHeight = Math.max((d.expense / maxDailyValue) * 100, 3);
                const dayLabel = d.date.split("-").slice(1).join("/");

                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[32px] flex flex-col items-center justify-end h-full group relative"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-[85%]">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incHeight}%` }}
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-400 rounded-t-sm transition-all"
                        title={`รายรับ: ${d.income.toLocaleString()} ${currency}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-1/2 bg-rose-500 hover:bg-rose-400 rounded-t-sm transition-all"
                        title={`รายจ่าย: ${d.expense.toLocaleString()} ${currency}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 truncate font-mono">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              ไม่มีข้อมูลในช่วงเวลานี้
            </div>
          )}
        </div>

        {/* EXPENSE CATEGORY DISTRIBUTION */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              สัดส่วนค่าใช้จ่ายตามหมวดหมู่
            </h3>
            <p className="text-xs text-slate-400">หมวดหมู่ที่มีการเบิกจ่าย</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64">
            {reportData?.expenseCategoryData && reportData.expenseCategoryData.length > 0 ? (
              reportData.expenseCategoryData.map((cat, i) => {
                const percent = summary.totalExpense
                  ? ((cat.value / summary.totalExpense) * 100).toFixed(1)
                  : "0";
                return (
                  <div
                    key={i}
                    onClick={() => setDrillDownCategory(cat.name)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {cat.name}
                      </span>
                      <span className="font-mono font-bold text-rose-500">
                        {cat.value.toLocaleString()} {currency} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-rose-500 h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-slate-400 py-12">
                ยังไม่มีรายการค่าใช้จ่าย
              </p>
            )}
          </div>
        </div>
      </div>

      {/* P&L STRUCTURE & SHOP ACCOUNTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* P&L STRUCTURE TABLE */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            โครงสร้างกำไร-ขาดทุน (P&L Breakdown)
          </h3>

          <div className="space-y-2 text-xs">
            {/* Income */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                <span>1. รายรับรวม (Total Revenue)</span>
                <span>{summary.totalIncome.toLocaleString()} {currency}</span>
              </div>
              <div className="pl-4 mt-2 space-y-1 text-slate-600 dark:text-zinc-300">
                {pAndLStructure.incomeItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>• {item.name}</span>
                    <span>{item.value.toLocaleString()} {currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* COGS */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between font-semibold">
              <span className="text-slate-700 dark:text-zinc-300">
                2. ต้นทุนขาย/วัตถุดิบ (COGS)
              </span>
              <span className="text-rose-500 font-mono">
                -{pAndLStructure.cogs.toLocaleString()} {currency}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="bg-sky-50/50 dark:bg-sky-950/10 p-3 rounded-xl border border-sky-100 dark:border-sky-900/30 flex justify-between font-bold text-sky-700 dark:text-sky-300">
              <span>3. กำไรขั้นต้น (Gross Profit)</span>
              <span>{pAndLStructure.grossProfit.toLocaleString()} {currency}</span>
            </div>

            {/* OPEX */}
            <div className="bg-rose-50/30 dark:bg-rose-950/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
              <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                <span>4. ค่าใช้จ่ายในการดำเนินงาน (OPEX)</span>
                <span>-{pAndLStructure.opex.toLocaleString()} {currency}</span>
              </div>
              <div className="pl-4 mt-2 space-y-1 text-slate-500 dark:text-zinc-400">
                {pAndLStructure.opexItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>• {item.name}</span>
                    <span>{item.value.toLocaleString()} {currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between font-bold text-sm shadow-sm">
              <span>5. กำไรสุทธิ (Net Profit)</span>
              <span
                className={
                  summary.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {summary.netProfit.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* SHOP ACCOUNTS BALANCES */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              ยอดเงินคงเหลือในบัญชีร้าน
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              อัปเดตตาม Running Balance ปัจจุบัน
            </p>

            <div className="space-y-2.5">
              {reportData?.accounts?.map((acc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-zinc-800/80 flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏦</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {acc.accountName}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {acc.balance.toLocaleString()} {currency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4 text-xs flex justify-between font-bold text-slate-700 dark:text-zinc-300">
            <span>รวมเงินสดและเงินในบัญชี:</span>
            <span className="text-sky-600 dark:text-sky-400">
              {reportData?.accounts
                ?.reduce((sum, a) => sum + a.balance, 0)
                .toLocaleString()}{" "}
              {currency}
            </span>
          </div>
        </div>
      </div>

      {/* DRILL DOWN MODAL */}
      {drillDownCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-700 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  รายละเอียดรายการ: {drillDownCategory}
                </h4>
                <p className="text-xs text-slate-400">
                  พบ {drillDownTransactions.length} รายการ
                </p>
              </div>
              <button
                onClick={() => setDrillDownCategory(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {drillDownTransactions.map((tx, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-zinc-200">
                      {tx.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(tx.date).toLocaleDateString("th-TH")} •{" "}
                      {tx.accountName}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {tx.amount.toLocaleString()} {currency}
                  </span>
                </div>
              ))}
              {drillDownTransactions.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  ไม่มีรายการย่อย
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
