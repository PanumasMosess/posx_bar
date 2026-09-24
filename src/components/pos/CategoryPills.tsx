"use client";

import { useState } from "react";
import ProductFormModal from "./form/ProductFormModal";
import { ExtendedCategoryPillsProps } from "@/lib/interface";

export default function CategoryPills({
  initialCategories = [],
  selectedCategoryId = null,
  onSelectCategory,
}: ExtendedCategoryPillsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (id: number | null) => {
    if (onSelectCategory) {
      onSelectCategory(id);
    }
  };

  return (
    <>
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-pos-surface border-b border-pos-border flex items-center justify-between gap-3 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* แถบหมวดหมู่ */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold w-full sm:w-auto">
          {/* ปุ่มทั้งหมด */}
          <button
            onClick={() => handleSelect(null)}
            className={`shrink-0 px-3.5 py-1.5 sm:py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              selectedCategoryId === null
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-sm shadow-sky-500/20"
                : "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
            }`}
          >
            <span>ทั้งหมด</span>
          </button>

          {/* ปุ่มรายการหมวดหมู่ */}
          {initialCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border flex items-center gap-1.5 sm:gap-2 transition font-semibold ${
                  isSelected
                    ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white border-transparent shadow-sm shadow-sky-500/20"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* ปุ่มเพิ่มสินค้า */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center font-bold hover:bg-sky-50 shadow-xs transition active:scale-95"
            title="เพิ่มสินค้าใหม่"
          >
            +
          </button>
        </div>
      </div>

      {isModalOpen && (
        <ProductFormModal
          onClose={() => setIsModalOpen(false)}
          initialCategories={initialCategories}
        />
      )}
    </>
  );
}
