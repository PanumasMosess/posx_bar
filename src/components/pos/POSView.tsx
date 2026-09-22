"use client";

import { useState, useEffect, useRef } from "react";
import CategoryPills from "./CategoryPills";
import ProductGrid from "./ProductGrid";
import { POSViewProps } from "@/lib/types/interface";
import EditProductModal from "./form/EditProductModal";
import FloatingSearch from "./FloatingSearch";
import { deleteProductFromDB } from "@/lib/actions/actionsPos";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { useCart } from "../providers/CartContext";

export default function POSView({ categories, products }: POSViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [displayCount, setDisplayCount] = useState(10);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    setDisplayCount(10);
  }, [selectedCategoryId, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => {
            setDisplayCount((prev) => prev + 10);
          }, 300);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [observerTarget, displayCount]);

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategoryId !== null
        ? Number(product.category?.id) === Number(selectedCategoryId)
        : true;

    const matchSearch =
      searchTerm === "" ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.price?.toString().includes(searchTerm);

    return matchCategory && matchSearch;
  });

  const displayedProducts = filteredProducts.slice(0, displayCount);

  return (
    <div className="flex flex-col min-h-full relative pb-4">
      <CategoryPills
        initialCategories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      <ProductGrid
        initialProducts={displayedProducts}
        onAddToCart={(item) => addToCart(item)} // 🌟 ส่งสินค้าเข้าตะกร้าจริง
        onEditProduct={setEditingProduct}
        onDeleteProduct={(product) => setProductToDelete(product)}
      />

      {displayCount < filteredProducts.length && (
        <div
          ref={observerTarget}
          className="w-full h-20 flex items-center justify-center text-sky-600 pb-10"
        >
          <svg
            className="animate-spin -ml-1 mr-3 h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="font-semibold text-sm">กำลังโหลด...</span>
        </div>
      )}

      <FloatingSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {editingProduct && (
        <EditProductModal
          productToEdit={editingProduct}
          initialCategories={categories}
          onClose={() => setEditingProduct(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        title="ลบสินค้านี้ใช่หรือไม่?"
        message={`คุณต้องการลบ "${productToDelete?.name}" ออกจากระบบถาวรใช่ไหม?`}
        onClose={() => setProductToDelete(null)}
        isPending={isDeleting}
        onConfirm={async () => {
          if (!productToDelete) return;
          setIsDeleting(true);
          await deleteProductFromDB(productToDelete.id);
          setIsDeleting(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
}
