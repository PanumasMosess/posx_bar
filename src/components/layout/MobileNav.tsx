"use client";

interface MobileNavProps {
  onToggleCart: () => void;
}

export default function MobileNav({ onToggleCart }: MobileNavProps) {
  return (
    <nav className="md:hidden w-full mt-auto bg-pos-surface border-t border-pos-border px-2 pt-1 pb-[calc(4px+env(safe-area-inset-bottom))] flex items-center justify-around shrink-0 z-30 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] min-h-[56px]">
      <button className="flex flex-col items-center justify-center py-1 text-sky-600 w-14">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path
            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.651V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009 9.35c.694 0 1.343-.238 1.862-.64a3.001 3.001 0 004.276 0A2.993 2.993 0 0017 9.35c.783 0 1.507-.3 2.05-.801a3.001 3.001 0 001.34 2.14"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span className="text-[9px] font-bold mt-0.5">ขาย</span>
      </button>
      <button className="flex flex-col items-center justify-center py-1 text-slate-500 w-14">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span className="text-[9px] font-medium mt-0.5">รายงาน</span>
      </button>
      <button className="flex flex-col items-center justify-center py-1 text-slate-500 w-14">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span className="text-[9px] font-medium mt-0.5">คลัง</span>
      </button>
      <button
        onClick={onToggleCart}
        className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-sky-600 relative w-14"
      >
        <div className="relative">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">
            1
          </span>
        </div>
        <span className="text-[9px] font-medium mt-0.5">ตะกร้า</span>
      </button>
      <button className="flex flex-col items-center justify-center py-1 text-slate-500 w-14">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span className="text-[9px] font-medium mt-0.5">ตั้งค่า</span>
      </button>
    </nav>
  );
}
