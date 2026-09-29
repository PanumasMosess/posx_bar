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

  // State สำหรับ Infinite Scroll (โหลดทีละ 10)
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);

  // 🌟 State และ Refs สำหรับปุ่มตะกร้าแบบลากได้
  const [cartPos, setCartPos] = useState({ x: 0, y: 0 });
  const [isDragged, setIsDragged] = useState(false); // 🌟 เพิ่ม State เช็กว่าเคยถูกลากหรือยัง
  const dragRef = useRef({ startX: 0, startY: 0, isDragging: false });

  // กรองสินค้าตามหมวดหมู่
  const filteredProducts =
    activeCategory === "ALL"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

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
      setIsDragged(true); // 🌟 เริ่มใช้พิกัดจากการลากแทน CSS เริ่มต้น

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

  // --- ระบบ Options (ปรับเป็น Format เดียวกับ POS พนักงาน) ---
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
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md shadow-sm px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 shadow-inner">
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
          <h1 className="font-black text-slate-800 text-base tracking-wide">
            เลือกรายการ
          </h1>
        </div>
        {tableName && (
          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-[10px] font-black rounded-full shadow-sm border border-amber-200/50 flex items-center gap-1">
            📍 {tableName}
          </span>
        )}
      </div>

      {/* หมวดหมู่ */}
      <div className="bg-white border-b border-slate-100 px-3 py-2 overflow-x-auto flex flex-nowrap gap-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
            activeCategory === "ALL"
              ? "bg-slate-800 text-white shadow-md"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          ทั้งหมด
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* รายการสินค้า */}
      <div className="p-2.5 grid grid-cols-3 gap-2">
        {displayedProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col active:scale-[0.98] transition-transform overflow-hidden relative"
          >
            {p.optionGroups && p.optionGroups.length > 0 && (
              <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                มีตัวเลือก
              </span>
            )}

            <div className="aspect-square bg-slate-100 relative">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-1.5 flex flex-col flex-1">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                {p.name}
              </h3>
              <p className="text-sky-600 font-black text-[10px] mt-0.5">
                {p.price.toLocaleString()}
              </p>
              <button
                onClick={() => handleAddClick(p)}
                className="mt-auto pt-1.5 w-full"
              >
                <div className="w-full py-1.5 bg-sky-50 active:bg-sky-100 text-sky-600 font-bold text-[10px] rounded-lg transition-colors">
                  + เพิ่ม
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < filteredProducts.length && (
        <div ref={loaderRef} className="py-4 flex justify-center items-center">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
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
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500"
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
                    className="mb-5 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"
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
                            <span className="text-rose-500 font-bold">
                              (จำเป็น)
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
                            className={`flex justify-between items-center p-2.5 rounded-xl border transition-colors cursor-pointer ${
                              isSelected
                                ? "border-sky-500 bg-sky-50"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 flex items-center justify-center border rounded ${group.allowMultiple ? "rounded-sm" : "rounded-full"} ${isSelected ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300"}`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3"
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

            <div className="p-4 border-t bg-white shrink-0 pb-safe">
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="font-bold text-xs text-slate-600">
                  ราคารวม (ชิ้นนี้)
                </span>
                <span className="text-lg font-black text-sky-600">
                  {(
                    selectedProduct.price + currentOptionPrice
                  ).toLocaleString()}
                </span>
              </div>
              <button
                onClick={confirmOptionsAndAdd}
                className="w-full py-3.5 bg-sky-500 active:bg-sky-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-sky-500/30 transition flex justify-center items-center gap-2"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 ปุ่มตะกร้าลอย (ปรับให้ใช้ CSS เป็นหลัก ป้องกันบั๊กปุ่มลอยหายบนมือถือ) */}
      {totalItems > 0 && !isCartOpen && (
        <div
          className={`fixed z-40 touch-none shadow-xl shadow-slate-900/20 transition-transform ${
            !isDragged ? "bottom-10 right-6" : ""
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
          <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
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
                <h2 className="text-base font-black text-slate-800">
                  ตะกร้าอาหาร
                </h2>
                {tableName && (
                  <p className="text-[10px] text-slate-500 font-bold">
                    สั่งสำหรับ {tableName}
                  </p>
                )}
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500"
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
                    className="flex justify-between items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {item.product.name}
                      </h4>
                      {optText && (
                        <p className="text-[10px] text-sky-600 mt-0.5 line-clamp-1">
                          {optText}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-bold mt-1">
                        {(item.totalPrice / item.quantity).toLocaleString()} /
                        ชิ้น
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100 shrink-0">
                      <button
                        disabled={isSubmitting}
                        onClick={() => updateQty(index, -1)}
                        className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center font-black text-rose-500"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-black text-xs text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        disabled={isSubmitting}
                        onClick={() => updateQty(index, 1)}
                        className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center font-black text-sky-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-white shrink-0 pb-safe">
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="font-bold text-xs text-slate-600">
                  ยอดรวมทั้งหมด
                </span>
                <span className="text-lg font-black text-sky-600">
                  {totalPrice.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์เข้าครัว"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
