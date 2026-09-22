"use client";

import { useState } from "react";

interface FloatingSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function FloatingSearch({
  searchTerm,
  setSearchTerm,
}: FloatingSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sticky bottom-4 left-4 md:left-6 z-40 mt-auto pointer-events-none flex flex-col-reverse items-start gap-3 w-fit pl-2 pb-2">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-tr from-sky-600 to-cyan-500 text-white rounded-full shadow-lg shadow-sky-500/40 flex items-center justify-center hover:scale-105 transition-all active:scale-95 outline-none focus:outline-none border-none"
          title="ค้นหาสินค้า"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            ></path>
          </svg>
        </button>
      ) : (
        <div className="pointer-events-auto bg-pos-surface p-1.5 rounded-full shadow-xl flex items-center gap-2 w-[85vw] sm:w-[350px] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-200 transition-all origin-bottom-left border-none">
          <div className="pl-3.5 text-sky-500">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              ></path>
            </svg>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="ค้นหา ชื่อ, รหัส (Code), ราคา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-pos-text placeholder-slate-400 py-2 w-full font-medium"
          />
          <button
            onClick={() => {
              setIsOpen(false);
              setSearchTerm("");
            }}
            className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 rounded-full transition-colors shrink-0 mr-0.5 outline-none focus:outline-none border-none"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
