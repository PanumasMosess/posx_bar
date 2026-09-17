"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function Header({ onToggleCart }: { onToggleCart: () => void }) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // เรียกใช้ theme จาก next-themes
  const { theme, setTheme } = useTheme();

  // ป้องกัน Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleThemeMenu = () => setIsThemeMenuOpen(!isThemeMenuOpen);

  return (
    <header className="h-14 md:h-16 bg-pos-surface border-b border-pos-border px-3 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 z-60 shadow-[0_1px_3px_rgba(0,0,0,0.03)] gap-2 md:gap-4 transition-colors duration-300">
      {/* Left Side: POSX Brand Identity & Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/25 text-white font-black shrink-0">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
            <circle cx="12" cy="12" fill="currentColor" r="2"></circle>
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* เปลี่ยนเป็น text-pos-text */}
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-pos-text uppercase font-sans transition-colors">
              POS
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-400">
                X
              </span>
            </span>
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse mr-1"></span>
              <span className="hidden xs:inline">ออนไลน์</span>
            </span>
          </div>
          <p className="text-[10px] tracking-wide text-slate-400 font-medium hidden md:block uppercase">
            สาขาหลัก • เครื่อง 01
          </p>
        </div>
        <div className="hidden 2xl:flex items-center ml-2 pl-3 border-l border-pos-border">
          <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-sky-50/80 to-cyan-50/80 border border-sky-100 flex items-center gap-2 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">
              ยอดวันนี้:
            </span>
            <span className="text-xs font-bold text-sky-700 font-mono tracking-tight">
              18,000 LAK
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium">1 บิล</span>
          </div>
        </div>
      </div>

      {/* Middle: Responsive Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2 md:mx-4">
        <div className="relative w-full">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          {/* อัปเดตคลาสช่องค้นหา ใช้ bg-pos-bg, text-pos-text และ border-pos-border */}
          <input
            className="w-full pl-8 sm:pl-9 pr-8 sm:pr-12 py-1.5 bg-pos-bg hover:bg-pos-hover border border-pos-border rounded-xl text-xs text-pos-text placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-pos-surface focus:ring-2 focus:ring-sky-500/10 transition-colors duration-300"
            placeholder="ค้นหาสินค้า, บาร์โค้ด..."
            type="text"
          />
          {/* อัปเดตปุ่มคีย์ลัด */}
          <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 bg-pos-surface border border-pos-border rounded transition-colors duration-300">
            ⌘
          </kbd>
        </div>
      </div>

      {/* Right Section: Theme, Cart Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Theme Switcher */}
        <div className="relative" id="themeSwitcherWrapper">
          <button
            onClick={toggleThemeMenu}
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-pos-surface border border-pos-border flex items-center gap-1 text-pos-text hover:bg-pos-hover transition-colors active:scale-95 shadow-xs"
            title="เปลี่ยนธีมระบบ"
          >
            <span className="text-xs sm:text-sm">
              {!mounted
                ? "☀️"
                : theme === "dark"
                  ? "🌙"
                  : theme === "teal"
                    ? "🌊"
                    : "☀️"}
            </span>
            <span className="text-xs font-semibold hidden xl:inline">
              {!mounted
                ? "ธีมสว่าง"
                : theme === "dark"
                  ? "ธีมมืด"
                  : theme === "teal"
                    ? "Ocean Cyan"
                    : "ธีมสว่าง"}
            </span>
            <svg
              className="w-3 h-3 text-slate-400 hidden sm:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>

          {isThemeMenuOpen && (
            /* อัปเดต Dropdown Menu ให้ใช้ bg-pos-surface และ border-pos-border */
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-pos-surface border border-pos-border shadow-xl p-2 z-50 space-y-1 select-none transition-colors duration-300">
              <div className="px-2.5 py-1.5 border-b border-pos-border flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  โหมดสีระบบ
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 font-mono">
                  POSX
                </span>
              </div>

              <button
                onClick={() => {
                  setTheme("light");
                  setIsThemeMenuOpen(false);
                }}
                className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-pos-hover border border-transparent transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 text-sm">☀️</span>
                  <span className="text-xs font-bold text-pos-text">
                    Light Mode
                  </span>
                </div>
                {mounted && theme === "light" && (
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                )}
              </button>

              <button
                onClick={() => {
                  setTheme("teal");
                  setIsThemeMenuOpen(false);
                }}
                className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-pos-hover border border-transparent transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-600 text-sm">🌊</span>
                  <span className="text-xs font-bold text-pos-text">
                    Ocean Cyan
                  </span>
                </div>
                {mounted && theme === "teal" && (
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                )}
              </button>

              <button
                onClick={() => {
                  setTheme("dark");
                  setIsThemeMenuOpen(false);
                }}
                className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-pos-hover border border-transparent transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 text-sm">🌙</span>
                  <span className="text-xs font-bold text-pos-text">
                    Dark Mode
                  </span>
                </div>
                {mounted && theme === "dark" && (
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Print Receipt Button */}
        <button
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pos-surface border border-pos-border hidden md:flex items-center justify-center text-slate-500 hover:text-pos-text hover:bg-pos-hover shadow-xs transition-colors"
          title="พิมพ์ใบเสร็จ"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>

        {/* Cart Badge Button */}
        <button
          onClick={onToggleCart}
          id="headerCartBtn"
          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:from-sky-700 hover:to-cyan-600 text-white font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 transition"
          title="ดูตะกร้าสินค้า"
        >
          <div className="relative">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-black border border-white">
              1
            </span>
          </div>
          <span className="text-xs font-bold hidden sm:inline">ตะกร้า</span>
          <span className="text-[11px] sm:text-xs font-mono font-extrabold bg-white/20 px-1.5 py-0.5 rounded text-white">
            18,000
          </span>
        </button>
      </div>
    </header>
  );
}