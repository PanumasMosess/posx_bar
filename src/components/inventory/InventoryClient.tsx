"use client";

import { useState, useTransition, useMemo } from "react";
import {
  toggleTrackStockDB,
  adjustStockDB,
} from "@/lib/actions/actionsInventory";

import StockTable from "@/components/inventory/StockTable";
import HistoryTable from "@/components/inventory/HistoryTable";
import AdjustStockModal from "@/components/inventory/AdjustStockModal";
import { useOrgSettings } from "../providers/OrganizationSettingsContext";



export default function InventoryClient({
  products,
  movements,
}: {
  products: any[];
  movements: any[];
}) {
  const [activeTab, setActiveTab] = useState<"STOCK" | "HISTORY">("STOCK");
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);


  const { settings } = useOrgSettings();
  const currencyUnit = settings?.currencyCode || "THB";

  const { totalStockCount, totalStockValue } = useMemo(() => {
    let count = 0;
    let value = 0;

    products.forEach((p) => {
      if (p.isTrackStock && p.stock > 0) {
        count += p.stock;
        value += p.stock * (p.cost || 0);
      }
    });

    return { totalStockCount: count, totalStockValue: value };
  }, [products]);

  const handleToggleTrack = (productId: number, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleTrackStockDB(productId, currentStatus);
      if (!res.success) alert("เกิดข้อผิดพลาด: " + res.message);
    });
  };

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

      {/* 🌟 การ์ดสรุปยอด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ยอดสินค้าทั้งหมด */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center text-2xl border border-sky-100 shrink-0">
            📦
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 font-bold mb-0.5 truncate">
              สินค้าในสต๊อกทั้งหมด
            </p>
            <h3 className="text-2xl font-black text-slate-800 truncate">
              {totalStockCount.toLocaleString()}{" "}
              <span className="text-sm font-bold text-slate-400">ชิ้น</span>
            </h3>
          </div>
        </div>

        {/* ยอดมูลค่าในคลัง */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl border border-emerald-100 shrink-0">
            💰
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 font-bold mb-0.5 truncate">
              มูลค่าคลัง (คิดจากทุน)
            </p>
            <h3 className="text-2xl font-black text-emerald-600 truncate">
              {totalStockValue.toLocaleString()}{" "}
              {/* 🌟 3. นำค่าที่ดึงจาก Context มาแสดงผล */}
              <span className="text-sm font-bold text-emerald-400">
                {currencyUnit}
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("STOCK")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === "STOCK" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          ยอดคงเหลือ
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === "HISTORY" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          ประวัติความเคลื่อนไหว
        </button>
      </div>

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

