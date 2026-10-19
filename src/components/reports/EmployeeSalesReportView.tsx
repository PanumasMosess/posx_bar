"use client";

import { useState } from "react";
import Image from "next/image";
import ReceiptDetailModal from "./ReceiptDetailModal";

import { EmployeeSalesReportViewProps } from "@/lib/types";

export default function EmployeeSalesReportView({
  data,
}: EmployeeSalesReportViewProps) {
  const employees = (data?.employees || []).filter(
    (emp) => emp.completedBills > 0 || emp.totalSales > 0
  );
  const totalSales = data?.totalSales || 0;

  const [expandedEmployees, setExpandedEmployees] = useState<{
    [key: string]: boolean;
  }>({});

  const [activeSubTab, setActiveSubTab] = useState<{
    [key: string]: "products" | "bills";
  }>({});

  // Modal สำหรับกดดูใบเสร็จย่อยจากรายการบิล
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedEmployees((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const setSubTab = (
    empName: string,
    tab: "products" | "bills"
  ) => {
    setActiveSubTab((prev) => ({
      ...prev,
      [empName]: tab,
    }));
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      <div className="pb-3 flex items-center justify-between">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              ยอดขายตามพนักงาน
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {data?.dateRangeText || ""}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block">
            ยอดขายทั้งหมด
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {totalSales.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 📦 Staff Cards List */}
      <div className="space-y-4">
        {employees.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            ไม่พบข้อมูลยอดขายพนักงานในช่วงเวลานี้
          </div>
        ) : (
          employees.map((emp) => {
            const isExpanded = !!expandedEmployees[emp.name];
            const currentTab = activeSubTab[emp.name] || "products";

            const cashAmount = emp.cashSales || 0;
            const transferAmount = emp.transferSales || 0;
            const totalPayment = cashAmount + transferAmount || 1;
            const cashPercent = Math.round((cashAmount / totalPayment) * 100);
            const transferPercent = 100 - cashPercent;

            return (
              <div
                key={emp.name}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition"
              >
                <div
                  onClick={() => toggleExpand(emp.name)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* Round Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm overflow-hidden shrink-0 border border-slate-300/60 dark:border-slate-600">
                      {emp.img ? (
                        <Image
                          src={emp.img}
                          alt={emp.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {emp.name}
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
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
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {emp.percentage}% ของยอดขาย
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {emp.totalSales.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                      บาท
                    </span>
                  </div>
                </div>

                {/* 📊 Card Body */}
                <div className="px-4 sm:px-5 pb-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 pt-1 pb-3 text-center sm:text-left">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        บิลสำเร็จ
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                        {emp.completedBills} บิล
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        บิลเฉลี่ย
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                        {typeof emp.averageBill === "number"
                          ? emp.averageBill.toFixed(2)
                          : emp.averageBill}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        บิลยกเลิก
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                        {emp.cancelledBills || 0} บิล
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* เส้นสีเหลือง/ส้มแนวยาวเต็มการ์ด */}
                    <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      {cashAmount > 0 && (
                        <div
                          style={{ width: `${cashPercent}%` }}
                          className="bg-[#f59e0b] h-full"
                        />
                      )}
                      {transferAmount > 0 && (
                        <div
                          style={{ width: `${transferPercent}%` }}
                          className="bg-[#ef4444] h-full"
                        />
                      )}
                      {cashAmount === 0 && transferAmount === 0 && (
                        <div className="bg-slate-200 dark:bg-slate-700 w-full h-full" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                          เงินสด {cashAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                          เงินโอน {transferAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <svg
                              className="w-3.5 h-3.5 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            <span className="font-medium text-[11px]">
                              จำนวนที่ขาย
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {emp.totalItemsSold} ชิ้น
                          </span>
                        </div>

                        {emp.categoryBreakdown && emp.categoryBreakdown.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {emp.categoryBreakdown.map((cat) => (
                              <span
                                key={cat.categoryName}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                              >
                                {cat.categoryName} {cat.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-slate-500 pt-1">
                          <span>ยอดสินค้า</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {emp.totalSales.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                          <span>ยอดขายทั้งหมด</span>
                          <span>{emp.totalSales.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 text-xs w-fit">
                        <button
                          type="button"
                          onClick={() => setSubTab(emp.name, "products")}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                            currentTab === "products"
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
                          }`}
                        >
                          <span>สินค้าที่ขาย</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 font-bold">
                            {emp.soldProducts.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSubTab(emp.name, "bills")}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                            currentTab === "bills"
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
                          }`}
                        >
                          <span>รายการบิล</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 font-bold">
                            {emp.orders.length}
                          </span>
                        </button>
                      </div>

                      {currentTab === "products" && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {emp.soldProducts.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              ไม่มีรายการสินค้า
                            </div>
                          ) : (
                            emp.soldProducts.map((p) => (
                              <div
                                key={p.productId}
                                className="py-3 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 relative">
                                    {p.image ? (
                                      <Image
                                        src={p.image}
                                        alt={p.productName}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs">
                                        🍣
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {p.productName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-6 shrink-0 text-right">
                                  <span className="text-slate-400 font-medium text-xs">
                                    ×{p.quantity}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs min-w-[50px]">
                                    {p.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {currentTab === "bills" && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {emp.orders.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              ไม่มีรายการบิล
                            </div>
                          ) : (
                            emp.orders.map((o, idx) => {
                              // ตัวเลขวงกลมสีฟ้าเขียว เช่น 03, 02, 01
                              const billNum = (emp.orders.length - idx)
                                .toString()
                                .padStart(2, "0");

                              return (
                                <div
                                  key={o.id}
                                  onClick={() => setSelectedOrderId(o.id)}
                                  className="py-3 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 transition group"
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    {/* Teal Circle Badge */}
                                    <div className="w-6 h-6 rounded-full bg-[#0d7482] dark:bg-teal-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                                      {billNum}
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 block group-hover:text-sky-600 transition">
                                        #{o.orderNumber}
                                      </span>

                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                        <span>{o.formattedTime}</span>
                                        <span>·</span>
                                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium text-[10px]">
                                          {o.paymentMethodLabel || "เงินสด"}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium text-[10px]">
                                          {o.tableName || "ขายหน้าร้าน"}
                                        </span>
                                      </div>

                                      {o.itemsSummary && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md pt-0.5">
                                          {o.itemsSummary}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {o.netAmount.toLocaleString()}
                                    </span>
                                    <svg
                                      className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition"
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
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal ดูรายละเอียดใบเสร็จเมื่อกดบิล */}
      <ReceiptDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
