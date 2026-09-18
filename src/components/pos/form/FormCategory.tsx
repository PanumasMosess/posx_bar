"use client";

export default function FormCategory({
  newCategoryName,
  setNewCategoryName,
  submitCategory,
  isPending,
  setActiveModal,
}: any) {
  return (
    <>
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">สร้างหมวดหมู่ใหม่</h2>
      </div>
      <form onSubmit={submitCategory} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อหมวดหมู่ *</label>
          <input required autoFocus type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="เช่น เครื่องดื่มเย็น" />
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={() => setActiveModal("ADD_PRODUCT")} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium">ย้อนกลับ</button>
          <button type="submit" disabled={isPending} className="flex-1 py-2 bg-sky-600 text-white rounded-xl font-bold">บันทึกหมวดหมู่</button>
        </div>
      </form>
    </>
  );
}