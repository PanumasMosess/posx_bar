'use client';

import React, { useState, useEffect } from 'react';

// Import Section Components
import SettingsEmptyView from './SettingsEmptyView';
import EmployeeSetting from './EmployeeSetting';
import ScanSetting from './ScanSetting';
import CurrencySetting, { ALL_CURRENCIES } from './CurrencySetting';
import BusinessHoursSetting from './BusinessHoursSetting';
import PaymentSetting from './PaymentSetting';
import VatSetting from './VatSetting';
import MiscSetting from './MiscSetting';
import RestaurantModeSetting from './RestaurantModeSetting';
import MemberSetting from './MemberSetting';

import { getShopProfileSettings, updateShopNameAction } from '@/lib/actions/actionsSettings';
import { SettingsSection } from '@/lib/types';
import { useEmployee } from '@/components/providers/EmployeeContext';

/* ==================== Graphic Components ==================== */
function UserAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden shrink-0 relative bg-[#7c3a1e] shadow-xs ring-2 ring-white dark:ring-slate-700 flex items-center justify-center`}
    >
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" fill="#9a4726" />
        <path d="M-2 18 C6 14, 12 20, 10 32 C4 30, 2 24, -2 18 Z" fill="#2d6a4f" />
        <path d="M4 22 C12 18, 16 26, 12 36 C8 32, 6 26, 4 22 Z" fill="#40916c" />
        <path d="M-4 30 C4 28, 10 36, 6 44 C0 42, -2 36, -4 30 Z" fill="#1b4332" />
        <path d="M22 26 L36 28 L34 38 L20 36 Z" fill="#94a3b8" opacity="0.6" />
        <circle cx="28" cy="19" r="6" fill="#e0a96d" />
        <path d="M23 18 C23 15, 25 13, 29 13 C33 13, 35 15, 35 18 Z" fill="#2c1810" />
        <path d="M22 28 C22 25, 25 24, 28 24 C31 24, 34 25, 34 28 L34 36 L22 36 Z" fill="#ffffff" />
        <path d="M25 32 L27 44 L31 44 L32 32 Z" fill="#1e3a5f" />
      </svg>
    </div>
  );
}

function ChevronRight({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function EditIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function MenuRow({
  label,
  sub,
  active,
  onClick,
  icon,
}: {
  label: string;
  sub?: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3.5 sm:px-4 sm:py-3.5 transition text-left cursor-pointer select-none ${active
        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
        : 'hover:bg-pos-hover text-pos-text'
        }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        {icon && (
          <div
            className={`w-5 h-5 shrink-0 flex items-center justify-center transition-colors ${active
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-400 dark:text-slate-500'
              }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm leading-tight truncate ${active ? 'font-bold' : 'font-semibold'
              }`}
          >
            {label}
          </p>
          {sub && (
            <p
              className={`text-xs mt-0.5 truncate ${active ? 'text-sky-600/80 dark:text-sky-400/80' : 'text-slate-400 dark:text-slate-500'
                }`}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <ChevronRight className={active ? 'text-sky-500' : 'text-slate-400 dark:text-slate-600'} />
    </button>
  );
}

/* ==================== Main SettingsView ==================== */
export default function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // ระบบแจ้งเตือน (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [isEditingShopName, setIsEditingShopName] = useState(false);
  const [editShopNameInput, setEditShopNameInput] = useState('');
  const [isSavingShop, setIsSavingShop] = useState(false);

  // ข้อมูลร้านที่แสดงในแถบด้านซ้าย
  const [selectedCurrency, setSelectedCurrency] = useState('บาท · THB');
  const [businessHoursText, setBusinessHoursText] = useState('08:00 - 22:30');

  // State สำหรับเก็บข้อมูลร้านจาก Database
  const [shopInfo, setShopInfo] = useState({
    name: 'กำลังโหลด...',
    phone: 'กำลังโหลด...',
    createdDateStr: '',
  });

  const { organizationId: contextOrgId } = useEmployee();
  const orgId = contextOrgId || 0;

  // ดึงข้อมูลร้านตอนเปิดหน้า / เมื่อ orgId พร้อม (auto-reactive)
  useEffect(() => {
    if (!contextOrgId) return;

    const fetchShopInfo = async () => {
      try {
        const data = await getShopProfileSettings(contextOrgId);
        if (data) {
          setShopInfo({
            name: data.name || 'ไม่ได้ตั้งชื่อร้าน',
            phone: data.phone || 'ยังไม่ได้ตั้งค่าเบอร์โทร',
            createdDateStr: data.createdDateStr
          });

          if (data.currencyCode) {
            const found = ALL_CURRENCIES.find((c) => c.code === data.currencyCode);
            setSelectedCurrency(data.currencyCode === 'THB' ? 'บาท · THB' : (found ? `${found.symbol} · ${found.code}` : data.currencyCode));
          }

          // อัปเดตเวลาทำการเริ่มต้น
          if (data.openTime && data.closeTime) {
            setBusinessHoursText(`${data.openTime} - ${data.closeTime}`);
          } else {
            setBusinessHoursText('ตัดยอดตามเที่ยงคืน');
          }
        }
      } catch (error) {
        console.error("Error fetching shop profile:", error);
      }
    };
    fetchShopInfo();
  }, [contextOrgId]);

  const sectionTitle: Record<Exclude<SettingsSection, null>, string> = {
    'shop-team': 'ร้านและทีม',
    member: 'ระบบสมาชิก',
    payment: 'ช่องทางการชำระเงิน',
    misc: 'ข้อมูลอื่น ๆ',
    vat: 'ภาษีมูลค่าเพิ่ม (VAT)',
    scan: 'การสแกนสั่ง',
    'restaurant-mode': 'โหมดร้านอาหาร',
    currency: 'สกุลเงิน',
    'business-hours': 'เวลาเปิด-ปิด',
  };

  const handleSelectSection = (section: SettingsSection) => {
    setActiveSection(section);
    setIsMobileModalOpen(true);
  };

  const handleSelectCurrency = (code: string, label: string) => {
    setSelectedCurrency(label);
  };

  const handleUpdateHours = (text: string) => {
    setBusinessHoursText(text);
  };

  const handleUpdateMisc = (newPhone: string) => {
    setShopInfo((prev) => ({
      ...prev,
      phone: newPhone || 'ยังไม่ได้ตั้งค่าเบอร์โทร',
    }));
  };

  // ฟังก์ชันเริ่มแก้ไขชื่อร้าน
  const handleStartEdit = () => {
    setEditShopNameInput(shopInfo.name);
    setIsEditingShopName(true);
  };

  // ฟังก์ชันยกเลิกแก้ไข
  const handleCancelEdit = () => {
    setIsEditingShopName(false);
    setEditShopNameInput('');
  };

  // ฟังก์ชันบันทึกชื่อร้าน
  const handleSaveShopName = async () => {
    const trimmedName = editShopNameInput.trim();
    if (!trimmedName || !orgId) {
      if (!orgId) showToast('ไม่พบข้อมูลร้านค้า กรุณาเข้าสู่ระบบใหม่', 'error');
      return;
    }

    setIsSavingShop(true);
    try {
      await updateShopNameAction(orgId, trimmedName);
      setShopInfo(prev => ({ ...prev, name: trimmedName }));
      showToast('อัปเดตชื่อร้านสำเร็จ', 'success');
      setIsEditingShopName(false);
    } catch (error) {
      console.error("Failed to update shop name:", error);
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setIsSavingShop(false);
    }
  };

  const menuShopItems = [
    {
      section: 'shop-team' as const,
      label: 'ร้านและทีม',
      sub: 'จัดการพนักงาน · 1 ร้าน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      section: 'member' as const,
      label: 'ระบบสมาชิก',
      sub: 'รายชื่อสมาชิก · แต้มสะสม · เครดิต',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      section: 'payment' as const,
      label: 'ช่องทางการชำระเงิน',
      sub: 'เงินสด · โอนเงิน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
    {
      section: 'misc' as const,
      label: 'ข้อมูลอื่น ๆ',
      sub: 'ยังไม่ได้ตั้งค่า',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      ),
    },
    {
      section: 'vat' as const,
      label: 'ภาษีมูลค่าเพิ่ม (VAT)',
      sub: 'VAT ปิดอยู่ · เงินสด: ปิดใกล้สุด',
      icon: (
        <span className="text-base font-black text-slate-400 dark:text-slate-500 leading-none">%</span>
      ),
    },
  ];

  const menuSalesItems = [
    {
      section: 'scan' as const,
      label: 'การสแกนสั่ง',
      sub: 'ลูกค้าสแกนสั่งเองที่โต๊ะ/หน้าร้าน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h3v3h-3v-3zM18 18h2.25v2.25H18V18zM13.5 19.5h2.25V21H13.5v-1.5z" />
        </svg>
      ),
    },
    {
      section: 'restaurant-mode' as const,
      label: 'โหมดร้านอาหาร',
      sub: 'เปิดอยู่ · การพักบิล · การส่งออเดอร์เข้าครัว · ...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3v5.25m0 0a3 3 0 01-3 3H6a3 3 0 01-3-3V3m6 5.25v12.75M6 3v5.25m12-5.25v18m0-18c-2.25 0-3 1.5-3 4.5v3.75h3V3z" />
        </svg>
      ),
    },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'shop-team': return <EmployeeSetting organizationId={orgId} />;
      case 'member': return <MemberSetting organizationId={orgId} />;
      case 'scan': return <ScanSetting />;
      case 'restaurant-mode': return <RestaurantModeSetting />;
      case 'currency': return <CurrencySetting organizationId={orgId} currentCurrency="THB" onSelectCurrency={handleSelectCurrency} />;
      case 'business-hours': return <BusinessHoursSetting organizationId={orgId} currentHoursText={businessHoursText} onUpdateHours={handleUpdateHours} />;
      case 'payment': return <PaymentSetting />;
      case 'vat': return <VatSetting onSwitchSection={() => handleSelectSection('misc')} />;
      case 'misc': return <MiscSetting organizationId={orgId} onUpdateMisc={handleUpdateMisc} />;
      default: return <SettingsEmptyView />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-pos-bg font-sans select-none relative transition-colors duration-300">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${toast.type === 'success'
            ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/80 dark:border-teal-700 dark:text-teal-100'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'
            }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. TOP SEARCH BAR */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="w-full bg-pos-surface rounded-full shadow-xs border border-pos-border px-4 py-2 flex items-center gap-2.5 transition-colors duration-300">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหาการตั้งค่า"
            className="w-full bg-transparent text-xs sm:text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT */}
      <div className="flex-1 flex overflow-hidden min-h-0 px-4 pb-4 gap-4">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SIDEBAR */}
        {/* ========================================================================= */}
        <div className="w-full sm:w-[310px] md:w-[330px] lg:w-[340px] shrink-0 h-full flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto custom-scroll space-y-3.5 pr-1">
            {/* Section: ข้อมูลร้าน */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">ข้อมูลร้าน</p>

              {/* Shop Profile Mini Box */}
              <div className="rounded-3xl bg-pos-surface p-4 shadow-xs border border-pos-border space-y-3 transition-colors duration-300">

                {/* ----------------- Toggle Edit / View Mode ----------------- */}
                {!isEditingShopName ? (
                  /* ==================== View Mode (รูปแรก) ==================== */
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar size="lg" />
                      <div className="flex flex-col justify-center mt-0.5">
                        <h3 className="font-bold text-base text-pos-text leading-tight">
                          {shopInfo.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {/* ป้ายเจ้าของร้านสีฟ้าอ่อน */}
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            เจ้าของร้าน
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            สร้าง {shopInfo.createdDateStr || 'ไม่ระบุ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ปุ่มแก้ไขรูปดินสอ */}
                    <button
                      type="button"
                      title="แก้ไขชื่อร้าน"
                      onClick={handleStartEdit}
                      className="w-8 h-8 rounded-full bg-pos-bg flex items-center justify-center text-slate-500 hover:text-sky-600 hover:bg-sky-500/10 transition cursor-pointer shrink-0 ml-2"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* ==================== Edit Mode (รูปสอง) ==================== */
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <UserAvatar size="lg" />
                      {/* ไอคอนดินสอตรงรูปโปรไฟล์ */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center border-2 border-pos-surface text-white shadow-sm cursor-pointer hover:bg-sky-600">
                        <EditIcon className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      {/* กล่องกรอกข้อความขอบสีฟ้า */}
                      <input
                        type="text"
                        value={editShopNameInput}
                        onChange={(e) => setEditShopNameInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-pos-border focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-sm font-semibold text-pos-text bg-pos-bg"
                        autoFocus
                      />

                      {/* ปุ่มยกเลิก - บันทึก */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 py-1.5 rounded-lg bg-pos-bg text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-pos-hover transition cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveShopName}
                          disabled={!editShopNameInput.trim() || isSavingShop}
                          className="flex-1 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isSavingShop ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                      </div>

                      {/* ป้ายและวันที่ (เลื่อนลงมาข้างล่างตามรูป) */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-md">
                          เจ้าของร้าน
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          สร้าง {shopInfo.createdDateStr || 'ไม่ระบุ'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* ------------------------------------------------------------- */}

                {/* ข้อมูลการเข้าสู่ระบบ, สกุลเงิน (กดได้), เวลาเปิด-ปิด (กดได้) */}
                <div className="space-y-2 border-t border-pos-border pt-3 text-xs">

                  {/* เบอร์ติดต่อ (กดไปหน้า MiscSetting) */}
                  <div
                    onClick={() => handleSelectSection('misc')}
                    className="flex items-center justify-between py-1.5 px-2 -mx-2 cursor-pointer rounded-lg transition hover:bg-pos-hover group"
                  >
                    <span className="font-medium text-slate-500 dark:text-slate-400 transition-colors">
                      เบอร์ติดต่อ
                    </span>
                    <div className="flex items-center gap-1 font-medium text-pos-text">
                      <span>{shopInfo.phone}</span>
                      <ChevronRight className="text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  {/* สกุลเงิน */}
                  <div
                    onClick={() => handleSelectSection('currency')}
                    className={`flex items-center justify-between py-1.5 px-2 -mx-2 cursor-pointer rounded-lg transition group ${activeSection === 'currency'
                      ? 'bg-sky-500/10'
                      : 'hover:bg-pos-hover'
                      }`}
                  >
                    <span className={`font-medium ${activeSection === 'currency' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                      สกุลเงิน
                    </span>
                    <div className={`flex items-center gap-1 font-medium ${activeSection === 'currency'
                      ? 'text-sky-600 dark:text-sky-400 font-bold'
                      : 'text-pos-text'
                      }`}>
                      <span>{selectedCurrency}</span>
                      <ChevronRight className={activeSection === 'currency' ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'} />
                    </div>
                  </div>

                  {/* เวลาเปิด-ปิด */}
                  <div
                    onClick={() => handleSelectSection('business-hours')}
                    className={`flex items-center justify-between py-1.5 px-2 -mx-2 cursor-pointer rounded-lg transition group ${activeSection === 'business-hours'
                      ? 'bg-sky-500/10'
                      : 'hover:bg-pos-hover'
                      }`}
                  >
                    <span className={`font-medium ${activeSection === 'business-hours' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                      เวลาเปิด-ปิด
                    </span>
                    <div className={`flex items-center gap-1 font-medium ${activeSection === 'business-hours'
                      ? 'text-sky-600 dark:text-sky-400 font-bold'
                      : 'text-pos-text'
                      }`}>
                      <span>{businessHoursText}</span>
                      <ChevronRight className={activeSection === 'business-hours' ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'} />
                    </div>
                  </div>

                </div>
              </div>

              {/* เมนูกลุ่มข้อมูลร้าน */}
              <div className="rounded-3xl bg-pos-surface shadow-xs border border-pos-border divide-y divide-pos-border overflow-hidden transition-colors duration-300">
                {menuShopItems.map(({ section, label, sub, icon }) => (
                  <MenuRow
                    key={section}
                    active={activeSection === section}
                    label={label}
                    sub={sub}
                    onClick={() => handleSelectSection(section)}
                    icon={icon}
                  />
                ))}
              </div>
            </div>

            {/* Section: การขาย */}
            <div className="space-y-2 pb-6">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">การขาย</p>
              <div className="rounded-3xl bg-pos-surface shadow-xs border border-pos-border divide-y divide-pos-border overflow-hidden transition-colors duration-300">
                {menuSalesItems.map(({ section, label, sub, icon }) => (
                  <MenuRow
                    key={section}
                    active={activeSection === section}
                    label={label}
                    sub={sub}
                    onClick={() => handleSelectSection(section)}
                    icon={icon}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: BIG WHITE PANEL */}
        {/* ========================================================================= */}
        <div className="hidden sm:flex flex-1 min-w-0 h-full overflow-hidden bg-pos-surface rounded-3xl border border-pos-border shadow-xs flex-col p-5 sm:p-6 transition-colors duration-300">
          {activeSection ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="pb-3.5 shrink-0">
                <h1 className="text-base sm:text-lg font-bold text-pos-text">
                  {sectionTitle[activeSection]}
                </h1>
              </div>
              <div className="flex-1 overflow-y-auto custom-scroll pr-1">
                {renderSectionContent()}
              </div>
            </div>
          ) : (
            <SettingsEmptyView />
          )}
        </div>
      </div>

      {/* ==================== 3. MOBILE MODAL / BOTTOM SHEET ==================== */}
      {isMobileModalOpen && activeSection && (
        <div className="sm:hidden fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setIsMobileModalOpen(false)} />
          <div className="relative w-full max-h-[90dvh] bg-pos-bg rounded-t-3xl shadow-2xl overflow-hidden flex flex-col z-10 border-t border-pos-border">
            <div className="px-5 py-3.5 bg-pos-surface flex items-center justify-between border-b border-pos-border shrink-0">
              <h2 className="text-base font-bold text-pos-text">
                {sectionTitle[activeSection]}
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-pos-text hover:bg-pos-hover transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}