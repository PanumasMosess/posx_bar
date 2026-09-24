"use client";

import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import ToastAlert from "@/components/ToastAlert";
import { useShift } from "@/components/providers/ShiftContext";
import { ShiftModalProps } from "@/lib/interface";
import { useState, useEffect } from "react";

export default function ShiftModal({ isOpen, onClose }: ShiftModalProps) {
  const { activeShift, openShift, closeShift, isLoading } = useShift();

  // Form States
  const [startingCash, setStartingCash] = useState<string>("0");
  const [endingCash, setEndingCash] = useState<string>("");
  const [cashierName, setCashierName] = useState<string>("แคชเชียร์");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 🌟 State ควบคุมการแสดงConfirm Modal
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);

  // State สำหรับควบคุม ToastAlert
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ isOpen: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

  // รีเซ็ตค่าเมื่อ Modal เปิด/ปิด
  useEffect(() => {
    if (isOpen) {
      setStartingCash("0");
      setEndingCash("");
      setNote("");
      setShowCloseConfirm(false);
      hideToast();
    }
  }, [isOpen]);

  // คำนวณสรุปยอดเบื้องต้นในหน้าปิดกะ
  const expectedCashCalculated = activeShift
    ? (activeShift.startingCash || 0) + (activeShift.cashSales || 0)
    : 0;
  const numEndingCash = Number(endingCash) || 0;
  const cashDiff = numEndingCash - expectedCashCalculated;

  // จัดการการเปิดกะ
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await openShift(Number(startingCash) || 0, cashierName);
      if (res.success) {
        showToast("เปิดกะการทำงานเรียบร้อยแล้ว", "success");
        onClose();
      } else {
        showToast(res.message || "ไม่สามารถเปิดกะได้", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเปิดกะ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // เมื่อกด Submit ในฟอร์มปิดกะ ให้เปิด ConfirmDeleteModal
  const handlePreCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endingCash) {
      showToast("กรุณากรอกยอดเงินสดที่นับได้จริงในลิ้นชัก", "info");
      return;
    }
    setShowCloseConfirm(true);
  };

  // 🌟 ฟังก์ชันปิดกะจริงที่จะเรียกใช้เมื่อกด Confirm
  const handleExecuteCloseShift = async () => {
    setShowCloseConfirm(false);
    setIsSubmitting(true);
    try {
      const res = await closeShift(numEndingCash, cashierName, note);
      if (res.success) {
        showToast("ปิดกะการทำงานเรียบร้อยแล้ว", "success");
        onClose();
      } else {
        showToast(res.message || "ไม่สามารถปิดกะได้", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการปิดกะ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 🌟 1. เรนเดอร์ ShiftModal เฉพาะเมื่อสั่งเปิด และไม่ได้อยู่ในขั้นตอน Confirmation */}
      {isOpen && !showCloseConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[100] transition-opacity animate-fade-in"
            onClick={() => !isSubmitting && onClose()}
          />

          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <div className="w-full max-w-lg bg-pos-surface rounded-3xl shadow-2xl border border-pos-border pointer-events-auto overflow-hidden animate-slide-up transition-colors flex flex-col max-h-[90vh] relative">
              {/* Header */}
              <div
                className={`p-4 border-b border-pos-border flex items-center justify-between shrink-0 transition-colors ${
                  activeShift
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{activeShift ? "🔴" : "🟢"}</span>
                  <div>
                    <h3 className="font-bold text-base leading-tight">
                      {activeShift
                        ? "ปิดกะการทำงาน (Shift Close)"
                        : "เปิดกะการทำงาน (Shift Open)"}
                    </h3>
                    <p className="text-[11px] text-pos-text/60 font-medium">
                      {activeShift
                        ? `รหัสกะ: ${activeShift.shiftNumber}`
                        : "กรุณาระบุเงินสดเริ่มต้นสำหรับการทอนเงิน"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center font-bold text-xs transition disabled:opacity-40"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              {!activeShift ? (
                /* ฟอร์มสำหรับเปิดกะ */
                <form
                  onSubmit={handleOpenShift}
                  className="p-4 space-y-4 overflow-y-auto custom-scroll"
                >
                  <div>
                    <label className="block text-xs font-bold text-pos-text mb-1.5">
                      ชื่อแคชเชียร์ผู้เปิดกะ:
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder="เช่น แคชเชียร์ A"
                      className="w-full px-3 py-2 bg-pos-bg border border-pos-border rounded-xl text-xs font-semibold text-pos-text outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-pos-text mb-1.5">
                      เงินสดเริ่มต้นในลิ้นชัก (เงินทอน):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        disabled={isSubmitting}
                        value={startingCash}
                        onChange={(e) => setStartingCash(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-pos-bg border border-pos-border rounded-xl text-base font-mono font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-pos-text/50">
                        LAK
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 100000, 200000, 500000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setStartingCash(preset.toString())}
                        className="py-1.5 rounded-xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-[11px] font-mono font-bold text-pos-text transition disabled:opacity-50"
                      >
                        {preset === 0 ? "0" : `+${(preset / 1000).toFixed(0)}k`}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "กำลังบันทึก..."
                        : "⚡ ยืนยันเปิดกะการทำงาน"}
                    </button>
                  </div>
                </form>
              ) : (
                /* ฟอร์มสำหรับปิดกะ */
                <form
                  onSubmit={handlePreCloseShift}
                  className="p-4 space-y-3.5 overflow-y-auto custom-scroll"
                >
                  <div className="p-3 bg-pos-bg rounded-2xl border border-pos-border space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-pos-border/60 font-bold">
                      <span className="text-pos-text/70">
                        เงินสดตั้งต้น (เริ่มต้นกะ):
                      </span>
                      <span className="font-mono text-pos-text">
                        {(activeShift.startingCash || 0).toLocaleString()} LAK
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between text-pos-text/70">
                        <span>💵 ยอดขายเงินสด:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{(activeShift.cashSales || 0).toLocaleString()} LAK
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-text/70">
                        <span>📱 ยอดสแกน QR / โอน:</span>
                        <span>
                          {(activeShift.qrSales || 0).toLocaleString()} LAK
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-text/70">
                        <span>💳 ยอดบัตรเครดิต:</span>
                        <span>
                          {(activeShift.cardSales || 0).toLocaleString()} LAK
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-text/70">
                        <span>👑 ยอดตัดกระเป๋าสมาชิก:</span>
                        <span>
                          {(activeShift.memberSales || 0).toLocaleString()} LAK
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-pos-border/60">
                      <span className="font-bold text-pos-text">
                        เงินสดที่ควรมีในลิ้นชัก:
                      </span>
                      <span className="text-base font-black font-mono text-sky-600 dark:text-sky-400">
                        {expectedCashCalculated.toLocaleString()} LAK
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-pos-text mb-1">
                      ยอดเงินสดนับได้จริงในลิ้นชัก{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        disabled={isSubmitting}
                        value={endingCash}
                        onChange={(e) => setEndingCash(e.target.value)}
                        placeholder="ระบุจำนวนเงินสดที่นับได้..."
                        className="w-full px-3 py-2.5 bg-pos-bg border border-pos-border rounded-xl text-base font-mono font-black text-pos-text outline-none focus:border-rose-500 disabled:opacity-50"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-pos-text/50">
                        LAK
                      </span>
                    </div>
                  </div>

                  {endingCash !== "" && (
                    <div
                      className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-bold ${
                        cashDiff === 0
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                          : cashDiff > 0
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-600"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      }`}
                    >
                      <span>ส่วนต่างเงินสด (เกิน/ขาด):</span>
                      <span className="font-mono font-black text-sm">
                        {cashDiff > 0
                          ? `+${cashDiff.toLocaleString()}`
                          : cashDiff.toLocaleString()}{" "}
                        LAK
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-pos-text mb-1">
                      หมายเหตุปิดกะ (ถ้ามี):
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="เช่น เงินทอนไม่พอ, ทอนเงินผิด..."
                      className="w-full px-3 py-2 bg-pos-bg border border-pos-border rounded-xl text-xs text-pos-text outline-none focus:border-sky-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-black text-sm shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "กำลังบันทึก..."
                        : "🔴 ยืนยันปิดกะสรุปยอด"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* 🌟 2. ConfirmDeleteModal จะแสดงแยกเดี่ยวๆ โดยไม่ซ้อนกับ ShiftModal */}
      {showCloseConfirm && (
        <ConfirmDeleteModal
          isOpen={showCloseConfirm}
          title="ยืนยันการปิดกะการทำงาน?"
          message={`คุณต้องการปิดกะ #${activeShift?.shiftNumber} ยอดเงินนับจริง ${numEndingCash.toLocaleString()} LAK ใช่หรือไม่?`}
          onConfirm={handleExecuteCloseShift}
          onClose={() => setShowCloseConfirm(false)}
          isPending={isSubmitting}
          confirmText="ยืนยันปิดกะ"
        />
      )}

      {/* 🌟 3. ToastAlert แสดงแจ้งเตือนมุมขวาบน */}
      <ToastAlert
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
}
