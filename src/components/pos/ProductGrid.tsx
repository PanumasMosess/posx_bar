"use client";

import { useState } from "react";
import { ProductGridProps } from "@/lib/types/interface";
import ProductOptionModal from "./ProductOptionModal"; // 🌟 Import จากไฟล์ที่เพิ่งแยกออกมา

interface ExtendedProductGridProps extends ProductGridProps {
  onAddToCart?: (item: any) => void;
}

export default function ProductGrid({
  initialProducts = [],
  onAddToCart,
}: ExtendedProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const handleProductClick = (product: any) => {
    if (product.optionGroups && product.optionGroups.length > 0) {
      setSelectedProduct(product);
    } else {
      const cartItem = {
        product,
        quantity: 1,
        selectedOptions: {},
        totalPrice: Number(product.price),
      };
      if (onAddToCart) onAddToCart(cartItem);
    }
  };

  return (
    <>
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {initialProducts.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500">
            ยังไม่มีสินค้าในระบบ กดปุ่ม + เพื่อเพิ่มสินค้า
          </div>
        ) : (
          initialProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="flex flex-col text-left bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-sky-200 transition active:scale-95 cursor-pointer relative group"
            >
              {product.optionGroups && product.optionGroups.length > 0 && (
                <div className="absolute top-2 right-2 bg-sky-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                  มีตัวเลือก
                </div>
              )}

              <div className="w-full aspect-square bg-slate-50 relative overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="text-xs text-sky-600 font-medium mb-1">
                  {product.category?.name || "ไม่มีหมวดหมู่"}
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <div className="font-extrabold text-sky-600">
                  {Number(product.price).toLocaleString()} LAK
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* เรียกใช้งาน Modal ตัวเลือกที่แยกไฟล์ออกมา */}
      {selectedProduct && (
        <ProductOptionModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(cartItem) => {
            if (onAddToCart) onAddToCart(cartItem);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
}
