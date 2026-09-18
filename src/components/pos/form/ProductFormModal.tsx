"use client";

import { useState, useTransition } from "react";
import { addProductToDB, addCategoryToDB } from "@/lib/actions/actionsPos";
import { ProductFormModalProps } from "@/lib/types/interface";
import { ModalView } from "@/lib/types/types";
import FormOption from "./FormOption";
import FormCategory from "./FormCategory";
import FormProduct from "./FormProduct";

export default function ProductFormModal({
  onClose,
  initialCategories = [],
}: ProductFormModalProps) {
  const [activeModal, setActiveModal] = useState<ModalView>("ADD_PRODUCT");
  const [isPending, startTransition] = useTransition();

  const [product, setProduct] = useState({
    name: "",
    price: "",
    cost: "",
    stock: "0",
    image: "",
    barcode: "",
    categoryId: "",
    detail: "",
  });

  const [optionGroups, setOptionGroups] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] =
    useState<{ id: number; name: string }[]>(initialCategories);
  const [currentOption, setCurrentOption] = useState({
    name: "",
    isRequired: false,
    allowMultiple: false,
    choices: [{ name: "", priceAdd: "0" }],
  });

  const submitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = { ...product, optionGroups };
      const result = await addProductToDB(payload);
      if (result.success) {
        onClose();
      } else {
        alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
      }
    });
  };

  const submitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addCategoryToDB({ name: newCategoryName });
      if (result.success && result.id !== undefined) {
        setCategories([
          ...categories,
          { id: result.id, name: newCategoryName },
        ]);
        setProduct({ ...product, categoryId: result.id.toString() });
        setNewCategoryName("");
        setActiveModal("ADD_PRODUCT");
      } else {
        alert("สร้างหมวดหมู่ไม่สำเร็จ");
      }
    });
  };

  const saveOptionGroup = () => {
    setOptionGroups([...optionGroups, currentOption]);
    setCurrentOption({
      name: "",
      isRequired: false,
      allowMultiple: false,
      choices: [{ name: "", priceAdd: "0" }],
    });
    setActiveModal("ADD_PRODUCT");
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* VIEW 1: เพิ่มสินค้า */}
        {activeModal === "ADD_PRODUCT" && (
          <FormProduct
            product={product}
            setProduct={setProduct}
            categories={categories}
            optionGroups={optionGroups}
            setOptionGroups={setOptionGroups}
            setActiveModal={setActiveModal}
            submitProduct={submitProduct}
            isPending={isPending}
            onClose={onClose}
          />
        )}

        {/* VIEW 2: เพิ่มหมวดหมู่ */}
        {activeModal === "ADD_CATEGORY" && (
          <FormCategory
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            submitCategory={submitCategory}
            isPending={isPending}
            setActiveModal={setActiveModal}
          />
        )}

        {/* VIEW 3: เพิ่มกลุ่มตัวเลือก */}
        {activeModal === "ADD_OPTION" && (
          <FormOption
            currentOption={currentOption}
            setCurrentOption={setCurrentOption}
            saveOptionGroup={saveOptionGroup}
            setActiveModal={setActiveModal}
          />
        )}
      </div>
    </div>
  );
}
