'use client';

import React, { useState } from 'react';

function ChevronDown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function ScanSetting() {
  const [isQrAccordionOpen, setIsQrAccordionOpen] = useState(false);
  const [showAddQrModal, setShowAddQrModal] = useState(false);

  // Modal State
  const [qrType, setQrType] = useState<'table' | 'counter'>('table');
  const [usageMethod, setUsageMethod] = useState<'permanent' | 'new_each_time'>('permanent');
  const [requirePin, setRequirePin] = useState(false);
  const [pinRotation, setPinRotation] = useState<'bill' | 'hourly' | 'manual'>('bill');
  const [qrExpiry, setQrExpiry] = useState<'bill' | '1h' | '2h' | '4h'>('bill');

  const [creationMode, setCreationMode] = useState<'single' | 'batch'>('single');
  const [singleTableNum, setSingleTableNum] = useState('');
  const [fromNum, setFromNum] = useState('1');
  const [toNum, setToNum] = useState('20');
  const [prefix, setPrefix] = useState('');
  const [padZero, setPadZero] = useState(false);

  // Calculate table preview
  const fromVal = parseInt(fromNum) || 1;
  const toVal = parseInt(toNum) || 1;
  const count = Math.max(0, toVal - fromVal + 1);

  const formatNum = (n: number) => {
    const s = n.toString();
    if (!padZero) return s;
    return s.padStart(2, '0');
  };

  const previewSummary =
    creationMode === 'batch'
      ? `จะได้ ${count} โต๊ะ : ${prefix ? prefix : ''}${formatNum(fromVal)} ถึง ${prefix ? prefix : ''}${formatNum(toVal)}`
      : `โต๊ะเลขที่ : ${singleTableNum || 'ยังไม่ได้ระบุ'}`;

  // Menu items list matching screenshot 1
  const scanMenuItems = [
    {
      id: 'open-close-order',
      title: 'การเปิด-ปิดรับออเดอร์',
      desc: 'กำหนดเอง',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
        </svg>
      ),
    },
    {
      id: 'order-conditions',
      title: 'เงื่อนไขการสั่ง',
      desc: 'บังคับกรอกเบอร์โทร',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      ),
    },
    {
      id: 'payment',
      title: 'การชำระเงิน',
      desc: 'เงินสด',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
        </svg>
      ),
    },
    {
      id: 'auto-close-bill',
      title: 'การปิดบิลอัตโนมัติ',
      desc: 'ไม่ได้ใช้งาน',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      id: 'display',
      title: 'การแสดงผล',
      desc: 'เหมือนหน้าขาย · กริด 3 คอลัมน์ · แสดงราคา',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
        </svg>
      ),
    },
    {
      id: 'hide-customer-side',
      title: 'ปิดขายฝั่งลูกค้า',
      desc: 'ลูกค้าเห็นครบทุกรายการ',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ),
    },
    {
      id: 'promotions',
      title: 'โปรโมชั่น',
      desc: '',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.87 2.664.408l4.453-2.327c.884-.462 1.343-1.464 1.114-2.434l-1.32-5.61a2.25 2.25 0 00-.66-1.121L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'voice-call',
      title: 'การเรียกคิวด้วยเสียง',
      desc: 'ปิดอยู่',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      ),
    },
    {
      id: 'call-notify',
      title: 'แจ้งเตือนเมื่อลูกค้าเรียก',
      desc: 'เปิดที่แอปเครื่องนี้',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">
      {/* Outer Card with Rows (ตรงตามรูปที่ 1 และ 2 ของต้นฉบับเป๊ะๆ) */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
        {/* 1. Accordion Item: QR Code (กดแล้วกางลงมาตามรูปที่ 2) */}
        <div>
          <div
            onClick={() => setIsQrAccordionOpen(!isQrAccordionOpen)}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-750 transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-slate-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h3v3h-3v-3zM18 18h2.25v2.25H18V18zM13.5 19.5h2.25V21H13.5v-1.5z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                QR Code
              </span>
            </div>

            <div className={`text-slate-400 transition-transform duration-200 ${isQrAccordionOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* กางลงมา: Badge "สแกนหน้าร้านและโต๊ะ" + แถบยาวสีเทา "เพิ่ม QR Code" (ตรงตามรูปที่ 2 เป๊ะ!) */}
          {isQrAccordionOpen && (
            <div className="px-4 sm:px-5 pb-5 pt-1 bg-white dark:bg-slate-800 animate-fadeIn space-y-3">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full font-medium">
                  สแกนหน้าร้านและโต๊ะ
                </span>
              </div>

              {/* ปุ่มแถบสีเทาตรงกลางเต็มแถว (ตามรูปที่ 2) */}
              <button
                type="button"
                onClick={() => setShowAddQrModal(true)}
                className="w-full py-3 rounded-2xl bg-[#edf2f6] hover:bg-slate-200/80 dark:bg-slate-700/60 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition cursor-pointer text-center"
              >
                เพิ่ม QR Code
              </button>
            </div>
          )}
        </div>

        {/* 2. รายการเมนูอื่นๆ ถัดมา 9 รายการ */}
        {scanMenuItems.map((item) => (
          <div
            key={item.id}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-750 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-slate-400 dark:text-slate-400 shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {item.title}
                </p>
                {item.desc && (
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                )}
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
          </div>
        ))}
      </div>

      {/* ==================== MODAL: เพิ่ม QR Code ==================== */}
      {showAddQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700 overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#1694a4] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">เพิ่ม QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddQrModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scroll">
              {/* ประเภท: [ โต๊ะ ] [ หน้าร้าน ] */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">ประเภท</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-750 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setQrType('table')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      qrType === 'table'
                        ? 'bg-[#d7f3f5] text-[#0f828e] shadow-2xs dark:bg-teal-900/60 dark:text-teal-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>🪑</span> โต๊ะ
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrType('counter')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      qrType === 'counter'
                        ? 'bg-[#d7f3f5] text-[#0f828e] shadow-2xs dark:bg-teal-900/60 dark:text-teal-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>🏪</span> หน้าร้าน
                  </button>
                </div>
              </div>

              {/* วิธีใช้ป้าย */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">วิธีใช้ป้าย</label>
                <div className="space-y-2">
                  <div
                    onClick={() => setUsageMethod('permanent')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      usageMethod === 'permanent'
                        ? 'bg-[#d7f3f5]/70 dark:bg-teal-950/40 border-[#1694a4]/40 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <p className={`text-xs font-bold ${usageMethod === 'permanent' ? 'text-[#0f766e] dark:text-teal-200' : 'text-slate-700 dark:text-slate-200'}`}>
                      แปะไว้ที่โต๊ะ
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      พิมพ์ครั้งเดียวแล้วติดถาวร ลูกค้าสแกนสั่งได้ทันที
                    </p>
                  </div>

                  <div
                    onClick={() => setUsageMethod('new_each_time')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      usageMethod === 'new_each_time'
                        ? 'bg-[#d7f3f5]/70 dark:bg-teal-950/40 border-[#1694a4]/40 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <p className={`text-xs font-bold ${usageMethod === 'new_each_time' ? 'text-[#0f766e] dark:text-teal-200' : 'text-slate-700 dark:text-slate-200'}`}>
                      พิมพ์ใหม่ทุกครั้ง
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      พนักงานกดเปิดโต๊ะเพื่อออก QR ใหม่
                    </p>
                  </div>
                </div>
              </div>

              {/* ความปลอดภัย / อายุ QR */}
              {usageMethod === 'permanent' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">ความปลอดภัย</label>
                  <div
                    onClick={() => setRequirePin(!requirePin)}
                    className="flex items-center gap-2.5 cursor-pointer select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        requirePin ? 'bg-[#1694a4] text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {requirePin && (
                        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      ต้องกรอกรหัส 4 หลักจากพนักงาน
                    </span>
                  </div>

                  {!requirePin && (
                    <p className="text-[11px] font-bold text-rose-500 pl-7 animate-fadeIn">
                      ร้านมีความเสี่ยงที่ลูกค้าจะสั่งของมาจากบุคคลภายนอก
                    </p>
                  )}

                  {requirePin && (
                    <div className="pl-7 space-y-1.5 pt-1 animate-fadeIn">
                      <p className="text-[11px] text-slate-400 font-medium">เปลี่ยนรหัสเมื่อ</p>
                      <div className="flex gap-2">
                        {[
                          { id: 'bill' as const, label: 'เช็คบิล' },
                          { id: 'hourly' as const, label: 'ทุกชั่วโมง' },
                          { id: 'manual' as const, label: 'กดเปลี่ยนเอง' },
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setPinRotation(id)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                              pinRotation === id
                                ? 'bg-[#d7f3f5] text-[#0f828e] font-bold dark:bg-teal-900/60 dark:text-teal-200'
                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">อายุการใช้งาน QR Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bill' as const, label: 'เช็คบิลแล้วหมดอายุ' },
                      { id: '1h' as const, label: 'หมดอายุใน 1 ชม.' },
                      { id: '2h' as const, label: 'หมดอายุใน 2 ชม.' },
                      { id: '4h' as const, label: 'หมดอายุใน 4 ชม.' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setQrExpiry(id)}
                        className={`py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          qrExpiry === id
                            ? 'bg-[#d7f3f5] text-[#0f828e] font-bold dark:bg-teal-900/60 dark:text-teal-200 border border-[#1694a4]/40'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* สร้าง: [ ทีละใบ ] [ เป็นชุด ] */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">สร้าง</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-750 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setCreationMode('single')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      creationMode === 'single'
                        ? 'bg-[#d7f3f5] text-[#0f828e] shadow-2xs dark:bg-teal-900/60 dark:text-teal-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    ทีละใบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('batch')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      creationMode === 'batch'
                        ? 'bg-[#d7f3f5] text-[#0f828e] shadow-2xs dark:bg-teal-900/60 dark:text-teal-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    เป็นชุด
                  </button>
                </div>

                {creationMode === 'single' ? (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">เลขโต๊ะ</label>
                    <input
                      type="text"
                      value={singleTableNum}
                      onChange={(e) => setSingleTableNum(e.target.value)}
                      placeholder="เช่น 5, A1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1694a4]"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">จากเลข</label>
                        <input
                          type="number"
                          min="1"
                          value={fromNum}
                          onChange={(e) => setFromNum(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-[#1694a4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">ถึงเลข</label>
                        <input
                          type="number"
                          min="1"
                          value={toNum}
                          onChange={(e) => setToNum(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-[#1694a4]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">ตัวนำหน้า</label>
                      <input
                        type="text"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="เช่น A (ไม่ใส่ก็ได้)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-[#1694a4] placeholder-slate-400"
                      />
                    </div>

                    <div
                      onClick={() => setPadZero(!padZero)}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors ${
                          padZero ? 'bg-[#1694a4] text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {padZero && (
                          <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        เติมศูนย์หน้าเลข (01, 002)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#e6f7f8] dark:bg-teal-950/40 border border-[#1694a4]/20 text-center">
                      <p className="text-xs font-bold text-[#0f828e] dark:text-teal-300">
                        {previewSummary}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => {
                  alert(`บันทึกการสร้าง QR Code เรียบร้อย (${previewSummary})`);
                  setShowAddQrModal(false);
                }}
                className="w-full py-3 rounded-2xl bg-[#1694a4] hover:bg-[#138290] text-white text-sm font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
