"use client";

import KitchenOrderItem from "./KitchenOrderItem";

interface KitchenOrderCardProps {
  order: any;
  processingId: number | null;
  onServeItem: (itemId: number) => void;
  onServeAll: (orderId: number) => void;
}

/** คำนวณเวลาที่ผ่านไปเป็นนาที */
const getElapsedTimeMinutes = (createdAt: string | Date) => {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  return Math.floor((now - created) / (1000 * 60));
};

export default function KitchenOrderCard({
  order,
  processingId,
  onServeItem,
  onServeAll,
}: KitchenOrderCardProps) {
  const elapsed = getElapsedTimeMinutes(order.createdAt);
  const isUrgent = elapsed >= 15;
  const isWarning = elapsed >= 10 && elapsed < 15;

  const tableName =
    order.qrcode?.tableName ||
    order.customerName ||
    `บิล #${order.orderNumber.split("-").pop()}`;

  return (
    <div
      className={`w-80 sm:w-88 rounded-3xl border shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
        isUrgent
          ? "bg-pos-surface border-rose-500/80 ring-2 ring-rose-500/20"
          : isWarning
            ? "bg-pos-surface border-amber-500/80"
            : "bg-pos-surface border-pos-border"
      }`}
    >
      {/* Card Header */}
      <div
        className={`p-4 border-b flex items-center justify-between shrink-0 transition-colors ${
          isUrgent
            ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            : isWarning
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-pos-hover/50 border-pos-border text-pos-text"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg truncate text-pos-text tracking-tight">
              {tableName}
            </span>
            <span className="text-xs font-mono bg-pos-bg px-2 py-0.5 rounded-lg font-bold border border-pos-border text-pos-text/70">
              #{order.orderNumber.split("-").pop()}
            </span>
          </div>
          <p className="text-xs text-pos-text/60 mt-0.5 font-semibold">
            {order.orderType === "TAKE_AWAY"
              ? "🛍️ สั่งกลับบ้าน"
              : "🍽️ ทานที่ร้าน"}
          </p>
        </div>

        {/* Timer Badge */}
        <div
          className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-extrabold flex items-center gap-1.5 border shadow-2xs ${
            isUrgent
              ? "bg-rose-500 text-white border-rose-400"
              : isWarning
                ? "bg-amber-500 text-slate-950 border-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          }`}
        >
          <span className="text-xs">⏱️</span>
          <span>{elapsed}m</span>
        </div>
      </div>

      {/* Items List */}
      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-[55vh] custom-scroll bg-pos-bg/40 transition-colors">
        {order.items.map((item: any) => (
          <KitchenOrderItem
            key={item.id}
            item={item}
            isProcessing={processingId === item.id}
            onServe={onServeItem}
          />
        ))}
      </div>

      {/* Card Footer: ปุ่มเสิร์ฟยกบิล */}
      <div className="p-3.5 bg-pos-surface border-t border-pos-border shrink-0">
        <button
          type="button"
          disabled={processingId === order.id}
          onClick={() => onServeAll(order.id)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:from-sky-700 hover:to-cyan-600 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>
            {processingId === order.id
              ? "กำลังบันทึก..."
              : "✅ เสิร์ฟครบแล้วทั้งบิล"}
          </span>
        </button>
      </div>
    </div>
  );
}
