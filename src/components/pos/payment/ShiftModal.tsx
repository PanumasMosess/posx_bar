"use client";

import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import ToastAlert from "@/components/ToastAlert";
import { useShift } from "@/components/providers/ShiftContext";
import { useEmployee } from "@/components/providers/EmployeeContext";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { useShiftRevenue } from "@/components/providers/ShiftRevenueContext"; // 🌟 นำเข้า Provider
import { ShiftModalProps } from "@/lib/interface";
import { useState, useEffect } from "react";

export default function ShiftModal({ isOpen, onClose }: ShiftModalProps) {
  const { activeShift, openShift, closeShift, isLoading } = useShift();
  const { currentEmployee, employeeId } = useEmployee();
  const { settings, formatCurrency } = useOrgSettings();

  // 🌟 ดึง salesSummary (ยอดขายแยกประเภท) มาให้ครบ
  const { salesSummary, isLoadingRevenue, refreshRevenue } = useShiftRevenue();

  const currencyCode = settings?.currencyCode || "LAK";

  // Form States
  const [startingCash, setStartingCash] = useState<string>("0");
  const [endingCash, setEndingCash] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" | "info") =>
    setToast({ isOpen: true, message, type });
  const hideToast = () => setToast((prev) => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (isOpen) {
      setStartingCash("0");
      setEndingCash("");
      setNote("");
      setShowCloseConfirm(false);
      hideToast();

      // สั่งรีเฟรชข้อมูลยอดเงินแบบ Real-time เมื่อเปิด Modal ปิดกะ
      if (activeShift) {
        refreshRevenue();
      }
    }
  }, [isOpen, activeShift, refreshRevenue]);

  // 🌟 คำนวณสรุปยอด
  // ยอดที่ควรมีในเก๊ะ = เงินตั้งต้น + ยอดขาย "เงินสด" เท่านั้น
  const startingCashAmount = activeShift?.startingCash || 0;

  // ป้องกัน error ถ้า salesSummary ยังโหลดไม่เสร็จ
  const currentCashSales = salesSummary?.cashSales || 0;
  const expectedCashCalculated = activeShift
    ? startingCashAmount + currentCashSales
    : 0;

  const numEndingCash = Number(endingCash) || 0;
  const cashDiff = numEndingCash - expectedCashCalculated;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const openerId = String(employeeId || "0");
      const res = await openShift(Number(startingCash) || 0, openerId);
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

  const handlePreCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endingCash) {
      showToast("กรุณากรอกยอดเงินสดที่นับได้จริงในลิ้นชัก", "info");
      return;
    }
    setShowCloseConfirm(true);
  };

  const handleExecuteCloseShift = async () => {
    setShowCloseConfirm(false);
    setIsSubmitting(true);
    try {
      const closerId = String(employeeId || "0");
      const finalNote =
        cashDiff !== 0 && !note
          ? `ปิดกะด้วยส่วนต่าง ${cashDiff > 0 ? "+" : ""}${cashDiff} ${currencyCode}`
          : note;

      const res = await closeShift(numEndingCash, closerId, finalNote);
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
      {isOpen && !showCloseConfirm && (
        <>
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
                /* ----------------- เปิดกะ (เหมือนเดิม) ----------------- */
                <form
                  onSubmit={handleOpenShift}
                  className="p-4 space-y-4 overflow-y-auto custom-scroll"
                >
                  <div className="flex justify-between items-center px-1 text-xs font-semibold text-pos-text/60">
                    <span>ผู้ทำรายการ:</span>
                    <span className="text-pos-text font-bold">
                      {currentEmployee?.name || "พนักงาน"}
                    </span>
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
                        {currencyCode}
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
                /* ----------------- ปิดกะ (อัปเดตใหม่) ----------------- */
                <form
                  onSubmit={handlePreCloseShift}
                  className="p-4 space-y-3.5 overflow-y-auto custom-scroll relative"
                >
                  {/* Loading Overlay */}
                  {isLoadingRevenue && (
                    <div className="absolute inset-0 z-10 bg-pos-surface/50 backdrop-blur-[1px] flex items-center justify-center rounded-b-3xl">
                      <span className="text-sm font-bold text-sky-500 animate-pulse bg-pos-surface px-4 py-2 rounded-full shadow-lg border border-pos-border">
                        กำลังอัปเดตยอดเงินล่าสุด...
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center px-1 text-xs font-semibold text-pos-text/60">
                    <span>ผู้ทำรายการ:</span>
                    <span className="text-pos-text font-bold">
                      {currentEmployee?.name || "พนักงาน"}
                    </span>
                  </div>

                  <div className="p-3 bg-pos-bg rounded-2xl border border-pos-border space-y-2 text-xs">
                    {/* เงินทอนตั้งต้น */}
                    <div className="flex justify-between items-center pb-2 border-b border-pos-border/60 font-bold">
                      <span className="text-pos-text/70">
                        เงินสดตั้งต้น (เริ่มต้นกะ):
                      </span>
                      <span className="font-mono text-pos-text">
                        {formatCurrency(startingCashAmount)}
                      </span>
                    </div>

                    {/* รายละเอียดแยกตามประเภท (รับค่ามาจาก Provider) */}
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between text-pos-text/70">
                        <span>💵 ยอดขายเงินสด:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(salesSummary?.cashSales || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-text/70">
                        <span>📱 ยอดสแกน QR / โอน:</span>
                        <span>
                          {formatCurrency(salesSummary?.qrSales || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-text/70">
                        <span>💳 ยอดบัตรเครดิต:</span>
                        <span>
                          {formatCurrency(salesSummary?.cardSales || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-text/70">
                        <span>👑 ยอดตัดกระเป๋าสมาชิก:</span>
                        <span>
                          {formatCurrency(salesSummary?.memberSales || 0)}
                        </span>
                      </div>
                      {/* ❌ ลบเงื่อนไข Delivery ออกไปเลยครับ */}
                    </div>

                    {/* สรุปเงินสดสุทธิที่ควรมีในลิ้นชัก */}
                    <div className="flex justify-between items-baseline pt-2 border-t border-pos-border/60">
                      <span className="font-bold text-pos-text">
                        เงินสดที่ควรมีในลิ้นชัก:
                      </span>
                      <span className="text-base font-black font-mono text-sky-600 dark:text-sky-400">
                        {formatCurrency(expectedCashCalculated)}
                      </span>
                    </div>
                  </div>

                  {/* ช่องกรอกเงินสดจริง */}
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
                        disabled={isSubmitting || isLoadingRevenue}
                        value={endingCash}
                        onChange={(e) => setEndingCash(e.target.value)}
                        placeholder="ระบุจำนวนเงินสดที่นับได้..."
                        className="w-full px-3 py-2.5 bg-pos-bg border border-pos-border rounded-xl text-base font-mono font-black text-pos-text outline-none focus:border-rose-500 disabled:opacity-50"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-pos-text/50">
                        {currencyCode}
                      </span>
                    </div>
                  </div>

                  {/* แสดงส่วนต่าง (ถ้ามีกรอก) */}
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
                          ? `+${formatCurrency(cashDiff)}`
                          : formatCurrency(cashDiff)}
                      </span>
                    </div>
                  )}

                  {/* หมายเหตุ */}
                  <div>
                    <label className="block text-xs font-bold text-pos-text mb-1">
                      หมายเหตุปิดกะ (ถ้ามี):
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting || isLoadingRevenue}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="เช่น เงินทอนไม่พอ, ทอนเงินผิด..."
                      className="w-full px-3 py-2 bg-pos-bg border border-pos-border rounded-xl text-xs text-pos-text outline-none focus:border-sky-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading || isLoadingRevenue}
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

      {/* Confirm Modal แยกเดี่ยว */}
      {showCloseConfirm && (
        <ConfirmDeleteModal
          isOpen={showCloseConfirm}
          title="ยืนยันการปิดกะการทำงาน?"
          message={`คุณต้องการปิดกะ #${activeShift?.shiftNumber} ยอดเงินนับจริง ${formatCurrency(numEndingCash)} ใช่หรือไม่?`}
          onConfirm={handleExecuteCloseShift}
          onClose={() => setShowCloseConfirm(false)}
          isPending={isSubmitting}
          confirmText="ยืนยันปิดกะ"
        />
      )}

      <ToastAlert
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
}
