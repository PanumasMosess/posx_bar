"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { holdOrderToDB } from "@/lib/actions/actionsPos";

export default function POSQR({
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
  const [activeCategory, setActiveCategory] = useState<number | "ALL">("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  // กรองสินค้าตามหมวดหมู่
  const filteredProducts =
    activeCategory === "ALL"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  // เปลี่ยนชื่อ Tab (Title) ตามโต๊ะ
  useEffect(() => {
    document.title = tableName ? `สั่งอาหาร - ${tableName}` : "สั่งอาหาร";
  }, [tableName]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeCategory]);

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

      let newX = clientX - 30;
      let newY = clientY - 30;
      newX = Math.max(0, Math.min(newX, window.innerWidth - 60));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 60));
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
          className="px-8 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/30 transition active:scale-95"
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

  return (
    <div className="min-h-screen bg-slate-50 pb-safe relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl shadow-sm px-4 py-3 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20">
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-sm tracking-wide leading-none">
              เลือกรายการ
            </h1>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              สั่งอาหารง่ายๆ ผ่านมือถือ
            </p>
          </div>
        </div>
        {tableName && (
          <span className="px-3.5 py-1.5 bg-slate-900 text-white text-[11px] font-black rounded-full shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            โต๊ะ {tableName}
          </span>
        )}
      </div>

      {/* หมวดหมู่ */}
      <div className="bg-white border-b border-slate-200/60 px-3 py-2.5 overflow-x-auto flex flex-nowrap gap-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {/* 🌟🌟🌟 รายการสินค้า (ดีไซน์พรีเมียม สัดส่วน 1:1 + ภาพเบลอเนียนเป็นพื้นหลัง) 🌟🌟🌟 */}
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {displayedProducts.map((p) => (
          <div
            key={p.id}
            onClick={() => handleAddClick(p)}
            className="group bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-xl hover:shadow-sky-500/10 border border-slate-100/80 flex flex-col active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer relative"
          >
            {/* ป้าย "มีตัวเลือก" สไตล์ Glassmorphism */}
            {p.optionGroups && p.optionGroups.length > 0 && (
              <div className="absolute top-2.5 right-2.5 z-20">
                <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 border border-white/10">
                  <svg
                    className="w-3 h-3 text-sky-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  ตัวเลือก
                </span>
              </div>
            )}

            {/* 🌟 คอนเทนเนอร์รูปภาพ (เทคนิค ภาพเต็ม 100% + พื้นหลังเบลอกลืนไปกับรูป) */}
            <div className="aspect-square relative overflow-hidden bg-slate-100 flex items-center justify-center">
              {p.image ? (
                <>
                  {/* เลเยอร์ที่ 1: รูปภาพขยายเต็มพื้นที่แล้วเบลอ (ดึงสีมาทำ Background) */}
                  <img
                    src={p.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xl scale-125 saturate-150 pointer-events-none"
                  />

                  {/* เลเยอร์ที่ 2: รูปภาพหลักแบบเต็มใบ (object-contain) พร้อมเงาให้ลอยขึ้นมา */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="relative z-10 w-full h-full p-3 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                  <svg
                    className="w-10 h-10 opacity-30"
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
                </div>
              )}
            </div>

            {/* รายละเอียดด้านล่างของการ์ด */}
            <div className="p-3.5 flex flex-col flex-1 bg-white relative z-10">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
                {p.name}
              </h3>

              <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sky-600 font-black text-[13px] sm:text-[15px] tracking-tight leading-none">
                    {p.price.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                    LAK
                  </span>
                </div>

                {/* ปุ่ม Add ทรงกลมล้ำๆ (ดีไซน์น่ากด) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddClick(p);
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-sky-500/30 active:scale-90 shrink-0"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
          </div>
        ))}
      </div>

      {visibleCount < filteredProducts.length && (
        <div ref={loaderRef} className="py-6 flex justify-center items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-slate-500 text-xs font-bold border border-slate-100">
            <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
            กำลังโหลด...
          </div>
        </div>
      )}

      {/* Modal เลือก Options */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedProduct(null)}
          />

          <div className="bg-white w-full rounded-t-3xl shadow-2xl relative z-10 animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center shrink-0">
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

            <div className="p-4 overflow-y-auto custom-scroll flex-1 bg-slate-50/50">
              {selectedProduct.optionGroups.map((group: any) => {
                const groupKey = group.id
                  ? String(group.id)
                  : String(group.name);

                return (
                  <div
                    key={group.id || group.name}
                    className="mb-5 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">
                          {group.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
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
                            className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                              isSelected
                                ? "border-sky-500 bg-sky-50 shadow-sm shadow-sky-500/10"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 flex items-center justify-center border transition-colors ${group.allowMultiple ? "rounded-md" : "rounded-full"} ${isSelected ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300"}`}
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
                                className={`text-xs font-bold ${isSelected ? "text-sky-700" : "text-slate-700"}`}
                              >
                                {choice.name}
                              </span>
                            </div>
                            {Number(choice.priceAdd) > 0 && (
                              <span className="text-[10px] font-bold text-sky-600">
                                +{Number(choice.priceAdd).toLocaleString()}
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

            <div className="p-4 border-t bg-white shrink-0 pb-safe shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="font-bold text-xs text-slate-500">
                  ราคารวม (ชิ้นนี้)
                </span>
                <span className="text-xl font-black text-sky-600">
                  {(
                    selectedProduct.price + currentOptionPrice
                  ).toLocaleString()}
                </span>
              </div>
              <button
                onClick={confirmOptionsAndAdd}
                className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-sky-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 ปุ่มตะกร้าลอย */}
      {totalItems > 0 && !isCartOpen && (
        <div
          className={`fixed z-40 touch-none shadow-2xl shadow-sky-900/30 transition-transform ${
            !isDragged ? "bottom-10 right-6 animate-bounce-short" : ""
          }`}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#0ea5e9", // สีฟ้า Sky-500 ให้เด่นๆ ชวนให้กด
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
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {totalItems > 99 ? "99+" : totalItems}
          </div>
        </div>
      )}

      {/* Modal ตะกร้าสินค้า */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !isSubmitting && setIsCartOpen(false)}
          />

          <div className="bg-white w-full rounded-t-3xl shadow-2xl relative z-10 animate-slide-up max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  ตะกร้าอาหาร
                </h2>
                {tableName && (
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    สั่งสำหรับโต๊ะ{" "}
                    <span className="text-sky-600">{tableName}</span>
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

            <div className="p-4 overflow-y-auto custom-scroll flex-1 space-y-3 bg-slate-50/50">
              {cart.map((item, index) => {
                const optText = renderOptionsText(item.selectedOptions);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                        {item.product.name}
                      </h4>
                      {optText && (
                        <p className="text-[10px] text-sky-600 mt-1 line-clamp-1 bg-sky-50 px-1.5 py-0.5 rounded inline-block font-medium border border-sky-100">
                          {optText}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 font-bold mt-1.5">
                        {(item.totalPrice / item.quantity).toLocaleString()} /
                        ชิ้น
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100 shrink-0 shadow-inner">
                      <button
                        disabled={isSubmitting}
                        onClick={() => updateQty(index, -1)}
                        className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-black text-rose-500 active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-xs text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        disabled={isSubmitting}
                        onClick={() => updateQty(index, 1)}
                        className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-black text-sky-500 active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t bg-white shrink-0 pb-safe shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-4 px-1">
                <span className="font-bold text-sm text-slate-500">
                  ยอดรวมทั้งหมด
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">
                    {totalPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">
                    LAK
                  </span>
                </div>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-[0.98]"
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
