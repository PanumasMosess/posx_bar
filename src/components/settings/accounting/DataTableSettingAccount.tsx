"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createAccount,
  adjustAccountBalance,
  transferMoney,
  setAccPosPayment,
} from "@/lib/actions/actionAccounting";
import { AccountItem, DataTableSettingAccountProps } from "@/lib/types";

type DataTableProps = DataTableSettingAccountProps;

export default function DataTableSettingAccount({
  data,
  userId,
  organizationId,
  onUpdateStatus,
  onUpdateName,
  showToast,
  onRefresh,
  viewMode = "split",
}: DataTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"id" | "accountName" | "balance">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Editing state for Name
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  // Editing state for Balance
  const [editingBalanceId, setEditingBalanceId] = useState<number | null>(null);
  const [editingBalanceValue, setEditingBalanceValue] = useState("");

  // Modals state
  const [openAdd, setOpenAdd] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("0");

  const [openTransfer, setOpenTransfer] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [targetAccountId, setTargetAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [openAdjust, setOpenAdjust] = useState(false);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Sorting handler
  const handleSort = (field: "id" | "accountName" | "balance") => {
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
      result = result.filter((item) =>
        item.accountName.toLowerCase().includes(q)
      );
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

  // Inline Save Name
  const handleSaveName = (id: number) => {
    setEditingNameId(null);
    const item = data.find((a) => a.id === id);
    if (item && editingNameValue.trim() && editingNameValue.trim() !== item.accountName) {
      onUpdateName(id, editingNameValue.trim());
    }
  };

  // Inline Save Balance
  const handleSaveBalance = async (id: number) => {
    setEditingBalanceId(null);
    const item = data.find((a) => a.id === id);
    const newBal = parseFloat(editingBalanceValue);
    if (item && !isNaN(newBal) && newBal !== item.balance) {
      setIsLoading(true);
      const res = await adjustAccountBalance(
        id,
        newBal,
        "OVERRIDE",
        "แก้ไขยอดเงินโดยตรงจากตาราง",
        userId,
        organizationId
      );
      if (res.success) {
        showToast("อัปเดตยอดเงินสำเร็จ", "success");
        if (onRefresh) await onRefresh();
        router.refresh();
      } else {
        showToast(res.message || "อัปเดตยอดเงินไม่สำเร็จ", "error");
      }
      setIsLoading(false);
    }
  };

  // Modal Open Handlers
  const handleOpenTransfer = (acc: AccountItem) => {
    setSelectedAccount(acc);
    setTargetAccountId("");
    setTransferAmount("");
    setTransferNote("");
    setOpenTransfer(true);
  };

  const handleOpenAddMoney = (acc: AccountItem) => {
    setSelectedAccount(acc);
    setAdjustType("IN");
    setAdjustAmount("");
    setAdjustNote("");
    setOpenAdjust(true);
  };

  const handleOpenDeductMoney = (acc: AccountItem) => {
    setSelectedAccount(acc);
    setAdjustType("OUT");
    setAdjustAmount("");
    setAdjustNote("");
    setOpenAdjust(true);
  };

  // Actions
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) {
      showToast("กรุณากรอกชื่อบัญชี", "error");
      return;
    }
    const initBalance = parseFloat(newAccountBalance) || 0;
    setIsLoading(true);
    const res = await createAccount({
      accountName: newAccountName.trim(),
      initialBalance: initBalance,
      organizationId,
      createdById: userId,
    });
    if (res.success) {
      showToast("เพิ่มบัญชีสำเร็จ", "success");
      setNewAccountName("");
      setNewAccountBalance("0");
      setOpenAdd(false);
      if (onRefresh) await onRefresh();
      router.refresh();
    } else {
      showToast(res.message || "เพิ่มบัญชีไม่สำเร็จ", "error");
    }
    setIsLoading(false);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    const toId = parseInt(targetAccountId);
    if (isNaN(amount) || amount <= 0) {
      showToast("กรุณาระบุจำนวนเงินที่มากกว่า 0", "error");
      return;
    }
    if (isNaN(toId)) {
      showToast("กรุณาเลือกบัญชีปลายทาง", "error");
      return;
    }
    if (!selectedAccount) return;

    setIsLoading(true);
    const res = await transferMoney(
      selectedAccount.id,
      toId,
      amount,
      transferNote,
      userId,
      organizationId
    );
    if (res.success) {
      showToast(res.message || "โอนเงินสำเร็จ", "success");
      setOpenTransfer(false);
      if (onRefresh) await onRefresh();
      router.refresh();
    } else {
      showToast(res.message || "เกิดข้อผิดพลาดในการโอนเงิน", "error");
    }
    setIsLoading(false);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("กรุณาระบุจำนวนเงินที่มากกว่า 0", "error");
      return;
    }
    if (!selectedAccount) return;

    setIsLoading(true);
    const mode = adjustType === "IN" ? "ADD" : "REDUCE";
    const res = await adjustAccountBalance(
      selectedAccount.id,
      amount,
      mode,
      adjustNote || (adjustType === "IN" ? "เพิ่มเงินในบัญชี" : "ลดเงินในบัญชี"),
      userId,
      organizationId
    );
    if (res.success) {
      showToast(adjustType === "IN" ? "เพิ่มเงินสำเร็จ" : "ลดเงินสำเร็จ", "success");
      setOpenAdjust(false);
      if (onRefresh) await onRefresh();
      router.refresh();
    } else {
      showToast(res.message || "ทำรายการไม่สำเร็จ", "error");
    }
    setIsLoading(false);
  };

  const handleSetAccPos = async (accountId: number) => {
    setIsLoading(true);
    const res = await setAccPosPayment(accountId, organizationId);
    if (res.success) {
      showToast("เปลี่ยนช่องทางรับเงินหน้าร้านเรียบร้อยแล้ว", "success");
      if (onRefresh) await onRefresh();
      router.refresh();
    } else {
      showToast(res.message || "เกิดข้อผิดพลาด", "error");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Card Header matching theme */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              จัดการบัญชีการเงิน
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              คลิกที่ ยอดเงินคงเหลือ เพื่อแก้ไขตัวเลขโดยตรง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหาบัญชี..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-[180px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>เพิ่มบัญชี</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto custom-scroll border border-slate-100 dark:border-slate-800 rounded-xl">
        <table className={`w-full text-xs sm:text-sm text-left border-collapse ${viewMode === "tabs" ? "min-w-[680px]" : "min-w-[480px]"}`}>
          <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 select-none">
            <tr>
              <th
                onClick={() => handleSort("id")}
                className="py-3 px-2 cursor-pointer hover:text-slate-800 text-center w-8 whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>#</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </div>
              </th>
              <th
                onClick={() => handleSort("accountName")}
                className="py-3 px-2 cursor-pointer hover:text-slate-800 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>ชื่อบัญชี</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </div>
              </th>
              <th
                className="py-3 px-1.5 text-center text-sky-600 dark:text-sky-400 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap cursor-help"
                title="ยอดขายหน้าร้าน (POS) จะวิ่งเข้าบัญชีนี้อัตโนมัติ"
              >
                รับเงิน POS
              </th>
              <th
                onClick={() => handleSort("balance")}
                className="py-3 px-2 cursor-pointer hover:text-slate-800 text-right text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>ยอดคงเหลือ</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </div>
              </th>
              <th className="py-3 px-1.5 text-center font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                สถานะ
              </th>
              <th className="py-3 px-2 text-center font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                จัดการเงิน
              </th>
              {viewMode === "tabs" && (
                <th className="py-3 px-3 text-center text-slate-400 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                  อัปเดตล่าสุด
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewMode === "tabs" ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">
                  ไม่พบข้อมูลบัญชี
                </td>
              </tr>
            ) : (
              paginatedData.map((acc, index) => {
                const isActive = acc.status === "ACTIVE";
                const isPos = !!acc.accPosPayment;

                return (
                  <tr
                    key={acc.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-2 text-center text-slate-400 font-medium whitespace-nowrap text-xs">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    {/* Account Name (Inline Editable) + Subtitle update date */}
                    <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {editingNameId === acc.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onBlur={() => handleSaveName(acc.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName(acc.id);
                            if (e.key === "Escape") setEditingNameId(null);
                          }}
                          className="h-7 px-2 rounded-lg border border-sky-500 bg-white dark:bg-slate-800 text-xs font-semibold w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <div
                            onClick={() => {
                              setEditingNameId(acc.id);
                              setEditingNameValue(acc.accountName);
                            }}
                            className="cursor-pointer group inline-flex items-center gap-1 py-0.5 rounded hover:text-sky-600 transition"
                            title="คลิกเพื่อแก้ไขชื่อบัญชี"
                          >
                            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600">
                              {acc.accountName}
                            </span>
                            <svg className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </div>
                          {viewMode !== "tabs" && acc.updatedAt && (
                            <span className="text-[10px] text-slate-400 font-normal leading-tight">
                              อัปเดต{" "}
                              {new Date(acc.updatedAt).toLocaleDateString("th-TH", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acc POS Payment Switch */}
                    <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        title={
                          isPos
                            ? "ยอดขายจากหน้าร้านจะเข้าบัญชีนี้อัตโนมัติ"
                            : "คลิกเพื่อตั้งให้ยอดขายหน้าร้านวิ่งเข้าบัญชีนี้"
                        }
                        disabled={!isActive || isPos}
                        onClick={() => handleSetAccPos(acc.id)}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          !isActive
                            ? "cursor-not-allowed bg-slate-200 dark:bg-slate-800 opacity-50"
                            : isPos
                            ? "bg-sky-500 shadow-sm shadow-sky-500/30"
                            : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isPos ? "translate-x-3.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Balance (Click to edit inline) */}
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      {editingBalanceId === acc.id ? (
                        <input
                          type="number"
                          autoFocus
                          value={editingBalanceValue}
                          onChange={(e) => setEditingBalanceValue(e.target.value)}
                          onBlur={() => handleSaveBalance(acc.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveBalance(acc.id);
                            if (e.key === "Escape") setEditingBalanceId(null);
                          }}
                          className="h-7 w-24 px-1.5 text-right rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingBalanceId(acc.id);
                            setEditingBalanceValue(acc.balance.toString());
                          }}
                          className="cursor-pointer group inline-flex items-center justify-end gap-1 py-0.5 px-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
                          title="คลิกเพื่อแก้ไขยอดเงินคงเหลือโดยตรง"
                        >
                          <span className="font-black text-emerald-600 dark:text-emerald-400 tracking-tight whitespace-nowrap text-xs sm:text-sm">
                            {Number(acc.balance).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <svg className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Status Select with Dot */}
                    <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isActive ? "bg-emerald-500 shadow-sm" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        <select
                          value={acc.status || "INACTIVE"}
                          onChange={(e) => onUpdateStatus(acc.id, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="ACTIVE">ใช้งาน</option>
                          <option value="INACTIVE">ไม่ใช้งาน</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions: + (Add), - (Deduct), ⇄ (Transfer) */}
                    <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* + Add Money */}
                        <button
                          type="button"
                          onClick={() => handleOpenAddMoney(acc)}
                          className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition active:scale-95 shadow-2xs cursor-pointer"
                          title="เพิ่มเงินเข้าบัญชี"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>

                        {/* - Deduct Money */}
                        <button
                          type="button"
                          onClick={() => handleOpenDeductMoney(acc)}
                          className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-500 hover:text-white transition active:scale-95 shadow-2xs cursor-pointer"
                          title="ลดเงินจากบัญชี"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                          </svg>
                        </button>

                        {/* ⇄ Transfer */}
                        <button
                          type="button"
                          onClick={() => handleOpenTransfer(acc)}
                          className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition active:scale-95 shadow-2xs cursor-pointer"
                          title="โอนเงินระหว่างบัญชี"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                        </button>
                      </div>
                    </td>

                    {/* Updated At (Only in tabs mode) */}
                    {viewMode === "tabs" && (
                      <td className="py-2.5 px-3 text-center text-slate-400 text-xs whitespace-nowrap">
                        {acc.updatedAt
                          ? new Date(acc.updatedAt).toLocaleDateString("th-TH", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    )}
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
      {/* MODAL: เพิ่มบัญชีใหม่                                           */}
      {/* ============================================================== */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isLoading && setOpenAdd(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                เพิ่มบัญชีใหม่
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

            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ชื่อบัญชี / ช่องทางรับเงิน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ลิ้นชักหน้าร้าน, ธนาคารกสิกรไทย"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ยอดยกมา / เงินตั้งต้น (ถ้ามี)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 text-base font-bold text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? "กำลังบันทึก..." : "บันทึกบัญชี"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: โอนเงินระหว่างบัญชี                                     */}
      {/* ============================================================== */}
      {openTransfer && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isLoading && setOpenTransfer(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                โอนเงินระหว่างบัญชี
              </h3>
              <button
                type="button"
                onClick={() => setOpenTransfer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              {/* Card info origin */}
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-100 dark:border-orange-900/40">
                <span className="text-xs text-orange-600/80 font-medium block">
                  โอนเงินออกจากบัญชี
                </span>
                <span className="text-base font-bold text-orange-700 dark:text-orange-400 block mt-0.5">
                  {selectedAccount.accountName}
                </span>
                <span className="text-xs text-orange-600/80 block mt-1">
                  ยอดเงินที่สามารถโอนได้:{" "}
                  <strong className="text-orange-700 dark:text-orange-300">
                    {Number(selectedAccount.balance).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  เลือกบัญชีปลายทาง (โอนเข้า)
                </label>
                <select
                  required
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="" disabled>-- เลือกบัญชี --</option>
                  {data
                    .filter((a) => a.id !== selectedAccount.id && a.status === "ACTIVE")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  จำนวนเงินที่ต้องการโอน
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 text-base font-bold text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  placeholder="เช่น นำเงินสดเข้าธนาคาร"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
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
                  {isLoading ? "กำลังประมวลผล..." : "ยืนยันการโอนเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: เพิ่ม/ลดเงินในบัญชี (Adjust Type: IN / OUT)              */}
      {/* ============================================================== */}
      {openAdjust && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isLoading && setOpenAdjust(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {adjustType === "IN" ? (
                  <>
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>เพิ่มเงินเข้าบัญชี</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>ลดเงินจากบัญชี</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setOpenAdjust(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  adjustType === "IN"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40"
                }`}
              >
                <span
                  className={`text-xs font-medium block ${
                    adjustType === "IN" ? "text-emerald-600/80" : "text-rose-600/80"
                  }`}
                >
                  ทำรายการสำหรับบัญชี
                </span>
                <span
                  className={`text-base font-bold block mt-0.5 ${
                    adjustType === "IN"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {selectedAccount.accountName}
                </span>
                <span
                  className={`text-xs block mt-1 ${
                    adjustType === "IN" ? "text-emerald-600/80" : "text-rose-600/80"
                  }`}
                >
                  ยอดเงินปัจจุบัน:{" "}
                  <strong>
                    {Number(selectedAccount.balance).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  จำนวนเงิน
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  disabled={isLoading}
                  className={`w-full h-10 px-3 text-base font-bold rounded-xl border focus:outline-none ${
                    adjustType === "IN"
                      ? "border-emerald-200 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                      : "border-rose-200 text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-rose-500"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  หมายเหตุ (สาเหตุการ{adjustType === "IN" ? "เพิ่ม" : "ลด"}เงิน)
                </label>
                <input
                  type="text"
                  placeholder={
                    adjustType === "IN"
                      ? "เช่น เงินทอนตั้งต้นประจำวัน"
                      : "เช่น ถอนเงินไปใช้จ่ายอื่นๆ"
                  }
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 ${
                    adjustType === "IN"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isLoading
                    ? "กำลังประมวลผล..."
                    : adjustType === "IN"
                    ? "ยืนยันการเพิ่มเงิน"
                    : "ยืนยันการลดเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
