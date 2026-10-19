"use client";

import ReportDateSelector from "./ReportDateSelector";
import { ReportTabKey, ReportSidebarProps } from "@/lib/types";

export default function ReportSidebar({
  activeTab,
  onSelectTab,
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  className = "",
}: ReportSidebarProps) {
  const groups = [
    {
      title: "ยอดขาย",
      items: [
        {
          key: "total" as ReportTabKey,
          title: "ยอดขายทั้งหมด",
          subtitle: "ยอดขาย/โอน · บิลเฉลี่ย · รายชั่วโมง",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          ),
        },
        {
          key: "product" as ReportTabKey,
          title: "ยอดขายตามสินค้า",
          subtitle: "ขายดี - ขายไม่ดี ตามจำนวน ยอดขาย หรือกำไร",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          ),
        },
        {
          key: "employee" as ReportTabKey,
          title: "ยอดขายตามพนักงาน",
          subtitle: "แยกยอดขายและจำนวนบิลต่อคน",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          ),
        },
      ],
    },
    {
      title: "บิล",
      items: [
        {
          key: "bills" as ReportTabKey,
          title: "รายการบิล / ใบเสร็จ",
          subtitle: "ค้นหาและดูบิลรายใบ แยกตามช่องทางชำระ",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          ),
        },
      ],
    },
  ];

  return (
    <div
      className={`flex flex-col gap-3 h-full overflow-hidden select-none ${className}`}
    >
      {/* Date Range Selector at top as a framed card */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
        <ReportDateSelector
          period={period}
          onPeriodChange={onPeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={onCustomDateChange}
        />
      </div>

      {/* Report Groups inside a framed card */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs overflow-y-auto space-y-4">
        {groups.map((grp) => (
          <div key={grp.title} className="space-y-1">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
              {grp.title}
            </h4>

            <div className="space-y-1">
              {grp.items.map((item) => {
                const isSelected = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelectTab(item.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold border-l-4 border-sky-500 shadow-xs"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isSelected
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-slate-400"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {item.icon}
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs block truncate ${
                          isSelected
                            ? "font-bold text-sky-700 dark:text-sky-300"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
