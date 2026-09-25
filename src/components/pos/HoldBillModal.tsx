"use client";

import { useState, useEffect } from "react";
import { useCart } from "../providers/CartContext";
import { getTablesFromDB, createTableInDB } from "@/lib/actions/actionsPos";
import { HoldBillModalProps } from "@/lib/interface";
import { useEmployee } from "../providers/EmployeeContext";

export default function HoldBillModal({
  isOpen,
  onClose,
  onSuccess,
}: HoldBillModalProps) {
  const { holdBill, activeBillId, activeBillInfo, cart } = useCart();
  const { employeeId, organizationId } = useEmployee();

  const [customerName, setCustomerName] = useState("");
  const [qrCodeId, setQrCodeId] = useState<number | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 Snapshot ตะกร้าสินค้าไว้ ไม่ให้หายไปวูบวาบตอนกดบันทึก
  const [displayCart, setDisplayCart] = useState<any[]>([]);

  // State เก็บ ID ของเมนูที่ต้องการส่งเข้าครัว
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isSavingTable, setIsSavingTable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Snapshot ข้อมูล cart ไว้แสดงผล
      setDisplayCart(cart);

      // ดึงรายชื่อโต๊ะมาแสดง
      if (organizationId) {
        getTablesFromDB(organizationId).then((res) => {
          if (res.success) setTables(res.data);
        });
      }
      // ดึงข้อมูลบิลเดิมถ้ากำลังแก้ไขอยู่
      if (activeBillId && activeBillInfo) {
        let cName = activeBillInfo.customerName || "";

        if (
          cName.includes("บิลพักชั่วคราว") ||
          cName.includes("บิล HOLD-") ||
          cName.startsWith("HOLD-")
        ) {
          cName = "";
        }

        setCustomerName(cName);
        setQrCodeId(activeBillInfo.qrCodeId || null);
      } else {
        setCustomerName("");
        setQrCodeId(null);
      }

      // ตั้งค่าสถานะเริ่มต้น: เลือกรายการที่มีสถานะเดิมเป็น IN_KITCHEN
      const preSelectedIds = cart
        .filter((item: any) => item.status === "IN_KITCHEN")
        .map((item) => item.id);

      setSelectedItemIds(preSelectedIds);

      setIsAddingTable(false);
      setNewTableName("");
    }
  }, [isOpen, activeBillId, activeBillInfo, organizationId]);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === displayCart.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(displayCart.map((item) => item.id));
    }
  };

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;
    setIsSavingTable(true);

    const res = await createTableInDB(organizationId, newTableName.trim());

    if (res.success && res.data) {
      setTables((prev) => [...prev, res.data]);
      setQrCodeId(res.data.id);
      setIsAddingTable(false);
      setNewTableName("");
    } else {
      alert("ไม่สามารถเพิ่มโต๊ะได้ โปรดลองอีกครั้ง");
    }
    setIsSavingTable(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const hasKitchenItems = selectedItemIds.length > 0;

    const success = await holdBill(organizationId, {
      customerName,
      qrCodeId,
      sendToKitchen: hasKitchenItems,
      kitchenItemIds: selectedItemIds,
      createdBy: String(employeeId),
    });

    if (success) {
      onSuccess();
      onClose();
    }
    setIsSubmitting(false);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100]" />

      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-pos-surface rounded-2xl shadow-2xl border border-pos-border animate-slide-up overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-pos-border flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 shrink-0">
            <h3 className="font-bold text-sm text-amber-800 dark:text-amber-500">
              พักบิล / เลือกรายการส่งเข้าครัว
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-black/5 text-amber-700"
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

          <div className="p-4 space-y-4 overflow-y-auto custom-scroll flex-1">
            {/* Input ชื่อลูกค้า */}
            <div>
              <label className="block text-xs font-semibold text-pos-text mb-1">
                ชื่อลูกค้า / ป้ายกำกับ
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น คุณเอก, สั่งกลับบ้าน..."
                className="w-full px-3 py-2 bg-pos-bg border border-pos-border rounded-lg text-sm text-pos-text focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* ส่วนเลือก/เพิ่มโต๊ะ */}
            <div>
              <label className="block text-xs font-semibold text-pos-text mb-1">
                ระบุโต๊ะ (ถ้ามี)
              </label>

              {!isAddingTable ? (
                <div className="flex gap-2">
                  <select
                    value={qrCodeId || ""}
                    onChange={(e) =>
                      setQrCodeId(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className="flex-1 px-3 py-2 bg-pos-bg border border-pos-border rounded-lg text-sm text-pos-text focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- ไม่ระบุโต๊ะ --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingTable(true)}
                    className="px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-400 rounded-lg text-sm font-bold transition-colors flex items-center justify-center shrink-0"
                    title="เพิ่มโต๊ะใหม่"
                  >
                    + เพิ่ม
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="ใส่ชื่อโต๊ะใหม่..."
                    autoFocus
                    className="flex-1 px-3 py-2 bg-pos-bg border border-sky-400 rounded-lg text-sm text-pos-text focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTable}
                    disabled={isSavingTable || !newTableName.trim()}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold transition-colors shrink-0 disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTable(false);
                      setNewTableName("");
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-sm font-bold transition-colors shrink-0"
                  >
                    X
                  </button>
                </div>
              )}
            </div>

            {/* 🌟 รายการเมนูสำหรับเลือกเข้าครัว (ใช้ displayCart คงสถานะไว้ให้เนียนตา) */}
            <div className="pt-2 border-t border-pos-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-pos-text">
                  เลือกรายการที่ต้องการส่งเข้าครัว ({selectedItemIds.length}/
                  {displayCart.length})
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-bold text-sky-600 hover:underline"
                >
                  {selectedItemIds.length === displayCart.length
                    ? "ยกเลิกทั้งหมด"
                    : "เลือกทั้งหมด"}
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scroll pr-1">
                {displayCart.length === 0 ? (
                  <p className="text-xs text-pos-text/50 text-center py-4">
                    ไม่มีรายการสินค้าในตะกร้า
                  </p>
                ) : (
                  displayCart.map((item) => {
                    const title =
                      item.product?.name || item.product?.title || "สินค้า";
                    const isSelected = selectedItemIds.includes(item.id);
                    const isAlreadyInKitchen =
                      (item as any).status === "IN_KITCHEN";

                    const optDisplay = renderOptionsText(
                      item.selectedOptions || (item as any).options,
                    );

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelectItem(item.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-teal-500/10 border-teal-500/40 text-pos-text"
                            : "bg-pos-bg border-pos-border text-pos-text/60 hover:border-pos-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded-xs text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold truncate">
                                {title}
                              </p>
                              {isAlreadyInKitchen && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-teal-500/10 text-teal-600 font-bold border border-teal-500/20">
                                  ส่งแล้ว
                                </span>
                              )}
                            </div>
                            {optDisplay && (
                              <p className="text-[10px] text-sky-600 dark:text-sky-400 truncate">
                                {optDisplay}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs shrink-0 ml-2 px-2 py-0.5 rounded-xs bg-pos-surface border border-pos-border">
                          x{item.quantity}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="p-4 bg-pos-bg border-t border-pos-border shrink-0">
            <button
              type="submit"
              disabled={
                isSubmitting || isSavingTable || displayCart.length === 0
              }
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-sm shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? "กำลังบันทึก..." : "ยืนยันการพักบิล"}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
