"use client";

import { CashNumpadProps } from "@/lib/interface";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function CashNumpad({
  numReceived = 0,
  changeAmount = 0,
  onPreset,
  onNumpadPress,
}: CashNumpadProps) {
  const { t } = useTranslation();
  const { settings } = useOrgSettings();
  const currencyCode = settings?.currencyCode || "THB";

  const presets = [1000, 5000, 50000, 100000, 500000];
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "DEL"];

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-center">
      <div className="bg-pos-bg p-2.5 rounded-2xl border border-pos-border space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-pos-text/60">
            {t('payment.received_colon')}
          </span>
          <span className="text-lg font-black font-mono text-sky-600 dark:text-sky-400">
            {numReceived > 0 ? numReceived.toLocaleString() : "0"}{" "}
            {/* 🌟 เปลี่ยนมาใช้ตัวแปรสกุลเงิน */}
            <span className="text-xs font-normal">{currencyCode}</span>
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-pos-border/50">
          <span className="text-[11px] font-bold text-pos-text/60">
            {t('payment.change_colon')}
          </span>
          <span
            className={`text-base font-black font-mono ${
              changeAmount > 0 ? "text-amber-500" : "text-pos-text/40"
            }`}
          >
            {changeAmount.toLocaleString()}{" "}
            {/* 🌟 เปลี่ยนมาใช้ตัวแปรสกุลเงิน */}
            <span className="text-xs font-normal">{currencyCode}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onPreset(0, true)}
          className="py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold text-[10px]"
        >
          {t('payment.exact')}
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
            className={`py-2 rounded-xl border font-mono font-bold text-sm transition active:scale-95 ${
              key === "DEL"
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : "bg-pos-surface border-pos-border text-pos-text hover:bg-pos-bg"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
