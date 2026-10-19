import { ReportPeriod } from "@/lib/types";

export function resolveDateRange(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
) {
  const now = new Date();

  if (period === "custom" && customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week") {
    // จันทร์ - อาทิตย์
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // today (default)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

// Helper Format วันที่ภาษาไทย ให้ตรงตามต้นฉบับ
export function formatDateRangeThai(
  period: "today" | "week" | "month" | "custom",
  start: Date,
  end: Date
): string {
  const thaiMonthsShort = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const thaiDaysShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const thaiDaysFull = [
    "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ",
    "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"
  ];

  const beYear = (d: Date) => d.getFullYear() + 543;

  if (period === "today") {
    const dayName = thaiDaysFull[start.getDay()].replace("วัน", "");
    return `${dayName} ${start.getDate()} ${thaiMonthsShort[start.getMonth()]} ${beYear(start)}`;
  }

  if (period === "month") {
    return `${start.getDate()} ${thaiMonthsShort[start.getMonth()]} - ${end.getDate()} ${thaiMonthsShort[end.getMonth()]} ${beYear(end)}`;
  }

  if (period === "week") {
    const startDay = thaiDaysShort[start.getDay()];
    const endDay = thaiDaysShort[end.getDay()];
    if (start.getDate() === end.getDate()) {
      return `${start.getDate()} - ${end.getDate()} ${thaiMonthsShort[end.getMonth()]} ${beYear(end)}`;
    }
    return `${startDay} - ${endDay} ${start.getDate()} ${thaiMonthsShort[start.getMonth()]} - ${end.getDate()} ${thaiMonthsShort[end.getMonth()]} ${beYear(end)}`;
  }

  return `${start.getDate()} ${thaiMonthsShort[start.getMonth()]} - ${end.getDate()} ${thaiMonthsShort[end.getMonth()]} ${beYear(end)}`;
}
