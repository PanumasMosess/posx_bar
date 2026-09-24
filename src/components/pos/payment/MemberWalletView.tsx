"use client";

import { MemberWalletViewProps } from "@/lib/interface";



export default function MemberWalletView({
  selectedMember,
  netTotal,
  onOpenSearch,
}: MemberWalletViewProps) {
  if (!selectedMember) {
    return (
      <div className="flex-1 flex flex-col justify-center p-3 bg-pos-bg rounded-2xl border border-pos-border text-center space-y-2">
        <span className="text-3xl block">👑</span>
        <p className="font-bold text-xs text-rose-500">
          โปรดระบุหรือเลือกสมาชิกฝั่งซ้ายก่อนชำระเงิน
        </p>
        <div>
          <button
            type="button"
            onClick={onOpenSearch}
            className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold"
          >
            ค้นหาสมาชิก
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
          ตัดเงินจากบัญชีสมาชิก:
        </p>
        <p className="font-bold text-xs text-pos-text">{selectedMember.name}</p>
        <div className="flex justify-between items-center pt-1 border-t border-pos-border/50 text-xs font-mono font-bold">
          <span className="text-pos-text/60">ยอดเงินในบัตร:</span>
          <span className="text-emerald-600">
            {selectedMember.balance.toLocaleString()} LAK
          </span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono font-bold">
          <span className="text-pos-text/60">ยอดหักชำระ:</span>
          <span className="text-rose-500">-{netTotal.toLocaleString()} LAK</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-pos-border/50 text-xs font-mono font-bold">
          <span className="text-pos-text/60">คงเหลือหลังชำระ:</span>
          <span
            className={
              remaining >= 0 ? "text-sky-600" : "text-rose-500 font-black"
            }
          >
            {remaining.toLocaleString()} LAK
          </span>
        </div>
      </div>

      {remaining < 0 && (
        <p className="text-[10px] text-rose-500 font-bold text-center">
          * ยอดเงินในบัตรสมาชิกไม่เพียงพอ
        </p>
      )}
    </div>
  );
}