"use client";

import { ProductCardProps } from "@/lib/interface";
import Image from "next/image";

export default function ProductCard({
  product,
  isSelected = false,
  onAdd,
  onEdit,
}: ProductCardProps) {
  const hasOptions = product.optionGroups && product.optionGroups.length > 0;
  const numericPrice = Number(product.price || 0);

  return (
    <div
      onClick={onAdd}
      className={`group relative bg-pos-surface rounded-2xl p-2 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 select-none ${
        isSelected
          ? "ring-2 ring-sky-500 border-transparent shadow-sky-500/20"
          : "border border-pos-border hover:border-sky-500/40"
      }`}
    >
      {/* 🌟 1. ส่วนแสดงรูปภาพสินค้าเต็มรูป ไม่ตัดขอบ (Object Contain) */}
      <div className="relative w-full aspect-square bg-pos-bg rounded-xl overflow-hidden flex items-center justify-center border border-pos-border/30">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            /* 🌟 ใช้ object-contain พร้อม p-2 ให้เห็นรูปครบสมบูรณ์ทุกสัดส่วนโดยไม่โดนตัด */
            className={`object-contain p-2 transition-transform duration-300 ease-out ${
              isSelected ? "scale-105" : "group-hover:scale-108"
            }`}
            priority
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-pos-text/30 gap-1 w-full h-full">
            <svg
              className="w-8 h-8 opacity-30"
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
            <span className="text-[9px] font-bold tracking-wider opacity-50">
              NO IMAGE
            </span>
          </div>
        )}

        {/* 🌟 ป้ายราคา Glassmorphism ลอยมุมซ้ายบน */}
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2.5 py-1 text-xs font-black font-mono tracking-tight rounded-xl bg-slate-900/80 backdrop-blur-md text-white border border-white/20 shadow-md flex items-center gap-1">
            {numericPrice.toLocaleString()}
            <span className="text-[9px] font-normal text-slate-300">LAK</span>
          </span>
        </div>

        {/* 🌟 ปุ่มแก้ไขสินค้า (ดินสอ) ลอยมุมขวาบน */}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-xl bg-slate-900/60 hover:bg-sky-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 shadow-md"
            title="แก้ไขสินค้า"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        )}

        {/* 🌟 ป้ายแสดงสถานะมีตัวเลือกเสริม */}
        {hasOptions && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-lg bg-sky-500/90 backdrop-blur-md text-white text-[9px] font-bold shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              มีตัวเลือก
            </span>
          </div>
        )}
      </div>

      {/* 🌟 2. ส่วนข้อมูลสินค้าและปุ่มแอกชันด้านล่าง */}
      <div className="pt-2.5 px-1 flex items-center justify-between gap-2 z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 truncate uppercase tracking-wider mb-0.5">
            {product.category?.name || "ทั่วไป"}
          </p>
          <h3
            className={`font-bold text-xs sm:text-sm truncate transition-colors leading-snug ${
              isSelected
                ? "text-sky-600 dark:text-sky-400"
                : "text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400"
            }`}
          >
            {product.name}
          </h3>
        </div>

        {/* ปุ่มกดสั่งซื้อ (+) */}
        <button
          type="button"
          className="w-8 h-8 rounded-xl bg-pos-bg group-hover:bg-gradient-to-tr group-hover:from-sky-600 group-hover:to-cyan-500 group-hover:text-white border border-pos-border group-hover:border-transparent text-pos-text active:scale-90 flex items-center justify-center font-bold text-lg shadow-2xs transition-all shrink-0"
          title="เพิ่มลงรายการ"
        >
          +
        </button>
      </div>
    </div>
  );
}
