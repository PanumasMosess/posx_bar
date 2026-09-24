'use client';

import React, { useState } from 'react';

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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${checked ? 'bg-[#1694a4]' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 mt-[4px] rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

interface BusinessHoursSettingProps {
  currentHoursText?: string;
  onUpdateHours?: (text: string) => void;
}

export default function BusinessHoursSetting({
  currentHoursText = 'ตัดยอดตามเที่ยงคืน',
  onUpdateHours,
}: BusinessHoursSettingProps) {
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:30');
  const [isAutoModeEnabled, setIsAutoModeEnabled] = useState(false);

  // Time Picker Modal State
  const [activePicker, setActivePicker] = useState<'open' | 'close' | null>(null);
  const [tempHour, setTempHour] = useState('08');
  const [tempMinute, setTempMinute] = useState('00');

  // List of hours (00 to 23)
  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // List of minutes (ตรงตามรูป 3 คือ 00, 30 หรือตัวเลือกนาที)
  const minutesList = ['00', '15', '30', '45'];

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

  const handleConfirmPicker = () => {
    const formatted = `${tempHour}:${tempMinute}`;
    if (activePicker === 'open') {
      setOpenTime(formatted);
      if (onUpdateHours) {
        onUpdateHours(`${formatted} - ${closeTime}`);
      }
    } else if (activePicker === 'close') {
      setCloseTime(formatted);
      if (onUpdateHours) {
        onUpdateHours(`${openTime} - ${formatted}`);
      }
    }
    setActivePicker(null);
  };

  const handleClearHours = () => {
    setOpenTime('');
    setCloseTime('');
    setIsAutoModeEnabled(false);
    if (onUpdateHours) {
      onUpdateHours('ตัดยอดตามเที่ยงคืน');
    }
  };

  const handleToggleMode = (enabled: boolean) => {
    setIsAutoModeEnabled(enabled);
    if (onUpdateHours) {
      if (enabled && openTime && closeTime) {
        onUpdateHours(`${openTime} - ${closeTime}`);
      } else {
        onUpdateHours('ตัดยอดตามเที่ยงคืน');
      }
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6">
      {/* 1. สองช่องเลือกเวลา: ร้านเปิด / ร้านปิด (ตามรูปที่ 1 คลิกแล้วเปิด Modal เลือกเวลา) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* กล่องร้านเปิด */}
        <div
          onClick={() => handleOpenPicker('open')}
          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs transition cursor-pointer hover:border-[#1694a4] group flex flex-col justify-center"
        >
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#1694a4] transition">
            ร้านเปิด
          </span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {openTime || <span className="text-slate-400 font-normal">--:--</span>}
          </p>
        </div>

        {/* กล่องร้านปิด */}
        <div
          onClick={() => handleOpenPicker('close')}
          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs transition cursor-pointer hover:border-[#1694a4] group flex flex-col justify-center"
        >
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#1694a4] transition">
            ร้านปิด
          </span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {closeTime || <span className="text-slate-400 font-normal">--:--</span>}
          </p>
        </div>
      </div>

      {/* ข้อความตัดยอดเที่ยงคืน (ตามรูปที่ 1 อยู่ชิดขวาใต้ช่องปิด) */}
      <div className="text-right px-1">
        <p className="text-[11px] text-slate-400 font-medium">
          ถ้าไม่ตั้งเวลาเปิด-ปิด ยอดขายจะตัดวันตอนเที่ยงคืน
        </p>
      </div>

      {/* 2. การ์ดเปิด-ปิด โหมดเปิด-ปิดร้าน (ตามรูปที่ 1) */}
      <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-4 sm:p-5 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            โหมดเปิด-ปิดร้าน
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            เริ่มวันด้วยการกดเปิดร้าน และสรุปยอดให้ตอนปิดร้าน
          </p>
        </div>

        <ToggleSwitch
          checked={isAutoModeEnabled}
          onChange={handleToggleMode}
          disabled={!openTime || !closeTime}
        />
      </div>

      {/* 3. แถบปุ่มล้างเวลาทำการแบบยาวเต็มแถว (ตามรูปที่ 1) */}
      <button
        type="button"
        onClick={handleClearHours}
        className="w-full py-3 rounded-2xl bg-[#edf2f6] hover:bg-slate-200/80 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition cursor-pointer text-center shadow-2xs"
      >
        ล้างเวลาทำการ
      </button>

      {/* ==================== TIME PICKER MODAL (ตรงตามรูปที่ 3 เป๊ะๆ) ==================== */}
      {activePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-2xl w-full max-w-xs border border-slate-100 dark:border-slate-700 overflow-hidden animate-scaleUp p-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {activePicker === 'open' ? 'ร้านเปิด' : 'ร้านปิด'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Time Columns: ชั่วโมง (ซ้าย) / นาที (ขวา) */}
            <div className="py-4">
              <div className="grid grid-cols-2 gap-3 bg-[#f8fafc] dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
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
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#1694a4] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
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
                          className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#1694a4] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
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

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleConfirmPicker}
              className="w-full py-3 rounded-2xl bg-[#1694a4] hover:bg-[#138290] text-white text-sm font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
