'use client';

import React, { useState } from 'react';

export default function MiscSetting() {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('095-XXX-X040');
  const [receiptFooter, setReceiptFooter] = useState('ขอบคุณที่ใช้บริการ / Thank you!');

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-5 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            เบอร์โทรศัพท์ร้านค้า
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#1694a4]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ที่อยู่ร้านค้า (แสดงบนใบเสร็จ)
          </label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="เช่น 123/45 ถนนสุขุมวิท ตำบลแสนสุข อำเภอเมืองชลบุรี ชลบุรี 20130"
            className="w-full max-w-lg px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1694a4]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ข้อความท้ายใบเสร็จ
          </label>
          <input
            type="text"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            className="w-full max-w-lg px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#1694a4]"
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => alert('บันทึกข้อมูลเรียบร้อย')}
            className="px-6 py-2.5 rounded-xl bg-[#1694a4] hover:bg-[#138290] text-white text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}

