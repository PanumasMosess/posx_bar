'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/language/LanguageContext';

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
  options,
}: {
  label: string;
  value: RoundingOption;
  onChange: (v: RoundingOption) => void;
  options: { id: RoundingOption; label: string }[];
}) {
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
  const { t } = useTranslation();
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const [vatType, setVatType] = useState<VatTypeOption>('included');
  const [cashRounding, setCashRounding] = useState<RoundingOption>('nearest');
  const [transferRounding, setTransferRounding] = useState<RoundingOption>('none');

  const roundingOptions: { id: RoundingOption; label: string }[] = [
    { id: 'nearest', label: t('settings.round_nearest') },
    { id: 'always_down', label: t('settings.round_down') },
    { id: 'none', label: t('settings.round_none') },
  ];

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">

      {/* Card 1: ตั้งค่า VAT */}
      <div className="w-full rounded-3xl bg-pos-surface border border-pos-border shadow-2xs overflow-hidden transition-colors duration-300">

        {/* Toggle เปิดใช้ VAT */}
        <div className="flex items-center justify-between p-5">
          <p className="text-sm font-bold text-pos-text">
            {t('settings.vat_toggle')}
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
              {t('settings.vat_price_type')}
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
                {t('settings.vat_included')}
              </button>
              <button
                type="button"
                onClick={() => setVatType('excluded')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer ${vatType === 'excluded'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                    : 'bg-pos-bg hover:bg-pos-hover text-slate-500 dark:text-slate-400 font-semibold'
                  }`}
              >
                {t('settings.vat_excluded')}
              </button>
            </div>

            {/* คำเตือนเรื่องเลขผู้เสียภาษี */}
            <button
              type="button"
              onClick={onSwitchSection}
              className="text-[11px] sm:text-xs font-bold text-amber-500 hover:text-amber-600 underline decoration-amber-500/40 underline-offset-4 transition cursor-pointer"
            >
              {t('settings.vat_no_tax_id')}
            </button>
          </div>
        )}
      </div>

      {/* Card 2: การปัดเศษ */}
      <div className="w-full rounded-3xl bg-pos-surface border border-pos-border shadow-2xs p-5 space-y-5 transition-colors duration-300">

        {/* ปัดเศษเงินสด */}
        <RoundingSelector
          label={t('settings.cash_rounding')}
          value={cashRounding}
          onChange={setCashRounding}
          options={roundingOptions}
        />

        {/* ปัดเศษเงินโอน */}
        <div>
          <RoundingSelector
            label={t('settings.transfer_rounding')}
            value={transferRounding}
            onChange={setTransferRounding}
            options={roundingOptions}
          />
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 font-medium">
            {t('settings.rounding_transfer_hint')}
          </p>
        </div>

      </div>
    </div>
  );
}
