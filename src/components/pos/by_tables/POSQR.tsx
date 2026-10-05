"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { holdOrderToDB } from "@/lib/actions/actionsPos";
import {
  OrganizationSettingsProvider,
  useOrgSettings,
} from "@/components/providers/OrganizationSettingsContext";

function POSQRContent({
  categories,
  products,
  orgId,
  tableId,
  tableName,
}: {
  categories: any[];
  products: any[];
  orgId: number;
  tableId?: number;
  tableName?: string;
}) {
  const { settings, formatCurrency } = useOrgSettings();
  const currencyCode = settings?.currencyCode || "LAK";

  const [activeCategory, setActiveCategory] = useState<number | "ALL">("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // State สำหรับระบบค้นหาสินค้า
  const [searchQuery, setSearchQuery] = useState("");

  // State สำหรับ Option Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any[]>>(
    {},
  );

  // State สำหรับ Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);

  // State และ Refs สำหรับปุ่มตะกร้าแบบลากได้
  const [cartPos, setCartPos] = useState({ x: 0, y: 0 });
  const [isDragged, setIsDragged] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, isDragging: false });

  // กรองสินค้าตามหมวดหมู่ และ คำค้นหา
  const filteredProducts = products.filter((p) => {
    const matchCategory =
      activeCategory === "ALL" || p.categoryId === activeCategory;

    if (!searchQuery.trim()) return matchCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchName = p.name?.toLowerCase().includes(q);
    const matchPrice = p.price?.toString().includes(q);
    const matchCode = p.code?.toLowerCase().includes(q);
    const matchBarcode = p.barcode?.toLowerCase().includes(q);

    return (
      matchCategory && (matchName || matchPrice || matchCode || matchBarcode)
    );
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  // แยกรายการสินค้าออกเป็น 2 คอลัมน์ (ซ้าย / ขวา) สำหรับ Masonry Grid
  const leftColumnProducts = displayedProducts.filter((_, i) => i % 2 === 0);
  const rightColumnProducts = displayedProducts.filter((_, i) => i % 2 !== 0);

  useEffect(() => {
    document.title = tableName ? `สั่งอาหาร - ${tableName}` : "สั่งอาหาร";
  }, [tableName]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeCategory, searchQuery]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting) {
      setVisibleCount((prev) => prev + 10);
    }
  }, []);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver, displayedProducts.length]);

  // --- ฟังก์ชันควบคุมการลากปุ่มตะกร้า ---
  const handleDragStart = (clientX: number, clientY: number) => {
    dragRef.current = { startX: clientX, startY: clientY, isDragging: false };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const moveX = Math.abs(clientX - dragRef.current.startX);
    const moveY = Math.abs(clientY - dragRef.current.startY);

    if (moveX > 5 || moveY > 5) {
      dragRef.current.isDragging = true;
      setIsDragged(true);

      let newX = clientX - 32;
      let newY = clientY - 32;
      newX = Math.max(0, Math.min(newX, window.innerWidth - 64));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 64));
      setCartPos({ x: newX, y: newY });
    }
  };

  const handleDragEnd = () => {
    if (!dragRef.current.isDragging) {
      setIsCartOpen(true);
    }
    dragRef.current = { startX: 0, startY: 0, isDragging: false };
  };

  // --- ระบบ Options ---
  const handleAddClick = (product: any) => {
    if (product.optionGroups && product.optionGroups.length > 0) {
      setSelectedProduct(product);
      setSelectedOptions({});
    } else {
      addToCart(product, {}, Number(product.price || 0));
    }
  };

  const handleOptionChange = (group: any, choice: any) => {
    setSelectedOptions((prev) => {
      const newOpts = { ...prev };
      const groupKey = group.id ? String(group.id) : String(group.name);

      const choiceObject = {
        id: choice.id,
        name: choice.name,
        priceAdd: Number(choice.priceAdd || 0),
      };

      if (group.allowMultiple) {
        const currentArr = newOpts[groupKey] || [];
        const exists = currentArr.some((c: any) => c.id === choice.id);
        if (exists) {
          const filtered = currentArr.filter((c: any) => c.id !== choice.id);
          if (filtered.length === 0) {
            delete newOpts[groupKey];
          } else {
            newOpts[groupKey] = filtered;
          }
        } else {
          newOpts[groupKey] = [...currentArr, choiceObject];
        }
      } else {
        newOpts[groupKey] = [choiceObject];
      }
      return newOpts;
    });
  };

  const confirmOptionsAndAdd = () => {
    if (!selectedProduct) return;

    let isValid = true;
    selectedProduct.optionGroups.forEach((group: any) => {
      const groupKey = group.id ? String(group.id) : String(group.name);
      if (group.isRequired) {
        if (
          !selectedOptions[groupKey] ||
          selectedOptions[groupKey].length === 0
        ) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      alert("กรุณาเลือกตัวเลือกที่จำเป็นให้ครบถ้วน");
      return;
    }

    let finalItemPrice = Number(selectedProduct.price || 0);
    Object.values(selectedOptions).forEach((choices: any[]) => {
      if (Array.isArray(choices)) {
        choices.forEach((v) => (finalItemPrice += Number(v.priceAdd || 0)));
      }
    });

    addToCart(selectedProduct, { ...selectedOptions }, finalItemPrice);
    setSelectedProduct(null);
  };

  // --- ระบบตะกร้า ---
  const addToCart = (product: any, optionsMap: any, finalPrice: number) => {
    setCart((prev) => {
      const optionKey = JSON.stringify(optionsMap);
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedOptions) === optionKey,
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const existingItem = updated[existingIdx];
        updated[existingIdx] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          totalPrice: (existingItem.quantity + 1) * finalPrice,
        };
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          totalPrice: finalPrice,
          selectedOptions: optionsMap,
          unitPrice: finalPrice,
        },
      ];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item, i) => {
            if (i === index) {
              const newQty = item.quantity + delta;
              if (newQty <= 0) return null;
              return {
                ...item,
                quantity: newQty,
                totalPrice: newQty * item.unitPrice,
              };
            }
            return item;
          })
          .filter(Boolean) as any[],
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const renderOptionsText = (opts: any) => {
    if (!opts) return "";
    const names: string[] = [];
    Object.values(opts).forEach((val: any) => {
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (v && v.name) names.push(v.name);
        });
      } else if (val && val.name) {
        names.push(val.name);
      }
    });
    return names.join(", ");
  };

  // --- ยืนยันสั่งอาหาร ---
  const handleConfirmOrder = async () => {
    if (cart.length === 0 || !orgId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        organizationId: orgId,
        qrCodeId: tableId || null,
        customerName: tableName
          ? `${tableName} (สแกนสั่ง)`
          : `ทั่วไป (สแกนสั่ง)`,
        createdBy: "QR_ORDER",
        kitchenStatus: "IN_KITCHEN" as const,
        totalAmount: totalPrice,
        netAmount: totalPrice,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceAtTime: item.unitPrice,
          options: JSON.stringify(item.selectedOptions || {}),
          status: "IN_KITCHEN",
        })),
      };

      const res = await holdOrderToDB(payload);

      if (res.success) {
        setIsSuccess(true);
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert("ไม่สามารถส่งออเดอร์ได้ โปรดลองอีกครั้ง");
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการสั่งอาหาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">
          ส่งออเดอร์สำเร็จ!
        </h1>
        <p className="text-slate-500 mb-8 font-medium">
          รายการอาหารของคุณถูกส่งไปยังห้องครัวแล้ว
          <br />
          กรุณารอรับอาหารที่โต๊ะ
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition active:scale-95"
        >
          สั่งอาหารเพิ่มเติม
        </button>
      </div>
    );
  }

  let currentOptionPrice = 0;
  if (selectedProduct) {
    Object.values(selectedOptions).forEach((choices: any[]) => {
      if (Array.isArray(choices)) {
        choices.forEach((v) => (currentOptionPrice += Number(v.priceAdd || 0)));
      }
    });
  }

  // 🌟 Component ย่อยสำหรับเรนเดอร์ Card
  const renderProductCard = (p: any, index: number) => (
    <div
      key={p.id}
      onClick={() => handleAddClick(p)}
      style={{
        animationDelay: `${(index % 10) * 40}ms`,
      }}
      className="group relative rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 border border-white/40 pt-20 sm:pt-24 pb-4 px-3.5 flex flex-col justify-between items-center min-h-[210px] sm:min-h-[240px] cursor-pointer transition-all duration-300 ease-out active:scale-[0.98] animate-in fade-in slide-in-from-bottom-5 fill-mode-backwards z-0"
    >
      {/* 🌟 พื้นหลัง Card แบบเบลอสีเดียวกับรูปภาพ (Glassmorphism Tint) */}
      <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none -z-10 shadow-inner">
        {p.image ? (
          <>
            <img
              src={p.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-50 blur-2xl scale-125 saturate-200"
            />
            {/* ซ้อนสีขาวทับนิดนึงเพื่อให้ข้อความอ่านง่าย */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
          </>
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}
      </div>

      {/* 🌟 1. กรอบวงกลม + รูปภาพสินค้า (ใช้ w-full h-full เต็มกรอบวงกลม) */}
      <div className="absolute -top-20 sm:-top-24 w-40 h-40 sm:w-44 sm:h-44 bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 z-10 border border-white">
        <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 relative">
          {p.image ? (
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <svg
              className="w-12 h-12 opacity-30 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        {/* 🌟 2. Badge ตัวเลือก วงกลมลอยมุมขวาบนของขอบวงกลม */}
        {p.optionGroups && p.optionGroups.length > 0 && (
          <div
            className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full p-1 shadow-md border border-slate-100 flex items-center justify-center text-sky-500 font-bold"
            title="มีตัวเลือกเพิ่มเติม"
          >
            <svg
              className="w-4 h-4 sm:w-4.5 sm:h-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 🌟 3. ชื่อสินค้าจัดวางกึ่งกลาง */}
      <div className="w-full flex-1 flex items-center justify-center my-1 pt-2 relative z-10">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 text-center line-clamp-2 leading-snug transition-colors group-hover:text-sky-700">
          {p.name}
        </h3>
      </div>

      {/* 🌟 4. สรุปราคาสินค้า + ปุ่มเพิ่มรายการ */}
      <div className="w-full pt-2.5 border-t border-slate-300/40 flex items-center justify-between mt-auto relative z-10">
        <div className="flex flex-col">
          <span className="text-slate-900 font-black text-sm sm:text-base tracking-tight leading-none drop-shadow-sm">
            {p.price.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-600 font-bold mt-0.5">
            {currencyCode}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddClick(p);
          }}
          className="w-8 h-8 rounded-full bg-slate-900 text-white group-hover:bg-sky-500 flex items-center justify-center transition-all duration-300 shadow-md active:scale-90 shrink-0 border border-white/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
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
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-safe relative overflow-x-hidden scroll-smooth transition-all">
      {/* 🌟🌟🌟 Header: Minimal Search Bar & Table Tag 🌟🌟🌟 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 flex items-center gap-3 transition-all">
        {/* ช่องค้นหาสินค้า สไตล์ Minimal */}
        <div className="relative flex-1 flex items-center group">
          <svg
            className="absolute left-4 w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 focus:bg-white focus:border-slate-300 focus:shadow-sm rounded-full text-sm font-medium text-slate-700 transition-all outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 w-6 h-6 rounded-full bg-slate-200/50 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* ป้ายชื่อโต๊ะ สไตล์ Minimal */}
        {tableName && (
          <div className="shrink-0 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-full shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse"></span>
            โต๊ะ {tableName}
          </div>
        )}
      </div>

      {/* หมวดหมู่สินค้า */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 overflow-x-auto flex flex-nowrap gap-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`shrink-0 px-5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-300 ${
            activeCategory === "ALL"
              ? "bg-slate-900 text-white shadow-md scale-105"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          ทั้งหมด
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat.id
                ? "bg-slate-900 text-white shadow-md scale-105"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 🌟 รายการสินค้า Masonry Grid */}
      {displayedProducts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 animate-in fade-in duration-300">
          <svg
            className="w-16 h-16 mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-bold text-sm">ไม่พบสินค้าที่ค้นหา</p>
        </div>
      ) : (
        <div className="p-3.5 pt-28 pb-24 grid grid-cols-2 gap-4 sm:gap-6 transition-all duration-500">
          {/* คอลัมน์ซ้าย */}
          <div className="flex flex-col gap-24 sm:gap-28">
            {leftColumnProducts.map((p, index) =>
              renderProductCard(p, index * 2),
            )}
          </div>

          {/* คอลัมน์ขวา (เยื้องสลับระดับลงมา pt-16 sm:pt-20) */}
          <div className="flex flex-col gap-24 sm:gap-28 pt-16 sm:pt-20">
            {rightColumnProducts.map((p, index) =>
              renderProductCard(p, index * 2 + 1),
            )}
          </div>
        </div>
      )}

      {/* Loader สำหรับ Infinite Scroll */}
      {visibleCount < filteredProducts.length && (
        <div
          ref={loaderRef}
          className="py-8 flex justify-center items-center animate-in fade-in duration-300"
        >
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm text-slate-500 text-xs font-bold border border-slate-100/80">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
            กำลังโหลดเมนูเพิ่มเติม...
          </div>
        </div>
      )}

      {/* Modal เลือก Options */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedProduct(null)}
          />

          <div className="bg-white w-full rounded-t-[32px] shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-black text-slate-800 line-clamp-1 pr-4">
                {selectedProduct.name}
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scroll flex-1 bg-slate-50/50">
              {selectedProduct.optionGroups.map((group: any) => {
                const groupKey = group.id
                  ? String(group.id)
                  : String(group.name);

                return (
                  <div
                    key={group.id || group.name}
                    className="mb-5 bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm"
                  >
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">
                          {group.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {group.allowMultiple
                            ? "เลือกได้หลายข้อ"
                            : "เลือกได้ 1 ข้อ"}{" "}
                          {group.isRequired && (
                            <span className="text-rose-500 font-bold ml-1">
                              *จำเป็น
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.choices.map((choice: any) => {
                        const currentSelections =
                          selectedOptions[groupKey] || [];
                        const isSelected = currentSelections.some(
                          (c: any) => c.id === choice.id,
                        );

                        return (
                          <div
                            key={choice.id}
                            onClick={() => handleOptionChange(group, choice)}
                            className={`flex justify-between items-center p-3.5 rounded-[16px] border transition-all cursor-pointer active:scale-[0.98] ${
                              isSelected
                                ? "border-slate-800 bg-slate-50 shadow-sm"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 flex items-center justify-center border transition-colors ${group.allowMultiple ? "rounded-md" : "rounded-full"} ${isSelected ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300"}`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="3"
                                      d="M5 13l4 4L19 7"
                                    ></path>
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`text-sm font-semibold ${isSelected ? "text-slate-900" : "text-slate-600"}`}
                              >
                                {choice.name}
                              </span>
                            </div>
                            {Number(choice.priceAdd) > 0 && (
                              <span className="text-[11px] font-bold text-slate-500">
                                +{formatCurrency(Number(choice.priceAdd))}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-slate-100 bg-white shrink-0 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="font-semibold text-sm text-slate-500">
                  ราคารวม
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(selectedProduct.price + currentOptionPrice)}
                </span>
              </div>
              <button
                onClick={confirmOptionsAndAdd}
                className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ปุ่มตะกร้าลอย สไตล์ Minimal */}
      {totalItems > 0 && !isCartOpen && (
        <div
          className={`fixed z-40 touch-none shadow-2xl shadow-slate-900/20 transition-transform ${
            !isDragged ? "bottom-8 right-6 animate-bounce-short" : ""
          }`}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#0f172a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            ...(isDragged
              ? { left: `${cartPos.x}px`, top: `${cartPos.y}px` }
              : {}),
          }}
          onTouchStart={(e) =>
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchMove={(e) =>
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleDragMove(e.clientX, e.clientY);
          }}
          onMouseUp={handleDragEnd}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div className="absolute -top-1 -right-1 bg-white text-slate-900 text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
            {totalItems > 99 ? "99+" : totalItems}
          </div>
        </div>
      )}

      {/* Modal ตะกร้าสินค้า */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isSubmitting && setIsCartOpen(false)}
          />

          <div className="bg-white w-full rounded-t-[32px] shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 duration-300 max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  ตะกร้าอาหาร
                </h2>
                {tableName && (
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    สั่งสำหรับโต๊ะ{" "}
                    <span className="text-slate-800 font-bold">
                      {tableName}
                    </span>
                  </p>
                )}
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scroll flex-1 space-y-3 bg-slate-50">
              {cart.map((item, index) => {
                const optText = renderOptionsText(item.selectedOptions);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center gap-3 bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                        {item.product.name}
                      </h4>
                      {optText && (
                        <p className="text-[10px] text-slate-600 mt-1 line-clamp-1 bg-slate-100 px-2 py-0.5 rounded inline-block font-medium">
                          {optText}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-semibold mt-1.5">
                        {formatCurrency(item.totalPrice / item.quantity)} / ชิ้น
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100/50 rounded-full p-1 border border-slate-200 shrink-0">
                      <button
                        disabled={isSubmitting}
                        onClick={() => updateQty(index, -1)}
                        className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center font-black text-slate-600 active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        disabled={isSubmitting}
                        onClick={() => updateQty(index, 1)}
                        className="w-8 h-8 bg-slate-900 rounded-full shadow-sm flex items-center justify-center font-black text-white active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ยอดรวมในตะกร้า */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-5 px-1">
                <span className="font-semibold text-sm text-slate-500">
                  ยอดรวมทั้งหมด
                </span>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {totalPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1">
                    {currencyCode}
                  </span>
                </div>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-sm shadow-xl shadow-slate-900/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังส่งออเดอร์...
                  </div>
                ) : (
                  "ส่งออเดอร์เข้าครัว"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function POSQR(props: {
  categories: any[];
  products: any[];
  orgId: number;
  tableId?: number;
  tableName?: string;
}) {
  return (
    <OrganizationSettingsProvider organizationId={props.orgId}>
      <POSQRContent {...props} />
    </OrganizationSettingsProvider>
  );
}
