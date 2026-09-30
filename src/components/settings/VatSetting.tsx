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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 mt-[4px] rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
          }`}
      />
    </button>
  );
}

type RoundingOption = 'nearest' | 'always_down' | 'none';
type VatTypeOption = 'included' | 'excluded';

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
    { id: 'nearest', label: 'ปัดใกล้สุด' },
    { id: 'always_down', label: 'ปัดลงเสมอ' },
    { id: 'none', label: 'ไม่ปัด' },
  ];

  return (
    <div>
      <p className="text-sm font-semibold text-pos-text mb-2.5">{label}</p>
      <div className="flex gap-2.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer ${value === opt.id
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                : 'bg-pos-bg hover:bg-pos-hover text-slate-500 dark:text-slate-400 font-semibold'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface VatSettingProps {
  onSwitchSection?: () => void;
}

export default function VatSetting({ onSwitchSection }: VatSettingProps) {
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const [vatType, setVatType] = useState<VatTypeOption>('included');
  const [cashRounding, setCashRounding] = useState<RoundingOption>('nearest');
  const [transferRounding, setTransferRounding] = useState<RoundingOption>('none');

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">

      {/* Card 1: ตั้งค่า VAT */}
      <div className="w-full rounded-3xl bg-pos-surface border border-pos-border shadow-2xs overflow-hidden transition-colors duration-300">

        {/* Toggle เปิดใช้ VAT */}
        <div className="flex items-center justify-between p-5">
          <p className="text-sm font-bold text-pos-text">
            เปิดใช้ VAT 7%
          </p>
          <ToggleSwitch
            checked={isVatEnabled}
            onChange={setIsVatEnabled}
          />
        </div>

        {/* ส่วนที่แสดงเมื่อเปิด VAT */}
        {isVatEnabled && (
          <div className="px-5 pb-5 animate-fadeIn">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              ราคาสินค้าที่ตั้งไว้
            </p>
            <div className="flex gap-2.5 mb-3.5">
              <button
                type="button"
                onClick={() => setVatType('included')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer ${vatType === 'included'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                    : 'bg-pos-bg hover:bg-pos-hover text-slate-500 dark:text-slate-400 font-semibold'
                  }`}
              >
                รวม VAT แล้ว
              </button>
              <button
                type="button"
                onClick={() => setVatType('excluded')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer ${vatType === 'excluded'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                    : 'bg-pos-bg hover:bg-pos-hover text-slate-500 dark:text-slate-400 font-semibold'
                  }`}
              >
                ยังไม่รวม VAT
              </button>
            </div>

            {/* คำเตือนเรื่องเลขผู้เสียภาษี */}
            <button
              type="button"
              onClick={onSwitchSection} // เพิ่ม onClick ตรงนี้
              className="text-[11px] sm:text-xs font-bold text-amber-500 hover:text-amber-600 underline decoration-amber-500/40 underline-offset-4 transition cursor-pointer"
            >
              ยังไม่ได้กรอกเลขผู้เสียภาษี
            </button>
          </div>
        )}
      </div>

      {/* Card 2: การปัดเศษ */}
      <div className="w-full rounded-3xl bg-pos-surface border border-pos-border shadow-2xs p-5 space-y-5 transition-colors duration-300">

        {/* ปัดเศษเงินสด */}
        <RoundingSelector
          label="ปัดเศษเงินสด"
          value={cashRounding}
          onChange={setCashRounding}
        />

        {/* ปัดเศษเงินโอน */}
        <div>
          <RoundingSelector
            label="ปัดเศษเงินโอน"
            value={transferRounding}
            onChange={setTransferRounding}
          />
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 font-medium">
            ยอดที่ลูกค้าต้องโอนและยอดในคิวอาร์พร้อมเพย์จะเป็นยอดหลังปัดแล้ว
          </p>
        </div>

      </div>
    </div>
  );
}