"use client";

interface KitchenOrderItemProps {
  item: any;
  isProcessing: boolean;
  onServe: (itemId: number) => void;
}

/** แปลง JSON Options เป็นข้อความอ่านง่าย */
const renderOptionsText = (rawOptions: any) => {
  if (!rawOptions) return null;
  try {
    let parsed =
      typeof rawOptions === "string" ? JSON.parse(rawOptions) : rawOptions;
    if (!parsed || typeof parsed !== "object") return null;

    const names: string[] = [];
    const values = Array.isArray(parsed) ? parsed : Object.values(parsed);

    values.forEach((item: any) => {
      if (Array.isArray(item)) {
        item.forEach((sub) => {
          if (typeof sub === "object" && sub?.name) names.push(sub.name);
          else if (typeof sub === "string") names.push(sub);
        });
      } else if (typeof item === "object" && item !== null) {
        if (item.name) names.push(item.name);
      } else if (typeof item === "string") {
        names.push(item);
      }
    });
    return names.length > 0 ? names.join(", ") : null;
  } catch {
    return null;
  }
};

export default function KitchenOrderItem({
  item,
  isProcessing,
  onServe,
}: KitchenOrderItemProps) {
  const itemName = item.product?.name || "รายการสินค้า";
  const optDisplay = renderOptionsText(item.options);

  return (
    <div
      onClick={() => onServe(item.id)}
      className="p-3.5 rounded-2xl bg-pos-surface border border-pos-border hover:border-sky-500/50 active:scale-[0.99] transition cursor-pointer group flex items-start justify-between gap-3 shadow-2xs"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2.5">
          <span className="font-extrabold text-sky-600 dark:text-sky-400 text-lg font-mono">
            {item.quantity}x
          </span>
          <h4 className="font-bold text-sm sm:text-base text-pos-text group-hover:text-sky-500 transition leading-snug">
            {itemName}
          </h4>
        </div>

        {/* Options / ตัวเลือกเพิ่มเติม */}
        {optDisplay && (
          <p className="text-xs text-pos-text/60 font-medium mt-1 pl-7 leading-relaxed">
            ↳ {optDisplay}
          </p>
        )}
      </div>

      {/* ปุ่มเสิร์ฟรายการเดี่ยว */}
      <button
        type="button"
        disabled={isProcessing}
        className="w-9 h-9 rounded-xl bg-pos-bg group-hover:bg-emerald-500 group-hover:text-white text-pos-text/60 flex items-center justify-center text-sm font-bold transition shrink-0 border border-pos-border group-hover:border-emerald-400 shadow-2xs"
      >
        ✓
      </button>
    </div>
  );
}
