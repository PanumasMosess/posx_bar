"use client";

import { useState } from "react";
import Image from "next/image";

import { ProductSalesReportViewProps } from "@/lib/types";

export default function ProductSalesReportView({
  data,
  filterMode: controlledFilterMode,
  onFilterModeChange,
}: ProductSalesReportViewProps) {
  const [internalFilterMode, setInternalFilterMode] = useState<"best" | "worst">("best");
  const filterMode = controlledFilterMode ?? internalFilterMode;

  const handleFilterModeChange = (mode: "best" | "worst") => {
    setInternalFilterMode(mode);
    onFilterModeChange?.(mode);
  };

  // Sub mode: จำนวน / ยอดขาย / กำไร
  const [metricMode, setMetricMode] = useState<"quantity" | "sales" | "profit">("quantity");

  // รายการสินค้าตามโหมดที่เลือก
  const currentList =
    (filterMode === "best" ? data?.best?.[metricMode] : data?.worst?.[metricMode]) || [];

  // สินค้าทั้งหมดและจำนวนสินค้าที่ขายไม่ได้
  const allProducts = data?.allProducts || [];
  const allProductsCount = allProducts.length;
  const unsoldProductsCount = allProducts.filter((p) => p.quantity === 0).length;

  // หาค่ายอดสูงสุดเพื่อคำนวณความกว้าง Progress Bar ของโหมดขายดี
  const maxVal = Math.max(
    ...currentList.map((p) => {
      if (metricMode === "quantity") return p.quantity || 0;
      if (metricMode === "sales") return p.sales || 0;
      return p.profit || 0;
    }),
    1
  );

  return (
    <div className="w-full space-y-4 pb-6 select-none">
      {/* 🏷️ 1. Top Header */}
      <div className="pb-3 flex items-center justify-between">
        {/* Left: Icon & Title & Date */}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              ยอดขายตามสินค้า
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
            {(data?.totalSales || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-full flex items-center w-full text-xs">
        <button
          type="button"
          onClick={() => handleFilterModeChange("best")}
          className={`flex-1 py-1.5 rounded-full font-bold transition text-center ${
            filterMode === "best"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
          }`}
        >
          ขายดี
        </button>
        <button
          type="button"
          onClick={() => handleFilterModeChange("worst")}
          className={`flex-1 py-1.5 rounded-full font-bold transition text-center ${
            filterMode === "worst"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
          }`}
        >
          ขายไม่ดี
        </button>
      </div>

      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-full flex items-center w-full text-xs">
        <button
          type="button"
          onClick={() => setMetricMode("quantity")}
          className={`flex-1 py-1.5 rounded-full font-bold transition text-center ${
            metricMode === "quantity"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
          }`}
        >
          จำนวน
        </button>
        <button
          type="button"
          onClick={() => setMetricMode("sales")}
          className={`flex-1 py-1.5 rounded-full font-bold transition text-center ${
            metricMode === "sales"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
          }`}
        >
          ยอดขาย
        </button>
        <button
          type="button"
          onClick={() => setMetricMode("profit")}
          className={`flex-1 py-1.5 rounded-full font-bold transition text-center ${
            metricMode === "profit"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
          }`}
        >
          กำไร
        </button>
      </div>

      {filterMode === "worst" && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 px-1">
            เป็นการจัดอันดับจากรายงานในด้านบนรวมสินค้าที่มียอดขายเป็น 0 ในช่วงเวลานี้
          </p>
          {unsoldProductsCount > 0 && (
            <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-xl px-4 py-2.5 text-xs text-red-500 font-medium">
              ไม่มีการขายเลย {unsoldProductsCount} รายการ จากสินค้าทั้งหมด {allProductsCount} รายการ
            </div>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
        {currentList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            ไม่มีข้อมูลสินค้าในช่วงเวลานี้
          </div>
        ) : filterMode === "best" ? (
          currentList.map((prod, idx) => {
            const currentVal =
              metricMode === "quantity"
                ? prod.quantity
                : metricMode === "sales"
                  ? prod.sales
                  : prod.profit;

            const percent =
              maxVal > 0
                ? Math.min(100, Math.round((Math.max(currentVal, 0) / maxVal) * 100))
                : 0;

            let mainVal = "";
            let subVal = "";

            if (metricMode === "quantity") {
              mainVal = `${prod.quantity} ชิ้น`;
            } else if (metricMode === "sales") {
              mainVal = (prod.sales || 0).toLocaleString();
              subVal = `${prod.quantity} ชิ้น`;
            } else {
              // กำไร (ตัดต้นทุนแล้ว: ยอดขาย - ต้นทุน)
              mainVal = (prod.profit || 0).toLocaleString();
              subVal = `${prod.quantity} ชิ้น`;
            }

            return (
              <div key={prod.productId} className="py-3 sm:py-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Rank + Thumbnail + Product Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-4 text-center text-xs font-semibold text-slate-400 shrink-0">
                      {idx + 1}
                    </span>

                    {/* Thumbnail Image */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 relative">
                      {prod.image ? (
                        <Image
                          src={prod.image}
                          alt={prod.name}
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

                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {prod.name}
                    </span>
                  </div>

                  {/* Right: Main Amount & Sub Text */}
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                      {mainVal}
                    </span>
                    {subVal && (
                      <span className="text-[11px] text-slate-400 block -mt-0.5">
                        {subVal}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(percent, 2)}%` }}
                    className="h-full bg-sky-400 dark:bg-sky-500 rounded-full"
                  />
                </div>
              </div>
            );
          })
        ) : (
          currentList.map((prod) => {
            const isUnsold = prod.quantity === 0;

            let mainVal = "";
            let subTextUnderName = "";

            if (metricMode === "quantity") {
              mainVal = `${prod.quantity} ชิ้น`;
            } else if (metricMode === "sales") {
              mainVal = (prod.sales || 0).toLocaleString();
              if (!isUnsold) {
                subTextUnderName = `${prod.quantity} ชิ้น`;
              }
            } else {
              // กำไร (ตัดต้นทุนแล้ว: ยอดขาย - ต้นทุน)
              // ถ้าขายไม่ได้ (ยอดขาย 0) กำไรจะเป็น 0
              mainVal = (prod.profit || 0).toLocaleString();
              if (!isUnsold) {
                subTextUnderName = `${prod.quantity} ชิ้น`;
              }
            }

            return (
              <div
                key={prod.productId}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3"
              >
                {/* Left: Thumbnail & Name with Optional Badge / Subtext */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 relative">
                    {prod.image ? (
                      <Image
                        src={prod.image}
                        alt={prod.name}
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

                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 block truncate">
                      {prod.name}
                    </span>

                    {isUnsold ? (
                      <span className="inline-block bg-red-100 dark:bg-red-950/40 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-sm mt-0.5">
                        ไม่มีการขาย
                      </span>
                    ) : subTextUnderName ? (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {subTextUnderName}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                    {mainVal}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
