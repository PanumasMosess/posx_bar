"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { useEmployee } from "@/components/providers/EmployeeContext";
import ReportSidebar from "@/components/reports/ReportSidebar";
import ReportDateSelector from "@/components/reports/ReportDateSelector";
import {
  ReportTabKey,
  PeriodType,
  TotalSalesReportData,
  ProductSalesReportData,
  EmployeeSalesReportData,
  BillsReceiptsReportData,
} from "@/lib/types";
import TotalSalesReportView from "@/components/reports/TotalSalesReportView";
import ProductSalesReportView from "@/components/reports/ProductSalesReportView";
import EmployeeSalesReportView from "@/components/reports/EmployeeSalesReportView";
import BillsReceiptsReportView from "@/components/reports/BillsReceiptsReportView";
import ReportPreviewModal from "@/components/reports/ReportPreviewModal";
import {
  getTotalSalesReportAction,
  getProductSalesReportAction,
  getEmployeeSalesReportAction,
  getBillsReceiptsReportAction,
} from "@/lib/actions/actionsReports";
import { exportReportToExcel } from "@/components/reports/exportReportExcel";

export default function ReportsPage() {
  const { settings } = useOrgSettings();
  const { activeOrgId } = useEmployee();
  const organizationId = activeOrgId || settings?.organizationId || 1;

  // Active Tab & Date Range
  const [activeTab, setActiveTab] = useState<ReportTabKey>("total");
  const [period, setPeriod] = useState<PeriodType>("today");

  const todayStr = new Date().toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Filter for Bills
  const [billSearch, setBillSearch] = useState("");
  const [billPaymentMethod, setBillPaymentMethod] = useState<"ALL" | "CASH" | "QR">("ALL");

  // Track product tab filter mode ("best" vs "worst") for correct Excel sheet export
  const [productFilterMode, setProductFilterMode] = useState<"best" | "worst">("best");

  // Mobile Bottom Sheet modal active report (null = show Mobile Hub)
  const [mobileActiveReport, setMobileActiveReport] = useState<ReportTabKey | null>(null);

  // State Data Map แยกตามแต่ละ Tab เพื่อป้องกันการชนกันของข้อมูล
  const [dataMap, setDataMap] = useState<{
    total?: TotalSalesReportData;
    product?: ProductSalesReportData;
    employee?: EmployeeSalesReportData;
    bills?: BillsReceiptsReportData;
  }>({});

  const [isPending, startTransition] = useTransition();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch Report Data
  const fetchReport = useCallback(() => {
    if (!organizationId) return;

    startTransition(async () => {
      try {
        if (activeTab === "total") {
          const res = await getTotalSalesReportAction({
            organizationId,
            period,
            startDate: customStartDate,
            endDate: customEndDate,
          });
          if (res.success && res.data) {
            setDataMap((prev) => ({ ...prev, total: res.data }));
          }
        } else if (activeTab === "product") {
          const res = await getProductSalesReportAction({
            organizationId,
            period,
            startDate: customStartDate,
            endDate: customEndDate,
          });
          if (res.success && res.data) {
            setDataMap((prev) => ({ ...prev, product: res.data }));
          }
        } else if (activeTab === "employee") {
          const res = await getEmployeeSalesReportAction({
            organizationId,
            period,
            startDate: customStartDate,
            endDate: customEndDate,
          });
          if (res.success && res.data) {
            setDataMap((prev) => ({ ...prev, employee: res.data }));
          }
        } else if (activeTab === "bills") {
          const res = await getBillsReceiptsReportAction({
            organizationId,
            period,
            startDate: customStartDate,
            endDate: customEndDate,
            paymentMethod: billPaymentMethod,
            search: billSearch,
          });
          if (res.success && res.data) {
            setDataMap((prev) => ({ ...prev, bills: res.data }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
      }
    });
  }, [
    organizationId,
    activeTab,
    period,
    customStartDate,
    customEndDate,
    billPaymentMethod,
    billSearch,
  ]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePeriodChange = (p: PeriodType) => {
    setDataMap({});
    setPeriod(p);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setDataMap({});
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const reportTitles: { [key in ReportTabKey]?: string } = {
    total: "ยอดขายทั้งหมด",
    product: "ยอดขายตามสินค้า",
    employee: "ยอดขายตามพนักงาน",
    bills: "รายการบิล / ใบเสร็จ",
  };

  const currentData = dataMap[activeTab];
  const totalData = dataMap.total;
  const orgName = (settings as { name?: string })?.name || "";
  const currentDateText = totalData?.dateRangeText || (currentData as { dateRangeText?: string })?.dateRangeText || "";

  // Helper สำหรับดาวน์โหลด Excel
  const handleDownloadExcelForTab = (tab: ReportTabKey) => {
    const data = dataMap[tab];
    if (!data) return;
    const dateCode =
      (data as { dateRangeCode?: string }).dateRangeCode ||
      new Date().toISOString().slice(0, 10).replace(/-/g, "");

    let fileName = "";
    if (tab === "product") {
      fileName =
        productFilterMode === "worst"
          ? `low-sellers-${dateCode}`
          : `product-sales-all-${dateCode}`;
    } else if (tab === "total") {
      fileName = `sales-summary-${dateCode}`;
    } else if (tab === "employee") {
      fileName = `staff-sales-${dateCode}`;
    } else if (tab === "bills") {
      fileName = `bills-${dateCode}`;
    } else {
      const tabName = reportTitles[tab] || "รายงาน";
      fileName = `${tabName}_${period}_${dateCode}`;
    }

    const enrichedData = {
      ...data,
      shopName: orgName,
      productFilterMode,
    };
    exportReportToExcel(tab, enrichedData, fileName);
  };

  const handleDownloadExcel = () => handleDownloadExcelForTab(activeTab);

  // เปิดดูรายงานในโหมด Mobile
  const openMobileReport = (tab: ReportTabKey) => {
    setActiveTab(tab);
    setMobileActiveReport(tab);
  };

  const closeMobileReport = () => {
    setMobileActiveReport(null);
    setActiveTab("total");
  };

  return (
    <div className="flex h-full w-full bg-[#f1f5f9] dark:bg-pos-bg overflow-hidden p-2 sm:p-4 gap-3 sm:gap-4 select-none">
      {/* ======================================================== */}
      {/* 🖥️ Desktop / iPad View (md:flex)                        */}
      {/* ======================================================== */}
      <div className="hidden md:flex w-68 lg:w-72 xl:w-80 shrink-0 h-full flex-col">
        <ReportSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          period={period}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          className="h-full"
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col min-w-0 h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 bg-white dark:bg-slate-900">
          <div className="w-full">
            {!currentData || isPending ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">กำลังโหลดรายงาน...</span>
              </div>
            ) : (
              <>
                {activeTab === "total" && dataMap.total && (
                  <TotalSalesReportView data={dataMap.total} />
                )}
                {activeTab === "product" && dataMap.product && (
                  <ProductSalesReportView
                    data={dataMap.product}
                    filterMode={productFilterMode}
                    onFilterModeChange={setProductFilterMode}
                  />
                )}
                {activeTab === "employee" && dataMap.employee && (
                  <EmployeeSalesReportView data={dataMap.employee} />
                )}
                {activeTab === "bills" && dataMap.bills && (
                  <BillsReceiptsReportView
                    data={dataMap.bills}
                    search={billSearch}
                    onSearchChange={setBillSearch}
                    paymentMethodFilter={billPaymentMethod}
                    onPaymentMethodFilterChange={setBillPaymentMethod}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* 🏷️ Bottom Action Bar Framed Inside Right Card */}
        <div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3 z-10">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!currentData || isPending}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95 disabled:opacity-50 shadow-xs"
          >
            ดูตัวอย่างไฟล์
          </button>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={!currentData || isPending}
            className="flex-1 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            ดาวน์โหลด Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📱 Mobile View (md:hidden - ตรงตามรูปต้นฉบับ 100%)       */}
      {/* ======================================================== */}
      <div className="md:hidden flex-1 flex flex-col h-full overflow-y-auto bg-[#f8fafc] dark:bg-slate-950 p-3 space-y-3.5 pb-20">
        {/* Top Header: Date Range Only */}
        <div className="flex items-center justify-end px-1 pt-1">
          <span className="text-[11px] text-slate-400">{currentDateText}</span>
        </div>

        {/* Date Selector Pill */}
        <div className="w-full">
          <ReportDateSelector
            period={period}
            onPeriodChange={handlePeriodChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />
        </div>

        {/* Big Teal Highlight Card  */}
        <div className="bg-[#0c6b79] text-white rounded-3xl p-5 shadow-sm space-y-3.5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold text-teal-100 block">ยอดขาย</span>
              <span className="text-xs text-teal-200 block mt-0.5">
                {totalData?.completedBills ?? 0} บิล
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {(totalData?.totalSales ?? 0).toLocaleString()}
            </div>
          </div>

          {/* Middle info: จำนวนที่ขาย */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-1.5 text-teal-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>จำนวนที่ขาย</span>
              </div>
              <span className="font-bold text-white text-sm">
                {(totalData?.totalItemsSold ?? 0).toLocaleString()} ชิ้น
              </span>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {totalData?.categoryBreakdown && totalData.categoryBreakdown.length > 0 ? (
                totalData.categoryBreakdown.map((cat, i) => (
                  <span
                    key={i}
                    className="bg-[#074b55] text-teal-100 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {cat.categoryName} {cat.quantity}
                  </span>
                ))
              ) : (
                <span className="bg-[#074b55] text-teal-100 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                  สินค้า 0
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (Orange vs Light Green) */}
          <div className="space-y-2 pt-1">
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-teal-900/40">
              <div
                style={{ width: `${totalData?.costPercentage ?? 42}%` }}
                className="bg-[#f97316] h-full transition-all"
              />
              <div
                style={{ width: `${totalData?.profitPercentage ?? 58}%` }}
                className="bg-[#a3e635] h-full transition-all"
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] inline-block shrink-0" />
                <span className="text-teal-100 text-[11px] font-medium">ต้นทุนขาย</span>
                <span className="bg-[#074b55] text-[10px] px-1.5 py-0.2 rounded-full text-teal-200 font-medium">
                  {totalData?.costPercentage ?? 0}%
                </span>
              </div>
              <span className="font-bold text-white text-xs">
                {(totalData?.totalCost ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a3e635] inline-block shrink-0" />
                <span className="text-teal-100 text-[11px] font-medium">กำไรขั้นต้น</span>
                <span className="bg-[#074b55] text-[10px] px-1.5 py-0.2 rounded-full text-teal-200 font-medium">
                  {totalData?.profitPercentage ?? 0}%
                </span>
              </div>
              <span className="font-bold text-white text-xs">
                {(totalData?.grossProfit ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Section title  */}
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 pt-1">
          ยอดขาย
        </h3>

        {/* Menu List Card  */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:border-slate-800 overflow-hidden">
          {/* 1. ยอดขายทั้งหมด */}
          <button
            type="button"
            onClick={() => openMobileReport("total")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  ยอดขายทั้งหมด
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ยอดสด/โอน · บิลเฉลี่ย · รายชั่วโมง
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold text-xs shrink-0">
              <span>{(totalData?.totalSales ?? 0).toLocaleString()}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* 2. ยอดขายตามสินค้า */}
          <button
            type="button"
            onClick={() => openMobileReport("product")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  ยอดขายตามสินค้า
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ขายดี-ขายไม่ดี ตามจำนวน ยอดขาย หรือกำไร
                </p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>


          {/* 5. ยอดขายตามพนักงาน */}
          <button
            type="button"
            onClick={() => openMobileReport("employee")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  ยอดขายตามพนักงาน
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  แยกยอดและจำนวนบิลต่อคน
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-medium text-xs shrink-0">
              <span>{totalData?.activeEmployeesCount ?? 1} คน</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* 6. รายการบิล / ใบเสร็จ */}
          <button
            type="button"
            onClick={() => openMobileReport("bills")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  รายการบิล / ใบเสร็จ
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ค้นหาและดูรายละเอียดบิลย้อนหลัง
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-medium text-xs shrink-0">
              <span>{totalData?.completedBills ?? 0} บิล</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📱 Mobile Report Detail Sheet      */}
      {/* ======================================================== */}
      {mobileActiveReport && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          {/* Backdrop click to close */}
          <div
            className="flex-1"
            onClick={closeMobileReport}
          />

          {/* Bottom Sheet Modal Container */}
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] w-full overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Top Modal Header matching */}
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                {/* Specific icon matching report type */}
                <div className="w-8 h-8 flex items-center justify-center text-slate-500">
                  {mobileActiveReport === "total" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="6" width="20" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="6" y1="9" x2="6" y2="9.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <line x1="18" y1="15" x2="18" y2="15.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  )}
                  {mobileActiveReport === "product" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                  {mobileActiveReport === "employee" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {mobileActiveReport === "bills" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {reportTitles[mobileActiveReport]}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentDateText}
                  </p>
                </div>
              </div>

              {/* Clean grey X without circle background matching */}
              <button
                type="button"
                onClick={closeMobileReport}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Report Content inside Bottom Sheet */}
            <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
              {isPending && !dataMap[mobileActiveReport] ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">กำลังโหลดรายงาน...</span>
                </div>
              ) : (
                <>
                  {mobileActiveReport === "total" && dataMap.total && (
                    <TotalSalesReportView data={dataMap.total} isMobile={true} />
                  )}
                  {mobileActiveReport === "product" && dataMap.product && (
                    <ProductSalesReportView
                      data={dataMap.product}
                      filterMode={productFilterMode}
                      onFilterModeChange={setProductFilterMode}
                      isMobile={true}
                    />
                  )}
                  {mobileActiveReport === "employee" && dataMap.employee && (
                    <EmployeeSalesReportView data={dataMap.employee} isMobile={true} />
                  )}
                  {mobileActiveReport === "bills" && dataMap.bills && (
                    <BillsReceiptsReportView
                      data={dataMap.bills}
                      search={billSearch}
                      onSearchChange={setBillSearch}
                      paymentMethodFilter={billPaymentMethod}
                      onPaymentMethodFilterChange={setBillPaymentMethod}
                      isMobile={true}
                    />
                  )}
                </>
              )}
            </div>

            {/* Bottom Sticky Excel Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 pb-6 sm:pb-4">
              <button
                type="button"
                onClick={() => handleDownloadExcelForTab(mobileActiveReport)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold bg-[#0d7482] hover:bg-[#0b6470] text-white shadow-sm transition active:scale-[0.99] flex items-center justify-center text-center"
              >
                ดาวน์โหลด Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Preview Modal */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={reportTitles[activeTab] || "รายงาน"}
        reportType={activeTab}
        data={
          currentData
            ? {
              ...currentData,
              shopName: orgName,
              productFilterMode,
            }
            : null
        }
        onDownload={handleDownloadExcel}
      />
    </div>
  );
}
