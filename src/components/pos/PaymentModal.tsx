"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "../providers/CartContext";
import { PaymentModalProps } from "@/lib/types/interface";

export default function PaymentModal({ billId, onClose }: PaymentModalProps) {
  const { heldBills, checkoutBill } = useCart();

  // 🌟 เพิ่มประเภทการชำระเงิน MEMBER
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QR" | "CARD" | "MEMBER"
  >("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State สมาชิก (Member System)
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    phone: string;
    points: number;
    balance: number; // ยอดเงินคงเหลือในกระเป๋าสมาชิก
    discountPercent: number;
  } | null>(null);
  const [showMemberInput, setShowMemberInput] = useState(false);

  if (!billId) return null;

  const payingBill = heldBills.find((b) => b.id === billId) ?? null;
  if (!payingBill) return null;

  // คำนวณส่วนลดสมาชิกและยอดชำระสุทธิ
  const baseTotal = payingBill.totalPrice || 0;
  const discountAmount = selectedMember
    ? (baseTotal * selectedMember.discountPercent) / 100
    : 0;
  const netTotal = Math.max(0, baseTotal - discountAmount);

  // คำนวณเงินทอน
  const numReceived = Number(receivedAmount) || 0;
  const changeAmount =
    paymentMethod === "CASH" ? Math.max(0, numReceived - netTotal) : 0;

  // เช็คเงื่อนไขยอดเงินพอชำระหรือไม่
  const isCashSufficient =
    paymentMethod === "CASH" ? numReceived >= netTotal : true;
  const isMemberWalletSufficient =
    paymentMethod === "MEMBER"
      ? selectedMember
        ? selectedMember.balance >= netTotal
        : false
      : true;
  const canCheckout = isCashSufficient && isMemberWalletSufficient;

  // ค้นหาสมาชิก (Mock Data สำหรับทดสอบ)
  const handleSearchMember = () => {
    if (!memberSearch.trim()) return;
    setSelectedMember({
      id: "MEM-001",
      name: "คุณสมชาย ใจดี",
      phone: memberSearch,
      points: 450,
      balance: 500000, // ยอดเงินใน Wallet สมาชิก 500,000 LAK
      discountPercent: 5,
    });
    setShowMemberInput(false);
  };

  const handleNumpadPress = (val: string) => {
    if (val === "CLEAR") {
      setReceivedAmount("");
    } else if (val === "DEL") {
      setReceivedAmount((prev) => prev.slice(0, -1));
    } else if (val === "00") {
      setReceivedAmount((prev) => (prev ? prev + "00" : ""));
    } else {
      setReceivedAmount((prev) => prev + val);
    }
  };

  const handlePresetCash = (amount: number, isExact = false) => {
    if (isExact) {
      setReceivedAmount(netTotal.toString());
    } else {
      setReceivedAmount((prev) => ((Number(prev) || 0) + amount).toString());
    }
  };

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setIsSubmitting(true);
    try {
      await checkoutBill(String(billId));
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
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
          {/* 🌟 ฝั่งซ้าย: รายการบิล + ระบบสมาชิก */}
          <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-pos-border">
            {/* Header */}
            <div className="p-3.5 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-pos-text leading-tight">
                    ชำระเงิน
                  </h3>
                  <p className="text-[11px] text-pos-text/60 font-medium">
                    #{payingBill.orderNumber}{" "}
                    {tableName ? `• โต๊ะ ${tableName}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-lg bg-pos-bg text-pos-text flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* ส่วนสมาชิก (Member Section) */}
            <div className="p-3 bg-pos-surface border-b border-pos-border shrink-0">
              {!selectedMember ? (
                !showMemberInput ? (
                  <button
                    type="button"
                    onClick={() => setShowMemberInput(true)}
                    className="w-full py-2 px-3 rounded-xl bg-pos-bg hover:bg-pos-hover border border-dashed border-sky-500/40 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                      />
                    </svg>
                    <span>สะสมแต้ม / ค้นหาสมาชิก</span>
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      placeholder="ใส่เบอร์โทรศัพท์สมาชิก..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSearchMember()
                      }
                      className="flex-1 bg-pos-bg border border-pos-border rounded-xl px-3 py-1.5 text-xs text-pos-text outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleSearchMember}
                      className="px-3 py-1.5 bg-sky-600 text-white font-bold text-xs rounded-xl"
                    >
                      ค้นหา
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMemberInput(false)}
                      className="px-2 py-1.5 text-pos-text/50 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )
              ) : (
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      VIP
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-pos-text truncate">
                        {selectedMember.name}
                      </p>
                      <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium truncate">
                        เงินในบัตร: {selectedMember.balance.toLocaleString()}{" "}
                        LAK | แต้ม: {selectedMember.points}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="text-xs text-rose-500 font-bold hover:underline px-1 shrink-0"
                  >
                    เปลี่ยน
                  </button>
                </div>
              )}
            </div>

            {/* รายการสินค้า */}
            <div className="p-3 overflow-y-auto custom-scroll space-y-2 flex-1 bg-pos-bg">
              {payingBill.items?.map((subItem: any, idx: number) => {
                const subTitle =
                  subItem.product?.name ||
                  subItem.product?.title ||
                  subItem.name ||
                  "สินค้า";
                const subQty = subItem.quantity || 1;
                const subPrice =
                  subItem.priceAtTime || subItem.product?.price || 0;
                const optionsDisplay = renderOptionsText(
                  subItem.options || subItem.selectedOptions,
                );

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-pos-card border border-pos-border flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-pos-text truncate leading-tight">
                        {subTitle}
                      </h5>
                      {optionsDisplay && (
                        <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium truncate mt-0.5">
                          {optionsDisplay}
                        </p>
                      )}
                      <p className="text-[10px] text-pos-text/50 font-mono mt-0.5">
                        {subPrice.toLocaleString()} LAK × {subQty}
                      </p>
                    </div>
                    <span className="font-mono font-black text-xs text-pos-text shrink-0 bg-pos-surface px-2 py-1 rounded-lg border border-pos-border">
                      {(subPrice * subQty).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* สรุปยอดเงิน */}
            <div className="p-3.5 bg-pos-surface border-t border-pos-border space-y-1.5 shrink-0">
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-rose-500 font-semibold">
                  <span>
                    ส่วนลดสมาชิก ({selectedMember?.discountPercent}%):
                  </span>
                  <span>-{discountAmount.toLocaleString()} LAK</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-pos-text/70">
                  ยอดรวมสุทธิ:
                </span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {netTotal.toLocaleString()}{" "}
                  <span className="text-xs font-normal">LAK</span>
                </span>
              </div>
            </div>
          </div>

          {/* 🌟 ฝั่งขวา: ปุ่มวิธีชำระเงิน 4 ปุ่ม (เพิ่มปุ่มสมาชิก) + Numpad */}
          <div className="w-full md:w-80 flex flex-col justify-between bg-pos-surface p-3.5 gap-3 shrink-0">
            {/* 🌟 ปรับเป็น Grid 4 ช่องทางชำระเงิน */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "CASH", label: "เงินสด", icon: "💵" },
                { id: "QR", label: "สแกน QR", icon: "📱" },
                { id: "CARD", label: "บัตร", icon: "💳" },
                { id: "MEMBER", label: "สมาชิก", icon: "👑" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition ${
                    paymentMethod === m.id
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                      : "bg-pos-bg border-pos-border text-pos-text/70 hover:border-pos-border/80"
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* 1. กรณีชำระเงินสด */}
            {paymentMethod === "CASH" && (
              <div className="space-y-2 flex-1 flex flex-col justify-center">
                <div className="bg-pos-bg p-2.5 rounded-2xl border border-pos-border space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-pos-text/60">
                      รับเงินมา:
                    </span>
                    <span className="text-lg font-black font-mono text-sky-600 dark:text-sky-400">
                      {numReceived > 0 ? numReceived.toLocaleString() : "0"}{" "}
                      <span className="text-xs font-normal">LAK</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-pos-border/50">
                    <span className="text-[11px] font-bold text-pos-text/60">
                      เงินทอน:
                    </span>
                    <span
                      className={`text-base font-black font-mono ${changeAmount > 0 ? "text-amber-500" : "text-pos-text/40"}`}
                    >
                      {changeAmount.toLocaleString()}{" "}
                      <span className="text-xs font-normal">LAK</span>
                    </span>
                  </div>
                </div>

                {/* ปุ่มแบนก์ด่วน */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => handlePresetCash(0, true)}
                    className="py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold text-[10px]"
                  >
                    พอดี
                  </button>
                  {[50000, 100000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetCash(preset)}
                      className="py-1.5 rounded-lg bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-[10px]"
                    >
                      +{(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>

                {/* แป้นพิมพ์ Numpad ตัวเลข */}
                <div className="grid grid-cols-3 gap-1 flex-1">
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "00",
                    "0",
                    "DEL",
                  ].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNumpadPress(key)}
                      className={`py-2 rounded-xl font-mono font-bold text-sm border active:scale-95 transition ${
                        key === "DEL"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                          : "bg-pos-bg border-pos-border text-pos-text hover:bg-pos-hover"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🌟 2. กรณีชำระตัดผ่านบัตรกระเป๋าสมาชิก (MEMBER WALLET) */}
            {paymentMethod === "MEMBER" && (
              <div className="flex-1 flex flex-col justify-center p-3 bg-pos-bg rounded-2xl border border-pos-border gap-2">
                {!selectedMember ? (
                  <div className="text-center py-4 space-y-2">
                    <span className="text-3xl block">👑</span>
                    <p className="font-bold text-xs text-rose-500">
                      โปรดระบุหรือเลือกสมาชิกฝั่งซ้ายก่อนชำระเงิน
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowMemberInput(true)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold"
                    >
                      ค้นหาสมาชิก
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-pos-surface border border-pos-border space-y-1">
                      <p className="text-[10px] text-pos-text/60 font-bold">
                        ตัดเงินจากบัญชีสมาชิก:
                      </p>
                      <p className="font-bold text-xs text-pos-text">
                        {selectedMember.name}
                      </p>
                      <div className="flex justify-between items-center pt-1 border-t border-pos-border/50 text-xs font-mono font-bold">
                        <span className="text-pos-text/60">ยอดเงินในบัตร:</span>
                        <span className="text-emerald-600">
                          {selectedMember.balance.toLocaleString()} LAK
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className="text-pos-text/60">ยอดหักชำระ:</span>
                        <span className="text-rose-500">
                          -{netTotal.toLocaleString()} LAK
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-pos-border/50 text-xs font-mono font-bold">
                        <span className="text-pos-text/60">
                          คงเหลือหลังชำระ:
                        </span>
                        <span
                          className={
                            selectedMember.balance >= netTotal
                              ? "text-sky-600"
                              : "text-rose-500 font-black"
                          }
                        >
                          {(selectedMember.balance - netTotal).toLocaleString()}{" "}
                          LAK
                        </span>
                      </div>
                    </div>

                    {selectedMember.balance < netTotal && (
                      <p className="text-[10px] text-rose-500 font-bold text-center">
                        * ยอดเงินในบัตรสมาชิกไม่เพียงพอ
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. กรณี QR / CARD */}
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

            {/* ปุ่มยืนยันชำระเงิน */}
            <div className="space-y-1">
              {!isCashSufficient && paymentMethod === "CASH" && (
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
