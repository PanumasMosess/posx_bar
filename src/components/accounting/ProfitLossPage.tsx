"use client";

import React, { useState, useMemo } from "react";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { getProfitLossTransactions } from "@/lib/actions/actionProfitLoss";
import { AccountTransactionItem, ProfitLossPageProps } from "@/lib/types";

const PNL_ALLOWED = ["SALES", "INCOME", "AR_PAYMENT", "EXPENSE"];

export default function ProfitLossPage({
  accounts,
  defaultTxLogs,
  organizationId,
  initialStartDate,
  initialEndDate,
}: ProfitLossPageProps) {
  const { settings } = useOrgSettings();
  const currency = settings?.currencyCode || "";

  const initialLogs = useMemo(
    () => (defaultTxLogs || []).filter((t) => PNL_ALLOWED.includes(t.type)),
    [defaultTxLogs]
  );
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [txLogs, setTxLogs] = useState<AccountTransactionItem[]>(() =>
    (defaultTxLogs || []).filter((t) => PNL_ALLOWED.includes(t.type))
  );
  const [loading, setLoading] = useState(false);

  // Table pagination & search
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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

    const res = await getProfitLossTransactions({
      accountId: selectedAccountId,
      types: selectedTypes,
      startDate,
      endDate,
      organizationId,
    });

    if (res.success) {
      setTxLogs(res.data as unknown as AccountTransactionItem[]);
      setCurrentPage(1);
      if (res.data.length === 0) {
        showToast("ไม่พบรายการในช่วงเวลาที่เลือก", "warning");
      }
    } else {
      showToast(res.message || "ไม่สามารถดึงข้อมูลได้", "error");
    }
    setLoading(false);
  };

  const handleReset = () => {
    setSelectedAccountId("all");
    setSelectedTypes([]);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setTxLogs(initialLogs);
    setCurrentPage(1);
    setTableSearch("");
  };

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    txLogs.forEach((log) => {
      const amt = Math.abs(Number(log.amount) || 0);
      if (["SALES", "INCOME", "AR_PAYMENT"].includes(log.type)) {
        income += amt;
      } else if (log.type === "EXPENSE") {
        expense += amt;
      }
    });

    return { income, expense, net: income - expense };
  }, [txLogs]);

  const filteredTableData = useMemo(() => {
    if (!tableSearch.trim()) return txLogs;
    const q = tableSearch.toLowerCase();
    return txLogs.filter(
      (tx) =>
        tx.title?.toLowerCase().includes(q) ||
        tx.note?.toLowerCase().includes(q) ||
        tx.account?.accountName?.toLowerCase().includes(q) ||
        tx.type?.toLowerCase().includes(q)
    );
  }, [txLogs, tableSearch]);

  const totalPages = Math.ceil(filteredTableData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTableData.slice(start, start + pageSize);
  }, [filteredTableData, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (txLogs.length === 0) {
      showToast("ไม่มีข้อมูลสำหรับส่งออก", "warning");
      return;
    }
    const headers = ["วันที่", "ประเภท", "รายการ", "บัญชี", "จำนวนเงิน", "หมายเหตุ"];
    const csvData = txLogs.map((log) => [
      `"${new Date(log.date || log.createdAt).toLocaleDateString("th-TH")}"`,
      `"${log.type === "EXPENSE" ? "รายจ่าย" : "รายรับ"}"`,
      `"${log.title || "-"}"`,
      `"${log.account?.accountName || "-"}"`,
      Math.abs(log.amount),
      `"${log.note || "-"}"`,
    ]);

    const csvString = [headers.join(","), ...csvData.map((e) => e.join(","))].join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `สรุปกำไรขาดทุน_${startDate}_ถึง_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ส่งออกข้อมูลไฟล์ CSV สำเร็จ", "success");
  };

  const handleExportPDF = () => {
    if (txLogs.length === 0) {
      showToast("ไม่มีข้อมูลสำหรับส่งออก", "warning");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("กรุณาอนุญาตให้ Pop-up ทำงานเพื่อพิมพ์ PDF", "error");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>รายงานสรุปกำไรขาดทุน_${startDate}_ถึง_${endDate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; color: #18181b; margin: 0; padding: 0; background-color: #f4f4f5; }
            .action-bar { background: #18181b; padding: 15px 20px; display: flex; justify-content: flex-end; gap: 10px; position: sticky; top: 0; z-index: 100; }
            .btn { padding: 8px 16px; border-radius: 6px; border: none; font-family: 'Sarabun', sans-serif; font-weight: 600; cursor: pointer; font-size: 14px; }
            .btn-primary { background: #0284c7; color: white; }
            .btn-secondary { background: #3f3f46; color: white; }
            .page-container { background: white; max-width: 210mm; margin: 30px auto; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 4px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e4e4e7; padding-bottom: 15px; }
            .header h2 { margin: 0 0 5px 0; font-size: 24px; color: #18181b; }
            .header p { margin: 0; font-size: 14px; color: #52525b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th, td { border: 1px solid #d4d4d8; padding: 10px 8px; text-align: left; }
            th { background-color: #f4f4f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-green { color: #16a34a; font-weight: bold; }
            .text-red { color: #dc2626; font-weight: bold; }
            .summary-box { display: flex; justify-content: space-around; margin: 20px 0; padding: 15px; background: #f4f4f5; border-radius: 8px; font-size: 14px; font-weight: bold; }
            @media print {
              body { background-color: white; }
              .page-container { margin: 0; padding: 0; box-shadow: none; max-width: 100%; }
              .action-bar { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <button class="btn btn-secondary" onclick="window.close()">ปิดหน้าต่าง</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ สั่งพิมพ์ / บันทึก PDF</button>
          </div>
          <div class="page-container">
            <div class="header">
              <h2>รายงานสรุปกำไร-ขาดทุน (Profit & Loss)</h2>
              <p>ช่วงเวลา: ${new Date(startDate).toLocaleDateString("th-TH")} ถึง ${new Date(endDate).toLocaleDateString("th-TH")}</p>
            </div>
            <div class="summary-box">
              <span class="text-green">รายรับรวม: ${summary.income.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ${currency}</span>
              <span class="text-red">รายจ่ายรวม: ${summary.expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ${currency}</span>
              <span style="color: #0284c7;">กำไรสุทธิ: ${summary.net.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ${currency}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>รายการ</th>
                  <th>บัญชี</th>
                  <th class="text-right">จำนวนเงิน</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                ${txLogs
                  .map(
                    (tx) => `
                  <tr>
                    <td>${new Date(tx.date || tx.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>${tx.title || "-"}</td>
                    <td>${tx.account?.accountName || "-"}</td>
                    <td class="text-right ${tx.type === "EXPENSE" ? "text-red" : "text-green"}">
                      ${tx.type === "EXPENSE" ? "-" : "+"}${Number(Math.abs(tx.amount)).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ${currency}
                    </td>
                    <td>${tx.note || "-"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-zinc-100">
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

      {/* FILTER CARD */}
      <div className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              สรุปกำไร-ขาดทุน (Profit & Loss)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              วิเคราะห์รายรับจากการขายและรายจ่ายจริงเพื่อดูผลกำไรสุทธิ
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                เลือกบัญชี
              </label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0A0B] px-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={loading}
              >
                <option value="all">ทั้งหมดทุกบัญชี</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                ตั้งแต่วันที่
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                disabled={loading}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                disabled={loading}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {loading ? "กำลังค้นหา..." : "🔍 คำนวณกำไรขาดทุน"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="h-10 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              รายรับรวม (Total Revenue)
            </p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {summary.income.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
            </p>
          </div>
          <span className="text-3xl">💵</span>
        </div>

        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/60 dark:bg-rose-950/20 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
              รายจ่ายรวม (Total Expenses)
            </p>
            <p className="text-3xl font-black text-rose-700 dark:text-rose-300">
              {summary.expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
            </p>
          </div>
          <span className="text-3xl">💸</span>
        </div>

        <div className="rounded-2xl border border-sky-200 dark:border-sky-900/30 bg-sky-50/60 dark:bg-sky-950/20 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
              กำไรสุทธิ (Net Profit)
            </p>
            <p
              className={`text-3xl font-black ${
                summary.net >= 0
                  ? "text-sky-700 dark:text-sky-300"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {summary.net >= 0 ? "+" : ""}
              {summary.net.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
            </p>
          </div>
          <span className="text-3xl">📈</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#161618]">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              รายการรายรับและรายจ่าย ({filteredTableData.length} รายการ)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              แสดงเฉพาะรายการรายรับ (SALES, INCOME, AR) และรายจ่าย (EXPENSE)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <input
              placeholder="ค้นหาในตาราง..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 px-3 text-xs bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-48"
            />
            <button
              onClick={handleExportCSV}
              disabled={txLogs.length === 0}
              className="h-8.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
            >
              📥 ส่งออก CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={txLogs.length === 0}
              className="h-8.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
            >
              🖨️ พิมพ์ / PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px] text-xs">
            <thead className="bg-slate-100/70 dark:bg-[#0A0A0B] border-b border-slate-200 dark:border-zinc-800">
              <tr className="text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ชื่อรายการ</th>
                <th className="px-4 py-3">บัญชี</th>
                <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                <th className="px-4 py-3">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
              {paginatedData.map((tx) => {
                const isExpense = tx.type === "EXPENSE";
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(tx.date || tx.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExpense
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}
                      >
                        {isExpense ? "รายจ่าย" : "รายรับ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">
                      {tx.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      🏦 {tx.account?.accountName || "-"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                        isExpense ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {Number(Math.abs(tx.amount)).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-[200px]">
                      {tx.note || "-"}
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    ไม่พบรายการในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#161618] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-zinc-400">
              แสดงแถวที่ {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, filteredTableData.length)} จากทั้งหมด{" "}
              {filteredTableData.length}
            </span>
            <select
              className="h-7 px-2 bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-700 rounded-md text-xs cursor-pointer"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-slate-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
              >
                ก่อนหน้า
              </button>
              <span className="px-2 font-semibold text-slate-700 dark:text-zinc-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-slate-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

