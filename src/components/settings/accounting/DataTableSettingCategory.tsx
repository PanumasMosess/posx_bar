"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/lib/actions/actionAccounting";
import { DataTableSettingCategoryProps } from "@/lib/types";

type DataTableProps = DataTableSettingCategoryProps;

export default function DataTableSettingCategory({
  data,
  organizationId,
  onUpdateStatus,
  onUpdateName,
  showToast,
  onRefresh,
}: DataTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"id" | "name" | "type">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Inline editing state for name
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Modal State
  const [openAdd, setOpenAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Sorting
  const handleSort = (field: "id" | "name" | "type") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      const numA = Number(valA);
      const numB = Number(valB);
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });
    return result;
  }, [data, search, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Save Inline Name
  const handleSaveName = (id: number) => {
    setEditingId(null);
    const item = data.find((c) => c.id === id);
    if (item && editingName.trim() && editingName.trim() !== item.name) {
      onUpdateName(id, editingName.trim());
    }
  };

  // Add Category Submit
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast("กรุณากรอกชื่อหมวดหมู่", "error");
      return;
    }
    setIsLoading(true);
    const res = await createCategory({
      name: newName.trim(),
      type: newType,
      organizationId,
    });
    if (res.success) {
      showToast("เพิ่มหมวดหมู่สำเร็จ", "success");
      setNewName("");
      setOpenAdd(false);
      if (onRefresh) await onRefresh();
      router.refresh();
    } else {
      showToast("เพิ่มหมวดหมู่ไม่สำเร็จ", "error");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Card Header matching theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
              หมวดหมู่รายรับ-รายจ่าย
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              หมวดหมู่รายรับและรายจ่ายในระบบ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-[130px] lg:w-[150px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>เพิ่มหมวดหมู่</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-[260px] flex flex-col overflow-x-auto custom-scroll border border-slate-100 dark:border-slate-800 rounded-xl">
        <table className="w-full text-xs sm:text-sm text-left border-collapse">
          <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 select-none">
            <tr>
              <th
                onClick={() => handleSort("id")}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 text-center w-12 whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>#</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </div>
              </th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 text-left whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>ชื่อหมวดหมู่</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </div>
              </th>
              <th className="py-3 px-3 text-center font-bold text-[11px] uppercase tracking-wider w-24 whitespace-nowrap">
                ประเภท
              </th>
              <th className="py-3 px-3 text-center font-bold text-[11px] uppercase tracking-wider w-28 whitespace-nowrap">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:border-slate-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🏷️</span>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      ยังไม่มีหมวดหมู่รายรับ-รายจ่าย
                    </p>
                    <p className="text-xs text-slate-400">
                      เพิ่มหมวดหมู่เพื่อจัดหมวดหมู่รายรับและรายจ่ายในร้าน
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenAdd(true)}
                      className="mt-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition cursor-pointer shadow-xs"
                    >
                      + เพิ่มหมวดหมู่แรก
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((cat, index) => {
                const isIncome = cat.type === "INCOME";
                const isActive = cat.status === "ACTIVE";

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-slate-400 font-medium whitespace-nowrap">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    {/* Name (Inline editable) */}
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleSaveName(cat.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName(cat.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-8 px-2 rounded-lg border border-sky-500 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold w-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="inline-flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
                          title="คลิกเพื่อแก้ไขชื่อหมวดหมู่"
                        >
                          <span className="whitespace-nowrap font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600">
                            {cat.name}
                          </span>
                          <svg className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Type Badge matching Image 1 */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {isIncome ? "รายรับ" : "รายจ่าย"}
                      </span>
                    </td>

                    {/* Status Select matching Image 1 */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isActive ? "bg-emerald-500 shadow-sm" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        <select
                          value={cat.status || "INACTIVE"}
                          onChange={(e) => onUpdateStatus(cat.id, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="ACTIVE">ใช้งาน</option>
                          <option value="INACTIVE">ไม่ใช้งาน</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between pt-3 text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="First Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Previous Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Next Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Last Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: เพิ่มหมวดหมู่ใหม่                                         */}
      {/* ============================================================== */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isLoading && setOpenAdd(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                เพิ่มหมวดหมู่ใหม่
              </h3>
              <button
                type="button"
                onClick={() => setOpenAdd(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ประเภท
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setNewType("EXPENSE")}
                    className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      newType === "EXPENSE"
                        ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>💸</span>
                    <span>รายจ่าย (Expense)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setNewType("INCOME")}
                    className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      newType === "INCOME"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>💰</span>
                    <span>รายรับ (Income)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ชื่อหมวดหมู่
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าวัตถุดิบ, ค่าไฟ, รายได้อื่นๆ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
