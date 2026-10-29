"use server";

import prisma from "@/lib/prisma";

export async function getAccountingReportData(filters: {
  startDate: string;
  endDate: string;
  organizationId: number;
}) {
  try {
    const start = new Date(`${filters.startDate}T00:00:00+07:00`);
    const end = new Date(`${filters.endDate}T23:59:59+07:00`);

    const txLogs = await prisma.account_transaction.findMany({
      where: {
        organizationId: filters.organizationId,
        type: { in: ["SALES", "INCOME", "AR_PAYMENT", "EXPENSE"] },
        OR: [
          { date: { gte: start, lte: end } },
          { date: null, createdAt: { gte: start, lte: end } },
        ],
      },
      include: {
        category: { select: { name: true } },
        account: { select: { accountName: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalARPayment = 0;

    const dailyDataMap = new Map<string, { date: string; income: number; expense: number }>();
    const expenseCategoryMap = new Map<string, number>();
    const rawTransactions: {
      id: number;
      date: string;
      type: string;
      categoryName: string;
      title: string;
      accountName: string;
      amount: number;
    }[] = [];

    txLogs.forEach((tx) => {
      const rawAmount = Number(tx.amount);
      const amount = Math.abs(rawAmount);

      const actualDate = tx.date || tx.createdAt;
      const localDate = new Date(actualDate.getTime() + 7 * 60 * 60 * 1000);
      const dateKey = localDate.toISOString().split("T")[0];
      const catName = tx.category?.name || "ไม่ระบุหมวดหมู่";

      rawTransactions.push({
        id: tx.id,
        date: actualDate.toISOString(),
        type: tx.type,
        categoryName: catName,
        title: tx.title || tx.note || catName || "ไม่มีบันทึกย่อ",
        accountName: tx.account?.accountName || "ไม่ระบุบัญชี",
        amount,
      });

      if (!dailyDataMap.has(dateKey)) {
        dailyDataMap.set(dateKey, { date: dateKey, income: 0, expense: 0 });
      }

      if (["SALES", "INCOME", "AR_PAYMENT"].includes(tx.type)) {
        totalIncome += amount;
        dailyDataMap.get(dateKey)!.income += amount;

        if (tx.type === "AR_PAYMENT") {
          totalARPayment += amount;
        }
      } else if (tx.type === "EXPENSE") {
        totalExpense += amount;
        dailyDataMap.get(dateKey)!.expense += amount;

        expenseCategoryMap.set(catName, (expenseCategoryMap.get(catName) || 0) + amount);
      }
    });

    const netProfit = totalIncome - totalExpense;
    const dailyChartData = Array.from(dailyDataMap.values());
    const expenseCategoryData = Array.from(expenseCategoryMap.entries()).map(
      ([name, value]) => ({ name, value })
    );

    const accounts = await prisma.account.findMany({
      where: { organizationId: filters.organizationId, status: "ACTIVE" },
      select: { accountName: true, balance: true },
    });

    const memberTxs = await prisma.membertransaction.findMany({
      where: {
        organizationId: filters.organizationId,
        walletType: "CREDIT",
        type: { in: ["SPEND", "TOPUP"] },
      },
      select: {
        memberId: true,
        type: true,
        amount: true,
      },
    });

    const debtorMap = new Map<number, number>();
    memberTxs.forEach((tx) => {
      const currentDebt = debtorMap.get(tx.memberId) || 0;
      const amountValue = Number(tx.amount);

      if (tx.type === "SPEND") {
        debtorMap.set(tx.memberId, currentDebt + Math.abs(amountValue));
      } else if (tx.type === "TOPUP") {
        debtorMap.set(tx.memberId, currentDebt - amountValue);
      }
    });

    let totalOutstandingAR = 0;
    debtorMap.forEach((finalDebt) => {
      if (finalDebt > 0) {
        totalOutstandingAR += finalDebt;
      }
    });

    return {
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netProfit,
          totalARPayment,
          totalOutstandingAR,
        },
        dailyChartData,
        expenseCategoryData,
        accounts,
        transactions: rawTransactions,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}

