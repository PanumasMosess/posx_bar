"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { executeMemberPayment } from "@/lib/actions/actionMemberPayment";
import {
  SortField,
  SortOrder,
  BillCalculation,
  GroupedHistoryItem,
  MemberWithDebtInfo,
  MemberPaymentPageProps,
} from "@/lib/types";
import { useOrgSettings } from "@/components/providers/OrganizationSettingsContext";

export default function MemberPaymentPage({
  initialMembers,
  shopAccounts,
  userId,
  organizationId,
}: MemberPaymentPageProps) {
  const router = useRouter();
  const { settings } = useOrgSettings();
  const currency = settings?.currencyCode || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberWithDebtInfo | null>(null);

  const [selectedShopAccountId, setSelectedShopAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activeTab, setActiveTab] = useState<"DEBT" | "PAID" | "HISTORY">("DEBT");
  const [selectedBillsToPay, setSelectedBillsToPay] = useState<BillCalculation[]>([]);

  const [sortField, setSortField] = useState<SortField>("currentDebt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Inline Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  const membersWithDebtInfo = useMemo<MemberWithDebtInfo[]>(() => {
    const now = new Date().getTime();

    return initialMembers.map((member) => {
      const txs = member.transactions || [];
      const spends = [...txs.filter((t) => t.type === "SPEND")].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const allTopups = txs.filter((t) => t.type === "TOPUP");

      const totalSpent = spends.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalPaid = allTopups.reduce((sum, t) => sum + t.amount, 0);
      const currentDebt = totalSpent - totalPaid > 0 ? totalSpent - totalPaid : 0;

      const aging = { bucket30: 0, bucket60: 0, bucket90: 0, bucketOver90: 0 };

      if (currentDebt > 0) {
        let unreferencedMoney = allTopups
          .filter((t) => t.referenceTxId == null)
          .reduce((sum, t) => sum + t.amount, 0);

        for (const bill of spends) {
          const billAmount = Math.abs(bill.amount);
          const explicitlyPaid = allTopups
            .filter((t) => t.referenceTxId === bill.id)
            .reduce((sum, t) => sum + t.amount, 0);

          let remainingForThisBill = billAmount - explicitlyPaid;

          if (remainingForThisBill > 0 && unreferencedMoney > 0) {
            const fifoPaid = Math.min(remainingForThisBill, unreferencedMoney);
            unreferencedMoney -= fifoPaid;
            remainingForThisBill -= fifoPaid;
          }

          if (remainingForThisBill > 0) {
            const billDate = new Date(bill.createdAt).getTime();
            const diffDays = Math.floor((now - billDate) / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) aging.bucket30 += remainingForThisBill;
            else if (diffDays <= 60) aging.bucket60 += remainingForThisBill;
            else if (diffDays <= 90) aging.bucket90 += remainingForThisBill;
            else aging.bucketOver90 += remainingForThisBill;
          }
        }
      }

      return {
        ...member,
        currentDebt,
        aging,
      };
    });
  }, [initialMembers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const dashboardSummary = useMemo(() => {
    let totalDebtSum = 0;
    let normalDebtSum = 0;
    let overdueDebtSum = 0;

    membersWithDebtInfo.forEach((m) => {
      totalDebtSum += m.currentDebt;
      normalDebtSum += m.aging.bucket30;
      overdueDebtSum += m.aging.bucket60 + m.aging.bucket90 + m.aging.bucketOver90;
    });

    return { totalDebtSum, normalDebtSum, overdueDebtSum };
  }, [membersWithDebtInfo]);

  const filteredAndSortedDebtors = useMemo(() => {
    let debtors = membersWithDebtInfo.filter((m) => m.currentDebt > 0);
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      debtors = debtors.filter(
        (m) =>
          m.phone.includes(query) ||
          m.firstName.toLowerCase().includes(query) ||
          (m.lastName && m.lastName.toLowerCase().includes(query))
      );
    }

    debtors.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      if (sortField === "name") {
        valA = a.firstName.toLowerCase();
        valB = b.firstName.toLowerCase();
      } else if (sortField === "currentDebt") {
        valA = a.currentDebt;
        valB = b.currentDebt;
      } else {
        const bucketKey = sortField as keyof typeof a.aging;
        valA = a.aging[bucketKey];
        valB = b.aging[bucketKey];
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return debtors;
  }, [membersWithDebtInfo, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedDebtors.length / itemsPerPage) || 1;
  const currentDebtors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDebtors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedDebtors, currentPage, itemsPerPage]);

  const handleExportCSV = () => {
    if (filteredAndSortedDebtors.length === 0) {
      showToast("ไม่มีข้อมูลลูกหนี้ค้างชำระที่จะส่งออก", "warning");
      return;
    }

    const headers = [
      "ชื่อลูกค้า",
      "เบอร์โทรศัพท์",
      "ค้างชำระ <= 30 วัน",
      "ค้างชำระ 31-60 วัน",
      "ค้างชำระ 61-90 วัน",
      "ค้างชำระ > 90 วัน",
      "ยอดหนี้รวมทั้งหมด",
    ];
    const csvRows = filteredAndSortedDebtors.map((m) =>
      [
        `"${m.firstName} ${m.lastName || ""}"`,
        `"${m.phone}"`,
        m.aging.bucket30,
        m.aging.bucket60,
        m.aging.bucket90,
        m.aging.bucketOver90,
        m.currentDebt,
      ].join(",")
    );

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `รายงานวิเคราะห์อายุลูกหนี้_${new Date().toLocaleDateString("th-TH")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ส่งออกข้อมูลไฟล์ CSV สำเร็จ", "success");
  };

  const handleExportPDF = () => {
    if (filteredAndSortedDebtors.length === 0) {
      showToast("ไม่มีข้อมูลลูกหนี้ค้างชำระที่จะส่งออก", "warning");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("กรุณาอนุญาตให้ระบบเปิด Pop-up เพื่อดูตัวอย่าง PDF", "error");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>รายงานวิเคราะห์อายุหนี้ประจำวันที่_${new Date().toLocaleDateString("th-TH")}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; color: #18181b; margin: 0; padding: 0; background-color: #f4f4f5; }
            .action-bar { background: #18181b; padding: 15px 20px; display: flex; justify-content: flex-end; gap: 10px; position: sticky; top: 0; z-index: 100; }
            .btn { padding: 8px 16px; border-radius: 6px; border: none; font-family: 'Sarabun', sans-serif; font-weight: 600; cursor: pointer; font-size: 14px; }
            .btn-primary { background: #0284c7; color: white; }
            .btn-secondary { background: #3f3f46; color: white; }
            .page-container { background: white; max-width: 210mm; margin: 30px auto; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 4px; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e4e4e7; padding-bottom: 15px; }
            .header h2 { margin: 0 0 5px 0; font-size: 22px; color: #18181b; }
            .header p { margin: 0; font-size: 13px; color: #52525b; }
            .summary-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .sum-box { border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px; background: #fafafa; text-align: center; }
            .sum-title { font-size: 11px; font-weight: bold; color: #71717a; text-transform: uppercase; margin-bottom: 4px; }
            .sum-val { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #d4d4d8; padding: 8px 6px; text-align: left; }
            th { background-color: #f4f4f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-red { color: #dc2626; font-weight: bold; }
            @media print {
              body { background-color: white; }
              .page-container { margin: 0; padding: 0; box-shadow: none; max-width: 100%; }
              .action-bar { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <button class="btn btn-secondary" onclick="window.close()">ปิดหน้าต่าง</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ สั่งพิมพ์รายงาน / บันทึก PDF</button>
          </div>
          <div class="page-container">
            <div class="header">
              <h2>รายงานวิเคราะห์อายุลูกหนี้ค้างชำระ (AR Aging Report)</h2>
              <p>ข้อมูล ณ วันที่พิมพ์: ${new Date().toLocaleString("th-TH")} น.</p>
            </div>
            <div class="summary-summary">
              <div class="sum-box">
                <div class="sum-title">ยอดลูกหนี้ค้างชำระทั้งหมด</div>
                <div class="sum-val" style="color: #ef4444;">${dashboardSummary.totalDebtSum.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</div>
              </div>
              <div class="sum-box">
                <div class="sum-title">หนี้ปกติ (&le; 30 วัน)</div>
                <div class="sum-val" style="color: #10b981;">${dashboardSummary.normalDebtSum.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</div>
              </div>
              <div class="sum-box">
                <div class="sum-title">หนี้ค้างนาน (&gt; 30 วัน)</div>
                <div class="sum-val" style="color: #f59e0b;">${dashboardSummary.overdueDebtSum.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ชื่อลูกค้า - เบอร์โทรศัพท์</th>
                  <th class="text-right">&le; 30 วัน</th>
                  <th class="text-right">31-60 วัน</th>
                  <th class="text-right">61-90 วัน</th>
                  <th class="text-right">&gt; 90 วัน</th>
                  <th class="text-right">หนี้รวมทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAndSortedDebtors
                  .map(
                    (m) => `
                  <tr>
                    <td><strong>${m.firstName} ${m.lastName || ""}</strong><br><span style="font-size: 10px; color:#71717a;">${m.phone}</span></td>
                    <td class="text-right">${m.aging.bucket30 > 0 ? m.aging.bucket30.toLocaleString() : "-"}</td>
                    <td class="text-right" style="color: #b45309;">${m.aging.bucket60 > 0 ? m.aging.bucket60.toLocaleString() : "-"}</td>
                    <td class="text-right" style="color: #ea580c;">${m.aging.bucket90 > 0 ? m.aging.bucket90.toLocaleString() : "-"}</td>
                    <td class="text-right text-red">${m.aging.bucketOver90 > 0 ? m.aging.bucketOver90.toLocaleString() : "-"}</td>
                    <td class="text-right" style="font-weight: bold; background: #fff5f5;">${m.currentDebt.toLocaleString()} ${currency}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const { activeBills, settledBills, groupedHistory, billsLookupMap } = useMemo(() => {
    if (!selectedMember) {
      return {
        activeBills: [] as BillCalculation[],
        settledBills: [] as BillCalculation[],
        groupedHistory: [] as GroupedHistoryItem[],
        billsLookupMap: new Map<number, BillCalculation>(),
      };
    }

    const txs = selectedMember.transactions || [];
    const spends = [...txs.filter((t) => t.type === "SPEND")].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const allTopups = txs.filter((t) => t.type === "TOPUP");

    let unreferencedMoney = allTopups
      .filter((t) => t.referenceTxId == null)
      .reduce((sum, t) => sum + t.amount, 0);

    const calculatedActiveBills: BillCalculation[] = [];
    const calculatedSettledBills: BillCalculation[] = [];
    const internalLookupMap = new Map<number, BillCalculation>();

    for (const bill of spends) {
      const billAmount = Math.abs(bill.amount);
      const explicitlyPaid = allTopups
        .filter((t) => t.referenceTxId === bill.id)
        .reduce((sum, t) => sum + t.amount, 0);

      let remainingForThisBill = billAmount - explicitlyPaid;
      let totalPaidForThisBill = explicitlyPaid;

      if (remainingForThisBill > 0 && unreferencedMoney > 0) {
        const fifoPaid = Math.min(remainingForThisBill, unreferencedMoney);
        unreferencedMoney -= fifoPaid;
        remainingForThisBill -= fifoPaid;
        totalPaidForThisBill += fifoPaid;
      }

      const billData: BillCalculation = {
        id: bill.id,
        orderId: bill.orderId,
        amount: bill.amount,
        createdAt: bill.createdAt,
        date: bill.date,
        originalAmount: billAmount,
        paidAmount: totalPaidForThisBill,
        remainingAmount: remainingForThisBill,
      };

      internalLookupMap.set(bill.id, billData);

      if (remainingForThisBill > 0) {
        calculatedActiveBills.push(billData);
      }
      if (totalPaidForThisBill > 0) {
        calculatedSettledBills.push(billData);
      }
    }

    calculatedActiveBills.reverse();
    calculatedSettledBills.reverse();

    const historyMap = new Map<string | number, GroupedHistoryItem>();
    const sortedTopups = [...allTopups].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedTopups.forEach((tx) => {
      const key = tx.paymentGroupId || tx.id;
      if (historyMap.has(key)) {
        const existing = historyMap.get(key)!;
        existing.amount += tx.amount;
        existing.isGrouped = true;
        if (tx.referenceTxId) {
          existing.clearedBills = existing.clearedBills || [];
          existing.clearedBills.push({ id: tx.referenceTxId, amountPaid: tx.amount });
        }
      } else {
        historyMap.set(key, {
          id: tx.id,
          amount: tx.amount,
          note: tx.note,
          createdAt: tx.createdAt,
          date: tx.date,
          paymentGroupId: tx.paymentGroupId,
          isGrouped: false,
          clearedBills: tx.referenceTxId
            ? [{ id: tx.referenceTxId, amountPaid: tx.amount }]
            : [],
        });
      }
    });

    const finalHistory = Array.from(historyMap.values());

    return {
      activeBills: calculatedActiveBills,
      settledBills: calculatedSettledBills,
      groupedHistory: finalHistory,
      billsLookupMap: internalLookupMap,
    };
  }, [selectedMember]);

  const handleSelectMember = (member: MemberWithDebtInfo) => {
    setSelectedMember(member);
    setSelectedBillsToPay([]);
    setAmount("");
    setActiveTab("DEBT");
  };

  const handleToggleSelectBill = (bill: BillCalculation) => {
    setSelectedBillsToPay((prev) => {
      const isAlreadySelected = prev.some((b) => b.id === bill.id);
      const newSelected = isAlreadySelected
        ? prev.filter((b) => b.id !== bill.id)
        : [...prev, bill];

      const totalSelectedAmount = newSelected.reduce(
        (sum, b) => sum + b.remainingAmount,
        0
      );
      setAmount(totalSelectedAmount > 0 ? totalSelectedAmount.toString() : "");

      return newSelected;
    });
  };

  const closeModal = () => {
    setSelectedMember(null);
    setSelectedBillsToPay([]);
    setAmount("");
    setNote("");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return showToast("กรุณาเลือกสมาชิกก่อนทำรายการ", "error");
    if (!selectedShopAccountId)
      return showToast("กรุณาเลือกช่องทางรับเงินเข้าร้าน", "error");
    if (!paymentDate) return showToast("กรุณาเลือกวันที่ชำระเงิน", "error");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0)
      return showToast("กรุณาระบุจำนวนเงินให้ถูกต้อง", "error");

    setLoading(true);
    const targetTransactionIds = selectedBillsToPay.map((b) => b.id);

    const res = await executeMemberPayment({
      memberId: selectedMember.id,
      companyAccountId: parseInt(selectedShopAccountId),
      paymentType: "CLEAR_DEBT",
      amount: numAmount,
      note:
        note ||
        (targetTransactionIds.length > 0
          ? `รับชำระบิลค้าง (${targetTransactionIds.length} รายการ)`
          : "รับชำระบิลค้าง (ตัดยอดอัตโนมัติ)"),
      userId,
      organizationId,
      clearingTransactionIds: targetTransactionIds,
      paymentDate,
    });

    if (res.success) {
      showToast(res.message, "success");
      closeModal();
      setSearchQuery("");
      router.refresh();
    } else {
      showToast(res.message, "error");
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen text-slate-800 dark:text-zinc-100 font-sans relative">
      {/* Toast popup */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "warning"
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          />
          <span className="text-slate-800 dark:text-white">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="text-2xl">💳</span> รับชำระหนี้ / คืนยอดเครดิต
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              ตรวจสอบอายุหนี้ลูกหนี้ค้างชำระ และบันทึกรับชำระเงินเข้าบัญชีร้าน
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
            className="flex gap-2 w-full md:w-[380px]"
          >
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                placeholder="ค้นหาด้วยเบอร์โทร หรือชื่อ..."
                className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              type="submit"
              className="h-10 bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-5 text-sm font-medium transition cursor-pointer"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {/* DASHBOARD SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              ยอดเงินจม / หนี้ค้างรวมทั้งหมด
            </p>
            <p className="text-3xl font-black text-rose-500">
              {dashboardSummary.totalDebtSum.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-base font-normal">{currency}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
              ยอดเครดิตสะสมคงค้างของสมาชิกร้านค้าทุกคน
            </p>
          </div>

          <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              หนี้ก้อนปกติ (&le; 30 วัน)
            </p>
            <p className="text-3xl font-black text-emerald-500">
              {dashboardSummary.normalDebtSum.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-base font-normal">{currency}</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              ยอดหนี้อายุสั้น หมุนเวียนปกติ ความเสี่ยงต่ำ
            </p>
          </div>

          <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              หนี้ค้างนาน / หนี้เสี่ยง (&gt; 30 วัน)
            </p>
            <p className="text-3xl font-black text-amber-500">
              {dashboardSummary.overdueDebtSum.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-base font-normal">{currency}</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              หนี้ค้างนานเกิน 1 เดือนขึ้นไป ควรเริ่มติดตามทวงถาม
            </p>
          </div>
        </div>

        {/* DATA TABLE CARD */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#161618] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-bold">⚠️</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-wide">
                รายงานอายุลูกหนี้ค้างชำระ ({filteredAndSortedDebtors.length} รายการ)
              </h3>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleExportCSV}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 h-8.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 transition cursor-pointer"
              >
                📥 ส่งออก CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-sky-600 hover:bg-sky-500 text-white h-8.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 px-3 transition cursor-pointer shadow-xs"
              >
                🖨️ ตรวจสอบ / พิมพ์ PDF
              </button>
            </div>
          </div>

          {filteredAndSortedDebtors.length > 0 ? (
            <div className="flex flex-col">
              <div className="overflow-x-auto pb-2">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead className="bg-slate-100/70 dark:bg-[#0A0A0B] border-b border-slate-200 dark:border-zinc-800">
                    <tr className="text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap select-none">
                      <th
                        onClick={() => handleSort("name")}
                        className="px-5 py-3.5 w-[220px] hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 cursor-pointer group transition"
                      >
                        <div className="flex items-center gap-1">
                          ข้อมูลลูกค้า ↕
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("bucket30")}
                        className="px-3 py-3.5 text-right w-[100px] hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 cursor-pointer group transition"
                      >
                        <div className="flex items-center justify-end gap-1">
                          &le; 30 วัน ↕
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("bucket60")}
                        className="px-3 py-3.5 text-right w-[100px] text-amber-500 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 cursor-pointer group transition"
                      >
                        <div className="flex items-center justify-end gap-1">
                          31-60 วัน ↕
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("bucket90")}
                        className="px-3 py-3.5 text-right w-[100px] text-orange-500 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 cursor-pointer group transition"
                      >
                        <div className="flex items-center justify-end gap-1">
                          61-90 วัน ↕
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("bucketOver90")}
                        className="px-3 py-3.5 text-right w-[110px] text-rose-500 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 cursor-pointer group transition"
                      >
                        <div className="flex items-center justify-end gap-1">
                          &gt; 90 วัน ↕
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("currentDebt")}
                        className="px-5 py-3.5 text-right w-[130px] hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 cursor-pointer group transition"
                      >
                        <div className="flex items-center justify-end gap-1">
                          หนี้รวมทั้งหมด ↕
                        </div>
                      </th>
                      <th className="px-5 py-3.5 text-center w-[100px]">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-sm">
                    {currentDebtors.map((debtor, index) => (
                      <tr
                        key={debtor.id}
                        className={`hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition cursor-pointer group ${
                          index % 2 === 0
                            ? "bg-transparent"
                            : "bg-slate-50/30 dark:bg-[#161618]/30"
                        }`}
                        onClick={() => handleSelectMember(debtor)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 flex items-center justify-center font-bold text-xs group-hover:bg-sky-600 group-hover:text-white transition shrink-0">
                              {debtor.firstName[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-white transition line-clamp-1">
                                {debtor.firstName} {debtor.lastName || ""}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                                {debtor.phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-right font-mono text-xs text-slate-600 dark:text-zinc-300">
                          {debtor.aging.bucket30 > 0
                            ? debtor.aging.bucket30.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono text-xs text-amber-500 font-semibold">
                          {debtor.aging.bucket60 > 0
                            ? debtor.aging.bucket60.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono text-xs text-orange-500 font-bold">
                          {debtor.aging.bucket90 > 0
                            ? debtor.aging.bucket90.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono text-xs">
                          {debtor.aging.bucketOver90 > 0 ? (
                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 px-2 py-0.5 rounded font-bold">
                              {debtor.aging.bucketOver90.toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg">
                            {debtor.currentDebt.toLocaleString()} {currency}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            className="h-8 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white dark:bg-zinc-800 dark:hover:bg-sky-600 dark:text-zinc-300 dark:hover:text-white border border-sky-200 dark:border-zinc-700 transition rounded-lg font-medium text-xs px-3.5 cursor-pointer"
                          >
                            รับชำระ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#161618] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                    แสดงแถวที่ {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredAndSortedDebtors.length
                    )}{" "}
                    จากทั้งหมด {filteredAndSortedDebtors.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      แสดงหน้าละ:
                    </span>
                    <select
                      className="h-8 bg-white dark:bg-[#0A0A0B] border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-300 text-xs rounded-lg px-2 outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option
                        value={
                          filteredAndSortedDebtors.length > 0
                            ? filteredAndSortedDebtors.length
                            : 100
                        }
                      >
                        ทั้งหมด
                      </option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 rounded-lg text-xs disabled:opacity-40 cursor-pointer"
                    >
                      &larr; ก่อนหน้า
                    </button>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 px-3">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 rounded-lg text-xs disabled:opacity-40 cursor-pointer"
                    >
                      ถัดไป &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl text-emerald-600">✓</span>
              </div>
              <p className="text-base font-bold text-slate-700 dark:text-zinc-200">
                ไม่มีลูกหนี้ค้างชำระ
              </p>
              <p className="text-xs mt-1">
                {searchQuery
                  ? "ไม่พบข้อมูลที่ตรงกับการค้นหา"
                  : "ยอดเยี่ยมมาก! ปัจจุบันไม่มีลูกค้าค้างชำระในระบบ"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ชำระหนี้ */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="relative w-full max-w-[920px] max-h-[90vh] bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-700/60 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              ✕
            </button>

            {/* ฝั่งซ้าย: ข้อมูลบิล & สมาชิก */}
            <div className="w-full md:w-1/2 bg-slate-50 dark:bg-[#0A0A0B] p-6 border-r border-slate-200 dark:border-zinc-800/80 flex flex-col h-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center gap-3.5 mb-5 shrink-0">
                <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {selectedMember.firstName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedMember.firstName} {selectedMember.lastName || ""}
                  </h3>
                  <p className="text-slate-500 dark:text-zinc-400 font-mono text-xs mt-0.5">
                    📞 {selectedMember.phone}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 mb-5 shrink-0">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wider">
                  ยอดหนี้ที่ต้องชำระทั้งหมด
                </p>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  {selectedMember.currentDebt.toLocaleString()} {currency}
                </p>
              </div>

              {/* TABS */}
              <div className="flex items-center gap-1 mb-4 bg-slate-200/60 dark:bg-[#161618] p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setActiveTab("DEBT")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "DEBT"
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  ค้างชำระ ({activeBills.length})
                </button>
                <button
                  onClick={() => setActiveTab("PAID")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "PAID"
                      ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  ชำระแล้ว ({settledBills.length})
                </button>
                <button
                  onClick={() => setActiveTab("HISTORY")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "HISTORY"
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  ประวัติ ({groupedHistory.length})
                </button>
              </div>

              {/* LIST CONTENT */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {activeTab === "DEBT" && (
                  <>
                    {activeBills.map((tx, idx) => {
                      const isSelected = selectedBillsToPay.some((b) => b.id === tx.id);
                      return (
                        <div
                          key={`debt-${idx}`}
                          onClick={() => handleToggleSelectBill(tx)}
                          className={`p-3.5 rounded-xl border flex flex-col gap-2 transition cursor-pointer relative ${
                            isSelected
                              ? "bg-sky-50 dark:bg-sky-950/20 border-sky-400 dark:border-sky-500/50 shadow-xs"
                              : "bg-white dark:bg-[#161618] border-slate-200 dark:border-zinc-800/60 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-sky-500 bg-sky-500 text-white text-xs font-bold"
                                : "border-slate-300 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && "✓"}
                          </div>
                          <div className="pr-7">
                            <p
                              className={`font-semibold text-xs ${
                                isSelected
                                  ? "text-sky-700 dark:text-sky-300"
                                  : "text-slate-800 dark:text-zinc-200"
                              }`}
                            >
                              🧾 {tx.orderId ? `บิล #${tx.orderId}` : "เซ็นยืมหน้าร้าน"}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              {new Date(tx.date || tx.createdAt).toLocaleDateString(
                                "th-TH"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-zinc-800/40 text-xs">
                            <span className="text-slate-400 text-[11px]">
                              ยอดเดิม {tx.originalAmount.toLocaleString()} {currency}
                            </span>
                            <span className="font-bold text-rose-500">
                              ค้าง {tx.remainingAmount.toLocaleString()} {currency}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {activeBills.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-8">
                        ไม่มีบิลค้างชำระ
                      </p>
                    )}
                  </>
                )}

                {activeTab === "PAID" && (
                  <>
                    {settledBills.map((tx, idx) => (
                      <div
                        key={`paid-${idx}`}
                        className="p-3.5 rounded-xl border bg-white dark:bg-[#161618] border-slate-200 dark:border-zinc-800/60 text-xs space-y-1.5"
                      >
                        <p className="font-semibold text-slate-800 dark:text-zinc-200">
                          🧾 {tx.orderId ? `บิล #${tx.orderId}` : "เซ็นยืมหน้าร้าน"}
                        </p>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>
                            {new Date(tx.date || tx.createdAt).toLocaleDateString(
                              "th-TH"
                            )}
                          </span>
                          <span className="text-emerald-500 font-bold">
                            จ่ายแล้ว {tx.paidAmount.toLocaleString()} {currency}
                          </span>
                        </div>
                      </div>
                    ))}
                    {settledBills.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-8">
                        ยังไม่มีประวัติบิลที่ชำระ
                      </p>
                    )}
                  </>
                )}

                {activeTab === "HISTORY" && (
                  <>
                    {groupedHistory.map((tx, idx) => {
                      const relatedBills = tx.clearedBills
                        ? tx.clearedBills
                            .map((cb) => {
                              const b = billsLookupMap.get(cb.id);
                              return b ? { ...b, paidInThisTx: cb.amountPaid } : null;
                            })
                            .filter(Boolean)
                        : [];
                      return (
                        <div
                          key={`hist-${idx}`}
                          className="p-3.5 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-emerald-700 dark:text-emerald-400">
                                🏦 {tx.note || "รับชำระเงิน"}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {new Date(tx.date || tx.createdAt).toLocaleString(
                                  "th-TH"
                                )}
                              </span>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              +{tx.amount.toLocaleString()} {currency}
                            </span>
                          </div>
                          {relatedBills.length > 0 && (
                            <div className="pt-1.5 border-t border-emerald-100 dark:border-emerald-900/30 space-y-1">
                              {relatedBills.map((b, bIdx) => (
                                <div
                                  key={`rel-${bIdx}`}
                                  className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400"
                                >
                                  <span>
                                    🧾 {b?.orderId ? `บิล #${b.orderId}` : "บิลหน้าร้าน"}
                                  </span>
                                  <span className="font-semibold text-emerald-600">
                                    {b?.paidInThisTx.toLocaleString()} {currency}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {groupedHistory.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-8">
                        ยังไม่มีประวัติการชำระเงิน
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ฝั่งขวา: ฟอร์มรับเงิน */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between h-full bg-white dark:bg-[#111113]">
              <div>
                <div className="mb-5 pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>💵</span> บันทึกรับชำระเงิน
                  </h3>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
                    {selectedBillsToPay.length > 0
                      ? `เลือกจ่าย ${selectedBillsToPay.length} บิล (ยอดคำนวณอัตโนมัติ)`
                      : "กรอกจำนวนเงิน หรือกดเลือกบิลจากด้านซ้าย"}
                  </p>
                </div>

                <form
                  id="paymentForm"
                  onSubmit={handleSubmitPayment}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      วันที่ชำระเงิน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      ช่องทางรับเงินเข้าร้าน <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedShopAccountId}
                      onChange={(e) => setSelectedShopAccountId(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="" disabled>
                        -- เลือกบัญชีธนาคาร หรือ เงินสด --
                      </option>
                      {shopAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} (คงเหลือ {acc.balance.toLocaleString()} {currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      จำนวนเงินที่ลูกค้านำมาจ่าย <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={loading}
                        className="w-full h-14 pl-4 pr-12 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-zinc-700 rounded-xl text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                        {currency}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      หมายเหตุช่วยจำ (ถ้ามี)
                    </label>
                    <input
                      placeholder="เช่น ลูกค้าโอนเข้าบัญชีกสิกร..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={loading}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </form>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="submit"
                  form="paymentForm"
                  disabled={loading || selectedMember.currentDebt <= 0}
                  className="w-full h-12 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "กำลังบันทึก..." : "ยืนยันรับชำระเงิน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
