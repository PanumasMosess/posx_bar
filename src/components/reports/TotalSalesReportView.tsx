"use client";

import { useState, useEffect, useRef } from "react";
import { TotalSalesReportViewProps } from "@/lib/types";

export default function TotalSalesReportView({
  data,
  isMobile = false,
}: TotalSalesReportViewProps) {
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

  // ใช้ ResizeObserver เพื่อวัดขนาด Container จริง ป้องกันปัญหา SVG โดนย่อ/ขยายผิดเพี้ยน
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 0) {
        setContainerWidth(Math.round(w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Helper จัดรูปแบบตัวเลขทศนิยม ให้แสดง 2 ตำแหน่งถ้ามีเศษ เช่น 263.33
  const formatDecimals = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  // -------------------------------------------------------------
  // กราฟรายวัน (Daily Sales Chart) - คำนวณขอบเขตและพิกัดแบบพอดีจอ
  // -------------------------------------------------------------
  const daysCount = dailySales.length || 1;
  const svgHeight = isMobile ? 180 : 200;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 30;
  const padBottom = 25;

  // ปรับระยะห่างระหว่างจุดให้แคบลง เพื่อให้แสดงผลรวมได้พอดีในจอเดียว (เหมือนรูปต้นฉบับที่ 2)
  const minPointWidth = isMobile ? 28 : 36; 
  const minRequiredWidth = padLeft + padRight + (daysCount - 1) * minPointWidth;
  const cWidth = containerWidth || 350; // กันค่าว่างตอนโหลดครั้งแรก
  
  // ยืดความกว้างให้เต็มจอเสมอ หรือขยายให้เลื่อนได้ถ้าจุดเยอะเกินไป
  const svgWidth = Math.max(cWidth, minRequiredWidth);
  const canScroll = svgWidth > cWidth;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxDailyAmount = Math.max(
    ...dailySales.map((d) => d.amount || 0),
    10
  );
  
  // ปรับสเกลแกน Y ให้สวยงาม (0, 200, 400, 600...) แบบต้นฉบับ
  const roughStep = maxDailyAmount / 4;
  const mag = roughStep > 0 ? Math.pow(10, Math.floor(Math.log10(roughStep))) : 1;
  const norm = roughStep / mag;
  const yTicksStep = norm <= 1.5 ? mag : norm <= 2.5 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  const yAxisMax = Math.ceil(maxDailyAmount / yTicksStep) * yTicksStep;
  
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

  // สร้างเป็นเส้นตรงเชื่อมกัน (Straight Lines) เหมือนต้นฉบับ
  const linePathD =
    dailyPoints.length > 0
      ? "M " + dailyPoints.map((p) => `${p.x} ${p.y}`).join(" L ")
      : "";

  const areaPathD =
    dailyPoints.length > 0
      ? `${linePathD} L ${dailyPoints[dailyPoints.length - 1].x} ${padTop + plotHeight} L ${dailyPoints[0].x} ${padTop + plotHeight} Z`
      : "";

  const hasMultipleActiveHours =
    hourlyChartData.filter((h) => h.amount > 0).length > 1;

  return (
    <div className="w-full pb-4">
      {/* ======================================================== */}
      {/* 1. Main Card - Desktop View (ซ่อนในโหมด Mobile)           */}
      {/* ======================================================== */}
      {!isMobile && (
        <div className="w-full transition-all mb-5">
          {/* Desktop Header Row */}
          <div className="pb-4 flex items-center justify-between select-none">
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

            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-400 block">
                ยอดขายทั้งหมด
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {totalSales.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Body Content inside Card 1 (Desktop) */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Big Total KPI Header */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                ยอดขายทั้งหมด
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
                {totalSales.toLocaleString()}
              </div>
            </div>

            {/* 3 Stats Row (บิลสำเร็จ, บิลเฉลี่ย, บิลยกเลิก) */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-left">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  บิลสำเร็จ
                </span>
                <div className="mt-0.5">
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                    {completedBills}
                  </span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                    บิล
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  บิลเฉลี่ย
                </span>
                <div className="mt-0.5">
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                    {formatDecimals(averageBill)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  บิลยกเลิก
                </span>
                <div className="mt-0.5">
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                    {cancelledBills}
                  </span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                    บิล
                  </span>
                </div>
              </div>
            </div>

            {/* Items Sold & Category Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  จำนวนที่ขาย
                </span>
                <div>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {totalItemsSold}
                  </span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                    ชิ้น
                  </span>
                </div>
              </div>

              {(data?.categoryBreakdown || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(data?.categoryBreakdown || []).map((cat) => (
                    <span
                      key={cat.categoryName}
                      className="px-2.5 py-0.5 rounded-full text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {cat.categoryName} {cat.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Continuous Golden Cash & Red Transfer Bar */}
            <div className="space-y-2 pt-1">
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                {cashAmount > 0 && (
                  <div
                    style={{ width: `${cashPercent}%` }}
                    className="bg-[#ebb042] h-full transition-all duration-300"
                  />
                )}
                {transferAmount > 0 && (
                  <div
                    style={{ width: `${transferPercent}%` }}
                    className="bg-[#dd5044] h-full transition-all duration-300"
                  />
                )}
                {cashAmount === 0 && transferAmount === 0 && (
                  <div className="bg-slate-200 dark:bg-slate-700 w-full h-full" />
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ebb042] shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    เงินสด {cashAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dd5044] shrink-0" />
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
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                <span>ยอดขายทั้งหมด</span>
                <span>{totalSales.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Mobile View - ส่วนบนสุด (ยอดขายทั้งหมด)                    */}
      {/* ======================================================== */}
      {isMobile && (
        <div className="w-full mb-5">
          <div className="space-y-4">
            {/* Header: ยอดขายทั้งหมด & ตัวเลขใหญ่ */}
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                ยอดขายทั้งหมด
              </h3>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                {totalSales.toLocaleString()}
              </div>
            </div>

            {/* บิลสำเร็จ, บิลเฉลี่ย, บิลยกเลิก */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  บิลสำเร็จ
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {completedBills}
                  </span>
                  <span className="text-[11px] text-slate-400">บิล</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  บิลเฉลี่ย
                </span>
                <div className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatDecimals(averageBill)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  บิลยกเลิก
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {cancelledBills}
                  </span>
                  <span className="text-[11px] text-slate-400">บิล</span>
                </div>
              </div>
            </div>

            {/* จำนวนที่ขาย & หมวดหมู่ */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="font-medium">จำนวนที่ขาย</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {totalItemsSold}
                  </span>
                  <span className="text-[11px] text-slate-500">ชิ้น</span>
                </div>
              </div>

              {(data?.categoryBreakdown || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(data?.categoryBreakdown || []).map((cat) => (
                    <span
                      key={cat.categoryName}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {cat.categoryName} {cat.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* แถบสีเงินสด / เงินโอน */}
            <div className="space-y-2 pt-2">
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                {cashAmount > 0 && (
                  <div
                    style={{ width: `${cashPercent}%` }}
                    className="bg-[#fbc02d] h-full"
                  />
                )}
                {transferAmount > 0 && (
                  <div
                    style={{ width: `${transferPercent}%` }}
                    className="bg-[#e53935] h-full"
                  />
                )}
              </div>
              <div className="flex justify-between text-xs font-medium pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fbc02d]" />
                  <span className="text-slate-500">เงินสด</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold ml-0.5">
                    {cashAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e53935]" />
                  <span className="text-slate-500">เงินโอน</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold ml-0.5">
                    {transferAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* สรุปยอดรวม (ยอดสินค้า / ยอดขายทั้งหมด) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between text-[13px] font-medium text-slate-500">
                <span>ยอดสินค้า</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                  {totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[13px] font-bold text-slate-900 dark:text-slate-100 pt-0.5">
                <span>ยอดขายทั้งหมด</span>
                <span>{totalSales.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Daily Sales Chart (ยอดรายวัน)                          */}
      {/* ======================================================== */}
      {isMultiDay && (
        <div className={`w-full space-y-4 mb-6 ${isMobile ? "border-t border-slate-100 dark:border-slate-800/80 pt-5" : "border-t border-slate-100 dark:border-slate-800/80 pt-6"}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              ยอดรายวัน ({dailyStats.daysText || `${dailySales.length} วัน`})
            </h3>
            {isMobile && canScroll ? (
              <span className="text-[10px] text-slate-400 font-medium">ปัดดูซ้ายขวาได้</span>
            ) : !isMobile ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  ปัจจุบันย้อนหลัง
                </span>
                <button
                  type="button"
                  onClick={() => setShowOnlyDaysWithRevenue(!showOnlyDaysWithRevenue)}
                  className="text-xs text-teal-600 hover:underline font-medium transition"
                >
                  {showOnlyDaysWithRevenue ? "แสดงทุกวัน" : "เฉพาะวันมีรายได้"}
                </button>
              </div>
            ) : null}
          </div>

          {/* Area/Line Chart - แก้ไขให้แสดงผลพอดีจอแบบต้นฉบับเป๊ะๆ */}
          <div
            id="daily-chart-container"
            ref={containerRef}
            className={`w-full py-2 ${canScroll ? "overflow-x-auto overflow-y-hidden scrollbar-thin" : "overflow-hidden"}`}
          >
            {containerWidth > 0 ? (
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="select-none"
              >
                <defs>
                  <linearGradient
                    id={isMobile ? "tealDailyGradient-mobile" : "tealDailyGradient-desktop"}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00838f" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#00838f" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines & Y-axis ticks */}
                {yTicks.map((val) => {
                  const yPos = padTop + plotHeight - (val / (yAxisMax || 1)) * plotHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={padLeft}
                        y1={yPos}
                        x2={svgWidth - padRight}
                        y2={yPos}
                        stroke="#edf2f7"
                        strokeWidth="1"
                        strokeDasharray="2 3"
                      />
                      <text
                        x={padLeft - 6}
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
                  <path d={areaPathD} fill={isMobile ? "url(#tealDailyGradient-mobile)" : "url(#tealDailyGradient-desktop)"} />
                )}

                {/* Straight Line Stroke (Teal #00838f matching) */}
                {linePathD && (
                  <path
                    d={linePathD}
                    fill="none"
                    stroke="#00838f"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points (Dots and amount labels) */}
                {dailyPoints.map((pt, index) => {
                  const hasSales = pt.amount > 0;
                  return (
                    <g key={`${pt.day}-${index}`}>
                      {/* Circle Dot with white fill and #00838f border */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={3.5}
                        fill="#ffffff"
                        stroke="#00838f"
                        strokeWidth="2"
                      />

                      {/* Amount label directly above point */}
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#0f172a"
                      >
                        {hasSales ? pt.amount.toLocaleString() : "0"}
                      </text>

                      {/* Day label below X-axis: ONLY day number (e.g. 19, 20) */}
                      <text
                        x={pt.x}
                        y={padTop + plotHeight + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        fontWeight="500"
                      >
                        {pt.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ height: svgHeight }} className="w-full" />
            )}
          </div>

          {/* Show 3 Daily Cards on BOTH Mobile and Desktop */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
            <div className="bg-[#dff1f3] rounded-2xl p-3.5 sm:p-4 text-center space-y-0.5 border-0">
              <span className="text-[11px] font-medium text-slate-500 block">
                วันขายดีสุด
              </span>
              <div className="text-xs sm:text-sm font-bold text-[#086972] truncate">
                {dailyStats.bestDay?.dayText || "-"}
              </div>
              <div className="text-xs font-semibold text-[#086972]">
                {(dailyStats.bestDay?.amount || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[#f4f4f4] rounded-2xl p-3.5 sm:p-4 text-center space-y-0.5 border-0">
              <span className="text-[11px] font-medium text-slate-500 block">
                วันเงียบสุด
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {dailyStats.worstDay?.dayText || "-"}
              </div>
              <div className="text-xs font-semibold text-slate-500">
                {(dailyStats.worstDay?.amount || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[#f9f8f2] rounded-2xl p-3.5 sm:p-4 text-center space-y-0.5 border-0">
              <span className="text-[11px] font-medium text-slate-500 block">
                เฉลี่ยวันละ
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                {formatDecimals(dailyStats.averagePerDay || 0)}
              </div>
              <div className="text-xs font-medium text-slate-500">
                {dailyStats.activeDaysCount || 0} วัน
              </div>
            </div>
          </div>

          {!isMobile && (
            <p className="text-[11px] text-slate-400 text-center pt-1">
              *คำนวณวันละเฉลี่ยเฉพาะวันที่มีการขาย
            </p>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Hourly Sales Chart (ยอดขายรายชั่วโมง)                   */}
      {/* ======================================================== */}
      <div className={`w-full space-y-4 ${isMobile ? "border-t border-slate-100 dark:border-slate-800/80 pt-5" : "border-t border-slate-100 dark:border-slate-800/80 pt-6"}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            ยอดขายรายชั่วโมง
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {hourlyStats.rangeText}
          </span>
        </div>

        {/* Bar Chart Container */}
        <div className="pt-4 pb-1">
          {hourlyChartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              ไม่มีข้อมูลยอดขายในช่วงเวลานี้
            </div>
          ) : (
            <div className="relative w-full h-44 sm:h-52 px-1 sm:px-2 flex items-end justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
              {/* Horizontal dashed guide lines */}
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />

              <div className="w-full h-full flex items-end justify-between gap-1 z-10">
                {hourlyChartData.map((d) => {
                  const heightPercent =
                    d.amount > 0
                      ? Math.round((d.amount / maxHourlyAmount) * 100)
                      : 0;

                  return (
                    <div
                      key={d.hour}
                      className="flex-1 min-w-0 flex flex-col items-center justify-end h-full"
                    >
                      {/* Amount label above bar */}
                      {d.amount > 0 ? (
                        <span
                          className={`font-bold text-slate-800 dark:text-slate-100 mb-1.5 whitespace-nowrap text-center ${
                            hourlyChartData.length > 15
                              ? "text-[8px] -tracking-tight"
                              : hourlyChartData.length > 10
                              ? "text-[9px] -tracking-tight"
                              : "text-xs"
                          }`}
                        >
                          {d.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[9px] text-transparent mb-1.5 select-none">
                          -
                        </span>
                      )}

                      {/* Bar: Soft turquoise (#5bbbc8) */}
                      {d.amount > 0 ? (
                        <div
                          style={{ height: `${Math.max(heightPercent, 8)}%` }}
                          className="w-full max-w-[38px] rounded-t-sm transition-all duration-300 bg-[#5bbbc8] hover:bg-[#4ba8b5]"
                        />
                      ) : (
                        <div className="h-0 w-full" />
                      )}

                      {/* Hour label below bar */}
                      <span
                        className={`text-slate-500 dark:text-slate-400 font-semibold mt-2 ${
                          hourlyChartData.length > 15 ? "text-[8px]" : "text-[10px] sm:text-xs"
                        }`}
                      >
                        {d.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3 Summary Cards below Hourly Chart */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {/* Card 1: ช่วงขายดีสุด (Pale Teal bg-[#dff1f3], text #086972) */}
          <div className="bg-[#dff1f3] rounded-2xl p-3 sm:p-4 text-center space-y-0.5 border-0">
            <span className="text-[11px] font-medium text-slate-500 block">
              ช่วงขายดีสุด
            </span>
            <div className="text-sm sm:text-base font-bold text-[#086972]">
              {hourlyStats.peakHourText}
            </div>
            <div className="text-xs font-semibold text-[#086972]">
              {(hourlyStats.peakAmount || 0).toLocaleString()}
            </div>
          </div>

          {/* Card 2: ช่วงเงียบสุด (Light Grey bg-[#f4f4f4], text slate) */}
          <div className="bg-[#f4f4f4] rounded-2xl p-3 sm:p-4 text-center space-y-0.5 border-0">
            <span className="text-[11px] font-medium text-slate-500 block">
              {hasMultipleActiveHours ? "ช่วงเงียบสุด" : "ชั่วโมงเฉลี่ย"}
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-800">
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

          {/* Card 3: เฉลี่ย/ชม. (Soft Cream bg-[#f9f8f2], text slate) */}
          <div className="bg-[#f9f8f2] rounded-2xl p-3 sm:p-4 text-center space-y-0.5 border-0">
            <span className="text-[11px] font-medium text-slate-500 block">
              เฉลี่ย/ชม.
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-800">
              {formatDecimals(hourlyStats.averagePerHour || 0)}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {hourlyStats.activeHoursCount} ชม.
            </div>
          </div>
        </div>

        <p className="text-[10px] sm:text-[11px] text-slate-400 text-center pt-2">
          รวมยอดของทุกวันในช่วงที่เลือกไว้เฉพาะในแต่ละชั่วโมงเดียวกัน
        </p>
      </div>
    </div>
  );
}