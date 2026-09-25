"use client";

import { useState, useEffect } from "react";
import { useCart } from "../providers/CartContext";
import { holdOrderToDB } from "@/lib/actions/actionsPos";
import { useEmployee } from "@/components/providers/EmployeeContext"; // 🌟 1. นำเข้า useEmployee

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SplitBillModal({
  isOpen,
  onClose,
}: SplitBillModalProps) {
  const {
    cart,
    activeBillNumber,
    fetchHeldBills,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const { organizationId, employeeId } = useEmployee();

  const [splitQuantities, setSplitQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSplitQuantities({});
    }
  }, [isOpen]);

  const handleQtyChange = (itemId: string, maxQty: number, delta: number) => {
    setSplitQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      if (next > maxQty) return prev;
      return { ...prev, [itemId]: next };
    });
  };

  const handleSelectAllItem = (itemId: string, maxQty: number) => {
    setSplitQuantities((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === maxQty ? 0 : maxQty,
    }));
  };

  const renderOptionsText = (rawOptions: any) => {
    if (!rawOptions) return "";
    try {
      let parsed = rawOptions;
      if (typeof rawOptions === "string") parsed = JSON.parse(rawOptions);
      if (!parsed || typeof parsed !== "object") return "";

      const names: string[] = [];
      const values = Array.isArray(parsed) ? parsed : Object.values(parsed);

      values.forEach((item: any) => {
        if (Array.isArray(item)) {
          item.forEach((sub) => {
            if (typeof sub === "object" && sub?.name) names.push(sub.name);
            else if (typeof sub === "string") names.push(sub);
          });
        } else if (typeof item === "object" && item !== null) {
          if (item.name) names.push(item.name);
        } else if (typeof item === "string") {
          names.push(item);
        }
      });
      return names.join(", ");
    } catch (e) {
      return "";
    }
  };

  const selectedItemsToSplit = cart.filter(
    (item) => (splitQuantities[item.id] || 0) > 0,
  );

  const splitTotalPrice = selectedItemsToSplit.reduce((sum, item) => {
    const qtyToSplit = splitQuantities[item.id] || 0;
    const unitPrice = item.totalPrice / item.quantity;
    return sum + unitPrice * qtyToSplit;
  }, 0);

  const handleConfirmSplit = async () => {
    if (selectedItemsToSplit.length === 0) return;
    setIsSubmitting(true);

    try {
      const newBillItems = selectedItemsToSplit.map((item) => {
        const qtyToSplit = splitQuantities[item.id];
        const unitPrice = item.totalPrice / item.quantity;
        return {
          productId: item.product.id || item.product.productId,
          quantity: qtyToSplit,
          priceAtTime: unitPrice,
          options: JSON.stringify(item.selectedOptions || {}),
          status: (item as any).status || "SERVED",
        };
      });

      const newBillPayload = {
        organizationId: organizationId, // 🌟 3. ใช้ ID ร้านค้าปัจจุบันแทนเลข 1
        createdBy: String(employeeId), // 🌟 4. บันทึก ID พนักงานที่กดแยกบิล
        customerName: activeBillNumber
          ? `แยกจาก ${activeBillNumber}`
          : "บิลแยกใหม่",
        totalAmount: splitTotalPrice,
        netAmount: splitTotalPrice,
        kitchenStatus: "SERVED" as const,
        items: newBillItems,
      };

      const res = await holdOrderToDB(newBillPayload);

      if (res.success) {
        selectedItemsToSplit.forEach((splitItem) => {
          const qtyToSplit = splitQuantities[splitItem.id];
          if (qtyToSplit >= splitItem.quantity) {
            removeFromCart(splitItem.id);
          } else {
            updateQuantity(splitItem.id, -qtyToSplit);
          }
        });

        await fetchHeldBills(organizationId); // 🌟 5. ดึงบิลของร้านค้าใหม่แทนเลข 1
        onClose();
      } else {
        alert("เกิดข้อผิดพลาดในการสร้างบิลแยก");
      }
    } catch (e) {
      console.error("Split bill error:", e);
      alert("ไม่สามารถแยกบิลได้ โปรดลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-pos-surface rounded-2xl shadow-2xl border border-pos-border animate-slide-up overflow-hidden flex flex-col max-h-[85vh] transition-colors">
          {/* Header */}
          <div className="p-4 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
            <div>
              <h3 className="font-bold text-sm text-pos-text">
                แยกบิลชำระเงิน / พักบิล
              </h3>
              <p className="text-[11px] text-pos-text/60 font-medium">
                เลือกเมนูและจำนวนที่ต้องการแยกเป็นบิลใหม่
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-pos-bg hover:bg-pos-hover text-pos-text transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* รายการอาหาร */}
          <div className="p-4 space-y-3 overflow-y-auto custom-scroll flex-1 bg-pos-bg">
            {cart.map((item) => {
              const title =
                item.product?.name || item.product?.title || "สินค้า";
              const splitQty = splitQuantities[item.id] || 0;
              const isSelected = splitQty > 0;
              const optDisplay = renderOptionsText(
                item.selectedOptions || (item as any).options,
              );

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                    isSelected
                      ? "bg-sky-500/10 border-sky-500/40"
                      : "bg-pos-surface border-pos-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-pos-text truncate">
                        {title}
                      </p>
                      {optDisplay && (
                        <p className="text-[10px] text-sky-600 dark:text-sky-400 truncate mt-0.5">
                          {optDisplay}
                        </p>
                      )}
                      <p className="text-[10px] text-pos-text/50 mt-0.5">
                        มีในบิลทั้งหมด {item.quantity} รายการ
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectAllItem(item.id, item.quantity)
                      }
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        splitQty === item.quantity
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-pos-bg border-pos-border text-pos-text hover:bg-pos-hover"
                      }`}
                    >
                      {splitQty === item.quantity
                        ? "ย้ายทั้งหมดแล้ว"
                        : "ย้ายทั้งหมด"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-pos-border/40">
                    <span className="text-[11px] font-semibold text-pos-text/70">
                      จำนวนที่ย้ายไปบิลใหม่:
                    </span>
                    <div className="flex items-center bg-pos-bg border border-pos-border rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleQtyChange(item.id, item.quantity, -1)
                        }
                        disabled={splitQty === 0}
                        className="w-7 h-7 rounded bg-pos-surface hover:bg-pos-hover text-xs font-bold text-pos-text disabled:opacity-30 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        {splitQty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleQtyChange(item.id, item.quantity, 1)
                        }
                        disabled={splitQty >= item.quantity}
                        className="w-7 h-7 rounded bg-pos-surface hover:bg-pos-hover text-xs font-bold text-pos-text disabled:opacity-30 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer ยอดรวม */}
          <div className="p-4 bg-pos-surface border-t border-pos-border space-y-3 shrink-0">
            <div className="flex justify-between items-center text-xs font-bold text-pos-text">
              <span>ยอดรวมบิลใหม่:</span>
              <span className="font-mono text-sm font-black text-sky-600 dark:text-sky-400">
                {splitTotalPrice.toLocaleString()} LAK
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmSplit}
              disabled={isSubmitting || selectedItemsToSplit.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:brightness-105 active:scale-98 text-white font-bold text-sm shadow-md transition disabled:opacity-40"
            >
              {isSubmitting ? "กำลังแยกบิล..." : "ยืนยันการแยกบิล"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
