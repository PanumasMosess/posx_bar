"use client";

import { useState, useTransition } from "react";
import { addProductToDB, addCategoryToDB } from "@/lib/actions/actionsPos";
import { ProductFormModalProps } from "@/lib/interface";
import { ModalView } from "@/lib/types";
import FormOption from "./FormOption";
import FormCategory from "./FormCategory";
import FormProduct from "./FormProduct";
import ToastAlert from "@/components/ToastAlert"; 

export default function ProductFormModal({
  onClose,
  initialCategories = [],
}: ProductFormModalProps) {
  const [activeModal, setActiveModal] = useState<ModalView>("ADD_PRODUCT");
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({
    isOpen: false,
    type: "success",
    message: "",
  });

  const [product, setProduct] = useState({
    code: "", 
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
        setToast({
          isOpen: true,
          type: "success",
          message: "เพิ่มสินค้าเรียบร้อยแล้ว!",
        });
        setTimeout(() => onClose(), 1500); 
      } else {
        setToast({
          isOpen: true,
          type: "error",
          message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า",
        });
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
   
        setToast({
          isOpen: true,
          type: "error",
          message: "สร้างหมวดหมู่ไม่สำเร็จ",
        });
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

  return (

    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
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

          {activeModal === "ADD_CATEGORY" && (
            <FormCategory
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              submitCategory={submitCategory}
              isPending={isPending}
              setActiveModal={setActiveModal}
            />
          )}

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

      <ToastAlert
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}
