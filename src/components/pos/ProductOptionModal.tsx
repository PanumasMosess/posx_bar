"use client";

import { ProductOptionModalProps } from "@/lib/interface";
import { useState } from "react";
import Image from "next/image";
import { useOrgSettings } from "../providers/OrganizationSettingsContext";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function ProductOptionModal({
  product,
  onClose,
  onConfirm,
}: ProductOptionModalProps) {
  const { t } = useTranslation();
  // 🌟 ดึงค่าการตั้งค่าองค์กรและฟังก์ชันฟอร์แมตเงินจาก Context
  const { settings, formatCurrency } = useOrgSettings();
  const currencyCode = settings?.currencyCode || "LAK";

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="fixed inset-0 -z-10"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="bg-pos-surface border border-pos-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200">
          {/* 🌟 1. Header: รูปภาพและข้อมูลสินค้า */}
          <div className="relative bg-pos-bg shrink-0 border-b border-pos-border overflow-hidden">
            {/* กล่องแสดงภาพสินค้า */}
            <div className="relative w-full h-44 sm:h-48 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover blur-md opacity-30 scale-110"
                    priority
                  />
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-4 drop-shadow-md z-10"
                    priority
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-pos-text/30 gap-1.5 z-10">
                  <svg
                    className="w-10 h-10 opacity-40"
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
                  <span className="text-[10px] font-bold tracking-wider opacity-60">
                    NO IMAGE
                  </span>
                </div>
              )}

              {/* Gradient Mask Overlay ด้านล่าง Header */}
              <div className="absolute inset-0 bg-gradient-to-t from-pos-surface via-pos-surface/60 to-transparent" />
            </div>

            {/* ปุ่มปิด Modal (X) */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-pos-bg/80 hover:bg-pos-hover text-pos-text border border-pos-border flex items-center justify-center transition-transform active:scale-90 shadow-sm"
              title={t("common.close")}
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
                {product.category?.name || t("pos.items_unit")}
              </span>
              <h2 className="font-bold text-base sm:text-lg leading-snug truncate mt-0.5 text-pos-text">
                {product.name}
              </h2>
              <p className="text-xs font-mono font-semibold text-pos-text/60">
                {t("pos.starting_price")} {formatCurrency(Number(product.price))}
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
                          ({t("pos.multiple_choice")})
                        </span>
                      )}
                    </div>

                    {/* Badge แสดงสถานะการเลือก */}
                    {group.isRequired ? (
                      hasSelected ? (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          {t("pos.selected")}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          * {t("pos.required")}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-pos-text/40">
                        {t("pos.optional")}
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
                              +{priceAdd.toLocaleString()} {currencyCode}
                            </span>
                          ) : (
                            <span className="text-[11px] text-pos-text/40 font-medium">
                              {t("pos.free")}
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
                {t("cart.total")}
              </span>
              <div className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 leading-tight truncate">
                {totalPrice.toLocaleString()}{" "}
                <span className="text-xs font-bold">{currencyCode}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReady}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:brightness-105 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
            >
              <span>{t("pos.add_to_order")}</span>
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
