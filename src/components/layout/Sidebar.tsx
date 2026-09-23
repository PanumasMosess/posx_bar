"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  // รายการเมนูสำหรับ Sidebar
  const navItems = [
    {
      href: "/pos",
      label: "ขาย",
      icon: (
        <path
          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.651V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009 9.35c.694 0 1.343-.238 1.862-.64a3.001 3.001 0 004.276 0A2.993 2.993 0 0017 9.35c.783 0 1.507-.3 2.05-.801a3.001 3.001 0 001.34 2.14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      href: "/reports",
      label: "รายงาน",
      icon: (
        <path
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      href: "/inventory",
      label: "คลัง",
      icon: (
        <path
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      href: "/kitchen",
      label: "จอครัว",
      icon: (
        <path
          d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      href: "/expenses",
      label: "รายจ่าย",
      icon: (
        <path
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  return (
    <nav className="hidden md:flex flex-col items-center w-16 lg:w-20 bg-pos-surface border-r border-pos-border py-4 shrink-0 space-y-3 select-none z-20">
      {navItems.map((item) => {
        // เช็คว่ากดเลือกหน้านี้อยู่หรือไม่
        const isActive =
          pathname === item.href || (item.href === "/pos" && pathname === "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`w-11 lg:w-12 h-11 lg:h-12 rounded-xl flex flex-col items-center justify-center transition active:scale-95 group ${
              isActive
                ? "bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/25 font-bold"
                : "text-slate-400 hover:text-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-950/30"
            }`}
          >
            <svg
              className={`w-5 h-5 ${isActive ? "stroke-[2.3]" : "stroke-[1.8]"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {item.icon}
            </svg>
            <span
              className={`text-[9px] mt-0.5 ${
                isActive ? "font-bold" : "font-medium"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      <div className="flex-1"></div>

      {/* ปุ่มตั้งค่า (Settings) */}
      <Link
        href="/settings"
        className={`w-11 lg:w-12 h-11 lg:h-12 rounded-xl flex flex-col items-center justify-center transition active:scale-95 group ${
          pathname === "/settings"
            ? "bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/25 font-bold"
            : "text-slate-400 hover:text-pos-text hover:bg-pos-hover"
        }`}
      >
        <svg
          className={`w-5 h-5 ${
            pathname === "/settings" ? "stroke-[2.3]" : "stroke-[1.8]"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={`text-[9px] mt-0.5 ${
            pathname === "/settings" ? "font-bold" : "font-medium"
          }`}
        >
          ตั้งค่า
        </span>
      </Link>
    </nav>
  );
}
