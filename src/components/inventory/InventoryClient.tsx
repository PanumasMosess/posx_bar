"use client";

import { useState, useTransition } from "react";
import {
  toggleTrackStockDB,
  adjustStockDB,
} from "@/lib/actions/actionsInventory";

// Import Components ที่เราแยกไว้
import StockTable from "@/components/inventory/StockTable";
import HistoryTable from "@/components/inventory/HistoryTable";
import AdjustStockModal from "@/components/inventory/AdjustStockModal";

export default function InventoryClient({
  products,
  movements,
}: {
  products: any[];
  movements: any[];
}) {
  const [activeTab, setActiveTab] = useState<"STOCK" | "HISTORY">("STOCK");
  const [isPending, startTransition] = useTransition();

  // State สำหรับ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // 🌟 ฟังก์ชัน: กดเปิด-ปิดการนับสต๊อก
  const handleToggleTrack = (productId: number, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleTrackStockDB(productId, currentStatus);
      if (!res.success) alert("เกิดข้อผิดพลาด: " + res.message);
    });
  };

  // 🌟 ฟังก์ชัน: บันทึกการปรับยอด
  const handleSaveAdjust = (data: {
    type: "IN" | "OUT";
    quantity: number;
    note: string;
  }) => {
    if (!selectedProduct) return;

    startTransition(async () => {
      const res = await adjustStockDB({
        productId: selectedProduct.id,
        organizationId: selectedProduct.organizationId,
        quantity: data.quantity,
        type: data.type,
        note: data.note,
        createdBy: "พนักงาน",
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        alert("บันทึกไม่สำเร็จ: " + res.message);
      }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            ระบบคลังสินค้า (Inventory)
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            จัดการสต๊อกและดูประวัติการเข้า-ออกของสินค้า
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("STOCK")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            activeTab === "STOCK"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          📦 ยอดคงเหลือปัจจุบัน
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            activeTab === "HISTORY"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          ⏱️ ประวัติความเคลื่อนไหว
        </button>
      </div>

      {/* Render Table ตาม Tab ที่เลือก */}
      {activeTab === "STOCK" && (
        <StockTable
          products={products}
          isPending={isPending}
          onToggleTrack={handleToggleTrack}
          onOpenAdjustModal={(product) => {
            setSelectedProduct(product);
            setIsModalOpen(true);
          }}
        />
      )}

      {activeTab === "HISTORY" && <HistoryTable movements={movements} />}

      {/* Modal ปรับยอด */}
      <AdjustStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        isPending={isPending}
        onSave={handleSaveAdjust}
      />
    </div>
  );
}
