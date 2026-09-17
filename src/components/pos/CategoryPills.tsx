export default function CategoryPills() {
  return (
    <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-pos-surface border-b border-pos-border flex items-center justify-between gap-3 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold w-full sm:w-auto">
        <button className="shrink-0 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-bold shadow-sm shadow-sky-500/20 flex items-center gap-2 hover:opacity-95 transition">
          <span>ทั้งหมด</span>
          <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[11px] flex items-center justify-center font-extrabold">4</span>
        </button>
        <button className="shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1.5 sm:gap-2 transition">
          <span>สุรา</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white text-[10px] text-slate-600 font-medium">1</span>
        </button>
        <button className="shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1.5 sm:gap-2 transition">
          <span>บริการ PR</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white text-[10px] text-slate-600 font-medium">1</span>
        </button>
        <button className="shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1.5 sm:gap-2 transition">
          <span>เครื่องดื่มเย็น / เบียร์</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white text-[10px] text-slate-600 font-medium">2</span>
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <button className="flex items-center gap-1.5 text-xs text-slate-700 bg-pos-surface border border-pos-border px-2.5 py-1.5 rounded-xl hover:bg-slate-100 shadow-xs transition" title="จัดเรียง">
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span className="hidden md:inline">จัดเอง</span>
        </button>
        <button className="w-8 h-8 rounded-xl bg-pos-surface border border-pos-border text-sky-600 flex items-center justify-center font-bold hover:bg-sky-50 shadow-xs transition" title="เพิ่มสินค้าใหม่">+</button>
      </div>
    </div>
  );
}
