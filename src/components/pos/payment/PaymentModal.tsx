"use client";

import { useState, useRef } from "react";
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
import ShiftCheckView from "./ShiftCheckView";
import { useEmployee } from "@/components/providers/EmployeeContext";
import { toPng } from "html-to-image"; // 🌟 เปลี่ยนมาใช้ html-to-image

export default function PaymentModal({ billId, onClose }: PaymentModalProps) {
  const { heldBills, checkoutBill, fetchHeldBills } = useCart();
  const { organizationId, employeeId, currentEmployee } = useEmployee();
  const { activeShift, openShift } = useShift();

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QR" | "CARD" | "MEMBER"
  >("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  // 🌟 State สำหรับหน้าใบเสร็จ
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  // 🌟 อนุญาตให้ payingBill เป็น null ได้เฉพาะตอนที่จ่ายเงินสำเร็จแล้ว (เพื่อโชว์ใบเสร็จ)
  const payingBill = heldBills.find((b) => b.id === billId) ?? null;
  if (!payingBill && !isPaymentSuccess) return null;

  const baseTotal = payingBill?.totalPrice || 0;
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

  const tableName = payingBill
    ? (payingBill as any).qrcode?.tableName ||
      (payingBill as any).table?.tableName ||
      (payingBill as any).tableName
    : "";

  const handleQuickOpenShift = async (startingCash: number) => {
    setIsOpeningShift(true);
    try {
      const openerName = currentEmployee?.name || "พนักงาน";
      const res = await openShift(startingCash, openerName);
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
    if (!canCheckout || !activeShift || !payingBill) return;
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
        organizationId: organizationId,
        createdBy: String(employeeId),
      });

      if (res.success) {
        // 🌟 สำเนาข้อมูลใบเสร็จเก็บไว้ก่อนลบบิลทิ้ง
        setReceiptData({
          orderNumber: payingBill.orderNumber,
          tableName: tableName,
          items: payingBill.items,
          baseTotal: baseTotal,
          discountPercent: selectedMember?.discountPercent || 0,
          discountAmount: discountAmount,
          netTotal: netTotal,
          paymentMethod: paymentMethod,
          receivedAmount: paymentMethod === "CASH" ? numReceived : netTotal,
          changeAmount: changeAmount,
          date: new Date(),
        });

        setIsPaymentSuccess(true);
        checkoutBill(String(billId));
        await fetchHeldBills(organizationId);
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

  // 🌟 ฟังก์ชันสร้างรูปใบเสร็จโดยใช้ html-to-image
  const generateReceiptImage = async () => {
    if (!receiptRef.current) return null;
    setIsProcessingReceipt(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2, // ความคมชัด x2
        backgroundColor: "#ffffff",
      });
      return dataUrl;
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("ไม่สามารถสร้างรูปใบเสร็จได้");
      return null;
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  // 🌟 ฟังก์ชันดาวน์โหลดลงเครื่อง
  const handleSaveReceipt = async () => {
    const dataUrl = await generateReceiptImage();
    if (!dataUrl || !receiptData) return;

    const link = document.createElement("a");
    link.download = `Receipt_${receiptData.orderNumber}.png`;
    link.href = dataUrl;
    link.click();
  };

  // 🌟 ฟังก์ชันแชร์ (มือถือ)
  const handleShareReceipt = async () => {
    const dataUrl = await generateReceiptImage();
    if (!dataUrl || !receiptData) return;

    try {
      // แปลง DataURL เป็น File object เพื่อใช้กับ Web Share API
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Receipt_${receiptData.orderNumber}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ใบเสร็จรับเงิน ${receiptData.orderNumber}`,
          text: "ขอบคุณที่ใช้บริการครับ/ค่ะ",
          files: [file],
        });
      } else {
        alert("อุปกรณ์ของคุณไม่รองรับการแชร์โดยตรง ระบบจะดาวน์โหลดแทน");
        handleSaveReceipt(); // ถ้าแชร์ไม่ได้ ให้เซฟลงเครื่องแทน
      }
    } catch (error) {
      console.error("Error sharing:", error);
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

  // 🌟 หน้าจอใบเสร็จหลังจากชำระเงินสำเร็จ
  if (isPaymentSuccess && receiptData) {
    return (
      <>
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in flex flex-col items-center justify-center p-4 overflow-y-auto">
          {/* พื้นที่จำลองใบเสร็จรับเงิน (Thermal Slip Style) */}
          <div
            ref={receiptRef}
            className="bg-white text-slate-900 w-full max-w-[320px] p-6 rounded-sm shadow-xl relative mt-10 sm:mt-0"
            style={{ fontFamily: "monospace" }}
          >
            {/* ขอบใบเสร็จหยักๆ */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmZmZmYiIHBvaW50cz0iMCwwIDgsMCA0LDgiLz48L3N2Zz4=')] bg-repeat-x -mt-2 z-10" />

            <div className="text-center mb-6">
              <h2 className="text-xl font-black mb-1">POSX</h2>
              {/* <p className="text-xs text-slate-500">โทร: 02-123-4567</p> */}
              <p className="text-xs text-slate-500 mt-1 font-bold">
                ใบเสร็จรับเงิน / Receipt
              </p>
            </div>

            <div className="flex justify-between items-center text-xs mb-1 font-bold">
              <span>บิล: {receiptData.orderNumber}</span>
              <span>
                {receiptData.tableName
                  ? `โต๊ะ ${receiptData.tableName}`
                  : "ทั่วไป"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mb-4 pb-4 border-b border-dashed border-slate-300">
              <span>
                วันที่: {receiptData.date.toLocaleDateString("th-TH")}
              </span>
              <span>
                เวลา:{" "}
                {receiptData.date.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {receiptData.items.map((item: any, idx: number) => {
                const subTitle = item.product?.name || item.name || "สินค้า";
                const qty = item.quantity || 1;
                const price = item.priceAtTime || item.product?.price || 0;
                return (
                  <div
                    key={idx}
                    className="flex justify-between text-xs items-start gap-2"
                  >
                    <span className="flex-1">
                      {qty}x {subTitle}
                    </span>
                    <span className="shrink-0">
                      {(price * qty).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>ยอดรวม</span>
                <span>{receiptData.baseTotal.toLocaleString()} LAK</span>
              </div>
              {receiptData.discountAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>ส่วนลด ({receiptData.discountPercent}%)</span>
                  <span>
                    - {receiptData.discountAmount.toLocaleString()} LAK
                  </span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-2">
                <span>ยอดสุทธิ</span>
                <span>{receiptData.netTotal.toLocaleString()} LAK</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 mt-4 pt-4 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>รับชำระ ({receiptData.paymentMethod})</span>
                <span>{receiptData.receivedAmount.toLocaleString()} LAK</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>เงินทอน</span>
                <span>{receiptData.changeAmount.toLocaleString()} LAK</span>
              </div>
            </div>

            <div className="text-center mt-8 text-xs font-bold text-slate-500 pb-2">
              <p>*** ขอบคุณที่ใช้บริการ ***</p>
            </div>
          </div>

          {/* กลุ่มปุ่ม Action (ไม่โดน Capture ไปในรูป) */}
          <div className="mt-8 flex flex-col gap-3 w-full max-w-[320px] relative z-[110] pb-10">
            <div className="flex gap-3">
              <button
                onClick={handleShareReceipt}
                disabled={isProcessingReceipt}
                className="flex-1 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md shadow-sky-500/20"
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
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                  />
                </svg>
                แชร์บิล
              </button>
              <button
                onClick={handleSaveReceipt}
                disabled={isProcessingReceipt}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-500/20"
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                บันทึกรูป
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition active:scale-95 shadow-sm"
            >
              ปิด / เสร็จสิ้น
            </button>
          </div>
        </div>
      </>
    );
  }

  // 🌟 หน้าจอชำระเงินปกติ
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[100] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-pos-surface rounded-3xl shadow-2xl border border-pos-border pointer-events-auto flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-slide-up transition-colors">
          <div className="flex-1 flex flex-col min-w-0 min-h-0 border-b md:border-b-0 md:border-r border-pos-border">
            <div className="shrink-0">
              <PaymentHeader
                orderNumber={payingBill?.orderNumber || ""}
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
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-pos-bg/30">
              <PaymentItemsList
                items={payingBill?.items || []}
                discountAmount={discountAmount}
                discountPercent={selectedMember?.discountPercent}
                netTotal={netTotal}
                renderOptionsText={renderOptionsText}
              />
            </div>
          </div>

          <div className="w-full md:w-80 flex flex-col justify-between bg-pos-surface p-3.5 gap-3 shrink-0 overflow-y-auto custom-scroll">
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

            <div className="space-y-1 shrink-0">
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
