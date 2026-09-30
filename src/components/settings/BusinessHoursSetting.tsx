'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { updateBusinessHoursAction, getShopProfileSettings } from '@/lib/actions/actionsSettings';
import { useEmployee } from '@/components/providers/EmployeeContext';

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 mt-[4px] rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
          }`}
      />
    </button>
  );
}

interface BusinessHoursSettingProps {
  organizationId?: number;
  currentHoursText?: string;
  onUpdateHours?: (text: string) => void;
}

export default function BusinessHoursSetting({
  organizationId: propOrgId,
  currentHoursText = 'ตัดยอดตามเที่ยงคืน',
  onUpdateHours,
}: BusinessHoursSettingProps) {
  const { organizationId: contextOrgId } = useEmployee();
  const orgId = propOrgId || contextOrgId || 0;

  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [isAutoModeEnabled, setIsAutoModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activePicker, setActivePicker] = useState<'open' | 'close' | null>(null);
  const [tempHour, setTempHour] = useState('08');
  const [tempMinute, setTempMinute] = useState('00');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesList = ['00', '15', '30', '45'];

  // ดึงข้อมูลเวลาทำการจาก DB เมื่อเปิดหน้า
  useEffect(() => {
    const fetchSettings = async () => {
      if (!orgId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getShopProfileSettings(orgId);
        if (data) {
          setOpenTime(data.openTime || '');
          setCloseTime(data.closeTime || '');
          setIsAutoModeEnabled(data.isManualOpenClose || false);
        }
      } catch (error) {
        console.error('Error fetching business hours settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [orgId]);

  const saveToDatabase = async (newOpen: string | null, newClose: string | null, newMode: boolean) => {
    if (!orgId) {
      showToast('ไม่พบข้อมูลองค์กร กรุณาลองใหม่อีกครั้ง', 'error');
      return false;
    }
    setIsSaving(true);
    try {
      await updateBusinessHoursAction(orgId, {
        openTime: newOpen || null,
        closeTime: newClose || null,
        isManualOpenClose: newMode,
      });
      showToast('บันทึกเวลาทำการสำเร็จ', 'success');
      return true;
    } catch (error) {
      console.error('Failed to update business hours:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกเวลาทำการ', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPicker = (type: 'open' | 'close') => {
    setActivePicker(type);
    const targetVal = type === 'open' ? openTime : closeTime;
    if (targetVal && targetVal.includes(':')) {
      const [h, m] = targetVal.split(':');
      setTempHour(h || '08');
      setTempMinute(m || '00');
    } else {
      setTempHour(type === 'open' ? '08' : '22');
      setTempMinute(type === 'open' ? '00' : '30');
    }
  };

  const handleConfirmPicker = async () => {
    const formatted = `${tempHour}:${tempMinute}`;
    let nextOpen = openTime;
    let nextClose = closeTime;

    if (activePicker === 'open') {
      nextOpen = formatted;
    } else if (activePicker === 'close') {
      nextClose = formatted;
    }

    setOpenTime(nextOpen);
    setCloseTime(nextClose);
    setActivePicker(null);

    const success = await saveToDatabase(nextOpen, nextClose, isAutoModeEnabled);
    if (success && onUpdateHours) {
      if (nextOpen && nextClose) {
        onUpdateHours(`${nextOpen} - ${nextClose}`);
      } else {
        onUpdateHours('ตัดยอดตามเที่ยงคืน');
      }
    }
  };

  const handleClearHours = async () => {
    const previousOpen = openTime;
    const previousClose = closeTime;
    const previousMode = isAutoModeEnabled;

    setOpenTime('');
    setCloseTime('');
    setIsAutoModeEnabled(false);

    const success = await saveToDatabase(null, null, false);
    if (success) {
      if (onUpdateHours) {
        onUpdateHours('ตัดยอดตามเที่ยงคืน');
      }
    } else {
      // คืนค่าเดิมกรณีบันทึกไม่สำเร็จ
      setOpenTime(previousOpen);
      setCloseTime(previousClose);
      setIsAutoModeEnabled(previousMode);
    }
  };

  const handleToggleMode = async (enabled: boolean) => {
    setIsAutoModeEnabled(enabled);
    const success = await saveToDatabase(openTime, closeTime, enabled);
    if (success && onUpdateHours) {
      if (openTime && closeTime) {
        onUpdateHours(`${openTime} - ${closeTime}`);
      } else {
        onUpdateHours('ตัดยอดตามเที่ยงคืน');
      }
    } else if (!success) {
      setIsAutoModeEnabled(!enabled);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-10 text-center text-slate-400 dark:text-slate-500 bg-pos-bg rounded-2xl border border-dashed border-pos-border">
        <p className="text-xs font-medium animate-pulse">กำลังโหลดข้อมูลเวลาเปิด-ปิดร้าน...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6 relative">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* กล่องร้านเปิด */}
        <div
          onClick={() => handleOpenPicker('open')}
          className="w-full px-4 py-3 rounded-2xl bg-pos-bg border border-pos-border shadow-2xs transition cursor-pointer hover:border-sky-500 group flex flex-col justify-center"
        >
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition">
            ร้านเปิด
          </span>
          <p className="text-sm font-bold text-pos-text mt-0.5">
            {openTime || <span className="text-slate-400 font-normal">--:--</span>}
          </p>
        </div>

        {/* กล่องร้านปิด */}
        <div
          onClick={() => handleOpenPicker('close')}
          className="w-full px-4 py-3 rounded-2xl bg-pos-bg border border-pos-border shadow-2xs transition cursor-pointer hover:border-sky-500 group flex flex-col justify-center"
        >
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition">
            ร้านปิด
          </span>
          <p className="text-sm font-bold text-pos-text mt-0.5">
            {closeTime || <span className="text-slate-400 font-normal">--:--</span>}
          </p>
        </div>
      </div>

      <div className="text-right px-1">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          ถ้าไม่ตั้งเวลาเปิด-ปิด ยอดขายจะตัดวันตอนเที่ยงคืน
        </p>
      </div>

      <div className="w-full rounded-2xl border border-pos-border p-4 sm:p-5 bg-pos-bg shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-pos-text">
            โหมดเปิด-ปิดร้าน
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            เริ่มวันด้วยการกดเปิดร้าน และสรุปยอดให้ตอนปิดร้าน
          </p>
        </div>

        <ToggleSwitch
          checked={isAutoModeEnabled}
          onChange={handleToggleMode}
          disabled={!openTime || !closeTime || isSaving}
        />
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={handleClearHours}
        className="w-full py-3 rounded-2xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-pos-text font-semibold text-xs sm:text-sm transition cursor-pointer text-center shadow-2xs disabled:opacity-50"
      >
        ล้างเวลาทำการ
      </button>

      {/* TIME PICKER MODAL */}
      {activePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-xs border border-pos-border overflow-hidden animate-scaleUp p-5">
            <div className="flex items-center justify-between pb-3 border-b border-pos-border">
              <h3 className="font-bold text-base text-pos-text">
                {activePicker === 'open' ? 'ร้านเปิด' : 'ร้านปิด'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-pos-hover transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4">
              <div className="grid grid-cols-2 gap-3 bg-pos-bg p-2.5 rounded-2xl border border-pos-border">
                {/* Column ชั่วโมง */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 text-center mb-2">ชั่วโมง</p>
                  <div className="max-h-48 overflow-y-auto custom-scroll space-y-1 pr-1">
                    {hoursList.map((h) => {
                      const isSelected = tempHour === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setTempHour(h)}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${isSelected
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-pos-hover'
                            }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column นาที */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 text-center mb-2">นาที</p>
                  <div className="max-h-48 overflow-y-auto custom-scroll space-y-1 pr-1">
                    {minutesList.map((m) => {
                      const isSelected = tempMinute === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTempMinute(m)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer ${isSelected
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-pos-hover'
                            }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleConfirmPicker}
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'กำลังบันทึก...' : 'ตกลง'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}