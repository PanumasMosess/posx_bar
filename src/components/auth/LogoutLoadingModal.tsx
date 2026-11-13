"use client";

import { useTranslation } from "@/lib/language/LanguageContext";

interface LogoutLoadingModalProps {
  isOpen: boolean;
}

export default function LogoutLoadingModal({
  isOpen,
}: LogoutLoadingModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-pos-surface border border-pos-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black text-pos-text mb-2">
          {t("auth.logging_out")}
        </h3>
        <p className="text-sm font-semibold text-slate-500">
          {t("auth.please_wait")}
        </p>
      </div>
    </div>
  );
}
