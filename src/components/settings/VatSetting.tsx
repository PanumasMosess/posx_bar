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

type RoundingOption = 'nearest' | 'always_up' | 'none';

function RoundingSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RoundingOption;
  onChange: (v: RoundingOption) => void;
}) {
  const options: { id: RoundingOption; label: string }[] = [
    { id: 'nearest', label: 'ปิดใกล้สุด' },
    { id: 'always_up', label: 'ปิดออกเสมอ' },
    { id: 'none', label: 'ไม่ปิด' },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              value === opt.id
                ? 'bg-[#d7f3f5] text-[#0f828e] font-bold dark:bg-teal-900/60 dark:text-teal-200'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VatSetting() {
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const [cashRounding, setCashRounding] = useState<RoundingOption>('nearest');
  const [transferRounding, setTransferRounding] = useState<RoundingOption>('none');

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">
      {/* Card: เปิดใช้ VAT + การปัดเศษ */}
      <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs overflow-hidden">

        {/* 1. Toggle: เปิดใช้ VAT 7% */}
        <div className="flex items-center justify-between p-4 sm:p-5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            เปิดใช้ VAT 7%
          </p>
          <ToggleSwitch
            checked={isVatEnabled}
            onChange={setIsVatEnabled}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-700/50 mx-4" />

        {/* 2. ปัดเศษเงินสด */}
        <div className="p-4 sm:p-5">
          <RoundingSelector
            label="ปัดเศษเงินสด"
            value={cashRounding}
            onChange={setCashRounding}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-700/50 mx-4" />

        {/* 3. ปัดเศษเงินโอน */}
        <div className="p-4 sm:p-5">
          <RoundingSelector
            label="ปัดเศษเงินโอน"
            value={transferRounding}
            onChange={setTransferRounding}
          />
        </div>

        {/* คำอธิบาย */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            ยอดที่ลูกค้าโอนมาจะถูกปัดเศษก่อนบันทึก เพื่อความสะดวกในการรับเงินและออกใบเสร็จ
          </p>
        </div>
      </div>
    </div>
  );
}
