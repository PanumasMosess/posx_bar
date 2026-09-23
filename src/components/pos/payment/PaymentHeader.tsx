"use client";

import { PaymentHeaderProps } from "@/lib/types/interface";

export default function PaymentHeader({
  orderNumber,
  tableName,
  shiftNumber,
  onClose,
}: PaymentHeaderProps) {
  return (
    <div className="p-3.5 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-pos-text leading-tight">
              ชำระเงิน
            </h3>
            {shiftNumber && (
              <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold">
                {shiftNumber}
              </span>
            )}
          </div>
          <p className="text-[11px] text-pos-text/60 font-medium">
            #{orderNumber} {tableName ? `• โต๊ะ ${tableName}` : ""}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="md:hidden w-8 h-8 rounded-lg bg-pos-bg text-pos-text flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}
