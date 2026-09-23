"use client";

export default function KitchenEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-pos-text/40 space-y-3">
      <span className="text-6xl animate-bounce">✨</span>
      <p className="font-extrabold text-lg text-pos-text">
        ไม่มีออเดอร์ค้างในครัว
      </p>
      <p className="text-xs text-pos-text/60 font-medium">
        ออเดอร์ใหม่ที่กดส่งเข้าครัวจะมาปรากฏที่นี่ทันที
      </p>
    </div>
  );
}
