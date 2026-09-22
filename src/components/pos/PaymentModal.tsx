"use client";

import Image from "next/image";
import { useCart } from "../providers/CartContext";

interface PaymentModalProps {
  billId: number | string | null;
  onClose: () => void;
}

export default function PaymentModal({ billId, onClose }: PaymentModalProps) {
  const { heldBills, checkoutBill } = useCart();

  if (!billId) return null;

  const payingBill = heldBills.find((b) => b.id === billId) ?? null;
  if (!payingBill) return null;

  const handleCheckout = () => {
    checkoutBill(String(billId));
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm bg-pos-surface rounded-2xl shadow-2xl border border-pos-border pointer-events-auto flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-pos-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-pos-text">ชำระเงิน</h3>
              <span className="text-xs font-medium text-pos-text/60">
                ({payingBill.orderNumber}
                {payingBill.customerName ? ` - ${payingBill.customerName}` : ""}
                )
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center"
            >
              X
            </button>
          </div>

          <div className="p-3 overflow-y-auto custom-scroll space-y-2 flex-1 bg-pos-bg">
            {/* รายการสินค้า... */}
            {payingBill.items?.map((subItem: any, idx: number) => {
              const subTitle =
                subItem.product?.name || subItem.product?.title || "สินค้า";
              const subQty = subItem.quantity || 1;
              const subPrice =
                subItem.priceAtTime || subItem.product?.price || 0;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-pos-card border border-pos-border flex justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0">
                    <h5 className="font-semibold text-xs text-pos-text truncate">
                      {subTitle}
                    </h5>
                    <span className="text-[11px] text-pos-text/60 font-mono">
                      x{subQty}
                    </span>
                  </div>
                  <div className="font-mono font-black text-xs text-pos-text shrink-0">
                    {(subPrice * subQty).toLocaleString()} LAK
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-pos-surface border-t border-pos-border flex items-baseline justify-between shrink-0">
            <span className="text-sm font-bold text-pos-text">ยอดสุทธิ</span>
            <div>
              <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">
                {payingBill.totalPrice.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-pos-text/60 ml-1">
                LAK
              </span>
            </div>
          </div>

          <div className="p-4 bg-pos-surface shrink-0">
            <button
              onClick={handleCheckout}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm tracking-wide shadow-lg flex items-center justify-center"
            >
              ยืนยันชำระเงิน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
