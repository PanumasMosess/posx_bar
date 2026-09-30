'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEmployee } from '@/components/providers/EmployeeContext';

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 mt-[4px] rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

export default function RestaurantModeSetting() {
  const { organizationId } = useEmployee();
  const storageKey = `posx_restaurant_mode_${organizationId || 'default'}`;

  const [isRestaurantMode, setIsRestaurantMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`${storageKey}_enabled`);
        if (saved !== null) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return true;
  });

  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`${storageKey}_features`);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      'hold-bill': true,
      'send-kitchen': true,
      'qr-order': true,
      'invoice': true,
    };
  });

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_enabled`, JSON.stringify(isRestaurantMode));
    } catch (e) {
      console.error(e);
    }
  }, [isRestaurantMode, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_features`, JSON.stringify(activeFeatures));
    } catch (e) {
      console.error(e);
    }
  }, [activeFeatures, storageKey]);

  const features = [
    {
      id: 'hold-bill',
      title: 'การพักบิล',
      desc: 'สำหรับการสั่งสินค้าแต่ไม่ได้ชำระเงินทันที เช่น การสั่งแบบนั่งโต๊ะ หรือการสั่งไว้ก่อนแล้วค่อยมารับทีหลัง',
    },
    {
      id: 'send-kitchen',
      title: 'การส่งออเดอร์เข้าครัว',
      desc: 'สำหรับร้านที่ต้องการพิมพ์ใบส่งออเดอร์หรือส่งออเดอร์ให้กับหลังร้านเพื่อทำต่อ',
    },
    {
      id: 'qr-order',
      title: 'QR Order',
      desc: 'การสแกนสั่งหน้าร้านหรือสแกนสั่งที่โต๊ะ',
    },
    {
      id: 'invoice',
      title: 'ใบแจ้งหนี้',
      desc: 'แจ้งยอดให้ลูกค้าโอนชำระก่อนออกใบเสร็จ (พิมพ์ใบแจ้งหนี้หรือแชร์)',
    },
  ];

  const handleToggleMainMode = (checked: boolean) => {
    setIsRestaurantMode(checked);
    showToast(checked ? 'เปิดโหมดร้านอาหารแล้ว' : 'ปิดโหมดร้านอาหารแล้ว', 'success');
  };

  const toggleFeature = (id: string) => {
    setActiveFeatures((prev) => {
      const nextState = !prev[id];
      const updated = { ...prev, [id]: nextState };
      showToast(nextState ? 'เปิดใช้งานฟีเจอร์แล้ว' : 'ปิดใช้งานฟีเจอร์แล้ว', 'success');
      return updated;
    });
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/80 dark:border-teal-700 dark:text-teal-100'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'
            }`}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. กล่องการ์ดเปิดโหมดร้านอาหาร */}
      <div className="w-full rounded-2xl border border-pos-border dark:border-slate-500/40 p-4 sm:p-5 bg-pos-surface shadow-2xs flex items-center justify-between transition-colors duration-300">
        <span className="text-sm font-bold text-pos-text">
          เปิดโหมดร้านอาหาร
        </span>

        <ToggleSwitch
          checked={isRestaurantMode}
          onChange={handleToggleMainMode}
        />
      </div>

      {/* 2. รายการฟีเจอร์ย่อย พร้อมเส้นคั่นประ */}
      {isRestaurantMode && (
        <div className="pt-2 animate-fadeIn divide-y divide-dashed divide-pos-border dark:divide-slate-500/40">
          {features.map((item) => {
            const isActive = !!activeFeatures[item.id];

            return (
              <div
                key={item.id}
                onClick={() => toggleFeature(item.id)}
                className="py-4 first:pt-2 last:pb-2 flex items-start gap-3.5 cursor-pointer group transition select-none"
              >
                {/* Checkmark วงกลม (เปิด = ฟ้า sky-500 พร้อมเครื่องหมายถูกสีขาว / ปิด = ขอบเทา) */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs transition-colors duration-200 ${
                    isActive
                      ? 'bg-sky-500 text-white'
                      : 'bg-transparent text-transparent border-2 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <svg
                    className={`w-3 h-3 stroke-[3] transition-opacity duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                {/* ชื่อฟีเจอร์ และคำอธิบาย */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-bold leading-tight transition-colors ${
                      isActive
                        ? 'text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}