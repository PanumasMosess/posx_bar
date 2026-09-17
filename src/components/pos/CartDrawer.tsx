"use client";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "./CartContext"; // นำเข้า context

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function CartDrawer({ isOpen, onClose, onOpen }: CartDrawerProps) {
  const { cart, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart, holdBill, heldBills, resumeBill, deleteBill, checkoutBill } = useCart();
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [showHeld, setShowHeld] = useState(false);
  // billId ที่กำลังจ่าย (เปิด modal)
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const payingBill = heldBills.find((b) => b.id === payingBillId) ?? null;

  return (
    <>
      {/* 1. Mobile Bottom Floating Bar */}
      <div className="lg:hidden absolute bottom-14 md:bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-pos-surface/95 backdrop-blur-md border-t border-pos-border z-20 shadow-lg transition-colors duration-300">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onOpen}>
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-black border border-white">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <span className="text-[11px] text-pos-text/70 font-medium">รวม {totalItems} รายการ</span>
              <div className="text-base font-black font-mono text-sky-600 dark:text-sky-400 leading-tight">
                {totalPrice.toLocaleString()} <span className="text-[10px] font-medium text-pos-text/60">LAK</span>
              </div>
            </div>
          </div>
          <button onClick={onOpen} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition">
            ดูตะกร้า / ชำระเงิน
          </button>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity" onClick={onClose}></div>}

      {/* 2. Side Panel */}
      <aside className={`${isOpen ? "flex" : "hidden"} lg:flex fixed lg:static top-0 right-0 h-full w-full sm:w-96 lg:w-80 xl:w-96 bg-pos-surface border-l border-pos-border shrink-0 select-none shadow-2xl lg:shadow-none flex-col z-50 transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className="p-3.5 border-b border-pos-border flex items-center justify-between bg-pos-surface transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pos-highlight flex items-center justify-center text-sky-600 dark:text-sky-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-pos-text flex items-center gap-1.5 transition-colors">
                <span>รายการออเดอร์</span>
                <span className="px-1.5 py-0.2 rounded-full bg-pos-highlight text-sky-700 dark:text-sky-300 text-[11px] font-bold">{totalItems}</span>
              </h3>
              <p className="text-[11px] text-pos-text/60 font-medium transition-colors">บิล #0024 • โต๊ะ A1</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* ปุ่มล้างบิล เรียก clearCart() */}
            <button onClick={clearCart} className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/20 transition">
              ล้างบิล
            </button>
            <button className="lg:hidden w-8 h-8 rounded-lg bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center transition-colors" onClick={onClose}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path></svg></button>
          </div>
        </div>

        {/* Service Mode Toggle */}
        <div className="px-3.5 pt-3 pb-1 bg-pos-surface transition-colors">
          <div className="flex w-full bg-pos-bg border border-pos-border p-1 rounded-xl shrink-0 transition-colors">
            <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-pos-text bg-pos-surface shadow-xs flex items-center justify-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.651V9.35" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <span>หน้าร้าน</span>
            </button>
            <button className="flex-1 py-1.5 rounded-lg text-xs font-medium text-pos-text/60 hover:text-pos-text flex items-center justify-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a.75.75 0 00-.75-.75H3.75a.75.75 0 00-.75.75v10.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <span>เดลิเวอรี่</span>
            </button>
          </div>
        </div>

        {/* 3. รายการสินค้าในตะกร้า */}
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2.5 bg-pos-bg transition-colors">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-pos-text/40 gap-2">
              <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <p className="text-sm font-medium">ยังไม่มีสินค้าในตะกร้า</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-pos-card border border-pos-border hover:border-sky-400 shadow-xs transition-colors flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2.5">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-pos-border bg-pos-surface">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-pos-text">{item.title}</h4>
                      {item.optionsText && <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">{item.optionsText}</p>}
                    </div>
                  </div>
                  {/* ปุ่มลบรายการ */}
                  <button onClick={() => removeFromCart(item.id)} className="text-pos-text/40 hover:text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-pos-border transition-colors">
                  {/* ปุ่มลด/เพิ่มจำนวน */}
                  <div className="flex items-center bg-pos-bg border border-pos-border rounded-lg p-0.5 transition-colors">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-pos-surface hover:bg-pos-hover text-xs font-bold text-pos-text active:scale-90">-</button>
                    <span className="w-7 text-center font-mono text-xs font-bold text-pos-text">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded bg-pos-surface hover:bg-pos-hover text-xs font-bold text-pos-text active:scale-90">+</button>
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-pos-text transition-colors">
                    {(item.price * item.quantity).toLocaleString()} <span className="text-xs text-pos-text/60 font-normal">LAK</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 4. สรุปยอดเงิน และปุ่ม Action */}
        <div className="p-3.5 bg-pos-surface border-t border-pos-border space-y-3 shrink-0 transition-colors">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-pos-text/70 font-medium">
              <span>ยอดรวมสินค้า</span>
              <span className="font-mono text-pos-text font-semibold">{totalPrice.toLocaleString()} LAK</span>
            </div>
            <div className="flex justify-between text-pos-text/70 font-medium">
              <span>ภาษีมูลค่าเพิ่ม (VAT 0%)</span>
              <span className="font-mono text-pos-text font-semibold">0 LAK</span>
            </div>
            <div className="pt-2 border-t border-pos-border flex justify-between items-baseline">
              <span className="text-sm font-bold text-pos-text">ยอดสุทธิ</span>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 tracking-tight">{totalPrice.toLocaleString()}</span>
                <span className="text-xs font-semibold text-pos-text/60 ml-1">LAK</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* ปุ่มพักบิล — เปิด panel ได้เสมอ */}
            <button
              onClick={() => setShowHeld(true)}
              className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-700 flex items-center justify-center gap-1.5 transition-colors active:scale-95 relative"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>พักบิล</span>
              {heldBills.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-black">
                  {heldBills.length}
                </span>
              )}
            </button>
            <button className="py-2 px-2.5 rounded-xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-xs font-bold text-pos-text flex items-center justify-center gap-1.5 transition-colors active:scale-95">
              <svg className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0v8.25m0-8.25h16.5m0 0a2.25 2.25 0 012.25 2.25v8.25" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>แยกบิล</span>
            </button>
          </div>

          {/* Main Checkout Button */}
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:brightness-105 active:scale-98 text-white font-black text-sm tracking-wide shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition">
            <span>ชำระเงิน (F12)</span>
            <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>
      </aside>

      {/* ===== HeldBills Panel ===== */}
      {showHeld && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[60]"
            onClick={() => setShowHeld(false)}
          />
          {/* panel */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-pos-surface border-l border-pos-border shadow-2xl z-[70] flex flex-col animate-slide-in-right">
            {/* header */}
            <div className="p-4 border-b border-pos-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-pos-text">บิลที่พักไว้</h3>
                  <p className="text-[11px] text-pos-text/60">{heldBills.length} บิลรอดำเนินการ</p>
                </div>
              </div>
              <button
                onClick={() => setShowHeld(false)}
                className="w-8 h-8 rounded-lg bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2.5">
              {heldBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-pos-text/40 gap-2">
                  <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <p className="text-sm font-medium">ไม่มีบิลที่พักไว้</p>
                </div>
              ) : (
                heldBills.map((bill) => (
                  <div key={bill.id} className="p-3 rounded-xl bg-pos-card border border-pos-border shadow-xs space-y-2">
                    {/* bill header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-pos-text">{bill.label}</p>
                        <p className="text-[11px] text-pos-text/60">
                          {bill.items.length} รายการ •{" "}
                          {bill.heldAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className="font-mono font-black text-sm text-sky-600">
                        {bill.totalPrice.toLocaleString()}
                        <span className="text-[10px] font-normal text-pos-text/60 ml-0.5">LAK</span>
                      </span>
                    </div>

                    {/* items preview */}
                    <div className="space-y-1">
                      {bill.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-[11px] text-pos-text/70">
                          <div className="relative w-6 h-6 rounded bg-pos-bg border border-pos-border overflow-hidden shrink-0">
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                          </div>
                          <span className="truncate flex-1">{item.title}</span>
                          <span className="font-mono shrink-0">x{item.quantity}</span>
                        </div>
                      ))}
                      {bill.items.length > 3 && (
                        <p className="text-[10px] text-pos-text/40 pl-8">+{bill.items.length - 3} รายการอื่นๆ</p>
                      )}
                    </div>

                    {/* actions — 3 ปุ่ม */}
                    <div className="flex gap-1.5 pt-2 border-t border-pos-border">
                      {/* ชำระเงินโดยตรง — primary */}
                      <button
                        onClick={() => setPayingBillId(bill.id)}
                        className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-sm shadow-emerald-500/20"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        ชำระเงิน
                      </button>
                      {/* คืนบิล */}
                      <button
                        onClick={() => { resumeBill(bill.id); setShowHeld(false); }}
                        className="flex-1 py-1.5 rounded-lg bg-pos-bg hover:bg-pos-hover border border-pos-border text-xs font-semibold text-pos-text flex items-center justify-center gap-1 active:scale-95 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        คืนบิล
                      </button>
                      {/* ลบ */}
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="w-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-500 flex items-center justify-center active:scale-95 transition-colors"
                        title="ลบบิลนี้ทิ้ง"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ปุ่มเปิดบิลพักใหม่จาก cart ปัจจุบัน */}
            {cart.length > 0 && (
              <div className="p-3 border-t border-pos-border shrink-0">
                <button
                  onClick={() => { holdBill(); }}
                  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  พักบิลปัจจุบัน
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== Payment Modal ===== */}
      {payingBill && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
            onClick={() => setPayingBillId(null)}
          />
          {/* modal */}
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm bg-pos-surface rounded-2xl shadow-2xl border border-pos-border pointer-events-auto animate-slide-in-right overflow-hidden">
              {/* modal header */}
              <div className="p-4 border-b border-pos-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-pos-text">ชำระเงิน</h3>
                    <p className="text-[11px] text-pos-text/60">{payingBill.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPayingBillId(null)}
                  className="w-8 h-8 rounded-lg bg-pos-bg hover:bg-pos-hover text-pos-text flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </button>
              </div>

          {/* Numeric keypad for cash input */}
          <div className="p-4 border-b border-pos-border">
            <div className="text-sm mb-2 text-pos-text">จำนวนเงินที่รับ (LAK)</div>
            <div className="text-2xl font-mono text-pos-text mb-2">{paidAmount || '0'}</div>
            <div className="grid grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9","0","C","←"].map((key) => (
                <button
                  key={key}
                  type="button"
                  className="py-2 rounded bg-pos-bg hover:bg-pos-hover border border-pos-border text-pos-text"
                  onClick={() => {
                    if (key === "C") {
                      setPaidAmount('');
                    } else if (key === "←") {
                      setPaidAmount((prev) => prev.slice(0, -1));
                    } else {
                      setPaidAmount((prev) => (prev + key).replace(/^0+(?!$)/, ''));
                    }
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
              {/* items summary */}
              <div className="p-4 space-y-1.5 max-h-48 overflow-y-auto custom-scroll">
                {payingBill.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-pos-text">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-pos-bg border border-pos-border flex items-center justify-center font-mono font-bold text-[10px] text-pos-text/70">{item.quantity}</span>
                      <span className="truncate max-w-[140px]">{item.title}</span>
                    </div>
                    <span className="font-mono font-semibold shrink-0">{(item.price * item.quantity).toLocaleString()} LAK</span>
                  </div>
                ))}
              </div>

              {/* total */}
              <div className="px-4 py-3 bg-pos-bg border-y border-pos-border flex items-baseline justify-between">
                <span className="text-sm font-bold text-pos-text">ยอดสุทธิ</span>
                <div>
                  <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">{payingBill.totalPrice.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-pos-text/60 ml-1">LAK</span>
                </div>
              </div>

              {/* payment methods */}
              <div className="p-4 space-y-3">
                <p className="text-[11px] font-bold text-pos-text/50 uppercase tracking-wider">วิธีชำระเงิน</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "เงินสด", icon: "💵", color: "emerald" },
                    { label: "QR Code", icon: "📱", color: "sky" },
                    { label: "โอน", icon: "🏦", color: "violet" },
                  ].map((method) => (
                    <button
                      key={method.label}
                      onClick={() => {
                        checkoutBill(payingBill.id);
                        setPayingBillId(null);
                        setShowHeld(false);
                      }}
                      className="py-2.5 rounded-xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-xs font-semibold text-pos-text flex flex-col items-center gap-1 transition-colors active:scale-95"
                    >
                      <span className="text-lg">{method.icon}</span>
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>

                {/* confirm button */}
                <button
                  onClick={() => {
                    checkoutBill(payingBill.id);
                    setPayingBillId(null);
                    setShowHeld(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 active:scale-98 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  ยืนยันชำระเงิน
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}