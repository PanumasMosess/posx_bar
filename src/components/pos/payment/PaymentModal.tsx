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
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";

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
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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
        // 🌟 สร้างลิ้งก์ใบเสร็จออนไลน์เพื่อซ่อนใน QR Code
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const generatedUrl = `${baseUrl}/receipt/${payingBill.id}`;
        setReceiptUrl(generatedUrl);

        setReceiptData({
          orderNumber: payingBill.orderNumber,
          tableName: tableName,
          netTotal: netTotal,
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

  const generateReceiptImage = async () => {
    if (!receiptRef.current) return null;
    setIsProcessingReceipt(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 3,
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

  const handleSaveReceipt = async () => {
    const dataUrl = await generateReceiptImage();
    if (!dataUrl || !receiptData) return;

    const link = document.createElement("a");
    link.download = `QR_Receipt_${receiptData.orderNumber}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShareReceipt = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const dataUrl = await generateReceiptImage();
      if (!dataUrl || !receiptData) {
        setIsSharing(false);
        return;
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `QR_Receipt_${receiptData.orderNumber}.png`,
        {
          type: "image/png",
        },
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ใบเสร็จออนไลน์ - บิล ${receiptData.orderNumber}`,
          text: `สแกน QR โค้ดหรือคลิกลิ้งก์เพื่อดูใบเสร็จ: ${receiptUrl}`,
          files: [file],
        });
      } else {
        alert("อุปกรณ์ของคุณไม่รองรับการแชร์โดยตรง ระบบจะดาวน์โหลดแทน");
        handleSaveReceipt();
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receiptUrl);
    alert("คัดลอกลิ้งก์ใบเสร็จแล้ว");
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

  // 🌟 ---------------- หน้าจอชำระเงินสำเร็จ (QR Code View) ---------------- 🌟
  if (isPaymentSuccess && receiptData) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-6 drop-shadow-md">
            ชำระเงินสำเร็จ
          </h2>

          {/* 🌟 พื้นที่ที่จะถูก Capture ไปเป็นรูปภาพ (ปรับ Size ให้เล็กลงกะทัดรัด กว้าง 300px) */}
          <div
            ref={receiptRef}
            className="bg-white px-6 py-8 rounded-[24px] flex flex-col items-center text-center w-[300px] shadow-2xl relative overflow-hidden"
          >
            {/* แถบสีตกแต่งด้านบน */}
            <div className="absolute top-0 left-0 w-full h-2 bg-sky-500" />

            {/* ส่วนหัวบิล */}
            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 mt-2">
              POSX
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6">
              บิล:{" "}
              <span className="text-slate-800">{receiptData.orderNumber}</span>
            </p>

            {/* ส่วนโชว์ QR Code */}
            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-5">
              <QRCodeSVG
                value={receiptUrl}
                size={160} // ขนาดกำลังดี สแกนง่าย
                level="M"
                includeMargin={false}
              />
            </div>

            {/* ข้อมูลการชำระเงินใต้ QR */}
            <div className="w-full pt-4 border-t border-dashed border-slate-200">
              <p className="text-[15px] font-black text-slate-800 mb-1">
                ยอดชำระ {receiptData.netTotal.toLocaleString()} LAK
              </p>
              <p className="text-sm font-bold text-sky-600 mb-0.5">
                สแกนคิวอาร์โค้ด
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                เพื่อดูใบเสร็จรับเงินออนไลน์
              </p>
            </div>
          </div>

          {/* 🌟 กลุ่มปุ่ม Action */}
          <div className="mt-8 flex flex-col w-full max-w-[300px] gap-3">
            <button
              onClick={handleCopyLink}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-95 backdrop-blur-sm"
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
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              คัดลอกลิ้งก์ (URL)
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleShareReceipt}
                disabled={isProcessingReceipt || isSharing}
                className="flex-1 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-sky-500/20"
              >
                {isSharing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                    />
                  </svg>
                )}
                แชร์ QR
              </button>

              <button
                onClick={handleSaveReceipt}
                disabled={isProcessingReceipt || isSharing}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {isProcessingReceipt ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                )}
                บันทึก QR
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition active:scale-95"
            >
              เสร็จสิ้น / ปิด
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🌟 ---------------- หน้าจอชำระเงินปกติ ---------------- 🌟
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
