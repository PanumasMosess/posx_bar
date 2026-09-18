"use client";

export default function FormOption({
  currentOption,
  setCurrentOption,
  saveOptionGroup,
  setActiveModal,
}: any) {
  const addChoiceRow = () =>
    setCurrentOption({ ...currentOption, choices: [...currentOption.choices, { name: "", priceAdd: "0" }] });
    
  const updateChoice = (index: number, field: string, value: string) => {
    const newChoices = [...currentOption.choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setCurrentOption({ ...currentOption, choices: newChoices });
  };

  return (
    <>
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800">สร้างกลุ่มตัวเลือก</h2>
      </div>
      <div className="p-5 overflow-y-auto custom-scroll space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อกลุ่ม *</label>
          <input required autoFocus type="text" value={currentOption.name} onChange={(e) => setCurrentOption({ ...currentOption, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="เช่น ระดับความหวาน, ไซส์" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={currentOption.isRequired} onChange={(e) => setCurrentOption({ ...currentOption, isRequired: e.target.checked })} className="rounded text-sky-600" /> บังคับเลือก
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={currentOption.allowMultiple} onChange={(e) => setCurrentOption({ ...currentOption, allowMultiple: e.target.checked })} className="rounded text-sky-600" /> เลือกได้หลายข้อ
          </label>
        </div>
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">ตัวเลือกย่อย</label>
          <div className="space-y-2">
            {currentOption.choices.map((choice: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input type="text" placeholder="ชื่อ (เช่น หวาน 50%)" value={choice.name} onChange={(e) => updateChoice(i, "name", e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                <input type="number" placeholder="+ราคา" value={choice.priceAdd} onChange={(e) => updateChoice(i, "priceAdd", e.target.value)} className="w-24 px-3 py-1.5 border rounded-lg text-sm" />
              </div>
            ))}
          </div>
          <button type="button" onClick={addChoiceRow} className="mt-3 text-sm text-sky-600 font-medium hover:underline">+ เพิ่มแถวตัวเลือกย่อย</button>
        </div>
        <div className="pt-6 flex gap-3 sticky bottom-0 bg-white">
          <button type="button" onClick={() => setActiveModal("ADD_PRODUCT")} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium">ย้อนกลับ</button>
          <button type="button" onClick={saveOptionGroup} disabled={!currentOption.name} className="flex-1 py-2 bg-sky-600 text-white rounded-xl font-bold disabled:opacity-50">ยืนยันกลุ่มตัวเลือก</button>
        </div>
      </div>
    </>
  );
}