'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { updateMiscSettingsAction, getShopProfileSettings } from '@/lib/actions/actionsSettings';
import { useEmployee } from '@/components/providers/EmployeeContext';

interface MiscSettingProps {
  organizationId?: number;
  onUpdateMisc?: (phone: string) => void;
}

export default function MiscSetting({ organizationId: propOrgId, onUpdateMisc }: MiscSettingProps) {
  const { organizationId: contextOrgId } = useEmployee();
  const orgId = propOrgId || contextOrgId || 0;

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [taxId, setTaxId] = useState(''); // เพิ่ม State สำหรับ Tax ID
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ระบบแจ้งเตือน Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ดึงข้อมูลเมื่อเปิดหน้า
  useEffect(() => {
    const fetchSettings = async () => {
      if (!orgId) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getShopProfileSettings(orgId);
        if (data) {
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setReceiptFooter(data.receiptFooter || '');
          setTaxId(data.taxId || ''); // ดึงค่า Tax ID
        }
      } catch (error) {
        console.error('Error fetching misc settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [orgId]);

  // ฟังก์ชันบันทึกข้อมูล
  const handleSave = async () => {
    if (!orgId) {
      showToast('ไม่พบข้อมูลองค์กร กรุณาลองใหม่อีกครั้ง', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const trimmedPhone = phone.trim();
      await updateMiscSettingsAction(orgId, {
        phone: trimmedPhone,
        address: address.trim(),
        receiptFooter: receiptFooter.trim(),
        taxId: taxId.trim(), // ส่งค่า Tax ID ไปบันทึก
      });
      showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      
      if (onUpdateMisc) {
        onUpdateMisc(trimmedPhone);
      }
    } catch (error) {
      console.error('Error saving misc settings:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-10 text-center text-slate-400 dark:text-slate-500 bg-pos-surface rounded-2xl border border-dashed border-pos-border transition-colors duration-300">
        <p className="text-xs font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

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

      <div className="rounded-2xl border border-pos-border bg-pos-surface p-5 shadow-2xs space-y-4 transition-colors duration-300">
        
        {/* เพิ่ม Input เลขผู้เสียภาษี ไว้ด้านบนสุด */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            เลขประจำตัวผู้เสียภาษี
          </label>
          <input
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="เช่น 0123456789123"
            className="w-full max-w-md px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            เบอร์โทรศัพท์ร้านค้า
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="เช่น 095-XXX-X950"
            className="w-full max-w-md px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            ที่อยู่ร้านค้า (แสดงบนใบเสร็จ)
          </label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="เช่น 123/45 ถนนสุขุมวิท ตำบลแสนสุข อำเภอเมืองชลบุรี ชลบุรี 20130"
            className="w-full max-w-lg px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition custom-scroll"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            ข้อความท้ายใบเสร็จ
          </label>
          <input
            type="text"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder="เช่น ขอบคุณที่ใช้บริการ / Thank you!"
            className="w-full max-w-lg px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  );
}