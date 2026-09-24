"use client";

import { useState } from "react";
import { ProductGridProps } from "@/lib/interface";
import ProductOptionModal from "./ProductOptionModal";
import ProductCard from "./ProductCard";

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
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {initialProducts.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-pos-text/40 gap-2">
            <svg
              className="w-12 h-12 opacity-30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3m-3 3h3m-6-3h.008v.008H9.75V12zm0 3h.008v.008H9.75V15zm0 3h.008v.008H9.75V18z"
              />
            </svg>
            <p className="text-sm font-medium">ไม่พบรายการสินค้าที่จะแสดง</p>
          </div>
        ) : (
          initialProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => handleProductClick(product)}
              onEdit={() => onEditProduct && onEditProduct(product)}
            />
          ))
        )}
      </div>

      {/* Modal เลือกตัวเลือกเสริม (ถ้ามี) */}
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
