"use client";

import { useState } from "react";

import { PeriodType, ReportDateSelectorProps } from "@/lib/types";

const THAI_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const THAI_DAYS_WEEK = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function ReportDateSelector({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: ReportDateSelectorProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);

  // วันปัจจุบัน
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // ปฏิทินแสดงเดือน/ปี
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  const [rangeStart, setRangeStart] = useState<Date>(() => {
    if (customStartDate) {
      const d = new Date(customStartDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [rangeEnd, setRangeEnd] = useState<Date | null>(() => {
    if (customEndDate) {
      const d = new Date(customEndDate);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  // ฟังก์ชันเปิด Modal กำหนดเองและซิงค์วันที่เริ่มต้น
  const handleOpenCustomModal = () => {
    if (customStartDate) {
      const s = new Date(customStartDate);
      s.setHours(0, 0, 0, 0);
      setRangeStart(s);
      setViewYear(s.getFullYear());
      setViewMonth(s.getMonth());
    }
    if (customEndDate) {
      const e = new Date(customEndDate);
      e.setHours(23, 59, 59, 999);
      setRangeEnd(e);
    }
    setIsSelectingEnd(false);
    setShowCustomModal(true);
  };

  // ปุ่มช่วงด่วน (3 วัน, 7 วัน, 14 วัน, 30 วัน)
  const handleSelectPreset = (days: number) => {
    setActivePreset(days);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const start = new Date(todayYear, todayMonth, todayDate - (days - 1));
    start.setHours(0, 0, 0, 0);

    setRangeStart(start);
    setRangeEnd(end);
    setIsSelectingEnd(false);
    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
  };

  const handleDateClick = (clickedDate: Date) => {
    setActivePreset(null);

    // ถ้ากำลังรอคลิกวันสิ้นสุด
    if (isSelectingEnd && rangeStart) {
      if (clickedDate.getTime() >= rangeStart.getTime()) {
        const end = new Date(clickedDate);
        end.setHours(23, 59, 59, 999);
        setRangeEnd(end);
        setIsSelectingEnd(false);
      } else {
        // หากคลิกวันก่อนวันเริ่มต้น ให้สลับวันนั้นเป็นวันเริ่มต้นใหม่
        const start = new Date(clickedDate);
        start.setHours(0, 0, 0, 0);
        setRangeStart(start);
        setRangeEnd(null);
        setIsSelectingEnd(true);
      }
    } else {
      // คลิกครั้งแรก เริ่มเลือกใหม่
      const start = new Date(clickedDate);
      start.setHours(0, 0, 0, 0);
      setRangeStart(start);
      setRangeEnd(null);
      setIsSelectingEnd(true);
    }
  };

  // เลื่อนเดือนก่อนหน้า
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  // เลื่อนเดือนถัดไป (ห้ามเกินเดือนปัจจุบัน)
  const isNextMonthFuture =
    viewYear > todayYear ||
    (viewYear === todayYear && viewMonth >= todayMonth);

  const handleNextMonth = () => {
    if (isNextMonthFuture) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // คำนวณวันในเดือนของปฏิทิน
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // สร้างเซลล์วันในปฏิทิน
  const calendarCells = [];
  // วันเดือนก่อนหน้า (Padding)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      dateObj: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isFuture: false,
    });
  }

  // วันในเดือนปัจจุบัน
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateObj = new Date(viewYear, viewMonth, d);
    dateObj.setHours(12, 0, 0, 0);

    const isFuture =
      viewYear > todayYear ||
      (viewYear === todayYear && viewMonth > todayMonth) ||
      (viewYear === todayYear && viewMonth === todayMonth && d > todayDate);

    calendarCells.push({
      dateObj,
      day: d,
      isCurrentMonth: true,
      isFuture,
    });
  }

  const totalCellsSoFar = calendarCells.length;
  const targetTotal = totalCellsSoFar <= 35 ? 35 : 42;
  const nextMonthPadding = targetTotal - totalCellsSoFar;
  for (let d = 1; d <= nextMonthPadding; d++) {
    calendarCells.push({
      dateObj: new Date(viewYear, viewMonth + 1, d),
      day: d,
      isCurrentMonth: false,
      isFuture: true,
    });
  }

  // คำนวณจำนวนวันที่เลือก
  const effectiveEnd = rangeEnd || rangeStart;
  const daysDiff = Math.max(
    1,
    Math.round(
      (effectiveEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  // ฟอร์แมตหัวข้อช่วงเวลา เช่น "2 ก.ย. - 17 ก.ย. 2569"
  const formatRangeHeader = () => {
    const sDate = rangeStart.getDate();
    const sMonth = THAI_MONTHS_SHORT[rangeStart.getMonth()];
    const sYear = rangeStart.getFullYear() + 543;

    const eDate = effectiveEnd.getDate();
    const eMonth = THAI_MONTHS_SHORT[effectiveEnd.getMonth()];
    const eYear = effectiveEnd.getFullYear() + 543;

    if (
      sDate === eDate &&
      rangeStart.getMonth() === effectiveEnd.getMonth() &&
      sYear === eYear
    ) {
      return `${sDate} ${sMonth} ${sYear}`;
    }

    if (rangeStart.getMonth() === effectiveEnd.getMonth() && sYear === eYear) {
      return `${sDate} ${sMonth} - ${eDate} ${eMonth} ${eYear}`;
    }

    return `${sDate} ${sMonth} - ${eDate} ${eMonth} ${eYear}`;
  };

  // ยืนยันการเลือกช่วงเวลา
  const handleConfirm = () => {
    const sM = (rangeStart.getMonth() + 1).toString().padStart(2, "0");
    const sD = rangeStart.getDate().toString().padStart(2, "0");
    const startStr = `${rangeStart.getFullYear()}-${sM}-${sD}`;

    const eM = (effectiveEnd.getMonth() + 1).toString().padStart(2, "0");
    const eD = effectiveEnd.getDate().toString().padStart(2, "0");
    const endStr = `${effectiveEnd.getFullYear()}-${eM}-${eD}`;

    onCustomDateChange(startStr, endStr);
    onPeriodChange("custom");
    setShowCustomModal(false);
  };

  const periodOptions: { key: PeriodType; label: string }[] = [
    { key: "today", label: "วันนี้" },
    { key: "week", label: "สัปดาห์นี้" },
    { key: "month", label: "เดือนนี้" },
    { key: "custom", label: "กำหนดเอง" },
  ];

  return (
    <>
      {/* แท็บเลือกช่วงเวลา วันนี้ | สัปดาห์นี้ | เดือนนี้ | กำหนดเอง */}
      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl flex items-center justify-between gap-1 w-full">
        {periodOptions.map((opt) => {
          const isActive = period === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                if (opt.key === "custom") {
                  handleOpenCustomModal();
                } else {
                  onPeriodChange(opt.key);
                }
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-all ${
                isActive
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* Modal กำหนดเอง (เลือกช่วงเวลาได้อิสระ)    */}
      {/* ======================================================== */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                เลือกช่วงเวลา
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Section 1: ช่วงด่วน (3วัน, 7วัน, 14วัน, 30วัน) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                ช่วงด่วน
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSelectPreset(days)}
                    className={`py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                      activePreset === days
                        ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300 shadow-xs font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {days}วัน
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: ปฏิทินแสดงช่วงวันที่เลือก*/}
            <div className="space-y-2.5 pt-1">
              {/* Header แสดงช่วงวันที่เลือก เช่น "2 ก.ย. - 17 ก.ย. 2569" และ "16 วัน" */}
              <div className="flex items-center justify-between px-1 py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {formatRangeHeader()}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {daysDiff} วัน
                </span>
              </div>

              {/* Month Navigator Header (< เดือน ปี >) */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
                >
                  ‹
                </button>

                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {THAI_MONTHS_FULL[viewMonth]} {viewYear + 543}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextMonthFuture}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                    isNextMonthFuture
                      ? "opacity-20 cursor-not-allowed text-slate-300"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  ›
                </button>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
                {THAI_DAYS_WEEK.map((dw) => (
                  <div key={dw} className="py-0.5">
                    {dw}
                  </div>
                ))}
              </div>

              {/* Calendar Grid with Range Highlight */}
              <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center text-xs">
                {calendarCells.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={`prev-${idx}`}
                        className="py-1 text-slate-300 dark:text-slate-600 select-none text-[11px]"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  if (cell.isFuture) {
                    return (
                      <div
                        key={`future-${cell.day}`}
                        className="py-1 text-slate-300 dark:text-slate-700 opacity-25 cursor-not-allowed select-none text-[11px]"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const cellTime = new Date(
                    viewYear,
                    viewMonth,
                    cell.day
                  ).setHours(0, 0, 0, 0);

                  const startTime = new Date(rangeStart).setHours(0, 0, 0, 0);
                  const endTime = rangeEnd
                    ? new Date(rangeEnd).setHours(0, 0, 0, 0)
                    : startTime;

                  const isStart = cellTime === startTime;
                  const isEnd = cellTime === endTime;
                  const isInRange = cellTime >= startTime && cellTime <= endTime;

                  return (
                    <div
                      key={`day-${cell.day}`}
                      className={`relative py-0.5 ${
                        isInRange && !isStart && !isEnd
                          ? "bg-sky-50 dark:bg-sky-950/40"
                          : ""
                      } ${
                        isStart && isEnd
                          ? ""
                          : isStart
                            ? "rounded-l-full bg-sky-50 dark:bg-sky-950/40"
                            : isEnd
                              ? "rounded-r-full bg-sky-50 dark:bg-sky-950/40"
                              : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleDateClick(
                            new Date(viewYear, viewMonth, cell.day)
                          )
                        }
                        className={`h-7 w-7 mx-auto rounded-full text-[11px] font-semibold flex items-center justify-center transition ${
                          isStart || isEnd
                            ? "bg-sky-600 text-white font-bold shadow-xs scale-105 z-10"
                            : isInRange
                              ? "text-sky-700 dark:text-sky-300 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {cell.day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footnote */}
            <p className="text-[10px] text-slate-400 pt-1">
              เลือกได้สูงสุด 90 วัน
            </p>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white shadow-sm transition active:scale-95"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
