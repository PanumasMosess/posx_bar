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

  // State Data Map แยกตามแต่ละ Tab เพื่อป้องกันการชนกันของข้อมูล
  const [dataMap, setDataMap] = useState<{
    total?: TotalSalesReportData;
    product?: ProductSalesReportData;
    employee?: EmployeeSalesReportData;
    bills?: BillsReceiptsReportData;
  }>({});

  const [isPending, startTransition] = useTransition();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleDownloadExcel = () => {
    if (!currentData) return;
    const dateCode =
      (currentData as { dateRangeCode?: string }).dateRangeCode ||
      new Date().toISOString().slice(0, 10).replace(/-/g, "");

    let fileName = "";
    if (activeTab === "product") {
      fileName =
        productFilterMode === "worst"
          ? `low-sellers-${dateCode}`
          : `product-sales-all-${dateCode}`;
    } else if (activeTab === "total") {
      fileName = `sales-summary-${dateCode}`;
    } else if (activeTab === "employee") {
      fileName = `staff-sales-${dateCode}`;
    } else if (activeTab === "bills") {
      fileName = `bills-${dateCode}`;
    } else {
      const tabName = reportTitles[activeTab] || "รายงาน";
      fileName = `${tabName}_${period}_${dateCode}`;
    }

    const orgName = (settings as { name?: string })?.name || settings?.payments_settings?.promptPayName || "ซูชิ";
    const enrichedData = {
      ...currentData,
      shopName: orgName,
      productFilterMode,
    };
    exportReportToExcel(activeTab, enrichedData, fileName);
  };

  // Top 4 active tabs for quick mobile/tablet switcher
  const quickTabs: { key: ReportTabKey; label: string }[] = [
    { key: "total", label: "ยอดขายทั้งหมด" },
    { key: "product", label: "ยอดขายตามสินค้า" },
    { key: "employee", label: "ยอดขายตามพนักงาน" },
    { key: "bills", label: "รายการบิล / ใบเสร็จ" },
  ];

  return (
    <div className="flex h-full w-full bg-[#f1f5f9] dark:bg-pos-bg overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4 select-none">
      {/* 🖥️ Left Column (Framed Sidebar for PC / iPad) */}
      <div className="hidden md:flex w-68 lg:w-72 xl:w-80 shrink-0 h-full flex-col">
        <ReportSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          period={period}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          className="h-full"
        />
      </div>

      {/* 📱 Mobile Drawer Modal */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs h-full bg-[#f1f5f9] dark:bg-pos-bg shadow-2xl z-10 flex flex-col p-3">
            <div className="p-2 mb-2 flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 px-2">
                เมนูรายงานทั้งหมด
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <ReportSidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }}
              period={period}
              onPeriodChange={handlePeriodChange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomDateChange={handleCustomDateChange}
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* 📄 Right Column (Framed Report Container) */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
        {/* 📱 Mobile Header Bar (shown on screens < md) */}
        <div className="md:hidden border-b border-slate-100 dark:border-slate-800 p-3 space-y-2 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {reportTitles[activeTab]}
            </h1>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50"
            >
              <svg
                className="w-4 h-4 text-sky-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              เมนูรายงาน
            </button>
          </div>

          {/* Quick tab switcher scroll on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {quickTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Date Selector */}
          <div>
            <ReportDateSelector
              period={period}
              onPeriodChange={handlePeriodChange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomDateChange={handleCustomDateChange}
            />
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 bg-white dark:bg-slate-900">
          <div className="w-full">
            {!currentData || isPending ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">กำลังโหลดรายงาน...</span>
              </div>
            ) : currentData ? (
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
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                ไม่พบข้อมูลรายงาน
              </div>
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

      {/* Preview Modal */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={reportTitles[activeTab] || "รายงาน"}
        reportType={activeTab}
        data={
          currentData
            ? {
                ...currentData,
                shopName: (settings as { name?: string })?.name || settings?.payments_settings?.promptPayName || "ซูชิ",
                productFilterMode,
              }
            : null
        }
        onDownload={handleDownloadExcel}
      />
    </div>
  );
}