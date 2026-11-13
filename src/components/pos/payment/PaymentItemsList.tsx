"use client";

import Image from "next/image";
import { PaymentItemsListProps } from "@/lib/interface";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function PaymentItemsList({
  items,
  discountAmount,
  discountPercent,
  netTotal,
  renderOptionsText,
}: PaymentItemsListProps) {
  const { t } = useTranslation();
  const { settings } = useOrgSettings();
  const currencyCode = settings?.currencyCode || "LAK";

  // 🌟 ฟังก์ชันดึง ID ตัวเลือกเพื่อใช้จัดกลุ่ม
  const getNormalizedOptionKey = (rawOptions: any) => {
    if (!rawOptions) return "";
    try {
      let parsed = rawOptions;
      if (typeof rawOptions === "string") {
        if (!rawOptions.trim() || rawOptions === "{}" || rawOptions === "[]")
          return "";
        parsed = JSON.parse(rawOptions);
      }
      if (!parsed || typeof parsed !== "object") return "";

      const choiceIds: number[] = [];
      const extractIds = (obj: any) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          obj.forEach((item) => extractIds(item));
        } else if (typeof obj === "object") {
          if (obj.id !== undefined) {
            choiceIds.push(Number(obj.id));
          } else {
            Object.values(obj).forEach((val) => extractIds(val));
          }
        }
      };

      extractIds(parsed);
      return choiceIds.sort((a, b) => a - b).join("_");
    } catch (e) {
      return "";
    }
  };

  // 🌟 ฟังก์ชันรวมรายการสินค้าที่เป็นเมนูเดียวกัน + Option เดียวกัน
  const aggregateItems = (itemList: any[]) => {
    if (!itemList || !Array.isArray(itemList)) return [];

    const itemMap = new Map<string, any>();

    itemList.forEach((item) => {
      const productId = item.productId || item.product?.id || item.id;
      const optionKey = getNormalizedOptionKey(
        item.options || item.selectedOptions,
      );
      const groupKey = `${productId}__${optionKey}`;

      if (itemMap.has(groupKey)) {
        const existing = itemMap.get(groupKey);
        existing.quantity =
          (Number(existing.quantity) || 1) + (Number(item.quantity) || 1);
      } else {
        itemMap.set(groupKey, {
          ...item,
          quantity: Number(item.quantity) || 1,
        });
      }
    });

    return Array.from(itemMap.values());
  };

  const aggregatedList = aggregateItems(items);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-pos-surface">
      {/* 🌟 รายการสินค้าที่รวมแล้ว Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scroll p-3 sm:p-4 space-y-2.5 min-h-0">
        {aggregatedList.length === 0 ? (
          <div className="text-center py-12 text-pos-text/40 text-xs">
            {t("cart.empty_cart")}
          </div>
        ) : (
          aggregatedList.map((item, index) => {
            const subTitle =
              item.product?.name ||
              item.product?.title ||
              item.name ||
              item.title ||
              t("pos.items_unit");
            const subImage =
              item.product?.image || item.product?.img || item.image || "";
            const subPrice = Number(
              item.priceAtTime || item.product?.price || item.price || 0,
            );
            const subQty = Number(item.quantity || 1);

            const optionsDisplay = renderOptionsText(
              item.options || item.selectedOptions,
            );

            return (
              <div
                key={item.id ? `item-${item.id}` : `agg-${index}`}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-pos-bg/80 hover:bg-pos-bg border border-pos-border/70 hover:border-pos-border transition-all duration-200"
              >
                {/* 🌟 รูปภาพสินค้าขอบมนสวยงาม */}
                <div className="relative w-12 h-12 rounded-xl bg-pos-surface border border-pos-border/50 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  {subImage ? (
                    <Image
                      src={subImage}
                      alt={subTitle}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-pos-bg text-pos-text/40 font-black text-[10px]">
                      POS
                    </div>
                  )}
                </div>

                {/* รายละเอียดสินค้า */}
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-xs text-pos-text truncate leading-snug">
                    {subTitle}
                  </h5>

                  {/* 🌟 Option Badge */}
                  {optionsDisplay && (
                    <div className="mt-0.5">
                      <span className="inline-block text-[10px] font-medium text-pos-text/70 bg-pos-surface border border-pos-border px-2 py-0.5 rounded-md truncate max-w-full">
                        {optionsDisplay}
                      </span>
                    </div>
                  )}

                  <p className="text-[10px] text-pos-text/50 font-mono mt-1 flex items-center gap-1">
                    <span>
                      {subPrice.toLocaleString()} {currencyCode}
                    </span>
                    <span className="text-pos-text/30">×</span>
                    <span className="font-bold text-pos-text/80">{subQty}</span>
                  </p>
                </div>

                {/* 🌟 ราคารวมต่อรายการ + ป้ายจำนวน */}
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className="font-mono font-black text-xs text-pos-text bg-pos-surface px-2.5 py-1 rounded-xl border border-pos-border shadow-2xs">
                    {(subPrice * subQty).toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-pos-text/60 bg-pos-surface px-1.5 py-0.2 rounded-full border border-pos-border">
                    x{subQty} {t("pos.piece_unit")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🌟 สรุปยอดรวมสุทธิ */}
      <div className="p-3.5 bg-pos-surface border-t border-pos-border/80 space-y-2 shrink-0 mt-auto shadow-lg">
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
            <span>{t("cart.discount")} ({discountPercent}%):</span>
            <span className="font-mono">
              -{discountAmount.toLocaleString()} {currencyCode}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-pos-text/70 block">
              {t("cart.total")}
            </span>
            <span className="text-[10px] text-pos-text/40 font-medium">
              {t("cart.vat")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 drop-shadow-2xs">
              {netTotal.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 ml-1">
              {currencyCode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
