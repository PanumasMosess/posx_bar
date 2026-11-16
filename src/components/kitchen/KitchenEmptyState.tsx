"use client";

import { useTranslation } from "@/lib/language/LanguageContext";

export default function KitchenEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center text-pos-text/40 space-y-3">
      <span className="text-6xl animate-bounce">✨</span>
      <p className="font-extrabold text-lg text-pos-text">
        {t("kitchen.no_orders")}
      </p>
      <p className="text-xs text-pos-text/60 font-medium">
        {t("kitchen.empty_desc")}
      </p>
    </div>
  );
}
