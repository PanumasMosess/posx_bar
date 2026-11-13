"use client";

import { useTranslation } from "@/lib/language/LanguageContext";

export default function HistoryTable({ movements }: { movements: any[] }) {
  const { t, language } = useTranslation();
  const locale = language === "th" ? "th-TH" : "en-US";

  const renderMovementType = (type: string) => {
    switch (type) {
      case "IN":
        return (
          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-200">
            {t("inventory.movement_in")}
          </span>
        );
      case "OUT":
        return (
          <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-200">
            {t("inventory.movement_out")}
          </span>
        );
      case "ADJUST":
        return (
          <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-200">
            {t("inventory.movement_adjust")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">{t("inventory.datetime_col")}</th>
              <th className="px-6 py-4">{t("inventory.type_col")}</th>
              <th className="px-6 py-4">{t("inventory.product_col")}</th>
              <th className="px-6 py-4 text-right">{t("inventory.qty_col")}</th>
              <th className="px-6 py-4 text-right">{t("inventory.stock_remaining")}</th>
              <th className="px-6 py-4">{t("inventory.ref_note_col")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((move: any) => (
              <tr key={move.id} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 text-slate-600">
                  {new Date(move.createdAt).toLocaleDateString(locale)} <br />
                  <span className="text-xs text-slate-400">
                    {new Date(move.createdAt).toLocaleTimeString(locale)}
                  </span>
                </td>
                <td className="px-6 py-4">{renderMovementType(move.type)}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">
                    {move.product.name}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-black ${move.quantity > 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {move.quantity > 0 ? "+" : ""}
                    {move.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800">
                  {move.balanceAfter}
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-700">
                    {move.referenceNo || "-"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {move.note || "-"}
                  </p>
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  {t("inventory.no_movement_history")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
