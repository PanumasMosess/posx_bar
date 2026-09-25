"use client";

interface LogoutLoadingModalProps {
  isOpen: boolean;
}

export default function LogoutLoadingModal({
  isOpen,
}: LogoutLoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-pos-surface border border-pos-border rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center min-w-[280px]">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black text-pos-text mb-2">
          กำลังออกจากระบบ
        </h3>
        <p className="text-sm font-semibold text-slate-500">โปรดรอสักครู่...</p>
      </div>
    </div>
  );
}
