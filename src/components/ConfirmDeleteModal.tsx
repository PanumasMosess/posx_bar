"use client";

import { ConfirmDeleteModalProps } from "@/lib/types/interface";

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  isPending = false,
  confirmText = "ยืนยันลบข้อมูล",
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-pos-surface border border-pos-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          {/* ไอคอนถังขยะสีแดง */}
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 border-8 border-rose-50/50 dark:border-rose-900/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-rose-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </div>

          <h3 className="text-xl font-bold text-pos-text mb-2">{title}</h3>
          <p className="text-sm text-pos-text/60 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-3 bg-pos-bg text-pos-text rounded-2xl font-bold hover:bg-pos-hover border border-pos-border transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    ></circle>
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="opacity-75"
                    ></path>
                  </svg>
                  กำลังดำเนินการ...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
