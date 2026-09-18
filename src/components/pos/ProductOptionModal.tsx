"use client";

import { useState } from "react";

interface ProductOptionModalProps {
  product: any;
  onClose: () => void;
  onConfirm: (cartItem: any) => void;
}

export default function ProductOptionModal({
  product,
  onClose,
  onConfirm,
}: ProductOptionModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any[]>>(
    {},
  );

  const handleToggle = (group: any, choice: any) => {
    const current = selectedOptions[group.id] || [];
    if (group.allowMultiple) {
      const exists = current.some((c) => c.id === choice.id);
      setSelectedOptions({
        ...selectedOptions,
        [group.id]: exists
          ? current.filter((c) => c.id !== choice.id)
          : [...current, choice],
      });
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [group.id]: [choice],
      });
    }
  };

  // คำนวณราคาบวกเพิ่มของ Option
  const extraPrice = Object.values(selectedOptions)
    .flat()
    .reduce((sum, choice) => sum + Number(choice.priceAdd || 0), 0);

  const totalPrice = Number(product.price) + extraPrice;

  // ตรวจสอบเงื่อนไขกลุ่มที่บังคับเลือก (isRequired)
  const isReady = product.optionGroups.every((group: any) => {
    if (group.isRequired) {
      return selectedOptions[group.id] && selectedOptions[group.id].length > 0;
    }
    return true;
  });

  const handleSubmit = () => {
    onConfirm({
      product,
      quantity: 1,
      selectedOptions,
      totalPrice,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-slate-800">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scroll">
          {product.optionGroups.map((group: any) => {
            const currentSelected = selectedOptions[group.id] || [];
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-800">
                    {group.name}
                    {group.isRequired && (
                      <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-bold">
                        บังคับ
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.choices.map((choice: any) => {
                    const isSelected = currentSelected.some(
                      (c) => c.id === choice.id,
                    );
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => handleToggle(group, choice)}
                        className={`p-2.5 rounded-xl border text-left text-sm flex justify-between items-center transition ${
                          isSelected
                            ? "border-sky-500 bg-sky-50 font-bold text-sky-900"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{choice.name}</span>
                        {Number(choice.priceAdd) > 0 && (
                          <span className="text-xs text-sky-600">
                            +{Number(choice.priceAdd).toLocaleString()} LAK
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-slate-50 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!isReady}
            className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50 transition shadow-md shadow-sky-500/20"
          >
            ใส่ตะกร้า ({totalPrice.toLocaleString()} LAK)
          </button>
        </div>
      </div>
    </div>
  );
}
