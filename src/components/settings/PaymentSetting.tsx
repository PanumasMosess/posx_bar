'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEmployee } from '@/components/providers/EmployeeContext';

/* ==================== SVG Icons ==================== */
function CashHandIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 13" />
      <circle cx="16" cy="6" r="3" />
    </svg>
  );
}

function QrTransferIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <circle cx="17.5" cy="17.5" r="1.75" fill="currentColor" />
      <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CardIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function SplitBranchIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="6" r="2" />
      <path d="M6 8v8" />
      <path d="M6 12h5a5 5 0 0 0 5-5V8" />
    </svg>
  );
}

function WalletIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <rect x="15" y="9" width="7" height="6" rx="2" />
      <circle cx="18.5" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ChevronUpIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PhoneIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function ImageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
    </svg>
  );
}

function UploadArrowIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/* ==================== Types ==================== */
export type PaymentChannelType = 'cash' | 'transfer' | 'credit' | 'split' | 'custom';

export interface PaymentChannel {
  id: string;
  type: PaymentChannelType;
  title: string;
  subtext?: string;
  canExpand: boolean;
  config: {
    // for transfer
    transferTab?: 'phone' | 'id_card' | 'qr';
    phone?: string;
    idCard?: string;
    accountName?: string;
    qrImageUrl?: string | null;
    // for credit
    creditCardFee?: number;
    // for custom
    customName?: string;
  };
}

const DEFAULT_CHANNELS: PaymentChannel[] = [
  {
    id: 'cash',
    type: 'cash',
    title: 'เงินสด',
    canExpand: false,
    config: {},
  },
  {
    id: 'transfer',
    type: 'transfer',
    title: 'โอนเงิน',
    subtext: 'ยังไม่ได้ตั้งค่า',
    canExpand: true,
    config: {
      transferTab: 'id_card',
      phone: '',
      idCard: '',
      accountName: '',
      qrImageUrl: null,
    },
  },
];

/* ==================== Main Component ==================== */
export default function PaymentSetting() {
  const { organizationId } = useEmployee();
  const storageKey = `posx_payment_channels_${organizationId || 'default'}`;

  const [channels, setChannels] = useState<PaymentChannel[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_CHANNELS;
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Transfer Form State
  const [transferTab, setTransferTab] = useState<'phone' | 'id_card' | 'qr'>('id_card');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferIdCard, setTransferIdCard] = useState('');
  const [transferAccountName, setTransferAccountName] = useState('');
  const [transferQrImage, setTransferQrImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Credit Card Form State
  const [creditFee, setCreditFee] = useState<number>(3);

  // Custom Form State
  const [customChannelName, setCustomChannelName] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(channels));
    } catch (e) {
      console.error(e);
    }
  }, [channels, storageKey]);

  // When expanding a channel, load its config into form state
  const handleToggleExpand = (channel: PaymentChannel) => {
    if (!channel.canExpand) return;

    if (expandedId === channel.id) {
      setExpandedId(null);
    } else {
      setExpandedId(channel.id);
      if (channel.type === 'transfer') {
        setTransferTab(channel.config.transferTab || 'id_card');
        setTransferPhone(channel.config.phone || '');
        setTransferIdCard(channel.config.idCard || '');
        setTransferAccountName(channel.config.accountName || '');
        setTransferQrImage(channel.config.qrImageUrl || null);
      } else if (channel.type === 'credit') {
        setCreditFee(channel.config.creditCardFee ?? 3);
      } else if (channel.type === 'custom') {
        setCustomChannelName(channel.config.customName || channel.title);
      }
    }
  };

  // Delete / Remove channel
  const handleDeleteChannel = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`คุณต้องการลบช่องทาง "${title}" หรือไม่?`)) {
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
      showToast(`ลบช่องทาง "${title}" สำเร็จ`, 'success');
    }
  };

  // Save Transfer Config
  const handleSaveTransfer = (channelId: string) => {
    let subtext = 'ยังไม่ได้ตั้งค่า';
    if (transferTab === 'phone' && transferPhone.trim()) {
      subtext = `พร้อมเพย์: ${transferPhone.trim()}`;
    } else if (transferTab === 'id_card' && transferIdCard.trim()) {
      subtext = `เลขบัตร: ${transferIdCard.trim()}`;
    } else if (transferTab === 'qr' && transferQrImage) {
      subtext = 'สแกน QR Code พร้อมเพย์';
    } else if (transferAccountName.trim()) {
      subtext = `บัญชี: ${transferAccountName.trim()}`;
    }

    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            subtext,
            config: {
              ...c.config,
              transferTab,
              phone: transferPhone.trim(),
              idCard: transferIdCard.trim(),
              accountName: transferAccountName.trim(),
              qrImageUrl: transferQrImage,
            },
          };
        }
        return c;
      })
    );

    showToast('บันทึกข้อมูลโอนเงินเรียบร้อยแล้ว', 'success');
  };

  // Save Credit Card Config
  const handleSaveCredit = (channelId: string) => {
    const feeNum = Math.max(0, Math.min(100, Number(creditFee) || 0));
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            subtext: `ค่าธรรมเนียม ${feeNum}%`,
            config: {
              ...c.config,
              creditCardFee: feeNum,
            },
          };
        }
        return c;
      })
    );

    showToast('บันทึกค่าธรรมเนียมบัตรเครดิตเรียบร้อยแล้ว', 'success');
  };

  // Save Custom Config
  const handleSaveCustom = (channelId: string) => {
    const finalName = customChannelName.trim() || 'ช่องทางอื่น';
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            title: finalName,
            subtext: 'ตั้งชื่อเอง',
            config: {
              ...c.config,
              customName: finalName,
            },
          };
        }
        return c;
      })
    );
    showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
  };

  // Handle QR Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('ขนาดรูปภาพต้องไม่เกิน 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setTransferQrImage(event.target?.result as string);
        showToast('อัปโหลดรูป QR เรียบร้อยแล้ว', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Channel from Modal
  const handleAddChannel = (type: PaymentChannelType) => {
    if (type === 'credit') {
      const exists = channels.some((c) => c.type === 'credit');
      if (exists) {
        showToast('มีช่องทางบัตรเครดิตอยู่แล้ว', 'error');
        return;
      }
      const newChannel: PaymentChannel = {
        id: `credit_${Date.now()}`,
        type: 'credit',
        title: 'บัตรเครดิต',
        subtext: 'ค่าธรรมเนียม 3%',
        canExpand: true,
        config: { creditCardFee: 3 },
      };
      setChannels((prev) => [...prev, newChannel]);
      setExpandedId(newChannel.id);
      setCreditFee(3);
      setIsAddModalOpen(false);
      showToast('เพิ่มช่องทางบัตรเครดิตเรียบร้อยแล้ว', 'success');
    } else if (type === 'split') {
      const exists = channels.some((c) => c.type === 'split');
      if (exists) {
        showToast('มีช่องทางผสม 2 ช่องทางอยู่แล้ว', 'error');
        return;
      }
      const newChannel: PaymentChannel = {
        id: `split_${Date.now()}`,
        type: 'split',
        title: 'ผสม 2 ช่องทาง',
        subtext: 'เช่น คนละครึ่งคู่กับเงินสด',
        canExpand: true,
        config: {},
      };
      setChannels((prev) => [...prev, newChannel]);
      setExpandedId(newChannel.id);
      setIsAddModalOpen(false);
      showToast('เพิ่มช่องทางผสมเรียบร้อยแล้ว', 'success');
    } else if (type === 'custom') {
      const newChannel: PaymentChannel = {
        id: `custom_${Date.now()}`,
        type: 'custom',
        title: 'ช่องทางอื่น',
        subtext: 'ตั้งชื่อเอง เช่น คนละครึ่ง',
        canExpand: true,
        config: { customName: 'ช่องทางอื่น' },
      };
      setChannels((prev) => [...prev, newChannel]);
      setExpandedId(newChannel.id);
      setCustomChannelName('ช่องทางอื่น');
      setIsAddModalOpen(false);
      showToast('เพิ่มช่องทางอื่นเรียบร้อยแล้ว', 'success');
    }
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

      {/* Main Container Card (White box with rounded corners) */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-pos-border dark:border-slate-500/40 bg-pos-surface shadow-2xs overflow-hidden transition-colors duration-300">
        {channels.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm font-semibold">ยังไม่มีช่องทางการชำระเงิน</p>
            <p className="text-xs mt-1">กดปุ่ม &quot;เพิ่มช่องทาง&quot; ด้านล่างเพื่อเพิ่ม</p>
          </div>
        ) : (
          channels.map((ch, index) => {
            const isExpanded = expandedId === ch.id;
            const isLast = index === channels.length - 1;

            return (
              <div
                key={ch.id}
                className={`${!isLast ? 'border-b border-dashed border-pos-border dark:border-slate-500/40' : ''}`}
              >
                {/* Row Header */}
                <div
                  onClick={() => handleToggleExpand(ch)}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 transition select-none ${
                    ch.canExpand ? 'cursor-pointer hover:bg-pos-hover/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon Container */}
                    <div className="w-9 h-9 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs">
                      {ch.type === 'cash' && <CashHandIcon className="w-5 h-5" />}
                      {ch.type === 'transfer' && <QrTransferIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      {ch.type === 'credit' && <CardIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      {ch.type === 'split' && <SplitBranchIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      {ch.type === 'custom' && <WalletIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                    </div>

                    {/* Title & Subtitle */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-pos-text leading-tight truncate">
                        {ch.title}
                      </p>
                      {ch.subtext && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {ch.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions (Chevron & Delete) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ch.canExpand && (
                      <div className="text-slate-400 dark:text-slate-500 hover:text-pos-text transition">
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChannel(e, ch.id, ch.title)}
                      title={`ลบช่องทาง ${ch.title}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ================= Expanded Panel: โอนเงิน (Transfer) ================= */}
                {isExpanded && ch.type === 'transfer' && (
                  <div className="px-4 pb-5 pt-1 sm:px-6 space-y-4 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    {/* 3-Tab Segmented Control */}
                    <div className="p-1 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 grid grid-cols-3 gap-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTransferTab('phone')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          transferTab === 'phone'
                            ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border dark:border-slate-500/40'
                            : 'text-slate-400 dark:text-slate-500 hover:text-pos-text'
                        }`}
                      >
                        <PhoneIcon className="w-4 h-4" />
                        <span>เบอร์โทร</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferTab('id_card')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          transferTab === 'id_card'
                            ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border dark:border-slate-500/40'
                            : 'text-slate-400 dark:text-slate-500 hover:text-pos-text'
                        }`}
                      >
                        <CardIcon className="w-4 h-4" />
                        <span>เลขบัตร</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferTab('qr')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          transferTab === 'qr'
                            ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border dark:border-slate-500/40'
                            : 'text-slate-400 dark:text-slate-500 hover:text-pos-text'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>รูป QR</span>
                      </button>
                    </div>

                    {/* Tab 1: เบอร์โทร */}
                    {transferTab === 'phone' && (
                      <div className="space-y-3 animate-fadeIn">
                        <input
                          type="text"
                          value={transferPhone}
                          onChange={(e) => setTransferPhone(e.target.value)}
                          placeholder="เบอร์โทรศัพท์ (พร้อมเพย์)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                        <input
                          type="text"
                          value={transferAccountName}
                          onChange={(e) => setTransferAccountName(e.target.value)}
                          placeholder="ชื่อบัญชี (แสดงใต้ QR)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                      </div>
                    )}

                    {/* Tab 2: เลขบัตร */}
                    {transferTab === 'id_card' && (
                      <div className="space-y-3 animate-fadeIn">
                        <input
                          type="text"
                          value={transferIdCard}
                          onChange={(e) => setTransferIdCard(e.target.value)}
                          placeholder="เลขบัตรประชาชน"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                        <input
                          type="text"
                          value={transferAccountName}
                          onChange={(e) => setTransferAccountName(e.target.value)}
                          placeholder="ชื่อบัญชี (แสดงใต้ QR)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                      </div>
                    )}

                    {/* Tab 3: รูป QR */}
                    {transferTab === 'qr' && (
                      <div className="space-y-3 animate-fadeIn">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />

                        {/* Upload Card Box */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full rounded-2xl border-2 border-dashed border-pos-border dark:border-slate-500/40 bg-pos-surface hover:bg-pos-hover/50 p-6 sm:p-8 flex flex-col items-center justify-center relative cursor-pointer transition group shadow-2xs"
                        >
                          {transferQrImage ? (
                            <div className="relative flex flex-col items-center gap-2">
                              <img
                                src={transferQrImage}
                                alt="QR Code"
                                className="max-h-48 max-w-full rounded-xl object-contain shadow-xs border border-pos-border"
                              />
                              <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-1">
                                แตะเพื่อเปลี่ยนรูป QR
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2.5 text-center">
                              <QrTransferIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition" />
                              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                                แตะเพื่ออัปโหลดรูป QR
                              </p>
                              <p className="text-[11px] text-slate-400">
                                รองรับไฟล์ JPG, PNG (สูงสุด 5MB)
                              </p>
                            </div>
                          )}

                          {/* Round Upload Button in bottom right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="absolute bottom-3 right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer"
                          >
                            <UploadArrowIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={transferAccountName}
                          onChange={(e) => setTransferAccountName(e.target.value)}
                          placeholder="ชื่อบัญชี (แสดงใต้ QR)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                      </div>
                    )}

                    {/* Submit Button: บันทึก */}
                    <button
                      type="button"
                      onClick={() => handleSaveTransfer(ch.id)}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
                    >
                      บันทึก
                    </button>
                  </div>
                )}

                {/* ================= Expanded Panel: บัตรเครดิต (Credit Card) ================= */}
                {isExpanded && ch.type === 'credit' && (
                  <div className="px-4 pb-5 pt-3 sm:px-6 space-y-4 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-pos-text">
                          ค่าธรรมเนียมบัตรเครดิต
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          กำหนดค่าเริ่มต้น ปรับได้รายบิล
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-pos-surface border border-pos-border dark:border-slate-500/40 rounded-xl px-3 py-1.5 shadow-2xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={creditFee}
                            onChange={(e) => setCreditFee(Number(e.target.value))}
                            className="w-14 text-center text-sm font-bold text-pos-text bg-transparent focus:outline-none"
                          />
                          <span className="text-sm font-semibold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCredit(ch.id)}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
                    >
                      บันทึก
                    </button>
                  </div>
                )}

                {/* ================= Expanded Panel: ผสม 2 ช่องทาง ================= */}
                {isExpanded && ch.type === 'split' && (
                  <div className="px-4 pb-5 pt-3 sm:px-6 space-y-3 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    <p className="text-xs sm:text-sm font-semibold text-pos-text">
                      การชำระแบบผสม (Split Payment)
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      เปิดใช้งานการแบ่งยอดชำระ เช่น แบ่งจ่ายเงินสดส่วนหนึ่งและโอนเงินอีกส่วนหนึ่ง บนหน้าจอรับชำระเงิน
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(null);
                        showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
                      }}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
                    >
                      บันทึก
                    </button>
                  </div>
                )}

                {/* ================= Expanded Panel: ช่องทางอื่น (Custom) ================= */}
                {isExpanded && ch.type === 'custom' && (
                  <div className="px-4 pb-5 pt-3 sm:px-6 space-y-3 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        ชื่อช่องทางชำระเงิน
                      </label>
                      <input
                        type="text"
                        value={customChannelName}
                        onChange={(e) => setCustomChannelName(e.target.value)}
                        placeholder="เช่น คนละครึ่ง, บัตรสวัสดิการ, TrueMoney"
                        className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveCustom(ch.id)}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
                    >
                      บันทึก
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Button: เพิ่มช่องทาง (Add Channel) */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="w-full py-3.5 rounded-2xl bg-pos-surface hover:bg-pos-hover border border-pos-border dark:border-slate-500/40 text-pos-text font-semibold text-sm transition active:scale-[0.99] cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
      >
        <span>เพิ่มช่องทาง</span>
      </button>

      {/* ==================== Modal: เลือกช่องทางที่ต้องการเพิ่ม ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-sm border border-pos-border dark:border-slate-500/40 overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-pos-border dark:border-slate-500/40">
              <h3 className="font-bold text-base text-pos-text">
                เลือกช่องทางที่ต้องการเพิ่ม
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-pos-text hover:bg-pos-hover transition cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - List of Addable Options */}
            <div className="p-4 sm:p-5 space-y-2">
              {/* Option 1: บัตรเครดิต */}
              <div
                onClick={() => handleAddChannel('credit')}
                className="p-3.5 rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40 hover:bg-pos-hover/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-sky-500 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs transition">
                    <CardIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                      บัตรเครดิต
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      รูดบัตรผ่านเครื่องของร้าน
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0 shadow-2xs">
                  <PlusIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Option 2: ผสม 2 ช่องทาง */}
              <div
                onClick={() => handleAddChannel('split')}
                className="p-3.5 rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40 hover:bg-pos-hover/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-sky-500 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs transition">
                    <SplitBranchIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                      ผสม 2 ช่องทาง
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      เช่น คนละครึ่งคู่กับเงินสด
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0 shadow-2xs">
                  <PlusIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Option 3: ช่องทางอื่น */}
              <div
                onClick={() => handleAddChannel('custom')}
                className="p-3.5 rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40 hover:bg-pos-hover/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-sky-500 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs transition">
                    <WalletIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                      ช่องทางอื่น
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      ตั้งชื่อเอง เช่น คนละครึ่ง
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0 shadow-2xs">
                  <PlusIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
