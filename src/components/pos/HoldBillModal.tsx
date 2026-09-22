"use client";

import { useState, useEffect } from "react";
import { useCart } from "../providers/CartContext";
import { getTablesFromDB, createTableInDB } from "@/lib/actions/actionsPos";

interface HoldBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HoldBillModal({
  isOpen,
  onClose,
  onSuccess,
}: HoldBillModalProps) {
  // 🌟 ดึง activeBillInfo จาก CartContext มาใช้โดยตรง (แทนการค้นหาจาก heldBills)
  const { holdBill, activeBillId, activeBillInfo } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [qrCodeId, setQrCodeId] = useState<number | null>(null);
  const [sendToKitchen, setSendToKitchen] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isSavingTable, setIsSavingTable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // ดึงรายชื่อโต๊ะมาแสดง (สมมติ organizationId = 1)
      getTablesFromDB(1).then((res) => {
        if (res.success) setTables(res.data);
      });

      // 🌟 ดึงข้อมูลจาก activeBillInfo ซึ่งเป็นบิลที่กำลังเปิดและคืนบิลมาแก้ไขอยู่
      if (activeBillId && activeBillInfo) {
        let cName = activeBillInfo.customerName || "";

        // ถ้าชื่อลูกค้าเป็นชื่อที่ระบบตั้งให้อัตโนมัติ ให้เคลียร์ช่องกรอกเพื่อความสะดวก
        if (
          cName.includes("บิลพักชั่วคราว") ||
          cName.includes("บิล HOLD-") ||
          cName.startsWith("HOLD-")
        ) {
          cName = "";
        }

        setCustomerName(cName);
        setQrCodeId(activeBillInfo.qrCodeId || null);
        setSendToKitchen(activeBillInfo.kitchenStatus === "IN_KITCHEN");
      } else {
        // หากเป็นบิลใหม่เอี่ยม เคลียร์ค่าทั้งหมดให้เป็นค่าว่าง/เริ่มต้น
        setCustomerName("");
        setQrCodeId(null);
        setSendToKitchen(false);
      }

      setIsAddingTable(false);
      setNewTableName("");
    }
  }, [isOpen, activeBillId, activeBillInfo]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;
    setIsSavingTable(true);

    const res = await createTableInDB(1, newTableName.trim());

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
    const success = await holdBill(1, {
      customerName,
      qrCodeId,
      sendToKitchen,
    });
    setIsSubmitting(false);
    if (success) {
      onSuccess();
      onClose();
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
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-pos-surface rounded-2xl shadow-2xl border border-pos-border animate-slide-up overflow-hidden"
        >
          <div className="p-4 border-b border-pos-border flex items-center justify-between bg-amber-50 dark:bg-amber-900/20">
            <h3 className="font-bold text-sm text-amber-800 dark:text-amber-500">
              พักบิล / บันทึกออเดอร์
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

          <div className="p-4 space-y-4">
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
                    className="flex-1 px-3 py-2 bg-pos-bg border border-sky-400 rounded-lg text-sm text-pos-text focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
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

            {/* Switch ส่งเข้าครัว */}
            <div className="pt-2 border-t border-pos-border">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pos-bg transition">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={sendToKitchen}
                    onChange={(e) => setSendToKitchen(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </div>
                <div>
                  <span className="text-sm font-bold text-pos-text block">
                    ส่งเข้าครัว
                  </span>
                  <span className="text-[10px] text-pos-text/60">
                    ออเดอร์จะไปแสดงที่หน้าจอครัว
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="p-4 bg-pos-bg border-t border-pos-border">
            <button
              type="submit"
              disabled={isSubmitting || isSavingTable}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการพักบิล"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
