"use client";
import Image from "next/image";

interface ProductCardProps {
  title: string;
  image: string;
  price: number;
  stockText: string;
  optionsText?: string;
  badgeStyle?: "sky" | "pink";
  isSelected?: boolean;
  onAdd?: () => void;
}

export default function ProductCard({
  title,
  image,
  price,
  stockText,
  optionsText,
  badgeStyle = "sky",
  isSelected = false,
  onAdd,
}: ProductCardProps) {
  const isPink = badgeStyle === "pink";

  return (
    <div
      onClick={onAdd}
      // เพิ่ม hover:-translate-y-1 ให้การ์ดลอยขึ้นนิดๆ ตอนเอาเมาส์ชี้ดูมีมิติ
      className={`group relative bg-pos-card rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 ${isSelected
        ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-pos-bg"
        : `border border-pos-border hover:border-${isPink ? "pink" : "sky"}-400/60`
        }`}
    >
      {/* 1. สัดส่วนรูปภาพเปลี่ยนเป็นทรงเรียว (aspect-[4/5] บนมือถือ และ aspect-square บนจอใหญ่) */}
      <div className="relative w-full aspect-[4/5] sm:aspect-square bg-slate-50 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-110'}`}
          priority
        />

        {/* เงาไล่ระดับจากขอบบนและล่าง เพื่อให้ตัวหนังสืออ่านง่ายขึ้น */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-80"></div>

        {/* 2. ป้ายราคาแบบ Glassmorphism (โปร่งใส) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-sm font-bold font-mono tracking-tight rounded-xl shadow-sm backdrop-blur-md border ${isPink
            ? "bg-pink-500/80 border-pink-400/50 text-white"
            : "bg-slate-900/60 border-white/20 text-white"
            }`}>
            {price.toLocaleString()} <span className="text-[9px] font-normal opacity-80">LAK</span>
          </span>
        </div>

        {/* ป้ายกำลังเลือก (Selected) */}
        {isSelected && (
          <span className="absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded-lg bg-sky-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md animate-pulse">
            ✔ เลือกแล้ว
          </span>
        )}

        {/* ป้าย Option (ถ้ามี) */}
        {optionsText && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5">
            <span className={`px-2 py-1 rounded-lg backdrop-blur-md border text-[10px] font-semibold inline-flex items-center gap-1 shadow-sm ${isPink
              ? "bg-pink-50/90 border-pink-200 text-pink-700"
              : "bg-white/90 border-slate-200 text-slate-700"
              }`}>
              {optionsText}
            </span>
          </div>
        )}
      </div>

      {/* 3. ส่วนรายละเอียดสินค้าด้านล่าง (ตัดขอบทิ้ง ให้ดูเนียนไปกับการ์ด) */}
      <div className="p-3 bg-pos-card flex items-center justify-between gap-2 z-10">
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-xs sm:text-sm transition-colors line-clamp-1 ${isSelected
            ? "text-sky-600"
            : `text-pos-text group-hover:text-${isPink ? "pink" : "sky"}-600`
            }`}>
            {title}
          </h3>
          <span className="text-[10px] sm:text-[11px] text-pos-text/50 font-medium line-clamp-1 mt-0.5">
            {stockText}
          </span>
        </div>

        {/* 4. เปลี่ยนปุ่ม + ให้เป็นวงกลมมนๆ ดูเป็นมิตรและโมเดิร์น */}
        <button
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full active:scale-90 text-white flex items-center justify-center font-bold text-base shadow-sm transition-all shrink-0 ${isPink
            ? "bg-pink-500 hover:bg-pink-600 shadow-pink-500/30"
            : "bg-pos-text hover:bg-sky-500 shadow-slate-500/20 hover:shadow-sky-500/30"
            }`}
          title="เพิ่มลงรายการ"
        >
          +
        </button>
      </div>
    </div>
  );
}