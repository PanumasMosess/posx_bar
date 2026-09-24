"use client";

import { ProductOptionModalProps } from "@/lib/interface";
import { useState } from "react";
import Image from "next/image";

export default function ProductOptionModal({
  product,
  onClose,
  onConfirm,
}: ProductOptionModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any[]>>(
    {},
  );

  const handleToggle = (group: any, choice: any) => {
    const current = selectedOptions[group.id] || [];
    if (group.allowMultiple) {
      const exists = current.some((c) => c.id === choice.id);
      setSelectedOptions({
        ...selectedOptions,
        [group.id]: exists
          ? current.filter((c) => c.id !== choice.id)
          : [...current, choice],
      });
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [group.id]: [choice],
      });
    }
  };

  // คำนวณราคาบวกเพิ่มของ Option
  const extraPrice = Object.values(selectedOptions)
    .flat()
    .reduce((sum, choice) => sum + Number(choice.priceAdd || 0), 0);

  const totalPrice = Number(product.price) + extraPrice;

  // ตรวจสอบเงื่อนไขกลุ่มที่บังคับเลือก (isRequired)
  const isReady = product.optionGroups.every((group: any) => {
    if (group.isRequired) {
      return selectedOptions[group.id] && selectedOptions[group.id].length > 0;
    }
    return true;
  });

  const handleSubmit = () => {
    onConfirm({
      product,
      quantity: 1,
      selectedOptions,
      totalPrice,
    });
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto bg-pos-surface rounded-3xl shadow-2xl border border-pos-border w-full max-w-md overflow-hidden animate-slide-up flex flex-col max-h-[85vh] transition-colors">
          {/* 🌟 1. Header Hero Section (รูปลางๆ คมชัด ภาพไม่แตก) */}
          <div className="relative w-full h-32 sm:h-36 bg-pos-bg shrink-0 overflow-hidden flex items-center justify-center border-b border-pos-border">
            {product.image ? (
              <>
                {/* Background เบลอจางๆ ด้านหลังกันภาพแตก */}
                <Image
                  src={product.image}
                  alt=""
                  fill
                  className="object-cover blur-md scale-110 opacity-30"
                  aria-hidden="true"
                />
                {/* รูปภาพจริงตรงกลาง ไม่แตก คมชัด */}
                <div className="relative w-full h-full p-2">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain drop-shadow-md opacity-85"
                    priority
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-pos-text/30 gap-1">
                <svg
                  className="w-10 h-10 opacity-20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                  />
                </svg>
              </div>
            )}

            {/* Gradient Overlay ปรับให้โทนมืดลางๆ อ่านข้อความง่าย */}
            <div className="absolute inset-0 bg-gradient-to-t from-pos-surface via-pos-surface/60 to-transparent" />

            {/* ปุ่มปิด (Close Button) */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-pos-bg/80 hover:bg-pos-hover text-pos-text border border-pos-border flex items-center justify-center transition-transform active:scale-90 shadow-sm"
              title="ปิด"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* ข้อมูลสินค้าหลักบน Header */}
            <div className="absolute bottom-2.5 left-4 right-4 z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                {product.category?.name || "รายการสินค้า"}
              </span>
              <h2 className="font-bold text-base sm:text-lg leading-snug truncate mt-0.5 text-pos-text">
                {product.name}
              </h2>
              <p className="text-xs font-mono font-semibold text-pos-text/60">
                ราคาเริ่มต้น {Number(product.price).toLocaleString()} LAK
              </p>
            </div>
          </div>

          {/* 🌟 2. Body List: กลุ่มตัวเลือก (Option Groups) */}
          <div className="p-4 overflow-y-auto space-y-5 flex-1 custom-scroll bg-pos-bg">
            {product.optionGroups.map((group: any) => {
              const currentSelected = selectedOptions[group.id] || [];
              const hasSelected = currentSelected.length > 0;

              return (
                <div key={group.id} className="space-y-2">
                  {/* Header รายกลุ่ม */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-pos-text">
                        {group.name}
                      </span>
                      {group.allowMultiple && (
                        <span className="text-[10px] font-medium text-pos-text/50">
                          (เลือกได้หลายรายการ)
                        </span>
                      )}
                    </div>

                    {/* Badge แสดงสถานะการเลือก */}
                    {group.isRequired ? (
                      hasSelected ? (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          เลือกแล้ว
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          * จำเป็นต้องเลือก
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-pos-text/40">
                        ไม่บังคับ
                      </span>
                    )}
                  </div>

                  {/* รายการ Choices */}
                  <div className="grid grid-cols-1 gap-2">
                    {group.choices.map((choice: any) => {
                      const isSelected = currentSelected.some(
                        (c) => c.id === choice.id,
                      );
                      const priceAdd = Number(choice.priceAdd || 0);

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleToggle(group, choice)}
                          className={`p-3 rounded-2xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.99] select-none ${
                            isSelected
                              ? "bg-sky-500/10 border-sky-500 text-pos-text font-bold shadow-2xs"
                              : "bg-pos-surface border-pos-border text-pos-text/80 hover:border-pos-border/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Radio / Checkbox Indicator Icon */}
                            <div
                              className={`w-4 h-4 rounded-${
                                group.allowMultiple ? "md" : "full"
                              } border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-sky-600 border-sky-600 text-white"
                                  : "border-pos-border bg-pos-bg"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                              )}
                            </div>
                            <span>{choice.name}</span>
                          </div>

                          {/* ราคาบวกเพิ่ม */}
                          {priceAdd > 0 ? (
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                                  : "bg-pos-bg text-pos-text/60 border border-pos-border"
                              }`}
                            >
                              +{priceAdd.toLocaleString()} LAK
                            </span>
                          ) : (
                            <span className="text-[11px] text-pos-text/40 font-medium">
                              ฟรี
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🌟 3. Footer Section (ปุ่มยืนยันพร้อมสรุปยอดเงินรวม) */}
          <div className="p-4 bg-pos-surface border-t border-pos-border flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-pos-text/60 block">
                ราคารวมสุทธิ
              </span>
              <div className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 leading-tight truncate">
                {totalPrice.toLocaleString()}{" "}
                <span className="text-xs font-bold">LAK</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReady}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:brightness-105 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
            >
              <span>เพิ่มลงออเดอร์</span>
              <svg
                className="w-4 h-4 stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
