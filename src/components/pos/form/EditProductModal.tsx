"use client";

import { useState, useTransition } from "react";
import {
  addCategoryToDB,
  updateProductToDB,
  deleteProductFromDB,
} from "@/lib/actions/actionsPos";
import { ModalView } from "@/lib/types";
import FormOption from "./FormOption";
import FormCategory from "./FormCategory";
import FormProduct from "./FormProduct";
import { EditProductModalProps } from "@/lib/interface";
import ToastAlert from "@/components/ToastAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useEmployee } from "@/components/providers/EmployeeContext";

export default function EditProductModal({
  productToEdit,
  initialCategories = [],
  onClose,
}: EditProductModalProps) {
  const { organizationId } = useEmployee();
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
    id: productToEdit.id,
    code: productToEdit.code || "",
    name: productToEdit.name || "",
    price: productToEdit.price || "",
    cost: productToEdit.cost || "",
    stock: productToEdit.stock || "0",
    image: productToEdit.image || "",
    barcode: productToEdit.barcode || "",
    categoryId: productToEdit.categoryId?.toString() || "",
    detail: productToEdit.detail || "",
  });

  const [optionGroups, setOptionGroups] = useState<any[]>(
    productToEdit.optionGroups || [],
  );

  const [categories, setCategories] = useState(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState({
    name: "",
    isRequired: false,
    allowMultiple: false,
    choices: [{ name: "", priceAdd: "0" }],
  });

  const submitEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = { ...product, optionGroups };

      const result = await updateProductToDB(payload);
      if (result.success) {
        setToast({
          isOpen: true,
          type: "success",
          message: "อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว!",
        });

        setTimeout(() => onClose(), 1500);
      } else {
        setToast({
          isOpen: true,
          type: "error",
          message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
        });
      }
    });
  };

  const handleDeleteProduct = () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteAction = () => {
    startTransition(async () => {
      const result = await deleteProductFromDB(product.id);
      if (result.success) {
        setIsConfirmDeleteOpen(false);
        setToast({
          isOpen: true,
          type: "success",
          message: "ลบสินค้าออกจากระบบเรียบร้อยแล้ว!",
        });
        setTimeout(() => onClose(), 1500);
      } else {
        setIsConfirmDeleteOpen(false);
        setToast({
          isOpen: true,
          type: "error",
          message: "ไม่สามารถลบสินค้าได้ กรุณาลองใหม่",
        });
      }
    });
  };

  const submitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addCategoryToDB({
        name: newCategoryName,
        organizationId: organizationId,
      });
      if (result.success && result.id !== undefined) {
        setCategories([
          ...categories,
          { id: result.id, name: newCategoryName },
        ]);
        setProduct({ ...product, categoryId: result.id.toString() });
        setNewCategoryName("");
        setActiveModal("ADD_PRODUCT");
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
              submitProduct={submitEditProduct}
              isPending={isPending}
              onClose={onClose}
              onDelete={handleDeleteProduct}
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
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        title="ยืนยันการลบสินค้า"
        message={`คุณแน่ใจหรือไม่ที่จะลบ "${product.name}"? การลบจะไม่สามารถกู้คืนข้อมูลกลับมาได้`}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDeleteAction}
        isPending={isPending}
      />
      <ToastAlert
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}
