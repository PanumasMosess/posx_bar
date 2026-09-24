"use client";

import { MemberSelectorProps } from "@/lib/interface";

export default function MemberSelector({
  selectedMember,
  showInput,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onToggleInput,
  onClearMember,
}: MemberSelectorProps) {
  return (
    <div className="p-3 bg-pos-surface border-b border-pos-border shrink-0">
      {!selectedMember ? (
        !showInput ? (
          <button
            type="button"
            onClick={() => onToggleInput(true)}
            className="w-full py-2 px-3 rounded-xl bg-pos-bg hover:bg-pos-hover border border-dashed border-sky-500/40 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
            <span>สะสมแต้ม / ค้นหาสมาชิก</span>
          </button>
        ) : (
          <div className="flex gap-1.5">
            <input
              autoFocus
              type="text"
              placeholder="ใส่เบอร์โทรศัพท์สมาชิก..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
              className="flex-1 bg-pos-bg border border-pos-border rounded-xl px-3 py-1.5 text-xs text-pos-text outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              className="px-3 py-1.5 bg-sky-600 text-white font-bold text-xs rounded-xl"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={() => onToggleInput(false)}
              className="px-2 py-1.5 text-pos-text/50 text-xs"
            >
              ยกเลิก
            </button>
          </div>
        )
      ) : (
        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              VIP
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-pos-text truncate">
                {selectedMember.name}
              </p>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium truncate">
                เงินในบัตร: {selectedMember.balance.toLocaleString()} LAK |
                แต้ม: {selectedMember.points}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearMember}
            className="text-xs text-rose-500 font-bold hover:underline px-1 shrink-0"
          >
            เปลี่ยน
          </button>
        </div>
      )}
    </div>
  );
}
