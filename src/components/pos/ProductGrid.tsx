"use client";

import { useState } from "react";
import { ProductGridProps } from "@/lib/types/interface";
import ProductOptionModal from "./ProductOptionModal";

interface ExtendedProductGridProps extends ProductGridProps {
  onAddToCart?: (item: any) => void;
  onEditProduct?: (product: any) => void;
  onDeleteProduct?: (product: any) => void;
}

export default function ProductGrid({
  initialProducts = [],
  onAddToCart,
  onEditProduct,
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
            ไม่มีสินค้าที่จะแสดง
          </div>
        ) : (
          initialProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="flex flex-col text-left bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-sky-200 transition active:scale-95 cursor-pointer relative group"
            >
              {/* ปุ่มแก้ไขสินค้า (ดินสอ) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditProduct) onEditProduct(product);
                }}
                className="absolute top-2 right-2 z-20 p-2 bg-white/80 backdrop-blur-md text-slate-400 hover:text-sky-600 hover:bg-white rounded-full shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="แก้ไขสินค้า"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>

              {/* ป้ายกำกับตัวเลือก */}
              {product.optionGroups && product.optionGroups.length > 0 && (
                <div className="absolute top-2 left-2 bg-sky-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                  มีตัวเลือก
                </div>
              )}

              {/* รูปภาพ */}
              <div className="w-full aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
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

              {/* ข้อมูลสินค้า */}
              <div className="p-3 flex flex-col flex-1">
                <div className="text-xs text-sky-600 font-medium mb-1 line-clamp-1">
                  {product.category?.name || "ไม่มีหมวดหมู่"}
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-2 flex-1">
                  {product.name}
                </h3>

                {/* ปุ่ม + เข้าตะกร้า */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="font-extrabold text-sky-600">
                    {Number(product.price).toLocaleString()} LAK
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                    className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 hover:bg-sky-600 hover:text-white transition-colors shadow-sm"
                    title="เพิ่มลงตะกร้า"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
