"use client";

import { useState } from "react";
import { useCart } from "@/components/providers/CartContext";
import { useShift } from "@/components/providers/ShiftContext";
import { PaymentModalProps } from "@/lib/interface";
import { processPaymentDB } from "@/lib/actions/actionsPos";
import PaymentHeader from "./PaymentHeader";
import MemberSelector from "./MemberSelector";
import PaymentItemsList from "./PaymentItemsList";
import PaymentMethodPicker from "./PaymentMethodPicker";
import CashNumpad from "./CashNumpad";
import MemberWalletView from "./MemberWalletView";
import ShiftCheckView from "./ShiftCheckView"; // 🌟 Import Component เปิดกะแยก

export default function PaymentModal({ billId, onClose }: PaymentModalProps) {
  const { heldBills, checkoutBill, fetchHeldBills } = useCart();
  const { activeShift, openShift } = useShift();

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QR" | "CARD" | "MEMBER"
  >("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  // State สมาชิก
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    phone: string;
    points: number;
    balance: number;
    discountPercent: number;
  } | null>(null);
  const [showMemberInput, setShowMemberInput] = useState(false);

  if (!billId) return null;

  const payingBill = heldBills.find((b) => b.id === billId) ?? null;
  if (!payingBill) return null;

  const baseTotal = payingBill.totalPrice || 0;
  const discountAmount = selectedMember
    ? (baseTotal * selectedMember.discountPercent) / 100
    : 0;
  const netTotal = Math.max(0, baseTotal - discountAmount);

  const numReceived = Number(receivedAmount) || 0;
  const changeAmount =
    paymentMethod === "CASH" ? Math.max(0, numReceived - netTotal) : 0;

  const isCashSufficient =
    paymentMethod === "CASH" ? numReceived >= netTotal : true;
  const isMemberWalletSufficient =
    paymentMethod === "MEMBER"
      ? selectedMember
        ? selectedMember.balance >= netTotal
        : false
      : true;

  const canCheckout =
    Boolean(activeShift) && isCashSufficient && isMemberWalletSufficient;

  // ฟังก์ชันเปิดกะผ่าน Sub-component
  const handleQuickOpenShift = async (startingCash: number) => {
    setIsOpeningShift(true);
    try {
      const res = await openShift(startingCash, "แคชเชียร์");
      if (!res.success) {
        alert(res.message || "ไม่สามารถเปิดกะได้");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเปิดกะ");
    } finally {
      setIsOpeningShift(false);
    }
  };

  const handleSearchMember = () => {
    if (!memberSearch.trim()) return;
    setSelectedMember({
      id: "MEM-001",
      name: "คุณสมชาย ใจดี",
      phone: memberSearch,
      points: 450,
      balance: 500000,
      discountPercent: 5,
    });
    setShowMemberInput(false);
  };

  const handleNumpadPress = (val: string) => {
    if (val === "CLEAR") setReceivedAmount("");
    else if (val === "DEL") setReceivedAmount((prev) => prev.slice(0, -1));
    else if (val === "00")
      setReceivedAmount((prev) => (prev ? prev + "00" : ""));
    else setReceivedAmount((prev) => prev + val);
  };

  const handlePresetCash = (amount: number, isExact = false) => {
    if (isExact) setReceivedAmount(netTotal.toString());
    else setReceivedAmount((prev) => ((Number(prev) || 0) + amount).toString());
  };

  const handleCheckout = async () => {
    if (!canCheckout || !activeShift) return;
    setIsSubmitting(true);

    try {
      const res = await processPaymentDB({
        orderId: Number(payingBill.id),
        amount: netTotal,
        receivedAmount: paymentMethod === "CASH" ? numReceived : netTotal,
        changeAmount: paymentMethod === "CASH" ? changeAmount : 0,
        shiftId: activeShift.id,
        method: paymentMethod,
        referenceNo: selectedMember ? `MEMBER-${selectedMember.id}` : undefined,
        organizationId: (payingBill as any).organizationId || 1,
        createdBy: "cashier",
      });

      if (res.success) {
        checkoutBill(String(billId));
        await fetchHeldBills(1);
        onClose();
      } else {
        alert(res.message || "ไม่สามารถชำระเงินได้");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOptionsText = (rawOptions: any) => {
    if (!rawOptions) return "";
    try {
      let parsed =
        typeof rawOptions === "string" ? JSON.parse(rawOptions) : rawOptions;
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

  const tableName =
    (payingBill as any).qrcode?.tableName ||
    (payingBill as any).table?.tableName ||
    (payingBill as any).tableName;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[100] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-pos-surface rounded-3xl shadow-2xl border border-pos-border pointer-events-auto flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-slide-up transition-colors">
          {/* ฝั่งซ้าย: รายการบิล + ระบบสมาชิก */}
          <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-pos-border">
            <PaymentHeader
              orderNumber={payingBill.orderNumber}
              tableName={tableName}
              shiftNumber={activeShift?.shiftNumber}
              onClose={onClose}
            />

            <MemberSelector
              selectedMember={selectedMember}
              showInput={showMemberInput}
              searchQuery={memberSearch}
              onSearchChange={setMemberSearch}
              onSearchSubmit={handleSearchMember}
              onToggleInput={setShowMemberInput}
              onClearMember={() => setSelectedMember(null)}
            />

            <PaymentItemsList
              items={payingBill.items || []}
              discountAmount={discountAmount}
              discountPercent={selectedMember?.discountPercent}
              netTotal={netTotal}
              renderOptionsText={renderOptionsText}
            />
          </div>

          {/* ฝั่งขวา: เลือกประเภทชำระเงิน / หรือแสดงหน้าเปิดกะ */}
          <div className="w-full md:w-80 flex flex-col justify-between bg-pos-surface p-3.5 gap-3 shrink-0">
            {!activeShift ? (
              <ShiftCheckView
                onOpenShift={handleQuickOpenShift}
                isLoading={isOpeningShift}
              />
            ) : (
              <>
                <PaymentMethodPicker
                  currentMethod={paymentMethod}
                  onChange={setPaymentMethod}
                />

                {paymentMethod === "CASH" && (
                  <CashNumpad
                    numReceived={numReceived}
                    changeAmount={changeAmount}
                    onPreset={handlePresetCash}
                    onNumpadPress={handleNumpadPress}
                  />
                )}

                {paymentMethod === "MEMBER" && (
                  <MemberWalletView
                    selectedMember={selectedMember}
                    netTotal={netTotal}
                    onOpenSearch={() => setShowMemberInput(true)}
                  />
                )}

                {(paymentMethod === "QR" || paymentMethod === "CARD") && (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-pos-bg rounded-2xl border border-pos-border text-center gap-2">
                    <span className="text-3xl">
                      {paymentMethod === "QR" ? "📲" : "💳"}
                    </span>
                    <p className="font-bold text-xs text-pos-text">
                      {paymentMethod === "QR"
                        ? "สแกน QR พร้อมเพย์"
                        : "รูด/แตะ บัตรเครดิต"}
                    </p>
                    <p className="text-[11px] font-mono font-bold text-emerald-600">
                      ยอดชำระ {netTotal.toLocaleString()} LAK
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ปุ่มยืนยันชำระเงิน */}
            <div className="space-y-1">
              {!isCashSufficient && paymentMethod === "CASH" && activeShift && (
                <p className="text-[10px] text-rose-500 font-bold text-center">
                  * จำนวนเงินที่รับมายังไม่ครบถ้วน
                </p>
              )}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || !canCheckout}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-105 active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>
                  {isSubmitting ? "กำลังบันทึก..." : "ยืนยันชำระเงิน"}
                </span>
                <svg
                  className="w-4 h-4 stroke-[3]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
