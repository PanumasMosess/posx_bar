'use client';

import React, { useState } from 'react';

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
        checked ? 'bg-[#1694a4]' : 'bg-slate-200 dark:bg-slate-700'
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
  const [isRestaurantMode, setIsRestaurantMode] = useState(true);

  // 1. เพิ่ม State สำหรับจัดการสถานะเปิด/ปิด ของแต่ละฟีเจอร์ย่อย
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({
    'hold-bill': true,
    'send-kitchen': true,
    'qr-order': true,
    'invoice': true,
  });

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
      desc: 'แจ้งยอดให้ลูกค้าโอนชำระก่อนออกใบเสร็จ (พิมพ์ใบแจ้งหนี้/เรียกแชร์)',
    },
  ];

  // ฟังก์ชันสลับสถานะของฟีเจอร์ย่อย
  const toggleFeature = (id: string) => {
    setActiveFeatures((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-6">
      {/* 1. กล่องการ์ดเปิดโหมดร้านอาหาร */}
      <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-4 sm:p-5 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
          เปิดโหมดร้านอาหาร
        </span>

        <ToggleSwitch
          checked={isRestaurantMode}
          onChange={setIsRestaurantMode}
        />
      </div>

      {/* 2. รายการฟีเจอร์ย่อย */}
      {isRestaurantMode && (
        <div className="space-y-6 pt-1 px-1 animate-fadeIn">
          {features.map((item) => {
            const isActive = activeFeatures[item.id]; // เช็คว่าปัจจุบันเปิดหรือปิดอยู่

            return (
              <div 
                key={item.id} 
                className="flex items-start gap-3.5 cursor-pointer group"
                onClick={() => toggleFeature(item.id)} // 2. เพิ่ม onClick เพื่อให้กดได้ทั้งแถว
              >
                {/* 3. ปรับสไตล์วงกลมตามสถานะ (เปิด = สีฟ้า-เขียว / ปิด = วงกลมใสๆ ขอบเทา) */}
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs transition-colors duration-200 ${
                    isActive 
                      ? 'bg-[#1694a4] text-white border-transparent' 
                      : 'bg-transparent text-transparent border-[1.5px] border-slate-300 dark:border-slate-500'
                  }`}
                >
                  <svg 
                    className={`w-3 h-3 stroke-[3] transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight transition-colors group-hover:text-[#1694a4]">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">
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