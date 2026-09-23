"use client";

import { ShiftCheckViewProps } from "@/lib/types/interface";
import { useState } from "react";

export default function ShiftCheckView({
  onOpenShift,
  isLoading = false,
}: ShiftCheckViewProps) {
  const [startingCashInput, setStartingCashInput] = useState<string>("0");

  const handleSubmit = async () => {
    const cash = Number(startingCashInput) || 0;
    await onOpenShift(cash);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-2xl">
        ⚠️
      </div>
      <div>
        <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">
          ยังไม่ได้เปิดกะการทำงาน
        </h4>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
          กรุณาเปิดกะก่อนทำการรับชำระเงิน
        </p>
      </div>

      <div className="w-full space-y-2 pt-2">
        <div className="text-left">
          <label className="text-[10px] font-bold text-pos-text/70 block mb-1">
            เงินสดเริ่มต้นกะ (LAK):
          </label>
          <input
            type="number"
            value={startingCashInput}
            onChange={(e) => setStartingCashInput(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-1.5 bg-pos-bg border border-pos-border rounded-xl text-xs font-mono font-bold text-pos-text outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
        >
          {isLoading ? "กำลังเปิดกะ..." : "⚡ เปิดกะการทำงานทันที"}
        </button>
      </div>
    </div>
  );
}
