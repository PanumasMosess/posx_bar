"use client";

import { PaymentItemsListProps } from "@/lib/interface";

export default function PaymentItemsList({
  items,
  discountAmount,
  discountPercent,
  netTotal,
  renderOptionsText,
}: PaymentItemsListProps) {
  return (
    <>
      <div className="p-3 overflow-y-auto custom-scroll space-y-2 flex-1 bg-pos-bg">
        {items?.map((subItem: any, idx: number) => {
          const subTitle =
            subItem.product?.name ||
            subItem.product?.title ||
            subItem.name ||
            "สินค้า";
          const subQty = subItem.quantity || 1;
          const subPrice = subItem.priceAtTime || subItem.product?.price || 0;
          const optionsDisplay = renderOptionsText(
            subItem.options || subItem.selectedOptions
          );

          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-pos-card border border-pos-border flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="min-w-0 flex-1">
                <h5 className="font-bold text-xs text-pos-text truncate leading-tight">
                  {subTitle}
                </h5>
                {optionsDisplay && (
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium truncate mt-0.5">
                    {optionsDisplay}
                  </p>
                )}
                <p className="text-[10px] text-pos-text/50 font-mono mt-0.5">
                  {subPrice.toLocaleString()} LAK × {subQty}
                </p>
              </div>
              <span className="font-mono font-black text-xs text-pos-text shrink-0 bg-pos-surface px-2 py-1 rounded-lg border border-pos-border">
                {(subPrice * subQty).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 bg-pos-surface border-t border-pos-border space-y-1.5 shrink-0">
        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-rose-500 font-semibold">
            <span>ส่วนลดสมาชิก ({discountPercent}%):</span>
            <span>-{discountAmount.toLocaleString()} LAK</span>
          </div>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-bold text-pos-text/70">
            ยอดรวมสุทธิ:
          </span>
          <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {netTotal.toLocaleString()}{" "}
            <span className="text-xs font-normal">LAK</span>
          </span>
        </div>
      </div>
    </>
  );
}