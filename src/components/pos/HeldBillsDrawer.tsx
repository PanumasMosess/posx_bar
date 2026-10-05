"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useCart } from "../providers/CartContext";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

interface HeldBillsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToPay: (billId: number) => void;
}

export default function HeldBillsDrawer({
  isOpen,
  onClose,
  onSelectToPay,
}: HeldBillsDrawerProps) {
  const { heldBills, resumeBill, deleteBill, fetchHeldBills } = useCart();

  const [deletingBillId, setDeletingBillId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHeldBills(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirmDeleteBill = async () => {
    if (!deletingBillId) return;
    setIsDeleting(true);
    await deleteBill(deletingBillId);
    setIsDeleting(false);
    setDeletingBillId(null);
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

  const getNormalizedOptionKey = (rawOptions: any) => {
    if (!rawOptions) return "";
    try {
      let parsed = rawOptions;
      if (typeof rawOptions === "string") {
        if (!rawOptions.trim() || rawOptions === "{}" || rawOptions === "[]")
          return "";
        parsed = JSON.parse(rawOptions);
      }
      if (!parsed || typeof parsed !== "object") return "";

      const choiceIds: number[] = [];

      const extractIds = (obj: any) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          obj.forEach((item) => extractIds(item));
        } else if (typeof obj === "object") {
          if (obj.id !== undefined) {
            choiceIds.push(Number(obj.id));
          } else {
            Object.values(obj).forEach((val) => extractIds(val));
          }
        }
      };

      extractIds(parsed);
      return choiceIds.sort((a, b) => a - b).join("_");
    } catch (e) {
      return "";
    }
  };

  // 🌟 ฟังก์ชันจัดกลุ่มใหม่: รวมรายการที่ "สินค้าเดียวกัน + ตัวเลือกเดียวกัน + สถานะเดียวกัน" เข้าด้วยกันทั้งหมด
  const aggregateItemsByStatus = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];

    const mergedMap = new Map<string, any>();

    items.forEach((item) => {
      const rawStatus = (item.status || "IDLE").toString().toUpperCase();
      const productId = item.productId || item.product?.id || item.id;
      const optionKey = getNormalizedOptionKey(
        item.options || item.selectedOptions,
      );

      // สร้าง Key เฉพาะตัว ถ้าสินค้าเหมือนกัน ตัวเลือกเหมือนกัน สถานะเหมือนกัน จะถูกรวมเป็นบรรทัดเดียว
      const uniqueKey = `${productId}_${optionKey}_${rawStatus}`;

      if (mergedMap.has(uniqueKey)) {
        const existing = mergedMap.get(uniqueKey);
        existing.quantity += Number(item.quantity || 1);
      } else {
        mergedMap.set(uniqueKey, {
          ...item,
          quantity: Number(item.quantity || 1),
        });
      }
    });

    return Array.from(mergedMap.values());
  };

  // 🌟 Badge แสดงผลสถานะ
  const renderItemKitchenBadge = (status: string) => {
    const rawStatus = (status || "IDLE").toString().toUpperCase();

    if (
      rawStatus === "IN_KITCHEN" ||
      rawStatus === "COOKING" ||
      rawStatus === "PENDING"
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          กำลังเข้าครัว
        </span>
      );
    }

    if (rawStatus === "SERVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          ส่งแล้ว
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-pos-surface border border-pos-border text-pos-text/60 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        ฉบับร่าง
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[80]"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-pos-surface border-l border-pos-border shadow-2xl z-[90] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-pos-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pos-highlight flex items-center justify-center">
              <svg
                className="w-5 h-5 text-sky-600 dark:text-sky-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-pos-text">
                บิลที่พักไว้
              </h3>
              <p className="text-xs font-medium text-pos-text/60">
                {heldBills.length} บิลรอดำเนินการ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center transition-colors"
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

        {/* List of Held Bills */}
        <div className="flex-1 overflow-y-auto custom-scroll p-3.5 space-y-3 bg-pos-bg min-h-0">
          {heldBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-pos-text/40 gap-3">
              <svg
                className="w-12 h-12 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="text-base font-medium">ไม่มีบิลที่พักไว้</p>
            </div>
          ) : (
            heldBills.map((bill: any) => {
              const tableName = bill.tableName;
              const displayItems = aggregateItemsByStatus(bill.items);

              return (
                <div
                  key={bill.id}
                  className="p-3.5 rounded-2xl bg-pos-card border border-pos-border shadow-sm flex flex-col gap-3"
                >
                  {/* Bill Header Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-bold text-sm text-pos-text">
                          {bill.orderNumber}
                        </span>

                        {tableName && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-pos-surface border border-sky-500/30 text-[10px] font-bold text-sky-600 dark:text-sky-400 shadow-2xs">
                            <svg
                              className="w-3 h-3 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z"
                              />
                            </svg>
                            <span className="truncate max-w-[100px]">
                              {tableName}
                            </span>
                          </span>
                        )}

                        {bill.customerName && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-pos-surface border border-pos-border text-[10px] font-semibold text-pos-text/80 shadow-2xs">
                            <span className="truncate max-w-[100px]">
                              {bill.customerName}
                            </span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-pos-text/60">
                        ผู้ทำรายการ:{" "}
                        <span className="font-medium text-pos-text/80">
                          {bill.createdBy || "พนักงาน"}
                        </span>
                      </p>
                      <p className="text-[11px] text-pos-text/60 mt-0.5">
                        {displayItems.length} รายการ •{" "}
                        {new Date(bill.heldAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-base text-sky-600 dark:text-sky-400 block">
                        {bill.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* รายการสินค้า */}
                  <div className="space-y-2 pt-2 border-t border-pos-border/60 max-h-[170px] overflow-y-auto custom-scroll pr-1">
                    {displayItems.map((subItem: any, idx: number) => {
                      const subTitle =
                        subItem.product?.name ||
                        subItem.product?.title ||
                        subItem.name ||
                        subItem.title ||
                        "สินค้า";
                      const subImage =
                        subItem.product?.image ||
                        subItem.product?.img ||
                        subItem.image ||
                        "";

                      const subOptionsDisplay = renderOptionsText(
                        subItem.options || subItem.selectedOptions,
                      );

                      const itemStatus = subItem.status || "IDLE";

                      return (
                        <div
                          key={subItem.id || idx}
                          className="flex items-center gap-3 text-xs text-pos-text"
                        >
                          <div className="relative w-10 h-10 rounded-lg bg-pos-surface border border-pos-border overflow-hidden shrink-0 flex items-center justify-center">
                            {subImage ? (
                              <Image
                                src={subImage}
                                alt={subTitle}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium">
                                POS
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-pos-text leading-tight">
                              {subTitle}
                            </p>
                            {subOptionsDisplay && (
                              <p className="truncate text-[10px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
                                {subOptionsDisplay}
                              </p>
                            )}
                          </div>

                          {renderItemKitchenBadge(itemStatus)}

                          <span className="font-mono font-bold text-sm shrink-0 bg-pos-bg px-2 py-1 rounded-md border border-pos-border">
                            x{subItem.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ปุ่ม Action */}
                  <div className="flex gap-2 pt-3 border-t border-pos-border/60">
                    <button
                      onClick={() => onSelectToPay(bill.id)}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 active:scale-95 text-white text-xs font-bold transition shadow-md"
                    >
                      ชำระเงิน
                    </button>
                    <button
                      onClick={() => {
                        resumeBill(Number(bill.id));
                        onClose();
                      }}
                      className="flex-1 py-2 rounded-xl bg-pos-surface hover:bg-pos-hover border border-pos-border text-xs font-bold text-pos-text active:scale-95 transition-colors shadow-sm"
                    >
                      คืนบิล
                    </button>
                    <button
                      onClick={() => setDeletingBillId(Number(bill.id))}
                      className="w-10 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 text-rose-500 flex items-center justify-center active:scale-95 transition-colors"
                      title="ลบบิลนี้ทิ้ง"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deletingBillId !== null}
        title="ยืนยันการลบบิลที่พักไว้"
        message="คุณต้องการลบบิลนี้ออกจากระบบใช่หรือไม่? เมื่อลบแล้วจะไม่สามารถกู้คืนได้"
        onConfirm={handleConfirmDeleteBill}
        onClose={() => setDeletingBillId(null)}
        isPending={isDeleting}
      />
    </>
  );
}
