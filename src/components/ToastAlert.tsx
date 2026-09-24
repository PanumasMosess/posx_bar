"use client";

import { ToastAlertProps } from "@/lib/interface";
import { useEffect } from "react";

export default function ToastAlert({
  isOpen,
  message,
  type = "success",
  onClose,
}: ToastAlertProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: "bg-white border-green-500 text-green-700 shadow-green-500/10",
    error: "bg-white border-red-500 text-red-700 shadow-red-500/10",
    info: "bg-white border-sky-500 text-sky-700 shadow-sky-500/10",
  };

  const icons = {
    success: (
      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    ),
    error: (
      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    ),
    info: (
      <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0 text-sky-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    ),
  };

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-[90vw] animate-in slide-in-from-right-8 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-l-4 shadow-xl ${styles[type]}`}
      >
        {icons[type]}
        <span className="text-sm font-bold pr-4">{message}</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition ml-auto shrink-0"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
