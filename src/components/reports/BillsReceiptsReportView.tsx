"use client";

import { useState } from "react";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import ReceiptDetailModal from "./ReceiptDetailModal";

import { BillsReceiptsReportViewProps } from "@/lib/types";

export default function BillsReceiptsReportView({
  data,
  search,
  onSearchChange,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
}: BillsReceiptsReportViewProps) {
  const { settings } = useOrgSettings();
  const currency = settings?.currencyCode || "";

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  return (
    <div className="space-y-5 pb-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pos-surface border border-pos-border p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-800">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              รายการบิล / ใบเสร็จ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {data?.dateRangeText || ""}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-pos-border">
          <span className="text-[11px] font-medium text-slate-400 block">
            ยอดขายทั้งหมด
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {(data?.totalSales || 0).toLocaleString()}
          </span>
          {currency && (
            <span className="text-xs text-slate-500 ml-1 font-medium">
              {currency}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาเลขบิล ชื่อลูกค้า/โต๊ะ หรือชื่อสินค้า..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-pos-surface border border-pos-border text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPaymentMethodFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              paymentMethodFilter === "ALL"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-xs font-bold"
                : "bg-pos-surface text-slate-600 dark:text-slate-300 border border-pos-border hover:bg-slate-50"
            }`}
          >
            ทั้งหมด {data?.counts?.all || 0}
          </button>

          <button
            type="button"
            onClick={() => onPaymentMethodFilterChange("CASH")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              paymentMethodFilter === "CASH"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-xs font-bold"
                : "bg-pos-surface text-slate-600 dark:text-slate-300 border border-pos-border hover:bg-slate-50"
            }`}
          >
            เงินสด {data?.counts?.cash || 0}
          </button>

          <button
            type="button"
            onClick={() => onPaymentMethodFilterChange("QR")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              paymentMethodFilter === "QR"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-xs font-bold"
                : "bg-pos-surface text-slate-600 dark:text-slate-300 border border-pos-border hover:bg-slate-50"
            }`}
          >
            เงินโอน {data?.counts?.qr || 0}
          </button>
        </div>

        {/* Date Grouped Bills List */}
        <div className="space-y-6 pt-2">
          {(data?.dateGroups || []).length === 0 ? (
            <div className="bg-pos-surface border border-pos-border p-12 rounded-2xl text-center text-xs text-slate-400">
              ไม่พบรายการบิลในช่วงเวลานี้
            </div>
          ) : (
            data.dateGroups.map((group) => (
              <div key={group.dateKey} className="space-y-2.5">
                {/* Date Header */}
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  {group.dateTitleThai}
                </h4>

                {/* Bills in this date */}
                <div className="space-y-2">
                  {group.bills.map((bill) => (
                    <div
                      key={bill.id}
                      onClick={() => setSelectedOrderId(bill.id)}
                      className="bg-pos-surface border border-pos-border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 cursor-pointer transition select-none group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Receipt Icon */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>

                        {/* Bill Info */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 transition">
                              #{bill.orderNumber}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span>{bill.formattedTime}</span>
                            <span>·</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium text-[10px]">
                              {bill.paymentMethodLabel}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium text-[10px]">
                              {bill.tableName}
                            </span>
                          </div>

                          {/* Items summary */}
                          {bill.itemsSummary && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-xs sm:max-w-md pt-0.5">
                              {bill.itemsSummary}
                            </p>
                          )}

                          {/* Cashier */}
                          <p className="text-[10px] text-slate-400">
                            {bill.cashierName}
                          </p>
                        </div>
                      </div>

                      {/* Right Amount & Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                          {bill.netAmount.toLocaleString()}
                        </span>
                        <svg
                          className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for viewing receipt detail */}
      <ReceiptDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

