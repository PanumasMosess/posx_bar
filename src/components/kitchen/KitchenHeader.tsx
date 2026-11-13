"use client";

import { KitchenHeaderProps } from "@/lib/interface";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function KitchenHeader({
  orderCount,
  onRefresh,
}: KitchenHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-20 bg-pos-surface border-b border-pos-border px-5 sm:px-8 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 flex items-center justify-center text-2xl font-black shrink-0">
          🍳
        </div>
        <div>
          <div className="flex items-center gap-3">
            {/* หัวข้อหลัก */}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-pos-text">
              {t("kitchen.title")}
            </h1>
            {/* Badge แสดงจำนวนบิล */}
            <span className="text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3.5 py-1 rounded-full font-mono font-black tracking-wide">
              {t("kitchen.pending_orders").replace("{count}", String(orderCount))}
            </span>
          </div>
          {/* ข้อความคำอธิบาย */}
          <p className="text-xs sm:text-sm text-pos-text/70 font-semibold mt-0.5 hidden sm:block">
            {t("kitchen.kds_subtitle")}
          </p>
        </div>
      </div>

      {/* ปุ่มรีเฟรช */}
      <button
        type="button"
        onClick={onRefresh}
        className="px-4 py-2.5 rounded-2xl bg-pos-surface hover:bg-pos-hover text-pos-text border border-pos-border text-sm font-extrabold flex items-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
      >
        <span className="text-base">🔄</span>
        <span>{t("kitchen.refresh")}</span>
      </button>
    </header>
  );
}
