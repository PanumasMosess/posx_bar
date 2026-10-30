"use client";

import React, { useState, useMemo } from "react";
import { DataTableSettingTxlogProps } from "@/lib/types";

type DataTableProps = DataTableSettingTxlogProps;

// แปลง Enum ประเภทให้เป็นภาษาไทย และสี matching theme
const getTypeBadge = (type: string) => {
  switch (type) {
    case "INCOME":
      return {
        label: "เงินเข้า",
        color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
      };
    case "EXPENSE":
      return {
        label: "เงินออก",
        color: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
      };
    case "SALES":
      return {
        label: "ขาย",
        color: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
      };
    case "ADJUSTMENT_UP":
      return {
        label: "เติมเงินเข้า",
        color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
      };
    case "ADJUSTMENT_DOWN":
      return {
        label: "เบิกเงินออก",
        color: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
      };
    case "OVERRIDE_BALANCE":
      return {
        label: "ปรับยอดคงเหลือ",
        color: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
      };
    case "TRANSFER_IN":
      return {
        label: "รับโอนเข้า",
        color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
      };
    case "TRANSFER_OUT":
      return {
        label: "โอนเงินออก",
        color: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
      };
    case "AR_PAYMENT":
      return {
        label: "รับชำระหนี้",
        color: "bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
      };
    default:
      return {
        label: type,
        color: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
      };
  }
};

export default function DataTableSettingTxlog({
  data,
  title,
  subtitle,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Toggle sort by Date
  const handleToggleSortDate = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...(data || [])];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.title?.toLowerCase().includes(q) ||
          log.note?.toLowerCase().includes(q) ||
          log.account?.accountName?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    return result;
  }, [data, search, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header matching Image 1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3">
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {title || "ประวัติจัดการเงินในบัญชี"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {subtitle || "ประวัติการปรับเพิ่ม ลด และโอนเงินจากเมนูตั้งค่า"}
          </p>
        </div>

        <div className="relative w-full sm:w-auto">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหารายการ, ชื่อบัญชี..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-[280px]"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto custom-scroll border border-slate-100 dark:border-slate-800 rounded-xl">
        <table className="min-w-[760px] w-full text-xs sm:text-sm text-left border-collapse">
          <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 select-none">
            <tr>
              <th
                onClick={handleToggleSortDate}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 text-center whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>วันที่ / เวลา</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </div>
              </th>
              <th className="py-3 px-3 font-semibold whitespace-nowrap">ชื่อบัญชี</th>
              <th className="py-3 px-3 font-semibold whitespace-nowrap">รายการ</th>
              <th className="py-3 px-3 text-center font-semibold whitespace-nowrap">ประเภท</th>
              <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">จำนวนเงิน</th>
              <th className="py-3 px-3 text-right pr-4 font-semibold text-slate-400 whitespace-nowrap">
                คงเหลือหลังทำรายการ
              </th>
              <th className="py-3 px-3 text-center font-semibold whitespace-nowrap">ผู้ทำรายการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:border-slate-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  ไม่พบประวัติการทำรายการ
                </td>
              </tr>
            ) : (
              paginatedData.map((log) => {
                const dateVal = log.date || log.createdAt;
                const formattedDate = dateVal
                  ? new Date(dateVal).toLocaleString("th-TH", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";

                const badge = getTypeBadge(log.type);
                const rawAmount = parseFloat(String(log.amount)) || 0;
                const isNegative =
                  log.type === "ADJUSTMENT_DOWN" ||
                  log.type === "TRANSFER_OUT" ||
                  log.type === "EXPENSE" ||
                  rawAmount < 0;
                const displayAmount = Math.abs(rawAmount);

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Date/Time */}
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Account Name */}
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.account?.accountName || "-"}
                    </td>

                    {/* Title + Note */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                          {log.title}
                        </span>
                        {log.note && (
                          <span className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                            {log.note}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Amount (+ or -) */}
                    <td
                      className={`py-3 px-3 text-right font-bold text-xs sm:text-sm whitespace-nowrap ${
                        isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isNegative ? "-" : "+"}
                      {displayAmount.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Running Balance */}
                    <td className="py-3 px-3 text-right pr-4 text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">
                      {Number(log.accountBalance).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Creator */}
                    <td className="py-3 px-3 text-center text-xs text-slate-500 whitespace-nowrap">
                      {log.creator?.name || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between pt-3 text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="First Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Previous Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Next Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Last Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

