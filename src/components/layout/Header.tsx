"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useCart } from "../providers/CartContext";
import { useShift } from "../providers/ShiftContext";
import ShiftModal from "../pos/payment/ShiftModal";
import { usePathname } from "next/navigation";
// 🌟 นำเข้า useEmployee และ logoutAction
import { useEmployee } from "@/components/providers/EmployeeContext";
import { logoutAction } from "@/lib/actions/authActions";

export default function Header({ onToggleCart }: { onToggleCart: () => void }) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // 🌟 Dropdown สำหรับ Logout / PIN
  const [mounted, setMounted] = useState(false);

  // Modal State สำหรับเปิด-ปิดกะ
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const { totalItems, totalPrice, activeBillInfo } = useCart();
  const { activeShift } = useShift();

  // 🌟 ดึงข้อมูลพนักงานปัจจุบัน และฟังก์ชันลบ Session PIN
  const { currentEmployee, clearEmployeeSession } = useEmployee();

  const currentActivePrice = activeBillInfo
    ? activeBillInfo.totalPrice
    : totalPrice;

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleThemeMenu = () => {
    setIsThemeMenuOpen(!isThemeMenuOpen);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsThemeMenuOpen(false);
  };

  const pathname = usePathname();
  const isSettings = pathname?.startsWith("/settings");

  const handleShiftBtnClick = () => {
    setIsShiftModalOpen(true);
  };

  // 🌟 สลับพนักงาน (เคลียร์เฉพาะ PIN พนักงาน ให้หน้าจอเด้งกลับมากรอก PIN ใหม่)
  const handleSwitchEmployee = () => {
    clearEmployeeSession();
    window.location.reload();
  };

  // 🌟 ออกจากระบบองค์กร (Logout จากระบบ NextAuth ออกไปยังหน้า Login ร้าน)
  const handleOrgLogout = async () => {
    clearEmployeeSession();
    await logoutAction();
  };

  return (
    <>
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
        </div>

        {/* Right Section: Shift Status, Theme, Employee / Logout Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* ปุ่มจุดไฟ LED สถานะกะ */}
          <div className="relative group flex items-center">
            <button
              type="button"
              onClick={handleShiftBtnClick}
              className={`h-8 sm:h-9 px-2.5 rounded-xl border flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
                activeShift
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeShift ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    activeShift ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
              </span>

              <span className="text-xs font-mono font-extrabold hidden sm:inline">
                {activeShift
                  ? activeShift.shiftNumber.split("-").pop()
                  : "ปิดกะ"}
              </span>
            </button>

            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col gap-0.5 whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-xl z-50 pointer-events-none border border-slate-800 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="font-bold">สถานะกะ:</span>
                <span
                  className={`font-mono font-bold ${
                    activeShift ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {activeShift
                    ? `เปิดอยู่ (${activeShift.shiftNumber})`
                    : "ยังไม่ได้เปิดกะ"}
                </span>
              </div>
            </div>
          </div>

          {isSettings && <div className="flex-1" />}

          {/* Theme & User Account Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Switcher */}
            <div className="relative" id="themeSwitcherWrapper">
              <button
                onClick={toggleThemeMenu}
                className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-pos-surface border border-pos-border flex items-center gap-1 text-pos-text hover:bg-pos-hover transition-colors active:scale-95 shadow-xs cursor-pointer"
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
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-pos-surface border border-pos-border shadow-xl p-2 z-50 space-y-1 select-none transition-colors duration-300">
                  <button
                    onClick={() => {
                      setTheme("light");
                      setIsThemeMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-pos-hover transition cursor-pointer"
                  >
                    <span className="text-xs font-bold text-pos-text">
                      ☀️ Light Mode
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme("teal");
                      setIsThemeMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-pos-hover transition cursor-pointer"
                  >
                    <span className="text-xs font-bold text-pos-text">
                      🌊 Ocean Cyan
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme("dark");
                      setIsThemeMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-pos-hover transition cursor-pointer"
                  >
                    <span className="text-xs font-bold text-pos-text">
                      🌙 Dark Mode
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 🌟 แทนที่ปุ่มตะกร้าเดิม ด้วยปุ่มโปรไฟล์แคชเชียร์/ผู้ใช้งาน */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold flex items-center gap-2 shadow-xs active:scale-95 transition cursor-pointer"
                title="โปรไฟล์และตัวเลือกล็อกเอาท์"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white font-black text-[10px] flex items-center justify-center">
                  {currentEmployee?.name
                    ? currentEmployee.name.charAt(0).toUpperCase()
                    : "👤"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold line-clamp-1 max-w-[90px] sm:max-w-[120px]">
                    {currentEmployee?.name || "ยังไม่ระบุพนักงาน"}
                  </span>
                </div>
                <svg
                  className="w-3 h-3 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {/* Dropdown Menu ออกจากระบบ / สลับ PIN */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1 select-none animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      แคชเชียร์ปัจจุบัน
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                      {currentEmployee?.name || "ไม่พบข้อมูล"}
                    </p>
                    <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      ตำแหน่ง: {currentEmployee?.role || "พนักงาน"}
                    </p>
                  </div>

                  {/* ปุ่มที่ 1: สลับพนักงาน (ใส่ PIN ใหม่) */}
                  <button
                    onClick={handleSwitchEmployee}
                    className="w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-600 dark:text-sky-400 transition font-bold text-xs cursor-pointer"
                  >
                    <span className="text-base">🔑</span>
                    <span>สลับพนักงาน (กรอก PIN)</span>
                  </button>

                  {/* ปุ่มที่ 2: ออกจากระบบร้านค้าทั้งหมด (NextAuth Logout) */}
                  <button
                    onClick={handleOrgLogout}
                    className="w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition font-bold text-xs cursor-pointer"
                  >
                    <span className="text-base">🏢</span>
                    <span>ออกจากระบบร้านค้า (Organization)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal จัดการเปิด/ปิดกะ */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />
    </>
  );
}
