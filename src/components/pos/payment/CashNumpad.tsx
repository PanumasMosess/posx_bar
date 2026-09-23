"use client";

import { CashNumpadProps } from "@/lib/types/interface";

export default function CashNumpad({
  numReceived = 0,
  changeAmount = 0,
  onPreset,
  onNumpadPress,
}: CashNumpadProps) {
  const presets = [1000, 5000, 50000, 100000, 500000];
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "DEL"];

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-center">
      <div className="bg-pos-bg p-2.5 rounded-2xl border border-pos-border space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-pos-text/60">
            รับเงินมา:
          </span>
          <span className="text-lg font-black font-mono text-sky-600 dark:text-sky-400">
            {numReceived > 0 ? numReceived.toLocaleString() : "0"}{" "}
            <span className="text-xs font-normal">LAK</span>
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-pos-border/50">
          <span className="text-[11px] font-bold text-pos-text/60">
            เงินทอน:
          </span>
          <span
            className={`text-base font-black font-mono ${
              changeAmount > 0 ? "text-amber-500" : "text-pos-text/40"
            }`}
          >
            {changeAmount.toLocaleString()}{" "}
            <span className="text-xs font-normal">LAK</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onPreset(0, true)}
          className="py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold text-[10px]"
        >
          พอดี
        </button>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPreset(preset)}
            className="py-1.5 rounded-lg bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-[10px]"
          >
            +{(preset / 1000).toFixed(0)}k
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 flex-1">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onNumpadPress(key)}
            className={`py-2 rounded-xl font-mono font-bold text-sm border active:scale-95 transition ${
              key === "DEL"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                : "bg-pos-bg border-pos-border text-pos-text hover:bg-pos-hover"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
