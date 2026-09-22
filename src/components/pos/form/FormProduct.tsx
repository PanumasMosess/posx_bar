"use client";

import { useState, useRef } from "react";

export default function FormProduct({
  product,
  setProduct,
  categories,
  optionGroups,
  setOptionGroups,
  setActiveModal,
  submitProduct,
  isPending,
  onClose,
  onDelete, 
}: any) {
  const [isExtraOpen, setIsExtraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!onDelete || !!product.id;

  const handleChange = (e: any) =>
    setProduct({ ...product, [e.target.name]: e.target.value });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct({ ...product, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProduct({ ...product, image: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800">
          {isEditMode ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <form
        onSubmit={submitProduct}
        className="p-5 overflow-y-auto custom-scroll space-y-4"
      >
        <div className="flex flex-col items-center justify-center mb-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />

          {product.image ? (
            <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
              <img
                src={product.image}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white text-sky-600 rounded-full hover:bg-sky-50 transition"
                  title="เปลี่ยนรูป"
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
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition"
                  title="ลบรูป"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition gap-2"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="text-xs font-medium">อัปโหลดรูปภาพ</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              รหัสสินค้า (SKU)
            </label>
            <input
              type="text"
              name="code"
              value={product.code || ""}
              onChange={handleChange}
              placeholder="เช่น M-01 (เว้นว่างได้)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่อสินค้า *
            </label>
            <input
              required
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              หมวดหมู่
            </label>
            <div className="flex gap-2">
              <select
                name="categoryId"
                value={product.categoryId}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white"
              >
                <option value="" className="text-slate-500">
                  -- เลือกหมวดหมู่ --
                </option>
                {categories.map((cat: any, index: number) => (
                  <option
                    key={`${cat.id}-${index}`}
                    value={cat.id}
                    className="text-slate-900"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setActiveModal("ADD_CATEGORY")}
                className="px-3 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg font-medium hover:bg-sky-100 transition whitespace-nowrap"
              >
                + สร้างใหม่
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ราคา (LAK) *
            </label>
            <input
              required
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ต้นทุน (LAK)
            </label>
            <input
              type="number"
              name="cost"
              value={product.cost}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>

          <div className="col-span-2 border-t pt-4 mt-2">
            <button
              type="button"
              onClick={() => setIsExtraOpen(!isExtraOpen)}
              className="flex items-center justify-between w-full text-sm font-bold text-slate-700 hover:text-sky-600 transition focus:outline-none"
            >
              <span>ข้อมูลเพิ่มเติม (บาร์โค้ด, รายละเอียด)</span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${isExtraOpen ? "rotate-180 text-sky-600" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isExtraOpen && (
              <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    รหัสบาร์โค้ด / QR Code
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={product.barcode}
                    onChange={handleChange}
                    placeholder="สแกนหรือพิมพ์รหัส"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    รายละเอียดสินค้า
                  </label>
                  <textarea
                    name="detail"
                    value={product.detail}
                    onChange={handleChange}
                    rows={3}
                    placeholder="อธิบายเพิ่มเติม..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none text-slate-900 bg-white placeholder:text-slate-400"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-slate-700">
              กลุ่มตัวเลือกเสริม
            </label>
            <button
              type="button"
              onClick={() => setActiveModal("ADD_OPTION")}
              className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
            >
              + เพิ่มตัวเลือก
            </button>
          </div>
          {optionGroups.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              ยังไม่มีกลุ่มตัวเลือก
            </p>
          ) : (
            <div className="space-y-2">
              {optionGroups.map((g: any, i: number) => (
                <div
                  key={i}
                  className="bg-slate-50 p-3 rounded-lg text-sm border space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <b className="text-slate-800">{g.name}</b>
                      {g.isRequired && (
                        <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded">
                          บังคับเลือก
                        </span>
                      )}
                      {g.allowMultiple && (
                        <span className="text-[10px] bg-sky-100 text-sky-600 font-semibold px-1.5 py-0.5 rounded">
                          หลายข้อ
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setOptionGroups(
                          optionGroups.filter(
                            (_: any, idx: number) => idx !== i,
                          ),
                        )
                      }
                      className="text-red-500 text-xs hover:underline"
                    >
                      ลบ
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                    {g.choices?.map((c: any, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-600"
                      >
                        <span>{c.name}</span>
                        {Number(c.priceAdd) > 0 && (
                          <span className="text-sky-600 font-bold">
                            (+{Number(c.priceAdd).toLocaleString()})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🌟 3. โซนปุ่มด้านล่างสุด */}
        <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
          {/* ถ้าเป็นโหมดแก้ไข ให้โชว์ปุ่มถังขยะสีแดง */}
          {isEditMode && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 hover:text-rose-700 transition disabled:opacity-50 flex items-center justify-center shrink-0"
              title="ลบสินค้า"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
          )}

          {/* ปุ่มบันทึก จะเปลี่ยนข้อความตามโหมด */}
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 w-full py-2 bg-gradient-to-r from-sky-600 to-cyan-500 text-white rounded-xl font-bold transition disabled:opacity-50"
          >
            {isPending
              ? "กำลังบันทึก..."
              : isEditMode
                ? "แก้ไขสินค้า"
                : "บันทึกสินค้า"}
          </button>
        </div>
      </form>
    </>
  );
}
