"use client";

import { AdjustStockModalProps } from "@/lib/types";
import { useState } from "react";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function AdjustStockModal({ isOpen, onClose, product, isPending, onSave }: AdjustStockModalProps) {
  const { t } = useTranslation();
  const [adjustData, setAdjustData] = useState({
    type: "IN" as "IN" | "OUT",
    quantity: "",
    note: "",
  });

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    if (!adjustData.quantity || Number(adjustData.quantity) <= 0) {
      alert(t("inventory.qty_invalid_alert"));
      return;
    }
    onSave({
      type: adjustData.type,
      quantity: Number(adjustData.quantity),
      note: adjustData.note || (adjustData.type === "IN" ? t("inventory.stock_in") : t("inventory.stock_out")),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-black text-lg text-slate-800">{t("inventory.adjust_title")}</h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">{product.name}</p>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("inventory.adjust_type_label")}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAdjustData({ ...adjustData, type: "IN" })}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition ${
                  adjustData.type === "IN" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t("inventory.stock_in")}
              </button>
              <button
                onClick={() => setAdjustData({ ...adjustData, type: "OUT" })}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition ${
                  adjustData.type === "OUT" ? "border-rose-500 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t("inventory.stock_out")}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("inventory.adjust_qty_label")}</label>
            <input
              type="number"
              min="1"
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("inventory.adjust_note_label")}</label>
            <input
              type="text"
              value={adjustData.note}
              onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 transition flex items-center justify-center"
          >
            {isPending ? t("common.saving") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
