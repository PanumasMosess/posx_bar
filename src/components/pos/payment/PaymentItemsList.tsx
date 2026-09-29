"use client";

import Image from "next/image";
import { PaymentItemsListProps } from "@/lib/interface";

export default function PaymentItemsList({
  items,
  discountAmount,
  discountPercent,
  netTotal,
  renderOptionsText,
}: PaymentItemsListProps) {
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
      const uniqueKey = `${productId}_${optionKey}`;

      const qty = Number(item.quantity || 1);
      const price = Number(item.priceAtTime || item.product?.price || 0);

      if (itemMap.has(uniqueKey)) {
        const existing = itemMap.get(uniqueKey);
        existing.quantity += qty;
      } else {
        itemMap.set(uniqueKey, {
          ...item,
          quantity: qty,
          priceAtTime: price,
        });
      }
    });

    return Array.from(itemMap.values());
  };

  const displayItems = aggregateItems(items);

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {/* 🌟 รายการสินค้า (เลื่อนดูได้ สวยงาม แสดงรูปภาพ พร้อม Option ตามธีม POS) */}
      <div className="p-3 overflow-y-auto custom-scroll space-y-2.5 flex-1 bg-pos-bg/40 max-h-[340px] sm:max-h-[380px]">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-pos-text/40">
            <p className="text-xs font-medium">ไม่มีรายการสินค้า</p>
          </div>
        ) : (
          displayItems.map((subItem: any, idx: number) => {
            const subTitle =
              subItem.product?.name ||
              subItem.product?.title ||
              subItem.name ||
              "สินค้า";
            const subQty = subItem.quantity || 1;
            const subPrice = subItem.priceAtTime || subItem.product?.price || 0;
            const subImage =
              subItem.product?.image ||
              subItem.product?.img ||
              subItem.image ||
              "";

            const optionsDisplay = renderOptionsText(
              subItem.options || subItem.selectedOptions,
            );

            return (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-pos-card border border-pos-border/80 flex items-center gap-3 shadow-2xs hover:border-pos-border transition-all shrink-0"
              >
                {/* 📸 รูปภาพสินค้า */}
                <div className="relative w-12 h-12 rounded-xl bg-pos-surface border border-pos-border overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
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

                  {/* 🌟 Option Badge โทนสีตามธีม POS (เข้ากันทั้ง Light & Dark mode) */}
                  {optionsDisplay && (
                    <div className="mt-0.5">
                      <span className="inline-block text-[10px] font-medium text-pos-text/70 bg-pos-surface border border-pos-border px-2 py-0.5 rounded-md truncate max-w-full">
                        {optionsDisplay}
                      </span>
                    </div>
                  )}

                  <p className="text-[10px] text-pos-text/50 font-mono mt-1 flex items-center gap-1">
                    <span>{subPrice.toLocaleString()} LAK</span>
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
                    x{subQty} ชิ้น
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
            <span>ส่วนลดสมาชิก ({discountPercent}%):</span>
            <span className="font-mono">
              -{discountAmount.toLocaleString()} LAK
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-pos-text/70 block">
              ยอดรวมสุทธิ
            </span>
            <span className="text-[10px] text-pos-text/40 font-medium">
              รวมภาษีมูลค่าเพิ่มแล้ว
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 drop-shadow-2xs">
              {netTotal.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 ml-1">
              LAK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
