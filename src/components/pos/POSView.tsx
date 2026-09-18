"use client";

import { useState } from "react";
import CategoryPills from "./CategoryPills";
import ProductGrid from "./ProductGrid";
import { POSViewProps } from "@/lib/types/interface";

export default function POSView({ categories, products }: POSViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const filteredProducts =
    selectedCategoryId !== null
      ? products.filter(
          (product) =>
            Number(product.categoryId) === Number(selectedCategoryId),
        )
      : products;

  return (
    <>
      <CategoryPills
        initialCategories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />
      <ProductGrid initialProducts={filteredProducts} />
    </>
  );
}
