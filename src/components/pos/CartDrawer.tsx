"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "../providers/CartContext";
import { CartDrawerProps } from "@/lib/types/interface";

import HoldBillModal from "./HoldBillModal";
import HeldBillsDrawer from "./HeldBillsDrawer";
import PaymentModal from "./payment/PaymentModal";
import SplitBillModal from "./SplitBillModal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

export default function CartDrawer({
  isOpen,
  onClose,
  onOpen,
}: CartDrawerProps) {
  const {
    cart,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
    activeBillNumber,
    heldBills,
  } = useCart();

  const [showHeldBills, setShowHeldBills] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [payingBillId, setPayingBillId] = useState<number | string | null>(
    null,
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmClear = async () => {
    setIsDeleting(true);
    await clearCart();
    setIsDeleting(false);
    setShowClearConfirm(false);
  };

  const renderOptionsText = (rawOptions: any) => {
    if (!rawOptions) return "";

    try {
      let parsed = rawOptions;
      if (typeof rawOptions === "string") {
        parsed = JSON.parse(rawOptions);
      }

      if (!parsed || typeof parsed !== "object") return "";

      const names: string[] = [];
      const values = Array.isArray(parsed) ? parsed : Object.values(parsed);

      values.forEach((item: any) => {
        if (Array.isArray(item)) {
          item.forEach((sub) => {
            if (typeof sub === "object" && sub?.name) {
              names.push(sub.name);
            } else if (typeof sub === "string") {
              names.push(sub);
            }
          });
        } else if (typeof item === "object" && item !== null) {
          if (item.name) {
            names.push(item.name);
          }
        } else if (typeof item === "string") {
          names.push(item);
        }
      });

      return names.join(", ");
    } catch (e) {
      return "";
    }
  };

  return (
    <>
      {/* Mobile Bottom Floating Bar */}
      <div className="lg:hidden absolute bottom-[calc(56px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 p-3 bg-pos-surface/95 backdrop-blur-md border-t border-pos-border z-[30] shadow-lg">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={onOpen}
          >
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black border-2 border-white">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-pos-text/70 font-medium">
                รวม {totalItems} รายการ
              </span>
              <div className="text-lg font-black font-mono text-sky-600 leading-tight">
                {totalPrice.toLocaleString()}{" "}
                <span className="text-xs">LAK</span>
              </div>
            </div>
          </div>

          {/* ปุ่มบันทึก/พักบิล สำหรับ Mobile */}
          <button
            onClick={() => setShowHoldModal(true)}
            disabled={cart.length === 0}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 text-white font-bold text-sm shadow-md disabled:opacity-50 active:scale-95 transition"
          >
            บันทึก / พักบิล
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Side Panel */}
      <aside
        className={`${
          isOpen ? "flex" : "hidden"
        } lg:flex fixed lg:static top-0 right-0 h-full w-full sm:w-96 lg:w-80 xl:w-96 bg-pos-surface border-l border-pos-border shrink-0 flex-col z-[70] lg:z-10 transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-pos-border flex items-center justify-between bg-pos-surface transition-colors shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pos-highlight flex items-center justify-center text-sky-600 dark:text-sky-400 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-pos-text">
                รายการออเดอร์
              </h3>
              <p className="text-xs text-pos-text/60 font-medium">
                {activeBillNumber ? `บิล: ${activeBillNumber}` : "บิลใหม่"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={cart.length === 0}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              ล้างบิล
            </button>
            <button
              className="lg:hidden w-10 h-10 rounded-xl bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center transition-colors"
              onClick={onClose}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* รายการสินค้าในตะกร้า */}
        <div className="flex-1 overflow-y-auto custom-scroll p-3.5 space-y-3 bg-pos-bg min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-pos-text/40 gap-3">
              <svg
                className="w-12 h-12 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <p className="text-base font-medium">ยังไม่มีสินค้าในตะกร้า</p>
            </div>
          ) : (
            cart.map((item) => {
              const title =
                item.product?.name || item.product?.title || "สินค้า";
              const image = item.product?.image || item.product?.img || "";

              const optionsDisplay = renderOptionsText(
                item.selectedOptions || (item as any).options,
              );

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-pos-card border border-pos-border hover:border-sky-400 shadow-sm transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-pos-border bg-pos-surface flex items-center justify-center">
                        {image ? (
                          <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-sm text-slate-400">POS</span>
                        )}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <h4 className="font-bold text-sm text-pos-text leading-snug truncate">
                          {title}
                        </h4>
                        {optionsDisplay && (
                          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium line-clamp-1 mt-0.5">
                            {optionsDisplay}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-pos-text/40 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors shrink-0"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-pos-border/60 transition-colors">
                    <div className="flex items-center bg-pos-bg border border-pos-border rounded-xl p-1 transition-colors">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-pos-surface hover:bg-pos-hover text-sm font-bold text-pos-text active:scale-90 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-bold text-pos-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-pos-surface hover:bg-pos-hover text-sm font-bold text-pos-text active:scale-90 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono font-black text-base sm:text-lg text-pos-text transition-colors">
                      {item.totalPrice.toLocaleString()}{" "}
                      <span className="text-xs text-pos-text/60 font-normal">
                        LAK
                      </span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* สรุปยอดเงิน และปุ่ม Action */}
        <div className="p-4 bg-pos-surface border-t border-pos-border space-y-3 shrink-0">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-base font-bold text-pos-text">ยอดสุทธิ</span>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400 tracking-tight">
                {totalPrice.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-pos-text/60 ml-1">
                LAK
              </span>
            </div>
          </div>

          {/* ปุ่ม Action 2 ปุ่มรอง: ดูบิลที่พัก และ แยกบิล */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowHeldBills(true)}
              className="py-2.5 rounded-xl bg-pos-highlight hover:bg-sky-100 dark:hover:bg-sky-900/40 border border-sky-200/50 dark:border-sky-800/50 text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center justify-center gap-1 transition-colors active:scale-95 relative"
            >
              ดูบิลที่พักไว้
              {heldBills.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] flex items-center justify-center font-black border border-white dark:border-slate-900">
                  {heldBills.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSplitModal(true)}
              disabled={cart.length === 0}
              className="py-2.5 rounded-xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-xs font-bold text-pos-text disabled:opacity-50 transition-colors active:scale-95"
            >
              แยกบิล
            </button>
          </div>

          {/* 🌟 ปุ่มหลักเปลี่ยนเป็น "บันทึก / พักบิล" (นำไปชำระเงินที่ลิ้นชักพักบิล) */}
          <button
            onClick={() => setShowHoldModal(true)}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:brightness-105 active:scale-98 text-white font-black text-base tracking-wide shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>บันทึก / พักบิล</span>
            <svg
              className="w-5 h-5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>
        </div>
      </aside>

      <ConfirmDeleteModal
        isOpen={showClearConfirm}
        title="ยืนยันการล้างบิล"
        message="รายการสินค้าทั้งหมดในบิลนี้จะถูกลบทิ้ง และไม่สามารถเรียกคืนได้"
        onConfirm={handleConfirmClear}
        onClose={() => setShowClearConfirm(false)}
        isPending={isDeleting}
      />

      <HoldBillModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onSuccess={() => onClose()}
      />

      <HeldBillsDrawer
        isOpen={showHeldBills}
        onClose={() => setShowHeldBills(false)}
        onSelectToPay={(id) => {
          setPayingBillId(id);
          setShowHeldBills(false);
        }}
      />

      <SplitBillModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
      />

      <PaymentModal
        billId={payingBillId}
        onClose={() => setPayingBillId(null)}
      />
    </>
  );
}
