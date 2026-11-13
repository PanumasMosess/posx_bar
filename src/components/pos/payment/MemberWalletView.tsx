"use client";

import { MemberWalletViewProps } from "@/lib/interface";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function MemberWalletView({
  selectedMember,
  netTotal,
  onOpenSearch,
}: MemberWalletViewProps) {
  const { t } = useTranslation();

  if (!selectedMember) {
    return (
      <div className="flex-1 flex flex-col justify-center p-3 bg-pos-bg rounded-2xl border border-pos-border text-center space-y-2">
        <span className="text-3xl block">👑</span>
        <p className="font-bold text-xs text-rose-500">
          {t("payment.select_member_first")}
        </p>
        <div>
          <button
            type="button"
            onClick={onOpenSearch}
            className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold"
          >
            {t("common.search")}
          </button>
        </div>
      </div>
    );
  }

  const remaining = selectedMember.balance - netTotal;

  return (
    <div className="flex-1 flex flex-col justify-center p-3 bg-pos-bg rounded-2xl border border-pos-border space-y-2">
      <div className="p-2.5 rounded-xl bg-pos-surface border border-pos-border space-y-1">
        <p className="text-[10px] text-pos-text/60 font-bold">
          {t("payment.member")}:
        </p>
        <p className="font-bold text-xs text-pos-text">{selectedMember.name}</p>
        <div className="flex justify-between items-center pt-1 border-t border-pos-border/50 text-xs font-mono font-bold">
          <span className="text-pos-text/60">{t("payment.balance")}:</span>
          <span className="text-emerald-600">
            {selectedMember.balance.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono font-bold">
          <span className="text-pos-text/60">{t("payment.amount_due")}:</span>
          <span className="text-rose-500">-{netTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-pos-border/50 text-xs font-mono font-bold">
          <span className="text-pos-text/60">{t("accounting.balance_after")}:</span>
          <span
            className={
              remaining >= 0 ? "text-sky-600" : "text-rose-500 font-black"
            }
          >
            {remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {remaining < 0 && (
        <p className="text-[10px] text-rose-500 font-bold text-center">
          * {t("payment.insufficient_cash")}
        </p>
      )}
    </div>
  );
}
