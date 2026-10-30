"use client";

import { useState, useRef, useEffect } from "react";
import { useCart } from "@/components/providers/CartContext";
import { useShift } from "@/components/providers/ShiftContext";
import { useEmployee } from "@/components/providers/EmployeeContext";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { PaymentModalProps } from "@/lib/interface";
import {
  processPaymentDB,
  createQrIntentDB,
  checkQrPaymentStatusDB,
} from "@/lib/actions/actionsPos";
import PaymentHeader from "./PaymentHeader";
import MemberSelector from "./MemberSelector";
import PaymentItemsList from "./PaymentItemsList";
import PaymentMethodPicker from "./PaymentMethodPicker";
import CashNumpad from "./CashNumpad";
import MemberWalletView from "./MemberWalletView";
import ShiftCheckView from "./ShiftCheckView";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { useMember } from "@/components/providers/MemberContext";

export default function PaymentModal({ billId, onClose }: PaymentModalProps) {
  // ==========================================
  // 1. เรียกใช้ Context และ State ทั้งหมด (ห้ามมี return คั่น)
  // ==========================================
  const { heldBills, checkoutBill, fetchHeldBills } = useCart();
  const { organizationId, employeeId, currentEmployee } = useEmployee();
  const { activeShift, openShift } = useShift();
  const { settings } = useOrgSettings();

  const {
    selectedMember,
    searchMember,
    clearSelectedMember,
    isSearchingMember,
    searchError,
  } = useMember();

  // 🌟 เปิดระบบสมาชิกในหน้านี้แล้ว
  const isEnableMemberSystem = true;

  // 🌟 สวิตช์ เปิด-ปิด ระบบ Webhook (ให้พนักงานกดเปิด/ปิดใน UI ได้)
  const [isEnableWebhook, setIsEnableWebhook] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QR" | "CARD" | "MEMBER"
  >("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberInput, setShowMemberInput] = useState(false);

  const [randomSatang, setRandomSatang] = useState(0);
  const [lastIntentAmount, setLastIntentAmount] = useState<number>(0);

  useEffect(() => {
    if (billId) {
      const randomDec = Math.floor(Math.random() * 60) + 1;
      setRandomSatang(randomDec);
      setLastIntentAmount(0);

      setIsPaymentSuccess(false);
      setReceiptData(null);
      setReceiptUrl("");
      setIsSubmitting(false);
      setReceivedAmount("");
      setPaymentMethod("CASH");
    }
  }, [billId]);

  // คำนวณค่าต่างๆ เตรียมไว้ก่อน
  const payingBill = heldBills.find((b) => b.id === billId) ?? null;
  const baseTotal = payingBill?.totalPrice || 0;

  const discountAmount =
    selectedMember && paymentMethod === "MEMBER" && isEnableMemberSystem
      ? (baseTotal * (selectedMember.discountPercent || 0)) / 100
      : 0;
  const netTotal = Math.max(0, baseTotal - discountAmount);

  // 🌟 ถ้าเปิด Webhook ให้บวกทศนิยม ถ้าปิดอยู่ให้ใช้ยอด netTotal ปกติ
  const qrAmount =
    isEnableWebhook && netTotal > 0 ? netTotal + randomSatang / 100 : netTotal;

  // ตรวจจับการเปิด QR Code เพื่อยิงบันทึก Intent รอรับ Webhook
  useEffect(() => {
    const generateIntent = async () => {
      if (
        isEnableWebhook &&
        paymentMethod === "QR" &&
        qrAmount > 0 &&
        payingBill &&
        qrAmount !== lastIntentAmount
      ) {
        try {
          await createQrIntentDB({
            organizationId: Number(organizationId),
            orderId: Number(payingBill.id),
            expectedAmount: qrAmount,
            shiftId: activeShift?.id,
            employeeId: Number(employeeId),
            memberId: selectedMember ? Number(selectedMember.id) : undefined,
          });
          setLastIntentAmount(qrAmount); // บันทึกยอดไว้ จะได้ไม่ยิงซ้ำ
        } catch (error) {
          console.error("Failed to create QR intent", error);
        }
      }
    };

    generateIntent();
  }, [
    isEnableWebhook,
    paymentMethod,
    qrAmount,
    payingBill,
    lastIntentAmount,
    organizationId,
    employeeId,
    activeShift,
    selectedMember,
  ]);

  // ==========================================
  // 🌟 ระบบ Polling เช็คยอดโอนอัตโนมัติ (ทำงานเฉพาะตอนเปิด Webhook)
  // ==========================================
  const checkoutRef = useRef<(() => void) | null>(null);

  // ให้ Ref อัปเดตเสมอ เพื่อไม่ให้ติด Rules of Hooks
  useEffect(() => {
    checkoutRef.current = handleCheckout;
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkAutoPayment = async () => {
      if (
        !isEnableWebhook ||
        paymentMethod !== "QR" ||
        !payingBill ||
        qrAmount <= 0
      )
        return;

      try {
        const res = await checkQrPaymentStatusDB(
          Number(payingBill.id),
          qrAmount,
        );
        if (res.success && res.isPaid) {
          clearInterval(intervalId); // หยุดเช็ค
          if (checkoutRef.current) checkoutRef.current(); // เรียก Checkout อัตโนมัติ
        }
      } catch (error) {
        console.error("Polling payment status error", error);
      }
    };

    if (
      isEnableWebhook &&
      paymentMethod === "QR" &&
      payingBill &&
      !isSubmitting
    ) {
      intervalId = setInterval(checkAutoPayment, 3000); // ยิงเช็คทุกๆ 3 วินาที
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isEnableWebhook, paymentMethod, payingBill, qrAmount, isSubmitting]);

  // ==========================================
  // 3. จัดการเงื่อนไข Early Return หลัง Hook ทั้งหมดทำงานเสร็จแล้ว
  // ==========================================
  if (!billId) return null;
  if (!payingBill && !isPaymentSuccess) return null;

  // ==========================================
  // 4. การคำนวณและฟังก์ชันที่เหลือ
  // ==========================================
  const POINTS_RATE = 100;
  const earnedPoints = Math.floor(netTotal / POINTS_RATE);

  const numReceived = Number(receivedAmount) || 0;
  const changeAmount =
    paymentMethod === "CASH" ? Math.max(0, numReceived - netTotal) : 0;

  const isCashSufficient =
    paymentMethod === "CASH" ? numReceived >= netTotal : true;

  const isMemberWalletSufficient =
    paymentMethod === "MEMBER"
      ? selectedMember && isEnableMemberSystem
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

  const handleSearchMember = async () => {
    if (!memberSearch.trim()) return;
    const isFound = await searchMember(memberSearch);
    if (isFound) {
      setShowMemberInput(false);
      setMemberSearch("");
    } else {
      alert(searchError || "ไม่พบข้อมูลสมาชิกในระบบ");
    }
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

  async function handleCheckout() {
    if (!canCheckout || !activeShift || !payingBill) return;
    setIsSubmitting(true);

    try {
      const res = await processPaymentDB({
        orderId: Number(payingBill.id),
        amount: paymentMethod === "QR" ? qrAmount : netTotal,
        receivedAmount:
          paymentMethod === "CASH"
            ? numReceived
            : paymentMethod === "QR"
              ? qrAmount
              : netTotal,
        changeAmount: paymentMethod === "CASH" ? changeAmount : 0,
        shiftId: activeShift.id,
        method: paymentMethod,
        referenceNo:
          selectedMember && paymentMethod === "MEMBER" && isEnableMemberSystem
            ? `MEMBER-${selectedMember.id}`
            : undefined,
        memberId:
          selectedMember && paymentMethod === "MEMBER" && isEnableMemberSystem
            ? Number(selectedMember.id)
            : undefined,
        organizationId: organizationId,
        createdBy: String(employeeId),
      });

      if (res.success) {
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const generatedUrl = `${baseUrl}/receipt/${payingBill.id}`;
        setReceiptUrl(generatedUrl);

        setReceiptData({
          orderNumber: payingBill.orderNumber,
          tableName: tableName,
          netTotal: paymentMethod === "QR" ? qrAmount : netTotal,
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
  }

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
        { type: "image/png" },
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

  const handleSavePromptPayQR = (qrUrl: string) => {
    try {
      const link = document.createElement("a");
      link.href = qrUrl;
      link.download = `PromptPay_${payingBill?.orderNumber || "QR"}.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error saving QR:", error);
      window.open(qrUrl, "_blank");
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

  // ==========================================
  // 5. ส่วนแสดงผล UI หน้าจอชำระเงินสำเร็จ (ใบเสร็จ)
  // ==========================================
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

          <div
            ref={receiptRef}
            className="bg-white px-6 py-8 rounded-[24px] flex flex-col items-center text-center w-[300px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-sky-500" />
            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 mt-2">
              POSX
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6">
              บิล:{" "}
              <span className="text-slate-800">{receiptData.orderNumber}</span>
            </p>
            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-5">
              <QRCodeSVG
                value={receiptUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="w-full pt-4 border-t border-dashed border-slate-200">
              <p className="text-[15px] font-black text-slate-800 mb-1">
                ยอดชำระ{" "}
                {receiptData.netTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {settings?.currencyCode || "LAK"}
              </p>
              <p className="text-sm font-bold text-sky-600 mb-0.5">
                สแกนคิวอาร์โค้ด
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                เพื่อดูใบเสร็จรับเงินออนไลน์
              </p>
            </div>
          </div>

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
                  "แชร์ QR"
                )}
              </button>
              <button
                onClick={handleSaveReceipt}
                disabled={isProcessingReceipt || isSharing}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {isProcessingReceipt ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "บันทึก QR"
                )}
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

  // ==========================================
  // 6. ส่วนแสดงผล UI หน้าต่างการรับชำระเงินหลัก
  // ==========================================
  const promptpayId = settings?.payments_settings?.promptPayNumber;
  const promptpayQrCodeUrl = promptpayId
    ? `https://promptpay.io/${promptpayId}/${qrAmount.toFixed(2)}.png`
    : null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[100] transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-pos-surface rounded-3xl shadow-2xl border border-pos-border pointer-events-auto flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-slide-up transition-colors">
          {/* ซ้าย: แสดงรายการสินค้า และค้นหาสมาชิก */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 border-b md:border-b-0 md:border-r border-pos-border">
            <div className="shrink-0">
              <PaymentHeader
                orderNumber={payingBill?.orderNumber || ""}
                tableName={tableName}
                shiftNumber={activeShift?.shiftNumber}
                onClose={onClose}
              />

              {paymentMethod === "MEMBER" && isEnableMemberSystem && (
                <>
                  <MemberSelector
                    selectedMember={selectedMember}
                    showInput={showMemberInput}
                    searchQuery={memberSearch}
                    onSearchChange={setMemberSearch}
                    onSearchSubmit={handleSearchMember}
                    onToggleInput={setShowMemberInput}
                    onClearMember={clearSelectedMember}
                  />
                  {selectedMember && earnedPoints > 0 && (
                    <div className="bg-emerald-500/10 px-4 py-2 border-b border-pos-border text-xs font-bold text-emerald-600 flex justify-between items-center">
                      <span>✨ จะได้รับแต้มสะสมจากบิลนี้:</span>
                      <span>+{earnedPoints} แต้ม</span>
                    </div>
                  )}
                </>
              )}
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

          {/* ขวา: หน้าต่างการจ่ายเงิน และ QR Code */}
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

                {paymentMethod === "MEMBER" && isEnableMemberSystem && (
                  <MemberWalletView
                    selectedMember={selectedMember}
                    netTotal={netTotal}
                    onOpenSearch={() => setShowMemberInput(true)}
                  />
                )}

                {paymentMethod === "QR" && (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-pos-bg rounded-2xl border border-pos-border text-center gap-3">
                    {promptpayQrCodeUrl ? (
                      <>
                        <p className="font-bold text-[13px] text-pos-text leading-tight">
                          {settings?.payments_settings?.promptPayName ||
                            "สแกน QR เพื่อชำระเงิน"}
                        </p>

                        {/* 🌟 เพิ่มปุ่ม UI สวิตช์เปิด-ปิด ตรงนี้ */}
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full justify-center mt-1 mb-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isEnableWebhook}
                              onChange={(e) =>
                                setIsEnableWebhook(e.target.checked)
                              }
                            />
                            <div
                              className={`block w-10 h-6 rounded-full transition-colors ${isEnableWebhook ? "bg-emerald-500" : "bg-slate-400"}`}
                            ></div>
                            <div
                              className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnableWebhook ? "translate-x-4" : ""}`}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {isEnableWebhook
                              ? "เช็คยอดโอนอัตโนมัติ"
                              : "ปิดออโต้ (กดยืนยันเอง)"}
                          </span>
                        </label>

                        <div className="bg-white p-2.5 rounded-2xl border-2 border-slate-200/50 shadow-sm relative">
                          <img
                            src={promptpayQrCodeUrl}
                            alt="PromptPay QR"
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <p
                            className={`text-[12px] font-mono font-black px-3 py-1 rounded-full ${isEnableWebhook ? "text-emerald-600 bg-emerald-500/10" : "text-sky-600 bg-sky-500/10"}`}
                          >
                            ยอดชำระ{" "}
                            {qrAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {settings?.currencyCode || "LAK"}
                          </p>
                          {/* แสดงข้อความรอจ่าย ถ้าระบบ Auto ทำงานอยู่ */}
                          {isEnableWebhook && (
                            <p className="text-[10px] text-emerald-600 font-bold animate-pulse mt-1">
                              กำลังรอตรวจสอบยอดเงินโอนอัตโนมัติ...
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSavePromptPayQR(promptpayQrCodeUrl)
                          }
                          className="mt-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
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
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                          </svg>
                          บันทึกรูป QR
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl mb-1">📲</span>
                        <p className="font-bold text-[13px] text-pos-text text-amber-600">
                          ยังไม่ได้ตั้งค่าพร้อมเพย์
                        </p>
                        <p className="text-[11px] text-pos-text/70 mt-1">
                          กรุณาตั้งค่าเลขพร้อมเพย์ในระบบหลังบ้าน
                        </p>
                      </>
                    )}
                  </div>
                )}

                {paymentMethod === "CARD" && (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-pos-bg rounded-2xl border border-pos-border text-center gap-2">
                    <span className="text-4xl mb-1">💳</span>
                    <p className="font-bold text-[13px] text-pos-text">
                      รูด/แตะ บัตรเครดิต
                    </p>
                    <p className="text-[12px] font-mono font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full mt-1">
                      ยอดชำระ {netTotal.toLocaleString()}{" "}
                      {settings?.currencyCode || "LAK"}
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
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-105 active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <span>
                  {isSubmitting
                    ? "กำลังบันทึก..."
                    : isSearchingMember
                      ? "กำลังค้นหา..."
                      : isEnableWebhook && paymentMethod === "QR"
                        ? "ข้ามระบบรอจ่าย (ยืนยันเอง)"
                        : "ยืนยันชำระเงิน"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
