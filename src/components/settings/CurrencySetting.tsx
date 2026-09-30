'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { updateCurrencyAction, getShopProfileSettings } from '@/lib/actions/actionsSettings';
import { useEmployee } from '@/components/providers/EmployeeContext';

export interface CurrencyItem {
  code: string;
  symbol: string;
}

export const ALL_CURRENCIES: CurrencyItem[] = [
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
  organizationId?: number;
  currentCurrency?: string;
  onSelectCurrency?: (code: string, label: string) => void;
}

export default function CurrencySetting({
  organizationId: propOrgId,
  currentCurrency = 'THB',
  onSelectCurrency,
}: CurrencySettingProps) {
  const { organizationId: contextOrgId } = useEmployee();
  const orgId = propOrgId || contextOrgId || 0;

  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(currentCurrency);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ดึงข้อมูลสกุลเงินปัจจุบันจาก Database ตอนเปิดส่วนนี้
  useEffect(() => {
    const fetchSetting = async () => {
      if (!orgId) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getShopProfileSettings(orgId);
        if (profile?.currencyCode) {
          setSelectedCode(profile.currencyCode);
        }
      } catch (error) {
        console.error('Failed to load currency setting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, [orgId]);

  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = async (cur: CurrencyItem) => {
    if (!orgId) {
      showToast('ไม่พบข้อมูลองค์กร กรุณาลองใหม่อีกครั้ง', 'error');
      return;
    }

    const previousCode = selectedCode;
    setSelectedCode(cur.code);
    setIsSaving(true);

    const formattedLabel = cur.code === 'THB' ? 'บาท · THB' : `${cur.symbol} · ${cur.code}`;

    try {
      await updateCurrencyAction(orgId, cur.code);
      showToast(`อัปเดตสกุลเงินเป็น ${cur.code} เรียบร้อยแล้ว`, 'success');
      if (onSelectCurrency) {
        onSelectCurrency(cur.code, formattedLabel);
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      setSelectedCode(previousCode);
      showToast('เกิดข้อผิดพลาดในการบันทึกสกุลเงิน', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-3 animate-fadeIn pb-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${toast.type === 'success'
                ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/80 dark:border-teal-700 dark:text-teal-100'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'
              }`}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Input Search */}
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
          className="w-full pl-9 pr-4 py-2 rounded-2xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-500 cursor-pointer text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="w-full py-10 text-center text-slate-400 dark:text-slate-500 bg-pos-bg rounded-2xl border border-dashed border-pos-border">
          <p className="text-xs font-medium animate-pulse">กำลังโหลดข้อมูลสกุลเงิน...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {filteredCurrencies.map((cur) => {
            const isSelected = selectedCode === cur.code;
            return (
              <button
                key={cur.code}
                type="button"
                disabled={isSaving}
                onClick={() => handleSelect(cur)}
                className={`relative py-2 px-2 rounded-xl sm:rounded-2xl transition-all text-center flex flex-col items-center justify-center h-[52px] sm:h-[56px] cursor-pointer select-none disabled:opacity-50 ${isSelected
                    ? 'bg-pos-surface border-2 border-sky-500 shadow-2xs'
                    : 'bg-pos-bg hover:bg-pos-hover border border-transparent'
                  }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-2xs">
                    <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}

                <span
                  className={`text-sm sm:text-base font-bold leading-tight ${isSelected ? 'text-pos-text' : 'text-pos-text opacity-90'
                    }`}
                >
                  {cur.symbol}
                </span>

                <span
                  className={`text-[10px] sm:text-[11px] mt-0.5 tracking-wider leading-tight ${isSelected ? 'text-pos-text font-bold' : 'text-slate-400 dark:text-slate-500 font-semibold'
                    }`}
                >
                  {cur.code}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && filteredCurrencies.length === 0 && (
        <div className="w-full py-10 text-center text-slate-400 dark:text-slate-500 bg-pos-surface rounded-2xl border border-dashed border-pos-border">
          <p className="text-xs font-medium">ไม่พบสกุลเงินที่ค้นหา &ldquo;{search}&rdquo;</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">ลองพิมพ์ด้วยรหัสย่อ เช่น THB, USD หรือ EUR</p>
        </div>
      )}
    </div>
  );
}