"use client";

import { useState, useEffect } from "react";

import { TotalSalesReportViewProps } from "@/lib/types";

export default function TotalSalesReportView({ data }: TotalSalesReportViewProps) {
  const [showOnlyDaysWithRevenue, setShowOnlyDaysWithRevenue] = useState(false);

  const totalSales = data?.totalSales || 0;
  const completedBills = data?.completedBills || 0;
  const averageBill = data?.averageBill || 0;
  const cancelledBills = data?.cancelledBills || 0;
  const totalItemsSold = data?.totalItemsSold || 0;

  const cashAmount = data?.paymentSplit?.cashAmount || 0;
  const transferAmount = data?.paymentSplit?.transferAmount || 0;
  const totalPayment = cashAmount + transferAmount || 1;
  const cashPercent = Math.round((cashAmount / totalPayment) * 100);
  const transferPercent = 100 - cashPercent;

  const hourlyChartData = data?.hourlyChartData || [];
  const maxHourlyAmount = Math.max(
    ...hourlyChartData.map((d) => d.amount || 0),
    1
  );

  const hourlyStats = data?.hourlyStats || {
    rangeText: "15:00 - 15:00",
    peakHourText: "15:00",
    peakAmount: 0,
    worstHourText: "15:00",
    worstAmount: 0,
    averageHourText: "15:00",
    averageAmount: 0,
    averagePerHour: 0,
    activeHoursCount: 1,
  };

  const isMultiDay = !!data?.isMultiDay;
  const rawDailySales = data?.dailySales || [];
  const dailySales = showOnlyDaysWithRevenue
    ? rawDailySales.filter((d) => d.amount > 0)
    : rawDailySales;

  const dailyStats = data?.dailyStats || {
    daysCount: dailySales.length,
    daysText: `${dailySales.length} วัน`,
    bestDay: { dayText: "-", amount: 0 },
    worstDay: { dayText: "-", amount: 0 },
    averagePerDay: 0,
    activeDaysCount: 0,
  };

  const [containerWidth, setContainerWidth] = useState(1000);
  const containerRef = (el: HTMLDivElement | null) => {
    if (el) {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(Math.round(w));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const el = document.getElementById("daily-chart-container");
      if (el) {
        const w = el.getBoundingClientRect().width;
        if (w > 0) setContainerWidth(Math.round(w));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // คำนวณ Spline Path สำหรับกราฟเส้นยอดรายวัน
  const daysCount = dailySales.length || 1;
  // ขยาย width ของ SVG ให้เต็มความกว้างการ์ด 100% (หากมีมากกว่า 31 วันจะขยายเพื่อเลื่อนแนวนอน)
  const svgWidth = Math.max(containerWidth, daysCount > 31 ? daysCount * 36 : containerWidth);
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 35;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxDailyAmount = Math.max(
    ...dailySales.map((d) => d.amount || 0),
    50
  );
  // ปรับสเกลแกน Y ให้ลงตัว (ขั้นละ 50 หรือ 100)
  const yAxisMax = Math.ceil(maxDailyAmount / 50) * 50;
  const yTicksStep = yAxisMax <= 200 ? 50 : yAxisMax <= 500 ? 50 : 100;
  const yTicks: number[] = [];
  for (let v = 0; v <= yAxisMax; v += yTicksStep) {
    yTicks.push(v);
  }

  const dailyPoints = dailySales.map((d, idx) => {
    const x =
      dailySales.length <= 1
        ? padLeft + plotWidth / 2
        : padLeft + (idx / (dailySales.length - 1)) * plotWidth;
    const y =
      padTop + plotHeight - ((d.amount || 0) / (yAxisMax || 1)) * plotHeight;
    return { x, y, day: d.day, label: d.label, amount: d.amount };
  });

  // สร้าง Smooth Cubic Bezier Spline
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePathD = buildSmoothPath(dailyPoints);
  const areaPathD =
    dailyPoints.length > 0
      ? `${linePathD} L ${dailyPoints[dailyPoints.length - 1].x} ${padTop + plotHeight} L ${dailyPoints[0].x} ${padTop + plotHeight} Z`
      : "";

  const hasMultipleActiveHours =
    hourlyChartData.filter((h) => h.amount > 0).length > 1;

  return (
    <div className="w-full space-y-6 pb-6">
      {/* ======================================================== */}
      {/* 1. Main Collapsible Card (ยอดขายทั้งหมด)                */}
      {/* ======================================================== */}
      <div className="w-full transition-all">
        {/* Top Header Row of Card 1 */}
        <div className="pb-4 flex items-center justify-between select-none">
          {/* Left: Icon & Title & Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-800">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                ยอดขายทั้งหมด
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {data?.dateRangeText || ""}
              </p>
            </div>
          </div>

          {/* Right: Total Amount */}
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 block">
              ยอดขายทั้งหมด
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {totalSales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Body Content inside Card 1 */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-5">
            {/* Big Total KPI Header */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                ยอดขายทั้งหมด
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                {totalSales.toLocaleString()}
              </div>
            </div>

            {/* 3 Stats Row (บิลสำเร็จ, บิลเฉลี่ย, บิลยกเลิก) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-y border-slate-100 dark:border-slate-800 text-left">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  บิลสำเร็จ
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {completedBills} บิล
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  บิลเฉลี่ย
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {averageBill.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  บิลยกเลิก
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {cancelledBills} บิล
                </span>
              </div>
            </div>

            {/* Items Sold & Category Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  จำนวนที่ขาย
                </span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(data?.categoryBreakdown || []).map((cat) => (
                    <span
                      key={cat.categoryName}
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {cat.categoryName} {cat.quantity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {totalItemsSold} ชิ้น
              </div>
            </div>

            {/* Continuous Golden Cash & Orange Transfer Bar */}
            <div className="space-y-2 pt-1">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                {cashAmount > 0 && (
                  <div
                    style={{ width: `${cashPercent}%` }}
                    className="bg-[#f59e0b] h-full transition-all duration-500"
                  />
                )}
                {transferAmount > 0 && (
                  <div
                    style={{ width: `${transferPercent}%` }}
                    className="bg-[#ea580c] h-full transition-all duration-500"
                  />
                )}
                {cashAmount === 0 && transferAmount === 0 && (
                  <div className="bg-slate-200 dark:bg-slate-700 w-full h-full" />
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    เงินสด {cashAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    เงินโอน {transferAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Table Row */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>ยอดสินค้า</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
                <span>ยอดขายทั้งหมด</span>
                <span>{totalSales.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      {/* ======================================================== */}
      {/* 2. Daily Sales Chart (ยอดรายวัน)                          */}
      {/* แสดงเฉพาะเมื่อเป็นช่วงหลายวัน เช่น สัปดาห์นี้ / เดือนนี้ / กำหนดเอง */}
      {/* ======================================================== */}
      {isMultiDay && (
        <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              ยอดรายวัน ({dailyStats.daysText || `${dailySales.length} วัน`})
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                ปัจจุบันย้อนหลัง
              </span>
              <button
                type="button"
                onClick={() => setShowOnlyDaysWithRevenue(!showOnlyDaysWithRevenue)}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium transition"
              >
                {showOnlyDaysWithRevenue ? "แสดงทุกวัน" : "เฉพาะวันมีรายได้"}
              </button>
            </div>
          </div>

          {/* Pure SVG Spline Area/Line Chart with Horizontal Scroll for Long Periods */}
          <div
            id="daily-chart-container"
            ref={containerRef}
            className="w-full overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="h-48 sm:h-56 select-none w-full"
              style={{ minWidth: `${svgWidth}px` }}
            >
              <defs>
                <linearGradient
                  id="skyAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines & Y-axis ticks */}
              {yTicks.map((val) => {
                const yPos =
                  padTop + plotHeight - (val / (yAxisMax || 1)) * plotHeight;
                return (
                  <g key={val}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={svgWidth - padRight}
                      y2={yPos}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={yPos + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="sans-serif"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {areaPathD && (
                <path d={areaPathD} fill="url(#skyAreaGradient)" />
              )}

              {/* Line Curve Stroke (Sky POS Theme) */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points (Dots and amount labels) */}
              {dailyPoints.map((pt) => {
                const hasSales = pt.amount > 0;
                return (
                  <g key={pt.day}>
                    {/* Circle Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hasSales ? 4.5 : 2}
                      fill={hasSales ? "#ffffff" : "#cbd5e1"}
                      stroke={hasSales ? "#0284c7" : "#94a3b8"}
                      strokeWidth={hasSales ? 2.5 : 1}
                    />

                    {/* Amount label above point */}
                    {hasSales ? (
                      <text
                        x={pt.x}
                        y={pt.y - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#0f172a"
                      >
                        {pt.amount.toLocaleString()}
                      </text>
                    ) : (
                      <text
                        x={pt.x}
                        y={pt.y - 5}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#cbd5e1"
                      >
                        0
                      </text>
                    )}

                    {/* Day label below X-axis */}
                    <text
                      x={pt.x}
                      y={padTop + plotHeight + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontWeight="500"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 3 Summary Cards below Daily Chart */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
            {/* วันขายดีสุด */}
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 rounded-xl p-3 sm:p-4 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 block">
                วันขายดีสุด
              </span>
              <div className="text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-100 truncate">
                {dailyStats.bestDay?.dayText || "-"}
              </div>
              <div className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                {(dailyStats.bestDay?.amount || 0).toLocaleString()}
              </div>
            </div>

            {/* วันขายน้อยสุด */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 block">
                วันขายน้อยสุด
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {dailyStats.worstDay?.dayText || "-"}
              </div>
              <div className="text-xs font-semibold text-slate-500">
                {(dailyStats.worstDay?.amount || 0).toLocaleString()}
              </div>
            </div>

            {/* เฉลี่ย/วัน */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 block">
                เฉลี่ย/วัน
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {(dailyStats.averagePerDay || 0).toLocaleString()}
              </div>
              <div className="text-xs font-medium text-slate-400">
                {dailyStats.activeDaysCount || 0} วัน
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-1">
            *คำนวณวันละเฉลี่ยเฉพาะวันที่มีการขาย
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Hourly Sales Chart (ยอดขายรายชั่วโมง)                   */}
      {/* ======================================================== */}
      <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            ยอดขายรายชั่วโมง
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {hourlyStats.rangeText}
          </span>
        </div>

        {/* Bar Chart Container */}
        <div className="pt-6 pb-2">
          {hourlyChartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              ไม่มีข้อมูลยอดขายในช่วงเวลานี้
            </div>
          ) : (
            <div className="flex items-end justify-around sm:justify-evenly h-48 sm:h-56 px-4 overflow-x-auto border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
              {hourlyChartData.map((d) => {
                const heightPercent =
                  d.amount > 0
                    ? Math.round((d.amount / maxHourlyAmount) * 100)
                    : 0;

                return (
                  <div
                    key={d.hour}
                    className="flex flex-col items-center justify-end h-full w-14 sm:w-16 group shrink-0"
                  >
                    {/* Amount label above bar */}
                    {d.amount > 0 ? (
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                        {d.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[9px] text-transparent mb-1.5 select-none">
                        -
                      </span>
                    )}

                    {/* Bar (Sky/Cyan Theme Gradient) */}
                    {d.amount > 0 ? (
                      <div
                        style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        className="w-full rounded-t-sm transition-all duration-300 bg-gradient-to-t from-sky-600 to-cyan-400 hover:from-sky-500 hover:to-cyan-300 shadow-xs"
                      />
                    ) : (
                      <div className="h-0 w-full" />
                    )}

                    {/* Hour label below bar (e.g. 14, 15) */}
                    <span className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-2">
                      {d.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3 Summary Cards below Hourly Chart */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
          {/* Card 1: ช่วงขายดีสุด */}
          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 rounded-xl p-3 sm:p-4 text-center space-y-0.5">
            <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 block">
              ช่วงขายดีสุด
            </span>
            <div className="text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-100">
              {hourlyStats.peakHourText}
            </div>
            <div className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              {(hourlyStats.peakAmount || 0).toLocaleString()}
            </div>
          </div>

          {/* Card 2: ช่วงเงียบสุด (หรือ ชั่วโมงเฉลี่ย เมื่อมีเพียง 1 ชม.) */}
          <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-center space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {hasMultipleActiveHours ? "ช่วงเงียบสุด" : "ชั่วโมงเฉลี่ย"}
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {hasMultipleActiveHours
                ? hourlyStats.worstHourText
                : hourlyStats.averageHourText}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {(hasMultipleActiveHours
                ? hourlyStats.worstAmount
                : hourlyStats.averageAmount || 0
              )?.toLocaleString()}
            </div>
          </div>

          {/* Card 3: เฉลี่ย/ชม. */}
          <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-center space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              เฉลี่ย/ชม.
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {(hourlyStats.averagePerHour || 0).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-400">
              {hourlyStats.activeHoursCount} ชม.
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center pt-1">
          *รวมยอดของทุกวันในช่วงที่เลือกไว้เฉพาะในแต่ละชั่วโมง
        </p>
      </div>
    </div>
  );
}
