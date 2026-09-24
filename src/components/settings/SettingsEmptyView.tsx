'use client';

import React from 'react';

export default function SettingsEmptyView() {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn select-none">
      <div className="flex flex-col items-center">
        <div className="text-slate-300 dark:text-slate-600 mb-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium tracking-wide">
          เลือกหัวข้อจากรายการทางซ้าย
        </p>
      </div>
    </div>
  );
}
