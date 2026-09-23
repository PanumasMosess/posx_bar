'use client';

import React, { useState, useMemo } from 'react';

export interface CurrencyItem {
  code: string;
  symbol: string;
}

// รายการสกุลเงินทั้งหมด 60 สกุลเงิน ตรงตามรูปที่ 2 ของต้นฉบับทุกประการ
export const ALL_CURRENCIES: CurrencyItem[] = [
  // --- แถวที่ 1 ถึง 9 (ตรงตามรูปที่ 2 เป๊ะๆ) ---
  { code: 'THB', symbol: '฿' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CNY', symbol: '¥' },
  { code: 'SGD', symbol: '$' },
  { code: 'MYR', symbol: 'RM' },
  { code: 'VND', symbol: '₫' },
  { code: 'IDR', symbol: 'Rp' },
  { code: 'PHP', symbol: '₱' },
  { code: 'KRW', symbol: '₩' },
  { code: 'TWD', symbol: 'NT$' },
  { code: 'HKD', symbol: '$' },
  { code: 'AUD', symbol: '$' },
  { code: 'NZD', symbol: '$' },
  { code: 'CAD', symbol: '$' },
  { code: 'INR', symbol: '₹' },
  { code: 'AED', symbol: 'AED' },
  { code: 'LAK', symbol: '₭' },
  { code: 'KHR', symbol: '៛' },
  { code: 'MMK', symbol: 'K' },
  { code: 'BND', symbol: '$' },
  { code: 'MOP', symbol: 'MOP' },
  { code: 'MNT', symbol: '₮' },
  { code: 'BDT', symbol: '৳' },
  { code: 'LKR', symbol: 'Rs' },

  // --- สกุลเงินเพิ่มเติมอื่นๆ ---
  { code: 'NPR', symbol: 'Rs' },
  { code: 'PKR', symbol: 'Rs' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'NOK', symbol: 'kr' },
  { code: 'DKK', symbol: 'kr' },
  { code: 'PLN', symbol: 'zł' },
  { code: 'CZK', symbol: 'Kč' },
  { code: 'HUF', symbol: 'Ft' },
  { code: 'RON', symbol: 'lei' },
  { code: 'RUB', symbol: '₽' },
  { code: 'TRY', symbol: '₺' },
  { code: 'UAH', symbol: '₴' },
  { code: 'SAR', symbol: 'SAR' },
  { code: 'QAR', symbol: 'QAR' },
  { code: 'KWD', symbol: 'KWD' },
  { code: 'BHD', symbol: 'BHD' },
  { code: 'OMR', symbol: 'OMR' },
  { code: 'JOD', symbol: 'JOD' },
  { code: 'ILS', symbol: '₪' },
  { code: 'EGP', symbol: 'E£' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'NGN', symbol: '₦' },
  { code: 'KES', symbol: 'KES' },
  { code: 'MAD', symbol: 'MAD' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'MXN', symbol: '$' },
  { code: 'ARS', symbol: '$' },
  { code: 'CLP', symbol: '$' },
  { code: 'COP', symbol: '$' },
  { code: 'PEN', symbol: 'PEN' },
  { code: 'FJD', symbol: '$' },
  { code: 'PGK', symbol: 'PGK' },
];

interface CurrencySettingProps {
  currentCurrency?: string;
  onSelectCurrency?: (code: string, label: string) => void;
}

export default function CurrencySetting({
  currentCurrency = 'THB',
  onSelectCurrency,
}: CurrencySettingProps) {
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(currentCurrency);

  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (cur: CurrencyItem) => {
    setSelectedCode(cur.code);
    if (onSelectCurrency) {
      onSelectCurrency(cur.code, `${cur.code === 'THB' ? 'บาท · THB' : `${cur.symbol} · ${cur.code}`}`);
    }
  };

  return (
    <div className="w-full space-y-3 animate-fadeIn pb-6">
      {/* Search Input Box กะทัดรัด (ตรงตามรูปที่ 2 ของต้นฉบับ) */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="พิมพ์รหัสหรือชื่อสกุลเงิน เช่น USD"
          className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1694a4] transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Grid 3 คอลัมน์ ขนาดเล็กกะทัดรัด สวยงาม ใช้ง่าย (ตรงตามรูปที่ 2 ของต้นฉบับเป๊ะๆ) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {filteredCurrencies.map((cur) => {
          const isSelected = selectedCode === cur.code;
          return (
            <button
              key={cur.code}
              type="button"
              onClick={() => handleSelect(cur)}
              className={`relative py-2 px-2 rounded-xl sm:rounded-2xl transition-all text-center flex flex-col items-center justify-center h-[52px] sm:h-[56px] cursor-pointer select-none ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-2 border-slate-800 dark:border-teal-400 shadow-2xs'
                  : 'bg-[#f4f6f8] hover:bg-[#ebf0f4] dark:bg-slate-750 dark:hover:bg-slate-700 border border-transparent'
              }`}
            >
              {/* ตราวงกลมสีเขียวเข้มพร้อมเครื่องหมายถูกมุมขวาบนเมื่อเลือก (ตามรูปที่ 2) */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#114b4f] dark:bg-teal-400 text-white dark:text-slate-900 flex items-center justify-center shadow-2xs">
                  <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}

              {/* Currency Symbol (สัญลักษณ์) */}
              <span
                className={`text-sm sm:text-base font-bold leading-tight ${
                  isSelected
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {cur.symbol}
              </span>

              {/* Currency Code (รหัสสกุลเงิน) */}
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-wider leading-tight ${
                  isSelected
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                {cur.code}
              </span>
            </button>
          );
        })}
      </div>

      {filteredCurrencies.length === 0 && (
        <div className="w-full py-10 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium">ไม่พบสกุลเงินที่ค้นหา &ldquo;{search}&rdquo;</p>
          <p className="text-[11px] text-slate-400 mt-0.5">ลองพิมพ์ด้วยรหัสย่อ เช่น THB, USD หรือ EUR</p>
        </div>
      )}
    </div>
  );
}
