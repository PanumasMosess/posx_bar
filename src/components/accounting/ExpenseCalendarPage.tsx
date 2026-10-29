"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import {
  ExpenseItem,
  MonthlyExpenseItem,
  CalendarData,
  ExpenseCalendarPageProps,
} from "@/lib/types";
import {
  recordTransaction,
  getCalendarExpensesAction,
  copyDayExpensesAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "@/lib/actions/actionAccountingRecord";


const THAI_MONTH_NAMES = [
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

const THAI_SHORT_MONTHS = [
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

const THAI_DAY_FULL_NAMES = [
  "วันอาทิตย์ที่",
  "วันจันทร์ที่",
  "วันอังคารที่",
  "วันพุธที่",
  "วันพฤหัสบดีที่",
  "วันศุกร์ที่",
  "วันเสาร์ที่",
];

export default function ExpenseCalendarPage({
  organizationId,
  userId,
  initialData,
}: ExpenseCalendarPageProps) {
  const { settings } = useOrgSettings();
  const currency = settings?.currencyCode || "";

  const now = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const [calendarData, setCalendarData] = useState<CalendarData | null>(
    initialData || null
  );

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<"TODAY" | "MONTH" | "YEAR">("TODAY");

  // Modal State
  const [activeModal, setActiveModal] = useState<
    | "NONE"
    | "DAY_VIEW"
    | "MONTH_VIEW"
    | "YEAR_VIEW"
    | "GLOBAL_ADD"
    | "EDIT_ITEM_MODAL"
    | "DATE_PICKER"
    | "COPY_DAY"
  >("NONE");

  // In Day View: either showing 3 buttons or the form
  const [dayFormState, setDayFormState] = useState<"BUTTONS" | "FORM">("BUTTONS");
  const [dayTab, setDayTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [dayTitle, setDayTitle] = useState("");
  const [dayAmount, setDayAmount] = useState("");
  const [dayCategory, setDayCategory] = useState("");
  const [isDayCatDropdownOpen, setIsDayCatDropdownOpen] = useState(false);
  const [dayChannel, setDayChannel] = useState<"CASH" | "TRANSFER" | "OTHER">("CASH");
  const [dayAccountId, setDayAccountId] = useState<number | undefined>(undefined);
  const [dayNote, setDayNote] = useState("");
  const [editingDayItem, setEditingDayItem] = useState<
    ExpenseItem | MonthlyExpenseItem | null
  >(null);

  // Dedicated Edit Item Modal State (from Month View, without date editing)
  const [editItemId, setEditItemId] = useState<number>(0);
  const [editItemTitle, setEditItemTitle] = useState("");
  const [editItemAmount, setEditItemAmount] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("");
  const [isEditCatDropdownOpen, setIsEditCatDropdownOpen] = useState(false);
  const [editItemChannel, setEditItemChannel] = useState<"CASH" | "TRANSFER" | "OTHER">("CASH");
  const [editItemAccountId, setEditItemAccountId] = useState<number | undefined>(undefined);
  const [editItemDateStr, setEditItemDateStr] = useState<string>("");
  const [editItemType, setEditItemType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [editItemIsMonthly, setEditItemIsMonthly] = useState<boolean>(false);

  // Global Add Modal Form State (from (+) FAB button)
  const [globalTab, setGlobalTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [globalExpenseSubTab, setGlobalExpenseSubTab] = useState<"DAILY" | "MONTHLY">("DAILY");
  const [globalDateStr, setGlobalDateStr] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  );
  const [globalMonth, setGlobalMonth] = useState<number>(now.getMonth() + 1);
  const [globalYear, setGlobalYear] = useState<number>(now.getFullYear());
  const [globalTitle, setGlobalTitle] = useState("");
  const [globalAmount, setGlobalAmount] = useState("");
  const [globalCategory, setGlobalCategory] = useState("");
  const [isGlobalCatDropdownOpen, setIsGlobalCatDropdownOpen] = useState(false);
  const [globalChannel, setGlobalChannel] = useState<"CASH" | "TRANSFER" | "OTHER">("CASH");
  const [globalAccountId, setGlobalAccountId] = useState<number | undefined>(undefined);
  const [globalNote, setGlobalNote] = useState("");

  // Custom Thai Calendar Date Picker Modal State
  const [pickerMonth, setPickerMonth] = useState<number>(now.getMonth() + 1);
  const [pickerYear, setPickerYear] = useState<number>(now.getFullYear());

  // Copy Day State
  const [selectedCopyDate, setSelectedCopyDate] = useState<string>("");
  const [copyItemCount, setCopyItemCount] = useState<number>(0);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message, type: "success" });
    }, 3500);
  };

  // Helper: check if date is in the future
  const isFutureDate = useCallback((dayNum: number, m: number, y: number) => {
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth() + 1;
    const todayD = today.getDate();

    if (y > todayY) return true;
    if (y === todayY && m > todayM) return true;
    if (y === todayY && m === todayM && dayNum > todayD) return true;
    return false;
  }, []);

  // Fetch calendar data
  const fetchMonthData = useCallback(async (year: number, month: number) => {
    const res = await getCalendarExpensesAction(year, month, organizationId);
    if (res.success && res.data) {
      setCalendarData(res.data);
    } else {
      showToast(res.message || "ไม่สามารถโหลดข้อมูลรายรับ-รายจ่ายได้", "error");
    }
  }, [organizationId]);

  useEffect(() => {
    if (!initialData) {
      fetchMonthData(currentYear, currentMonth);
    }
  }, [initialData, currentYear, currentMonth, fetchMonthData]);

  // Navigate Months
  const handlePrevMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth - 1;
    if (nextM === 0) {
      nextM = 12;
      nextY = currentYear - 1;
    }
    setCurrentMonth(nextM);
    setCurrentYear(nextY);
    fetchMonthData(nextY, nextM);
  };

  const handleNextMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth + 1;
    if (nextM === 13) {
      nextM = 1;
      nextY = currentYear + 1;
    }
    setCurrentMonth(nextM);
    setCurrentYear(nextY);
    fetchMonthData(nextY, nextM);
  };

  // Thai BE Year
  const thaiYear = currentYear + 543;
  const monthName = THAI_MONTH_NAMES[currentMonth - 1];

  // Calendar Day Grid Computation
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sunday

  // Selected Day Data
  const selectedDayData = calendarData?.dailyExpensesMap[selectedDay] || {
    totalExpense: 0,
    totalIncome: 0,
    net: 0,
    dailyItems: [],
    monthlyItems: [],
  };

  const selectedDateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(
    selectedDay
  ).padStart(2, "0")}`;
  const shortThaiYear = String(thaiYear).slice(-2);
  const selectedDayThaiDate = `${selectedDay} ${THAI_SHORT_MONTHS[currentMonth - 1]} ${shortThaiYear}`;
  const isSelectedDayFuture = isFutureDate(selectedDay, currentMonth, currentYear);

  // Format Date String to Thai Object
  const formatThaiDateFromStr = (dStr: string) => {
    if (!dStr) return { short: "", full: "", shortYear: "", shortMonthYear: "" };
    const parts = dStr.split("-").map(Number);
    if (parts.length < 3) return { short: "", full: "", shortYear: "", shortMonthYear: "" };
    const [y, m, d] = parts;
    const dateObj = new Date(y, m - 1, d);
    const thaiY = y + 543;
    const shortYear = String(thaiY).slice(-2);
    const shortMonth = THAI_SHORT_MONTHS[m - 1];
    const shortThai = `${d} ${shortMonth} ${thaiY}`;
    const shortMonthYear = `${d} ${shortMonth} ${shortYear}`;
    const weekdayName = THAI_DAY_FULL_NAMES[dateObj.getDay()];
    const fullThai = `${weekdayName} ${d} ${THAI_MONTH_NAMES[m - 1]} ${thaiY}`;
    return { short: shortThai, full: fullThai, shortYear, shortMonthYear };
  };

  // Format number to compact representation, e.g. 10000 -> "10K", 1000 -> "1K"
  const formatAmountBadge = (num: number) => {
    const abs = Math.abs(num);
    if (abs >= 10000) {
      const k = abs / 1000;
      return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
    }
    if (abs >= 1000 && abs % 1000 === 0) {
      return `${abs / 1000}K`;
    }
    return abs.toLocaleString();
  };

  // Filter categories according to active mode/tab
  const dayCategoryList = useMemo(() => {
    return (calendarData?.categories || []).filter((c) => c.type === dayTab);
  }, [calendarData?.categories, dayTab]);

  const globalCategoryList = useMemo(() => {
    return (calendarData?.categories || []).filter((c) => c.type === globalTab);
  }, [calendarData?.categories, globalTab]);

  const editCategoryList = useMemo(() => {
    return (calendarData?.categories || []).filter((c) => c.type === editItemType);
  }, [calendarData?.categories, editItemType]);

  // Previous days with expenses for Copy Day
  const previousDaysWithExpenses = useMemo(() => {
    if (!calendarData?.dailyExpensesMap) return [];
    const list: {
      day: number;
      dateStr: string;
      thaiDate: string;
      itemCount: number;
      totalExpense: number;
    }[] = [];

    Object.entries(calendarData.dailyExpensesMap).forEach(([dayStr, data]) => {
      const dayNum = parseInt(dayStr);
      if (data.dailyItems.length > 0 && dayNum !== selectedDay) {
        const dStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(
          dayNum
        ).padStart(2, "0")}`;
        const thaiDate = `${dayNum} ${THAI_SHORT_MONTHS[currentMonth - 1]} ${shortThaiYear}`;
        const expenseItems = data.dailyItems.filter((i) => i.type === "EXPENSE");
        if (expenseItems.length > 0) {
          list.push({
            day: dayNum,
            dateStr: dStr,
            thaiDate,
            itemCount: expenseItems.length,
            totalExpense: expenseItems.reduce((sum, item) => sum + item.amount, 0),
          });
        }
      }
    });

    return list.sort((a, b) => b.day - a.day);
  }, [calendarData, currentYear, currentMonth, shortThaiYear, selectedDay]);

  // Maximum amount across 12 months for Year View progress bars
  const maxYearlyValue = useMemo(() => {
    if (!calendarData?.yearlyMonthsData) return 1;
    let maxVal = 0;
    calendarData.yearlyMonthsData.forEach((m) => {
      if (m.income > maxVal) maxVal = m.income;
      if (m.expense > maxVal) maxVal = m.expense;
    });
    return maxVal > 0 ? maxVal : 1;
  }, [calendarData]);

  // Open Day View from calendar day click
  const handleDayClick = (dayNum: number) => {
    setSelectedDay(dayNum);
    setDayFormState("BUTTONS");
    setEditingDayItem(null);
    setDayTitle("");
    setDayAmount("");
    setDayCategory("");
    setDayNote("");
    setIsDayCatDropdownOpen(false);
    setActiveModal("DAY_VIEW");
  };

  // Open inline add form in Day View
  const handleOpenDayAddExpense = () => {
    setEditingDayItem(null);
    setDayTab("EXPENSE");
    setDayTitle("");
    setDayAmount("");
    setDayCategory("");
    setDayNote("");
    setDayChannel("CASH");
    setIsDayCatDropdownOpen(false);
    setDayFormState("FORM");
  };

  const handleOpenDayAddIncome = () => {
    setEditingDayItem(null);
    setDayTab("INCOME");
    setDayTitle("");
    setDayAmount("");
    setDayCategory("");
    setDayNote("");
    setDayChannel("CASH");
    setIsDayCatDropdownOpen(false);
    setDayFormState("FORM");
  };

  // Start editing item inside Day View
  const handleStartEditDayItem = (item: ExpenseItem | MonthlyExpenseItem) => {
    setEditingDayItem(item);
    setDayTitle(item.title);
    setDayAmount(
      "monthlyAmount" in item && item.monthlyAmount
        ? item.monthlyAmount.toString()
        : item.amount.toString()
    );
    setDayCategory(item.categoryName);
    setDayTab(item.type === "INCOME" ? "INCOME" : "EXPENSE");
    setDayChannel("CASH");
    setIsDayCatDropdownOpen(false);
    setDayFormState("FORM");
  };

  // Open Dedicated Edit Modal from Month View (without date editing box)
  const handleOpenEditFromMonthView = (item: ExpenseItem | MonthlyExpenseItem) => {
    setEditItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemAmount(
      "monthlyAmount" in item && item.monthlyAmount
        ? item.monthlyAmount.toString()
        : item.amount.toString()
    );
    setEditItemCategory(item.categoryName);
    setEditItemType(item.type as "EXPENSE" | "INCOME");
    setEditItemDateStr(item.dateStr || selectedDateStr);
    setEditItemChannel("CASH");
    setEditItemAccountId(undefined);
    setEditItemIsMonthly(!!item.isMonthly);
    setIsEditCatDropdownOpen(false);
    setActiveModal("EDIT_ITEM_MODAL");
  };

  // Open FAB Global Add
  const handleOpenGlobalAdd = () => {
    setGlobalTab("EXPENSE");
    setGlobalExpenseSubTab("DAILY");
    setGlobalDateStr(
      `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    );
    setGlobalMonth(currentMonth);
    setGlobalYear(currentYear);
    setGlobalTitle("");
    setGlobalAmount("");
    setGlobalCategory("");
    setGlobalChannel("CASH");
    setGlobalNote("");
    setIsGlobalCatDropdownOpen(false);
    setActiveModal("GLOBAL_ADD");
  };

  // Open Custom Thai Date Picker
  const handleOpenDatePicker = (initialDateStr: string) => {
    const parts = (initialDateStr || selectedDateStr).split("-").map(Number);
    if (parts.length >= 2) {
      setPickerYear(parts[0]);
      setPickerMonth(parts[1]);
    } else {
      setPickerYear(currentYear);
      setPickerMonth(currentMonth);
    }
    setActiveModal("DATE_PICKER");
  };

  // Date Picker Month Navigation
  const handlePickerPrevMonth = () => {
    let m = pickerMonth - 1;
    let y = pickerYear;
    if (m === 0) {
      m = 12;
      y = y - 1;
    }
    setPickerMonth(m);
    setPickerYear(y);
  };

  const handlePickerNextMonth = () => {
    let m = pickerMonth + 1;
    let y = pickerYear;
    if (m === 13) {
      m = 1;
      y = y + 1;
    }
    setPickerMonth(m);
    setPickerYear(y);
  };

  // Date Picker Select Date
  const handlePickerSelectDate = (y: number, m: number, d: number) => {
    const dStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setGlobalDateStr(dStr);
    setActiveModal("GLOBAL_ADD");
  };

  // Date Picker Select Today
  const handlePickerSelectToday = () => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setGlobalDateStr(todayStr);
    setActiveModal("GLOBAL_ADD");
  };

  // Submit Day Form (Add new or Update existing)
  const handleSubmitDayForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(dayAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("กรุณาระบุจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    if (!dayTitle.trim()) {
      showToast("กรุณาระบุชื่อรายการ", "error");
      return;
    }

    setIsSubmitting(true);

    if (editingDayItem) {
      const res = await updateExpenseAction({
        id: editingDayItem.id,
        title: dayTitle.trim(),
        amount: numAmount,
        categoryName: dayCategory.trim() || editingDayItem.categoryName,
        userId,
        organizationId,
      });

      if (res.success) {
        showToast(res.message, "success");
        setEditingDayItem(null);
        setDayFormState("BUTTONS");
        await fetchMonthData(currentYear, currentMonth);
      } else {
        showToast(res.message, "error");
      }
    } else {
      const isExpense = dayTab === "EXPENSE";
      const resolvedCat = dayCategory.trim() || (isExpense ? "ค่าใช้จ่ายเบ็ดเตล็ด" : "รายรับอื่นๆ");

      const res = await recordTransaction({
        accountId: dayAccountId,
        paymentChannel: dayChannel,
        categoryName: resolvedCat,
        title: dayTitle.trim(),
        amount: numAmount,
        type: isExpense ? "EXPENSE" : "INCOME",
        note: dayNote,
        userId,
        organizationId,
        date: selectedDateStr,
      });

      if (res.success) {
        showToast(res.message, "success");
        setDayTitle("");
        setDayAmount("");
        setDayCategory("");
        setDayNote("");
        setDayFormState("BUTTONS");
        await fetchMonthData(currentYear, currentMonth);
      } else {
        showToast(res.message, "error");
      }
    }

    setIsSubmitting(false);
  };

  // Delete transaction from Day View
  const handleDeleteDayItem = async (id: number) => {
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;
    setIsSubmitting(true);
    const res = await deleteExpenseAction(id);
    if (res.success) {
      showToast(res.message, "success");
      setEditingDayItem(null);
      setDayFormState("BUTTONS");
      await fetchMonthData(currentYear, currentMonth);
    } else {
      showToast(res.message, "error");
    }
    setIsSubmitting(false);
  };

  // Submit Dedicated Edit Modal
  const handleSubmitEditItemModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(editItemAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("กรุณาระบุจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    if (!editItemTitle.trim()) {
      showToast("กรุณาระบุชื่อรายการ", "error");
      return;
    }

    setIsSubmitting(true);
    const res = await updateExpenseAction({
      id: editItemId,
      title: editItemTitle.trim(),
      amount: numAmount,
      categoryName: editItemCategory.trim(),
      userId,
      organizationId,
    });

    if (res.success) {
      showToast(res.message, "success");
      await fetchMonthData(currentYear, currentMonth);
      setActiveModal("MONTH_VIEW");
    } else {
      showToast(res.message, "error");
    }
    setIsSubmitting(false);
  };

  // Delete from Dedicated Edit Modal
  const handleDeleteEditItemModal = async () => {
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;
    setIsSubmitting(true);
    const res = await deleteExpenseAction(editItemId);
    if (res.success) {
      showToast(res.message, "success");
      await fetchMonthData(currentYear, currentMonth);
      setActiveModal("MONTH_VIEW");
    } else {
      showToast(res.message, "error");
    }
    setIsSubmitting(false);
  };

  // Submit Global Add Form
  const handleSubmitGlobalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(globalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("กรุณาระบุจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    if (!globalTitle.trim()) {
      showToast("กรุณาระบุชื่อรายการ", "error");
      return;
    }

    setIsSubmitting(true);
    const isMonthly = globalTab === "EXPENSE" && globalExpenseSubTab === "MONTHLY";
    const resolvedCat =
      globalCategory.trim() || (globalTab === "EXPENSE" ? "ค่าใช้จ่ายเบ็ดเตล็ด" : "รายรับอื่นๆ");

    const targetDate = isMonthly
      ? `${globalYear}-${String(globalMonth).padStart(2, "0")}-01`
      : globalDateStr;

    const res = await recordTransaction({
      accountId: globalAccountId,
      paymentChannel: globalChannel,
      categoryName: resolvedCat,
      title: globalTitle.trim(),
      amount: numAmount,
      type: globalTab,
      note: globalNote,
      userId,
      organizationId,
      date: targetDate,
      isMonthly,
    });

    if (res.success) {
      showToast(res.message, "success");
      setActiveModal("NONE");
      await fetchMonthData(currentYear, currentMonth);
    } else {
      showToast(res.message, "error");
    }
    setIsSubmitting(false);
  };

  // Execute Copy Day
  const handleExecuteCopyDay = async () => {
    if (!selectedCopyDate) {
      showToast("กรุณาเลือกวันที่ต้องการคัดลอก", "warning");
      return;
    }

    setIsSubmitting(true);
    const res = await copyDayExpensesAction({
      sourceDate: selectedCopyDate,
      targetDate: selectedDateStr,
      userId,
      organizationId,
    });

    if (res.success) {
      showToast(res.message, "success");
      setActiveModal("DAY_VIEW");
      await fetchMonthData(currentYear, currentMonth);
    } else {
      showToast(res.message, "error");
    }
    setIsSubmitting(false);
  };

  const selectedDayExpenses = selectedDayData.dailyItems.filter((i) => i.type === "EXPENSE");
  const selectedDayIncomes = selectedDayData.dailyItems.filter((i) => i.type === "INCOME");

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-pos-bg text-pos-text p-2 sm:p-4 font-sans relative selection:bg-[#166675]/20">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl bg-white dark:bg-slate-900 border border-pos-border text-xs sm:text-sm font-semibold animate-in slide-in-from-bottom-2">
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "warning"
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          />
          <span className="text-slate-800 dark:text-slate-100">{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="w-full bg-pos-surface border border-pos-border rounded-2xl px-5 py-3.5 mb-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#166675] text-white flex items-center justify-center text-xl shadow-xs">
            👛
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-pos-text leading-tight">
              รายรับ-รายจ่าย
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              ปฏิทินบันทึกรายรับและรายจ่ายประจำวันของร้าน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border border-[#166675]/20 dark:border-[#166675]/40 text-xs font-semibold">
            {monthName} {thaiYear}
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        
        {/* ============================================================== */}
        {/* MOBILE SUMMARY (TABBED VIEW) (Displayed only on < md / Phones) */}
        {/* ============================================================== */}
        <div className="block md:hidden mb-1">
          <div className="bg-[#166675] rounded-2xl p-4 shadow-md shadow-[#166675]/20 text-white">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 bg-black/15 p-1 rounded-xl w-full max-w-[280px] mx-auto mb-4">
              <button
                onClick={() => setMobileTab("TODAY")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mobileTab === "TODAY" ? "bg-white text-[#166675] shadow-sm" : "text-white/90 hover:text-white"
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => setMobileTab("MONTH")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mobileTab === "MONTH" ? "bg-white text-[#166675] shadow-sm" : "text-white/90 hover:text-white"
                }`}
              >
                เดือนนี้
              </button>
              <button
                onClick={() => setMobileTab("YEAR")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mobileTab === "YEAR" ? "bg-white text-[#166675] shadow-sm" : "text-white/90 hover:text-white"
                }`}
              >
                ปีนี้
              </button>
            </div>

            {/* Content Display */}
            <div className="flex items-center justify-between text-center px-2">
              <div>
                <div className="text-[11px] text-white/85 mb-0.5">รายรับ</div>
                <div className="font-bold text-sm sm:text-base">
                  {mobileTab === "TODAY" && (calendarData?.todayIncome ?? 0).toLocaleString()}
                  {mobileTab === "MONTH" && (calendarData?.monthIncome ?? 0).toLocaleString()}
                  {mobileTab === "YEAR" && (calendarData?.yearIncome ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-[11px] text-white/85 mb-0.5">รายจ่าย</div>
                <div className="font-bold text-sm sm:text-base text-[#ffb8b1]">
                  {mobileTab === "TODAY" && (calendarData?.todayExpense ?? 0).toLocaleString()}
                  {mobileTab === "MONTH" && (calendarData?.monthExpense ?? 0).toLocaleString()}
                  {mobileTab === "YEAR" && (calendarData?.yearExpense ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-[11px] text-white/85 mb-0.5">สุทธิ</div>
                <div className={`font-black text-sm sm:text-base ${
                  (mobileTab === "TODAY" ? (calendarData?.todayNet ?? 0) : mobileTab === "MONTH" ? (calendarData?.monthNet ?? 0) : (calendarData?.yearNet ?? 0)) >= 0 
                  ? "text-[#99f6e4]" 
                  : "text-[#ffb8b1]"
                }`}>
                  {mobileTab === "TODAY" && ((calendarData?.todayNet ?? 0) > 0 ? `+${(calendarData?.todayNet ?? 0).toLocaleString()}` : (calendarData?.todayNet ?? 0).toLocaleString())}
                  {mobileTab === "MONTH" && ((calendarData?.monthNet ?? 0) > 0 ? `+${(calendarData?.monthNet ?? 0).toLocaleString()}` : (calendarData?.monthNet ?? 0).toLocaleString())}
                  {mobileTab === "YEAR" && ((calendarData?.yearNet ?? 0) > 0 ? `+${(calendarData?.yearNet ?? 0).toLocaleString()}` : (calendarData?.yearNet ?? 0).toLocaleString())}
                </div>
              </div>
            </div>

            {/* Averages for Month / Year */}
            {mobileTab === "MONTH" && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] text-white/90 pt-3 mt-3 border-t border-white/20">
                <span><span className="opacity-70">เฉลี่ยวันละ:</span> รายรับ <span className="font-bold">{(calendarData?.avgDailyIncome ?? 0).toLocaleString()}</span></span>
                <span>รายจ่าย <span className="font-bold text-[#ffb8b1]">{(calendarData?.avgDailyExpense ?? 0).toLocaleString()}</span></span>
              </div>
            )}
            {mobileTab === "YEAR" && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] text-white/90 pt-3 mt-3 border-t border-white/20">
                <span><span className="opacity-70">เฉลี่ยเดือนละ:</span> รายรับ <span className="font-bold">{(calendarData?.avgMonthlyIncome ?? 0).toLocaleString()}</span></span>
                <span>รายจ่าย <span className="font-bold text-[#ffb8b1]">{(calendarData?.avgMonthlyExpense ?? 0).toLocaleString()}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP & IPAD SUMMARY (3 CARDS) (Displayed only on >= md)     */}
        {/* ============================================================== */}
        <div className="hidden md:flex flex-col md:col-span-4 lg:col-span-3 space-y-3.5">
          
          {/* Card 1: วันนี้ */}
          <div
            onClick={() => {
              setSelectedDay(now.getDate());
              setDayFormState("BUTTONS");
              setActiveModal("DAY_VIEW");
            }}
            className="bg-[#166675] hover:bg-[#125a67] text-white rounded-[16px] p-4 sm:p-5 shadow-sm transition cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold text-white tracking-wide">วันนี้</span>
              <span className="text-white/30 text-xs font-bold">&gt;</span>
            </div>
            <div className="space-y-3 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-white/90">รายรับ</span>
                <span className="font-semibold text-white">
                  {(calendarData?.todayIncome ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/90">รายจ่าย</span>
                <span className="font-semibold text-[#ffb8b1]">
                  {(calendarData?.todayExpense ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-white/90">สุทธิ</span>
                <span
                  className={`font-bold text-[15px] ${
                    (calendarData?.todayNet ?? 0) >= 0 ? "text-[#99f6e4]" : "text-[#ffb8b1]"
                  }`}
                >
                  {(calendarData?.todayNet ?? 0) > 0
                    ? `+${(calendarData?.todayNet ?? 0).toLocaleString()}`
                    : (calendarData?.todayNet ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: เดือนนี้ */}
          <div
            onClick={() => setActiveModal("MONTH_VIEW")}
            className="bg-[#166675] hover:bg-[#125a67] text-white rounded-[16px] p-4 sm:p-5 shadow-sm transition cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold text-white tracking-wide">เดือนนี้</span>
              <span className="text-white/30 text-xs font-bold">&gt;</span>
            </div>
            <div className="space-y-3 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-white/90">รายรับ</span>
                <span className="font-semibold text-white">
                  {(calendarData?.monthIncome ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/90">รายจ่าย</span>
                <span className="font-semibold text-[#ffb8b1]">
                  {(calendarData?.monthExpense ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-white/90">สุทธิ</span>
                <span
                  className={`font-bold text-[15px] ${
                    (calendarData?.monthNet ?? 0) >= 0 ? "text-[#99f6e4]" : "text-[#ffb8b1]"
                  }`}
                >
                  {(calendarData?.monthNet ?? 0) > 0
                    ? `+${(calendarData?.monthNet ?? 0).toLocaleString()}`
                    : (calendarData?.monthNet ?? 0).toLocaleString()}
                </span>
              </div>
              
              {/* เฉลี่ยวันละ */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-white/90 mb-1">เฉลี่ยวันละ</div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">รายรับ</span>
                  <span className="font-semibold text-white">
                    {(calendarData?.avgDailyIncome ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">รายจ่าย</span>
                  <span className="font-semibold text-[#ffb8b1]">
                    {(calendarData?.avgDailyExpense ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: ปีนี้ */}
          <div
            onClick={() => setActiveModal("YEAR_VIEW")}
            className="bg-[#166675] hover:bg-[#125a67] text-white rounded-[16px] p-4 sm:p-5 shadow-sm transition cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold text-white tracking-wide">ปีนี้</span>
              <span className="text-white/30 text-xs font-bold">&gt;</span>
            </div>
            <div className="space-y-3 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-white/90">รายรับ</span>
                <span className="font-semibold text-white">
                  {(calendarData?.yearIncome ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/90">รายจ่าย</span>
                <span className="font-semibold text-[#ffb8b1]">
                  {(calendarData?.yearExpense ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-white/90">สุทธิ</span>
                <span
                  className={`font-bold text-[15px] ${
                    (calendarData?.yearNet ?? 0) >= 0 ? "text-[#99f6e4]" : "text-[#ffb8b1]"
                  }`}
                >
                  {(calendarData?.yearNet ?? 0) > 0
                    ? `+${(calendarData?.yearNet ?? 0).toLocaleString()}`
                    : (calendarData?.yearNet ?? 0).toLocaleString()}
                </span>
              </div>
              
              {/* เฉลี่ยเดือนละ */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-white/90 mb-1">เฉลี่ยเดือนละ</div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">รายรับ</span>
                  <span className="font-semibold text-white">
                    {(calendarData?.avgMonthlyIncome ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">รายจ่าย</span>
                  <span className="font-semibold text-[#ffb8b1]">
                    {(calendarData?.avgMonthlyExpense ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* RIGHT COLUMN: CALENDAR GRID */}
        <div className="md:col-span-8 lg:col-span-9 bg-pos-surface border border-pos-border rounded-2xl p-4 sm:p-5 shadow-2xs">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs transition cursor-pointer"
            >
              &lt;
            </button>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-wide">
              {monthName} {thaiYear}
            </h2>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs transition cursor-pointer"
            >
              &gt;
            </button>
          </div>

          {/* Weekday Names Header Row */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold select-none">
            <div className="text-rose-500">อา</div>
            <div className="text-slate-500">จ</div>
            <div className="text-slate-500">อ</div>
            <div className="text-slate-500">พ</div>
            <div className="text-slate-500">พฤ</div>
            <div className="text-slate-500">ศ</div>
            <div className="text-slate-500">ส</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank cells for offset before month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 sm:h-20" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayData = calendarData?.dailyExpensesMap[dayNum];
              const hasActivity =
                dayData && (dayData.totalExpense > 0 || dayData.totalIncome > 0);
              const net = dayData ? dayData.net : 0;
              const isSelected = selectedDay === dayNum;
              const isToday =
                now.getDate() === dayNum &&
                now.getMonth() + 1 === currentMonth &&
                now.getFullYear() === currentYear;
              const isSunday = (firstDayOfWeek + i) % 7 === 0;
              const isFuture = isFutureDate(dayNum, currentMonth, currentYear);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-16 sm:h-20 rounded-2xl p-1.5 flex flex-col items-center justify-between transition cursor-pointer relative select-none ${
                    isFuture
                      ? "bg-slate-50/40 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/40"
                      : isToday
                      ? "border-2 border-rose-500 bg-white dark:bg-slate-900"
                      : isSelected
                      ? "border-2 border-[#166675] bg-[#166675]/10 dark:bg-[#166675]/20 shadow-sm"
                      : net > 0
                      ? "bg-[#ebf5ed] hover:bg-[#dff0e2] dark:bg-emerald-950/30 border border-[#d2ead7] dark:border-emerald-900/40"
                      : net < 0
                      ? "bg-[#faebee] hover:bg-[#f6e1e5] dark:bg-rose-950/30 border border-[#f5d5db] dark:border-rose-900/40"
                      : "bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isFuture
                        ? "text-slate-400 dark:text-slate-500 font-medium"
                        : isSunday
                        ? "text-rose-500 font-extrabold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Future dates: subtle text */}
                  {isFuture && hasActivity && (
                    <span className="text-xs font-medium mb-1 tracking-tight text-slate-400 dark:text-slate-500">
                      {net < 0 ? `-${formatAmountBadge(Math.abs(net))}` : `+${formatAmountBadge(net)}`}
                    </span>
                  )}

                  {/* Non-future dates */}
                  {!isFuture && hasActivity && net > 0 && (
                    <span className="text-xs sm:text-sm font-black mb-1 tracking-tight text-emerald-700 dark:text-emerald-400">
                      +{formatAmountBadge(net)}
                    </span>
                  )}

                  {!isFuture && hasActivity && net < 0 && (
                    <span className="text-xs sm:text-sm font-black mb-1 tracking-tight text-rose-600 dark:text-rose-400">
                      -{formatAmountBadge(Math.abs(net))}
                    </span>
                  )}

                  {!isFuture && hasActivity && net === 0 && (
                    <span className="text-xs font-bold mb-1 text-slate-500">
                      0
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) (POS Theme) */}
      <button
        onClick={handleOpenGlobalAdd}
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 w-14 h-14 rounded-full bg-[#166675] hover:bg-[#125a67] text-white shadow-xl shadow-[#166675]/30 flex items-center justify-center text-3xl font-light transition active:scale-95 cursor-pointer"
        title="เพิ่มรายการ"
      >
        +
      </button>

      {/* ============================================================== */}
      {/* MODAL 1: DAY VIEW (Adjusted size & proportions)                */}
      {/* ============================================================== */}
      {activeModal === "DAY_VIEW" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setActiveModal("NONE")} />

          <div className="relative w-[95%] sm:w-full max-w-lg bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text max-h-[92vh] min-h-[50vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                รายจ่าย · {selectedDayThaiDate}
              </h3>
              <button
                onClick={() => setActiveModal("NONE")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Banner (POS Theme): รายรับ | รายจ่าย | สุทธิ */}
            <div className="bg-[#166675] text-white rounded-2xl p-4 flex items-center justify-around text-center mb-3 shadow-2xs shrink-0">
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">รายรับ</span>
                <span className="text-lg font-black text-white">
                  {selectedDayData.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">รายจ่าย</span>
                <span className="text-lg font-black text-[#ffb8b1]">
                  {selectedDayData.totalExpense.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">สุทธิ</span>
                <span className={`text-lg font-black ${selectedDayData.net >= 0 ? "text-[#99f6e4]" : "text-[#ffb8b1]"}`}>
                  {selectedDayData.net > 0 ? `+${selectedDayData.net.toLocaleString()}` : selectedDayData.net.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Future Date Alert */}
            {isSelectedDayFuture && (
              <div className="bg-[#166675]/10 dark:bg-[#166675]/20 border border-[#166675]/30 dark:border-[#166675]/40 text-[#166675] dark:text-[#53b9cc] rounded-xl px-3 py-2 text-xs text-center font-medium mb-3 flex items-center justify-center gap-1.5 shadow-2xs shrink-0">
                <span>วันที่ยังมาไม่ถึง รายการที่กรอกไว้จะยังไม่รวมในยอดเดือนนี้</span>
              </div>
            )}

            {/* SCROLLABLE HISTORY LIST */}
            <div
              className={`overflow-y-auto pr-2 space-y-3 custom-scroll flex-1 min-h-[150px] ${
                dayFormState === "FORM" ? "max-h-[35vh] sm:max-h-[40vh]" : "max-h-[50vh] sm:max-h-[55vh]"
              }`}
            >
              {/* 1. รายรับ */}
              {selectedDayIncomes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl">
                    <span>รายรับ</span>
                    <span className="text-emerald-600 font-bold">
                      {selectedDayIncomes
                        .reduce((sum, item) => sum + item.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  {selectedDayIncomes.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {idx > 0 && <div className="border-b border-dashed border-slate-200 dark:border-slate-700/60 my-1" />}
                      <div
                        onClick={() => handleStartEditDayItem(item)}
                        className="py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-sm text-emerald-600">
                            {item.amount.toLocaleString()}
                          </span>
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* 2. รายจ่ายทั่วไป */}
              {selectedDayExpenses.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl">
                    <span>รายจ่ายทั่วไป</span>
                    <span className="text-rose-600 font-bold">
                      {selectedDayExpenses
                        .reduce((sum, item) => sum + item.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  {selectedDayExpenses.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {idx > 0 && <div className="border-b border-dashed border-slate-200 dark:border-slate-700/60 my-1" />}
                      <div
                        onClick={() => handleStartEditDayItem(item)}
                        className="py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-sm text-rose-600">
                            {item.amount.toLocaleString()}
                          </span>
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                (selectedDayIncomes.length > 0 || selectedDayData.monthlyItems.length > 0) && (
                  <div className="py-2 text-center text-xs text-slate-400 font-medium">
                    ยังไม่มีรายจ่ายรายวัน
                  </div>
                )
              )}

              {/* 3. รายเดือน เฉลี่ยต่อวัน */}
              {selectedDayData.monthlyItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl">
                    <span className="flex items-center gap-1">
                      รายเดือน <span className="text-[10px] text-slate-400 font-normal">เฉลี่ยต่อวัน</span>
                    </span>
                    <span className="text-rose-600 font-bold">
                      {selectedDayData.monthlyItems
                        .reduce((sum, item) => sum + item.dailyShare, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  {selectedDayData.monthlyItems.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {idx > 0 && <div className="border-b border-dashed border-slate-200 dark:border-slate-700/60 my-1" />}
                      <div
                        onClick={() => handleStartEditDayItem(item)}
                        className="py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            เดือนละ {item.monthlyAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-sm text-rose-600">
                            {item.dailyShare.toLocaleString()}
                          </span>
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {selectedDayIncomes.length === 0 &&
                selectedDayExpenses.length === 0 &&
                selectedDayData.monthlyItems.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400 font-medium">
                    ยังไม่มีรายการบันทึกของวันนี้
                  </div>
                )}
            </div>

            {/* Note & Divider */}
            <div className="py-2 text-center shrink-0">
              <span className="text-[11px] text-slate-400">แตะที่รายการเพื่อแก้ไข</span>
            </div>

            {/* BOTTOM SECTION: 3 ACTION BUTTONS OR INLINE FORM */}
            {dayFormState === "BUTTONS" ? (
              <div className="space-y-2.5 pt-3 border-t border-pos-border shrink-0">
                <button
                  type="button"
                  onClick={handleOpenDayAddExpense}
                  className="w-full py-3 bg-[#166675] hover:bg-[#125a67] text-white rounded-xl font-bold text-sm cursor-pointer shadow-xs transition active:scale-98"
                >
                  เพิ่มรายจ่าย
                </button>
                <button
                  type="button"
                  onClick={handleOpenDayAddIncome}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm cursor-pointer transition active:scale-98"
                >
                  เพิ่มรายรับ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("COPY_DAY")}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm cursor-pointer transition active:scale-98"
                >
                  คัดลอกจากวันอื่น
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitDayForm} className="pt-3 border-t border-pos-border space-y-3 shrink-0">
                {editingDayItem ? (
                  <div className="flex items-center justify-between bg-[#166675]/10 dark:bg-[#166675]/20 px-3 py-2 rounded-xl text-xs font-semibold text-[#166675] dark:text-[#53b9cc]">
                    <span>
                      กำลังแก้ไข: <strong>{editingDayItem.title}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDayItem(null);
                        setDayFormState("BUTTONS");
                      }}
                      className="text-slate-500 hover:text-slate-700 underline text-xs cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {dayTab === "EXPENSE" ? "กรอกข้อมูลรายจ่าย" : "กรอกข้อมูลรายรับ"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDayFormState("BUTTONS")}
                      className="text-xs text-[#166675] dark:text-[#53b9cc] hover:underline cursor-pointer font-medium"
                    >
                      ย้อนกลับ
                    </button>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    ชื่อรายการ *
                  </label>
                  <input
                    required
                    placeholder="เช่น ซื้อผักสด, ค่าไฟ, ค่านม..."
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675] font-medium"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    จำนวนเงิน *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={dayAmount}
                      onChange={(e) => setDayAmount(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-12 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      {currency}
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    ประเภท
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="กดเพื่อเลือก หรือพิมพ์หมวดหมู่ใหม่..."
                      value={dayCategory}
                      onFocus={() => setIsDayCatDropdownOpen(true)}
                      onChange={(e) => {
                        setDayCategory(e.target.value);
                        setIsDayCatDropdownOpen(true);
                      }}
                      className="w-full h-10 pl-3.5 pr-8 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setIsDayCatDropdownOpen((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                    >
                      ▼
                    </button>

                    {isDayCatDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-pos-border rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto py-1.5">
                        {dayCategoryList.length > 0 ? (
                          <>
                            {dayCategoryList
                              .filter(
                                (c) =>
                                  !dayCategory.trim() ||
                                  c.name.toLowerCase().includes(dayCategory.toLowerCase())
                              )
                              .map((c) => (
                                <div
                                  key={c.id}
                                  onMouseDown={() => {
                                    setDayCategory(c.name);
                                    setIsDayCatDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-[#166675]/10 dark:hover:bg-slate-700/60 ${
                                    dayCategory === c.name
                                      ? "bg-[#166675]/10 dark:bg-slate-700 text-[#166675] dark:text-[#53b9cc] font-bold"
                                      : "text-slate-700 dark:text-slate-200"
                                  }`}
                                >
                                  <span>{c.name}</span>
                                  {dayCategory === c.name && (
                                    <span className="text-[#166675] font-bold">✓</span>
                                  )}
                                </div>
                              ))}
                            {dayCategory.trim() &&
                              !dayCategoryList.some(
                                (c) => c.name.toLowerCase() === dayCategory.trim().toLowerCase()
                              ) && (
                                <div
                                  onMouseDown={() => setIsDayCatDropdownOpen(false)}
                                  className="px-4 py-2 text-sm cursor-pointer border-t border-pos-border bg-slate-50 dark:bg-slate-800/80 text-[#166675] dark:text-[#53b9cc] font-semibold"
                                >
                                  + ใช้หมวดหมู่ใหม่: "{dayCategory.trim()}"
                                </div>
                              )}
                          </>
                        ) : (
                          <div className="px-3 py-3 text-sm text-slate-400 text-center">
                            ยังไม่มีหมวดหมู่ (พิมพ์เพื่อสร้างใหม่ได้เลย)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Channel Pills */}
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDayChannel("CASH")}
                      className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        dayChannel === "CASH"
                          ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      เงินสด
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayChannel("TRANSFER")}
                      className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        dayChannel === "TRANSFER"
                          ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      เงินโอน
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayChannel("OTHER")}
                      className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        dayChannel === "OTHER"
                          ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      ช่องทางอื่น
                    </button>
                  </div>
                </div>

                {/* Other Channel Select in Day View */}
                {dayChannel === "OTHER" && (
                  <div>
                    <select
                      value={dayAccountId || ""}
                      onChange={(e) => setDayAccountId(Number(e.target.value))}
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-pos-border rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#166675] font-medium"
                    >
                      <option value="">-- เลือกบัญชี --</option>
                      {calendarData?.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} (คงเหลือ: {Number(a.balance).toLocaleString()} {currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  {editingDayItem ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDeleteDayItem(editingDayItem.id)}
                        className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition cursor-pointer shadow-xs"
                      >
                        ลบ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDayItem(null);
                          setDayFormState("BUTTONS");
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-[#166675] hover:bg-[#125a67] text-white rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-[#166675] hover:bg-[#125a67] text-white rounded-xl font-bold text-sm cursor-pointer shadow-xs disabled:opacity-50 transition active:scale-98"
                    >
                      {isSubmitting
                        ? "กำลังบันทึก..."
                        : dayTab === "EXPENSE"
                        ? "บันทึกรายจ่าย"
                        : "บันทึกรายรับ"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: MONTH VIEW (Adjusted sizing for consistency)         */}
      {/* ============================================================== */}
      {activeModal === "MONTH_VIEW" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setActiveModal("NONE")} />

          <div className="relative w-[95%] sm:w-full max-w-lg bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>📅</span>
                <span>
                  รายรับ-รายจ่าย{monthName} {thaiYear}
                </span>
              </h3>
              <button
                onClick={() => setActiveModal("NONE")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Banner (POS Theme) */}
            <div className="bg-[#166675] text-white rounded-2xl p-4 flex items-center justify-around text-center mb-4 shadow-2xs shrink-0">
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">รายรับ</span>
                <span className="text-lg font-black text-white">
                  {(calendarData?.monthIncome ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">รายจ่าย</span>
                <span className="text-lg font-black text-[#ffb8b1]">
                  {(calendarData?.monthExpense ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">สุทธิ</span>
                <span className={`text-lg font-black ${ (calendarData?.monthNet ?? 0) >= 0 ? "text-[#99f6e4]" : "text-[#ffb8b1]" }`}>
                  {(calendarData?.monthNet ?? 0) > 0
                    ? `+${(calendarData?.monthNet ?? 0).toLocaleString()}`
                    : (calendarData?.monthNet ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Content Sections */}
            <div className="flex-1 min-h-0 max-h-[55vh] overflow-y-auto pr-2 space-y-3.5 custom-scroll">
              {/* Section 1: รายรับ */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl mb-1.5">
                  <span>รายรับ</span>
                  <span className="text-emerald-600 font-bold">
                    {(calendarData?.monthIncome ?? 0).toLocaleString()}
                  </span>
                </div>
                {calendarData?.monthAllIncomes && calendarData.monthAllIncomes.length > 0 ? (
                  <div className="space-y-1">
                    {calendarData.monthAllIncomes.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        {idx > 0 && <div className="border-b border-dashed border-slate-200 dark:border-slate-700/60 my-0.5" />}
                        <div
                          onClick={() => handleOpenEditFromMonthView(item)}
                          className="py-2 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-sm transition cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-emerald-600">
                              {item.amount.toLocaleString()}
                            </span>
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-2 text-sm text-slate-400">ยังไม่มีรายรับในเดือนนี้</p>
                )}
              </div>

              {/* Section 2: รายเดือน */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl mb-1.5">
                  <span>รายเดือน</span>
                  <span className="text-rose-600 font-bold">
                    {(calendarData?.totalMonthlyExpense ?? 0).toLocaleString()}
                  </span>
                </div>
                {calendarData?.monthlyExpenseItems && calendarData.monthlyExpenseItems.length > 0 ? (
                  <div className="space-y-1">
                    {calendarData.monthlyExpenseItems.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        {idx > 0 && <div className="border-b border-dashed border-slate-200 dark:border-slate-700/60 my-0.5" />}
                        <div
                          onClick={() => handleOpenEditFromMonthView(item)}
                          className="py-2 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              เฉลี่ยวันละ {item.dailyShare.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-sm text-rose-600">
                              {item.monthlyAmount.toLocaleString()}
                            </span>
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-2 text-sm text-slate-400">
                    ยังไม่มีรายจ่ายรายเดือน กดปุ่ม + แล้วเลือก "รายเดือน"
                  </p>
                )}
              </div>

              {/* Section 3: รายจ่ายทั่วไป */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl mb-1.5">
                  <span>รายจ่ายทั่วไป</span>
                  <span className="text-rose-600 font-bold">
                    {(
                      calendarData?.monthAllDailyExpenses.reduce(
                        (sum, item) => sum + item.amount,
                        0
                      ) ?? 0
                    ).toLocaleString()}
                  </span>
                </div>
                {calendarData?.monthAllDailyExpenses &&
                calendarData.monthAllDailyExpenses.length > 0 ? (
                  <div className="space-y-1">
                    {calendarData.monthAllDailyExpenses.map((item, idx) => {
                      const thaiInfo = formatThaiDateFromStr(item.dateStr);
                      return (
                        <React.Fragment key={item.id}>
                          {idx > 0 && <div className="border-b border-dashed border-slate-200 dark:border-slate-700/60 my-0.5" />}
                          <div
                            onClick={() => handleOpenEditFromMonthView(item)}
                            className="py-2 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex flex-col">
                              {thaiInfo.shortMonthYear && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {thaiInfo.shortMonthYear}
                                </span>
                              )}
                              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-bold text-sm text-rose-600">
                                {item.amount.toLocaleString()}
                              </span>
                              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-2 text-sm text-slate-400">
                    ยังไม่มีรายจ่ายทั่วไปในเดือนนี้
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-2 border-t border-pos-border text-center shrink-0">
              <span className="text-[11px] text-slate-400">แตะที่รายการเพื่อแก้ไข</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DEDICATED EDIT MODAL (Without Date Editing Box)        */}
      {/* ============================================================== */}
      {activeModal === "EDIT_ITEM_MODAL" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setActiveModal("MONTH_VIEW")} />

          <div className="relative w-[95%] sm:w-full max-w-lg bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {editItemType === "EXPENSE" ? "แก้ไขรายจ่าย" : "แก้ไขรายรับ"}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {formatThaiDateFromStr(editItemDateStr).shortMonthYear}
                </span>
              </div>
              <button
                onClick={() => setActiveModal("MONTH_VIEW")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEditItemModal} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ชื่อรายการ *
                </label>
                <input
                  required
                  value={editItemTitle}
                  onChange={(e) => setEditItemTitle(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  จำนวนเงิน *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editItemAmount}
                    onChange={(e) => setEditItemAmount(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-12 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ประเภท
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="กดเพื่อเลือก หรือพิมพ์หมวดหมู่ใหม่..."
                    value={editItemCategory}
                    onFocus={() => setIsEditCatDropdownOpen(true)}
                    onChange={(e) => {
                      setEditItemCategory(e.target.value);
                      setIsEditCatDropdownOpen(true);
                    }}
                    className="w-full h-10 pl-3.5 pr-8 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setIsEditCatDropdownOpen((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                  >
                    ▼
                  </button>

                  {isEditCatDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-pos-border rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto py-1.5">
                      {editCategoryList.length > 0 ? (
                        <>
                          {editCategoryList
                            .filter(
                              (c) =>
                                !editItemCategory.trim() ||
                                c.name.toLowerCase().includes(editItemCategory.toLowerCase())
                            )
                            .map((c) => (
                              <div
                                key={c.id}
                                onMouseDown={() => {
                                  setEditItemCategory(c.name);
                                  setIsEditCatDropdownOpen(false);
                                }}
                                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-[#166675]/10 dark:hover:bg-slate-700/60 ${
                                  editItemCategory === c.name
                                    ? "bg-[#166675]/10 dark:bg-slate-700 text-[#166675] dark:text-[#53b9cc] font-bold"
                                    : "text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                <span>{c.name}</span>
                                {editItemCategory === c.name && (
                                  <span className="text-[#166675] font-bold">✓</span>
                                )}
                              </div>
                            ))}
                          {editItemCategory.trim() &&
                            !editCategoryList.some(
                              (c) => c.name.toLowerCase() === editItemCategory.trim().toLowerCase()
                            ) && (
                              <div
                                onMouseDown={() => setIsEditCatDropdownOpen(false)}
                                className="px-4 py-2 text-sm cursor-pointer border-t border-pos-border bg-slate-50 dark:bg-slate-800/80 text-[#166675] dark:text-[#53b9cc] font-semibold"
                              >
                                + ใช้หมวดหมู่ใหม่: "{editItemCategory.trim()}"
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="px-3 py-3 text-sm text-slate-400 text-center">
                          ยังไม่มีหมวดหมู่ (พิมพ์เพื่อสร้างใหม่ได้เลย)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Channel (if not monthly) */}
              {!editItemIsMonthly && (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditItemChannel("CASH")}
                      className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        editItemChannel === "CASH"
                          ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      เงินสด
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItemChannel("TRANSFER")}
                      className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        editItemChannel === "TRANSFER"
                          ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      เงินโอน
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItemChannel("OTHER")}
                      className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        editItemChannel === "OTHER"
                          ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      ช่องทางอื่น
                    </button>
                  </div>
                </div>
              )}

              {/* Other Channel Select in Edit Modal */}
              {!editItemIsMonthly && editItemChannel === "OTHER" && (
                <div>
                  <select
                    value={editItemAccountId || ""}
                    onChange={(e) => setEditItemAccountId(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-pos-border rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#166675] font-medium"
                  >
                    <option value="">-- เลือกบัญชี --</option>
                    {calendarData?.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} (คงเหลือ: {Number(a.balance).toLocaleString()} {currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteEditItemModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  ลบ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#166675] hover:bg-[#125a67] text-white rounded-xl font-bold text-sm transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: GLOBAL ADD (Adjusted sizing for consistency)           */}
      {/* ============================================================== */}
      {activeModal === "GLOBAL_ADD" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setActiveModal("NONE")} />

          <div className="relative w-[95%] sm:w-full max-w-lg bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {globalTab === "EXPENSE" ? "บันทึกรายจ่าย" : "บันทึกรายรับ"}
              </h3>
              <button
                onClick={() => setActiveModal("NONE")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Tabs: รายจ่าย | รายรับ (POS Theme) */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setGlobalTab("EXPENSE")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition cursor-pointer border ${
                  globalTab === "EXPENSE"
                    ? "bg-[#166675] text-white border-transparent shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                รายจ่าย
              </button>
              <button
                type="button"
                onClick={() => setGlobalTab("INCOME")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition cursor-pointer border ${
                  globalTab === "INCOME"
                    ? "bg-[#166675] text-white border-transparent shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                รายรับ
              </button>
            </div>

            {/* Sub-tab Pill: รายวัน | รายเดือน */}
            {globalTab === "EXPENSE" && (
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-3">
                <button
                  type="button"
                  onClick={() => setGlobalExpenseSubTab("DAILY")}
                  className={`py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    globalExpenseSubTab === "DAILY"
                      ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  รายวัน
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalExpenseSubTab("MONTHLY")}
                  className={`py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    globalExpenseSubTab === "MONTHLY"
                      ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  รายเดือน
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitGlobalForm} className="space-y-4">
              {/* Date Box */}
              {globalTab === "EXPENSE" && globalExpenseSubTab === "MONTHLY" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    เดือนที่บันทึก
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={globalMonth}
                      onChange={(e) => setGlobalMonth(Number(e.target.value))}
                      className="h-10 px-3.5 bg-white dark:bg-slate-800 border border-pos-border rounded-xl text-sm font-bold cursor-pointer"
                    >
                      {THAI_MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={globalYear}
                      onChange={(e) => setGlobalYear(Number(e.target.value))}
                      className="h-10 px-3.5 bg-white dark:bg-slate-800 border border-pos-border rounded-xl text-sm font-bold cursor-pointer"
                    >
                      {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                        <option key={y} value={y}>
                          พ.ศ. {y + 543}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-[#166675] dark:text-[#53b9cc] mt-1.5 font-medium leading-relaxed">
                    ℹ️ รายการรายเดือนจะถูกนำไปเฉลี่ยเป็นรายจ่ายประจำวันในทุกๆ วันของเดือนนั้น (เช่น 1,600 {currency} ÷ 31 วัน = วันละ 52 {currency})
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => handleOpenDatePicker(globalDateStr)}
                  className="w-full border border-pos-border rounded-2xl p-3 bg-slate-50/70 dark:bg-slate-800/70 hover:border-[#166675] cursor-pointer transition select-none flex flex-col justify-center"
                >
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {formatThaiDateFromStr(globalDateStr).short}
                  </span>
                  <span className="text-xs text-[#166675] dark:text-[#53b9cc] font-medium mt-0.5">
                    {formatThaiDateFromStr(globalDateStr).full}
                  </span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ชื่อรายการ *
                </label>
                <input
                  required
                  placeholder={
                    globalTab === "EXPENSE"
                      ? globalExpenseSubTab === "MONTHLY"
                        ? "เช่น ค่าเช่าร้าน, ค่าอินเทอร์เน็ต..."
                        : "เช่น ค่าวัตถุดิบ, ค่าอุปกรณ์..."
                      : "เช่น ขายของหน้าร้าน, ค่าขนม..."
                  }
                  value={globalTitle}
                  onChange={(e) => setGlobalTitle(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675] font-medium"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  จำนวนเงิน *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={globalAmount}
                    onChange={(e) => setGlobalAmount(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-12 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ประเภท
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="กดเพื่อเลือก หรือพิมพ์หมวดหมู่ใหม่..."
                    value={globalCategory}
                    onFocus={() => setIsGlobalCatDropdownOpen(true)}
                    onChange={(e) => {
                      setGlobalCategory(e.target.value);
                      setIsGlobalCatDropdownOpen(true);
                    }}
                    className="w-full h-10 pl-3.5 pr-8 bg-slate-50/80 dark:bg-slate-800/80 border border-pos-border rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166675]"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setIsGlobalCatDropdownOpen((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                  >
                    ▼
                  </button>

                  {isGlobalCatDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-pos-border rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto py-1.5">
                      {globalCategoryList.length > 0 ? (
                        <>
                          {globalCategoryList
                            .filter(
                              (c) =>
                                !globalCategory.trim() ||
                                c.name.toLowerCase().includes(globalCategory.toLowerCase())
                            )
                            .map((c) => (
                              <div
                                key={c.id}
                                onMouseDown={() => {
                                  setGlobalCategory(c.name);
                                  setIsGlobalCatDropdownOpen(false);
                                }}
                                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-[#166675]/10 dark:hover:bg-slate-700/60 ${
                                  globalCategory === c.name
                                    ? "bg-[#166675]/10 dark:bg-slate-700 text-[#166675] dark:text-[#53b9cc] font-bold"
                                    : "text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                <span>{c.name}</span>
                                {globalCategory === c.name && (
                                  <span className="text-[#166675] font-bold">✓</span>
                                )}
                              </div>
                            ))}
                          {globalCategory.trim() &&
                            !globalCategoryList.some(
                              (c) => c.name.toLowerCase() === globalCategory.trim().toLowerCase()
                            ) && (
                              <div
                                onMouseDown={() => setIsGlobalCatDropdownOpen(false)}
                                className="px-4 py-2 text-sm cursor-pointer border-t border-pos-border bg-slate-50 dark:bg-slate-800/80 text-[#166675] dark:text-[#53b9cc] font-semibold"
                              >
                                + ใช้หมวดหมู่ใหม่: "{globalCategory.trim()}"
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="px-3 py-3 text-sm text-slate-400 text-center">
                          ยังไม่มีหมวดหมู่ (พิมพ์เพื่อสร้างใหม่ได้เลย)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Channel Pills */}
              <div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGlobalChannel("CASH")}
                    className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      globalChannel === "CASH"
                        ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    เงินสด
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalChannel("TRANSFER")}
                    className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      globalChannel === "TRANSFER"
                        ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    เงินโอน
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalChannel("OTHER")}
                    className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      globalChannel === "OTHER"
                        ? "bg-[#166675]/10 dark:bg-[#166675]/20 text-[#166675] dark:text-[#53b9cc] border-[#166675]/40 dark:border-[#166675]/40 font-bold shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    ช่องทางอื่น
                  </button>
                </div>
              </div>

              {/* Other Channel Select */}
              {globalChannel === "OTHER" && (
                <div>
                  <select
                    value={globalAccountId || ""}
                    onChange={(e) => setGlobalAccountId(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-pos-border rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#166675]"
                  >
                    <option value="">-- เลือกบัญชี --</option>
                    {calendarData?.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} (คงเหลือ: {Number(a.balance).toLocaleString()} {currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#166675] hover:bg-[#125a67] text-white rounded-xl font-bold text-sm cursor-pointer shadow-xs disabled:opacity-50 transition active:scale-98 mt-2"
              >
                {isSubmitting
                  ? "กำลังบันทึก..."
                  : globalTab === "EXPENSE"
                  ? globalExpenseSubTab === "MONTHLY"
                    ? "บันทึกรายจ่ายรายเดือน"
                    : "บันทึกรายจ่าย"
                  : "บันทึกรายรับ"}
              </button>

              {/* Copy Day Button */}
              {globalTab === "EXPENSE" && globalExpenseSubTab === "DAILY" && (
                <button
                  type="button"
                  onClick={() => setActiveModal("COPY_DAY")}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm cursor-pointer transition active:scale-98"
                >
                  คัดลอกจากวันอื่น
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: CUSTOM THAI DATE PICKER MODAL                         */}
      {/* ============================================================== */}
      {activeModal === "DATE_PICKER" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setActiveModal("GLOBAL_ADD")}
          />

          <div className="relative w-full max-w-xs sm:max-w-sm bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                เลือกวันที่
              </h3>
              <button
                onClick={() => setActiveModal("GLOBAL_ADD")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Month & Year Navigator */}
            <div className="flex items-center justify-between mb-4 px-1">
              <button
                type="button"
                onClick={handlePickerPrevMonth}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold transition cursor-pointer text-sm"
              >
                &lt;
              </button>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {THAI_MONTH_NAMES[pickerMonth - 1]} {pickerYear + 543}
              </span>
              <button
                type="button"
                onClick={handlePickerNextMonth}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold transition cursor-pointer text-sm"
              >
                &gt;
              </button>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold mb-3 select-none">
              <div className="text-rose-500">อา</div>
              <div className="text-slate-500">จ</div>
              <div className="text-slate-500">อ</div>
              <div className="text-slate-500">พ</div>
              <div className="text-slate-500">พฤ</div>
              <div className="text-slate-500">ศ</div>
              <div className="text-slate-500">ส</div>
            </div>

            {/* Date Grid */}
            {(() => {
              const pickerFirstDay = new Date(pickerYear, pickerMonth - 1, 1).getDay();
              const pickerDaysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
              const pickerDaysInPrevMonth = new Date(pickerYear, pickerMonth - 1, 0).getDate();

              const [tY, tM, tD] = (globalDateStr || "").split("-").map(Number);

              const prevDays = Array.from({ length: pickerFirstDay }).map((_, idx) => {
                const day = pickerDaysInPrevMonth - pickerFirstDay + idx + 1;
                let prevM = pickerMonth - 1;
                let prevY = pickerYear;
                if (prevM === 0) {
                  prevM = 12;
                  prevY = prevY - 1;
                }
                return { day, month: prevM, year: prevY, isCurrentMonth: false };
              });

              const currentDays = Array.from({ length: pickerDaysInMonth }).map((_, idx) => ({
                day: idx + 1,
                month: pickerMonth,
                year: pickerYear,
                isCurrentMonth: true,
              }));

              const totalCells = prevDays.length + currentDays.length;
              const nextDaysCount = (7 - (totalCells % 7)) % 7;
              const nextDays = Array.from({ length: nextDaysCount }).map((_, idx) => {
                let nextM = pickerMonth + 1;
                let nextY = pickerYear;
                if (nextM === 13) {
                  nextM = 1;
                  nextY = nextY + 1;
                }
                return { day: idx + 1, month: nextM, year: nextY, isCurrentMonth: false };
              });

              const allDays = [...prevDays, ...currentDays, ...nextDays];

              return (
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-5 text-center">
                  {allDays.map((item, idx) => {
                    const isSelectedDate =
                      item.day === tD && item.month === tM && item.year === tY;

                    return (
                      <div key={idx} className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handlePickerSelectDate(item.year, item.month, item.day)}
                          className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                            isSelectedDate
                              ? "bg-[#166675] text-white font-black shadow-xs"
                              : item.isCurrentMonth
                              ? "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                              : "text-slate-300 dark:text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {item.day}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Bottom "วันนี้" Button */}
            <button
              type="button"
              onClick={handlePickerSelectToday}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm cursor-pointer transition active:scale-98"
            >
              วันนี้
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: YEAR VIEW (Adjusted sizing for consistency)             */}
      {/* ============================================================== */}
      {activeModal === "YEAR_VIEW" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setActiveModal("NONE")} />

          <div className="relative w-[95%] sm:w-full max-w-lg bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>📅</span>
                <span>รายรับ-รายจ่ายปี พ.ศ. {thaiYear}</span>
              </h3>
              <button
                onClick={() => setActiveModal("NONE")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Banner (POS Theme) */}
            <div className="bg-[#166675] text-white rounded-2xl p-4 flex items-center justify-around text-center mb-4 shadow-2xs shrink-0">
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">รายรับ</span>
                <span className="text-lg font-black text-white">
                  {(calendarData?.yearIncome ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">รายจ่าย</span>
                <span className="text-lg font-black text-[#ffb8b1]">
                  {(calendarData?.yearExpense ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <span className="text-xs text-white/80 block mb-0.5 font-medium">สุทธิ</span>
                <span className={`text-lg font-black ${ (calendarData?.yearNet ?? 0) >= 0 ? "text-[#99f6e4]" : "text-[#ffb8b1]" }`}>
                  {(calendarData?.yearNet ?? 0) > 0
                    ? `+${(calendarData?.yearNet ?? 0).toLocaleString()}`
                    : (calendarData?.yearNet ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 12 Months Rows */}
            <div className="space-y-1.5 flex-1 min-h-0 max-h-[55vh] overflow-y-auto pr-2 custom-scroll">
              {calendarData?.yearlyMonthsData.map((m) => {
                const incomePct = maxYearlyValue > 0 ? (m.income / maxYearlyValue) * 100 : 0;
                const expensePct = maxYearlyValue > 0 ? (m.expense / maxYearlyValue) * 100 : 0;

                return (
                  <div
                    key={m.month}
                    onClick={() => {
                      setCurrentMonth(m.month);
                      fetchMonthData(currentYear, m.month);
                      setActiveModal("NONE");
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <span className="w-12 text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {m.monthName}
                    </span>

                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        {m.income > 0 ? (
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.max(incomePct, 2)}%` }}
                          />
                        ) : (
                          <div className="h-full bg-slate-200 dark:bg-slate-700 rounded-full w-full opacity-40" />
                        )}
                      </div>

                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        {m.expense > 0 ? (
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${Math.max(expensePct, 2)}%` }}
                          />
                        ) : (
                          <div className="h-full bg-slate-200 dark:bg-slate-700 rounded-full w-full opacity-40" />
                        )}
                      </div>
                    </div>

                    <div className="w-24 text-right text-xs sm:text-sm shrink-0 flex flex-col justify-center">
                      {m.hasData ? (
                        <>
                          <span className="font-bold text-emerald-600 leading-tight">
                            {m.income > 0 ? m.income.toLocaleString() : "--"}
                          </span>
                          <span className="font-bold text-rose-600 leading-tight">
                            {m.expense > 0 ? m.expense.toLocaleString() : "--"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 leading-tight">--</span>
                          <span className="text-slate-400 leading-tight">--</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 mt-2 border-t border-pos-border text-center shrink-0">
              <span className="text-[11px] text-slate-400">
                ยอดต่อเดือน = รายวันของเดือนนั้น + รายเดือนที่มีผล แตะเดือนเพื่อเปิดปฏิทิน
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: COPY DAY (Adjusted sizing for consistency)           */}
      {/* ============================================================== */}
      {activeModal === "COPY_DAY" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setActiveModal("DAY_VIEW")} />

          <div className="relative w-[95%] sm:w-full max-w-lg bg-pos-surface border border-pos-border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-pos-text">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-pos-border">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>⎘</span>
                <span>คัดลอกจากวันอื่น</span>
              </h3>
              <button
                onClick={() => setActiveModal("DAY_VIEW")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              เลือกวันที่ต้องการคัดลอกรายจ่ายมายังวันที่ <strong>{selectedDayThaiDate}</strong>
            </p>

            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-2 mb-5 custom-scroll">
              {previousDaysWithExpenses.map((d) => {
                const isSelected = selectedCopyDate === d.dateStr;
                return (
                  <div
                    key={d.dateStr}
                    onClick={() => {
                      setSelectedCopyDate(d.dateStr);
                      setCopyItemCount(d.itemCount);
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-[#166675]/10 border-[#166675] dark:bg-[#166675]/20 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-pos-border dark:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">
                        {d.thaiDate}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                        {d.itemCount} รายการ
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 text-sm flex items-center gap-1">
                      {d.totalExpense.toLocaleString()} {currency} &gt;
                    </span>
                  </div>
                );
              })}
              {previousDaysWithExpenses.length === 0 && (
                <p className="text-center py-6 text-sm text-slate-400">
                  ไม่พบประวัติรายจ่ายในวันก่อนหน้าสำหรับคัดลอก
                </p>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal("DAY_VIEW")}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleExecuteCopyDay}
                disabled={isSubmitting || !selectedCopyDate}
                className="flex-1 py-3 bg-[#166675] hover:bg-[#125a67] text-white rounded-xl font-bold text-sm transition cursor-pointer disabled:opacity-40"
              >
                {isSubmitting
                  ? "กำลังคัดลอก..."
                  : `คัดลอก ${copyItemCount} รายการ`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}