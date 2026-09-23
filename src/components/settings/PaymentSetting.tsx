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

export default function PaymentSetting() {
  const [payments, setPayments] = useState([
    { id: 'cash', name: 'เงินสด', desc: 'รับชำระด้วยเงินสดและทอนเงิน', enabled: true, icon: '💵' },
    { id: 'transfer', name: 'โอนเงิน / PromptPay', desc: 'สแกน QR Code รับโอนเงินเข้าบัญชี', enabled: true, icon: '📱' },
    { id: 'credit', name: 'บัตรเครดิต / เดบิต', desc: 'รูดบัตรหรือแตะชำระผ่านเครื่อง EDC', enabled: false, icon: '💳' },
    { id: 'custom', name: 'คนละครึ่ง / บัตรสวัสดิการ', desc: 'ช่องทางชำระเงินของรัฐบาลหรืออื่นๆ', enabled: false, icon: '🏛️' },
  ]);

  const handleToggle = (id: string, enabled: boolean) => {
    setPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled } : item))
    );
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">
      {/* List of payment methods */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
        {payments.map((p) => (
          <div
            key={p.id}
            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                {p.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {p.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{p.desc}</p>
              </div>
            </div>

            <ToggleSwitch
              checked={p.enabled}
              onChange={(val) => handleToggle(p.id, val)}
            />
          </div>
        ))}
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 text-xs text-[#0f766e] dark:text-teal-300 flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <p className="leading-relaxed">
          ช่องทางชำระเงินที่เปิดใช้งานจะปรากฏบนหน้าจอคิดเงินแคชเชียร์ทันที
        </p>
      </div>
    </div>
  );
}

