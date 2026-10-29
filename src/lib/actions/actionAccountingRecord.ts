"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getValidCreatorId } from "@/lib/actions/actionAccounting";

// 1. Record an Expense or Income transaction
export async function recordTransaction(data: {
  accountId?: number;
  paymentChannel?: "CASH" | "TRANSFER" | "OTHER";
  categoryId?: number;
  categoryName: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  title?: string;
  note?: string;
  userId: number;
  organizationId: number;
  date: string; // YYYY-MM-DD
  isMonthly?: boolean;
}) {
  try {
    if (data.amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");

    return await prisma.$transaction(async (tx) => {
      // Find or determine account
      let account = null;
      if (data.accountId && data.accountId > 0) {
        account = await tx.account.findUnique({ where: { id: data.accountId } });
      }

      if (!account) {
        // Find by payment channel
        const allAccounts = await tx.account.findMany({
          where: { organizationId: data.organizationId, status: "ACTIVE" },
        });

        if (data.paymentChannel === "TRANSFER") {
          account =
            allAccounts.find((a) =>
              a.accountName.includes("โอน") ||
              a.accountName.includes("ธนาคาร") ||
              a.accountName.includes("กสิกร") ||
              a.accountName.includes("กรุงเทพ") ||
              a.accountName.includes("ไทยพาณิชย์")
            ) || allAccounts[1] || allAccounts[0];
        } else {
          // Default to Cash
          account =
            allAccounts.find((a) =>
              a.accountName.includes("สด") || a.accountName.includes("ลิ้นชัก")
            ) || allAccounts[0];
        }

        if (!account) {
          // Create a default Cash account if none exists
          account = await tx.account.create({
            data: {
              organizationId: data.organizationId,
              accountName: "เงินสดในลิ้นชัก",
              balance: 0,
              status: "ACTIVE",
              accPosPayment: true,
            },
          });
        }
      }

      // Find or create category
      const cleanCategoryName = (data.categoryName || "ทั่วไป").trim();
      let category = await tx.account_category.findFirst({
        where: {
          name: cleanCategoryName,
          type: data.type,
          organizationId: data.organizationId,
        },
      });

      if (!category) {
        category = await tx.account_category.create({
          data: {
            name: cleanCategoryName,
            type: data.type,
            status: "ACTIVE",
            organizationId: data.organizationId,
          },
        });
      }

      // Update account balance
      let newBalance = account.balance;
      if (data.type === "INCOME") {
        newBalance = account.balance + data.amount;
      } else {
        newBalance = account.balance - data.amount;
      }

      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });

      const creatorId = await getValidCreatorId(tx, data.userId, data.organizationId);
      const targetDate = new Date(`${data.date}T12:00:00+07:00`);
      const finalNote = data.isMonthly
        ? (data.note ? `[MONTHLY] ${data.note}` : "[MONTHLY]")
        : (data.note || "-");

      await tx.account_transaction.create({
        data: {
          organizationId: data.organizationId,
          accountId: account.id,
          categoryId: category.id,
          type: data.type,
          amount: data.type === "EXPENSE" ? -data.amount : data.amount,
          accountBalance: newBalance,
          title: data.title?.trim() || cleanCategoryName,
          note: finalNote,
          createdById: creatorId,
          date: targetDate,
        },
      });

      revalidatePath("/expenses");
      revalidatePath("/accounting");
      revalidatePath("/settings");
      revalidatePath("/settings/accounting");

      return { success: true, message: "บันทึกรายการเรียบร้อยแล้ว" };
    });
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการบันทึก" };
  }
}

const THAI_SHORT_MONTHS_LIST = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

// 2. Fetch monthly calendar data with summary metrics
export async function getCalendarExpensesAction(
  year: number,
  month: number, // 1 to 12
  organizationId: number
) {
  try {
    // Range for current month
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const daysInMonth = endOfMonth.getDate();

    // Range for today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Range for year
    const startOfYear = new Date(year, 0, 1, 0, 0, 0);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Query all transactions for the year
    const txs = await prisma.account_transaction.findMany({
      where: {
        organizationId,
        type: { in: ["EXPENSE", "INCOME"] },
        OR: [
          { date: { gte: startOfYear, lte: endOfYear } },
          { date: null, createdAt: { gte: startOfYear, lte: endOfYear } },
        ],
      },
      include: {
        account: { select: { accountName: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    let todayIncome = 0;
    let todayExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    let yearIncome = 0;
    let yearExpense = 0;

    // Monthly expense items for the current selected month
    const monthlyExpenseItems: {
      id: number;
      title: string;
      categoryName: string;
      amount: number;
      monthlyAmount: number;
      dailyShare: number;
      type: string;
      accountName: string;
      note: string | null;
      dateStr: string;
      isMonthly: boolean;
    }[] = [];

    // All income and daily expense items for the current month (for Image 2 modal)
    const monthAllIncomes: {
      id: number;
      title: string;
      categoryName: string;
      amount: number;
      type: string;
      accountName: string;
      note: string | null;
      dateStr: string;
      isMonthly: boolean;
    }[] = [];

    const monthAllDailyExpenses: {
      id: number;
      title: string;
      categoryName: string;
      amount: number;
      type: string;
      accountName: string;
      note: string | null;
      dateStr: string;
      isMonthly: boolean;
    }[] = [];

    // 12 months data for yearly breakdown (for Image 3 modal)
    const yearlyMonthsData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: THAI_SHORT_MONTHS_LIST[i],
      income: 0,
      expense: 0,
      net: 0,
      hasData: false,
    }));

    // Pre-initialize dailyExpensesMap for each day 1..daysInMonth
    const dailyExpensesMap: Record<
      number,
      {
        totalExpense: number;
        totalIncome: number;
        net: number;
        dailyItems: {
          id: number;
          title: string;
          categoryName: string;
          amount: number;
          type: string;
          accountName: string;
          note: string | null;
          dateStr: string;
          isMonthly: boolean;
        }[];
        monthlyItems: {
          id: number;
          title: string;
          categoryName: string;
          amount: number;
          monthlyAmount: number;
          dailyShare: number;
          type: string;
          accountName: string;
          note: string | null;
          dateStr: string;
          isMonthly: boolean;
        }[];
      }
    > = {};

    for (let d = 1; d <= daysInMonth; d++) {
      dailyExpensesMap[d] = {
        totalExpense: 0,
        totalIncome: 0,
        net: 0,
        dailyItems: [],
        monthlyItems: [],
      };
    }

    // Process all transactions
    txs.forEach((tx) => {
      const actualDate = tx.date || tx.createdAt;
      const txTime = actualDate.getTime();
      const amount = Math.abs(Number(tx.amount));
      const isMonthly = !!tx.note?.includes("[MONTHLY]");
      const txMonth = actualDate.getMonth() + 1; // 1-12
      const dateStr = actualDate.toISOString().split("T")[0];

      const itemObj = {
        id: tx.id,
        title: tx.title,
        categoryName: tx.category?.name || "ทั่วไป",
        amount,
        type: tx.type,
        accountName: tx.account?.accountName || "เงินสด",
        note: tx.note,
        dateStr,
        isMonthly,
      };

      // 1. Yearly aggregation (Image 3)
      if (txTime <= endOfToday.getTime() || isMonthly) {
        if (tx.type === "INCOME") {
          yearIncome += amount;
          yearlyMonthsData[txMonth - 1].income += amount;
          yearlyMonthsData[txMonth - 1].hasData = true;
        } else if (tx.type === "EXPENSE") {
          yearExpense += amount;
          yearlyMonthsData[txMonth - 1].expense += amount;
          yearlyMonthsData[txMonth - 1].hasData = true;
        }
      }

      // 2. Current Month processing
      if (txTime >= startOfMonth.getTime() && txTime <= endOfMonth.getTime()) {
        if (isMonthly && tx.type === "EXPENSE") {
          const dailyShare = Math.round(amount / daysInMonth);
          monthlyExpenseItems.push({
            ...itemObj,
            monthlyAmount: amount,
            dailyShare,
          });
          monthExpense += amount;
        } else {
          // Regular daily transaction
          if (tx.type === "INCOME") {
            monthAllIncomes.push(itemObj);
            if (txTime <= endOfToday.getTime()) {
              monthIncome += amount;
            }
          } else if (tx.type === "EXPENSE") {
            monthAllDailyExpenses.push(itemObj);
            if (txTime <= endOfToday.getTime()) {
              monthExpense += amount;
            }
          }

          // Add to daily item map
          const dayNum = actualDate.getDate();
          if (dailyExpensesMap[dayNum]) {
            dailyExpensesMap[dayNum].dailyItems.push(itemObj);
            if (tx.type === "INCOME") {
              dailyExpensesMap[dayNum].totalIncome += amount;
            } else {
              dailyExpensesMap[dayNum].totalExpense += amount;
            }
          }

          // Today metrics for regular daily transaction
          if (txTime >= startOfToday.getTime() && txTime <= endOfToday.getTime()) {
            if (tx.type === "INCOME") todayIncome += amount;
            if (tx.type === "EXPENSE") todayExpense += amount;
          }
        }
      }
    });

    // Sum of daily share from all monthly expenses
    const totalMonthlyExpense = monthlyExpenseItems.reduce((sum, item) => sum + item.monthlyAmount, 0);
    const dailyShareOfMonthly = Math.round(totalMonthlyExpense / daysInMonth);

    // Apply monthly expense daily share to all days in the month
    for (let d = 1; d <= daysInMonth; d++) {
      dailyExpensesMap[d].totalExpense += dailyShareOfMonthly;
      dailyExpensesMap[d].net = dailyExpensesMap[d].totalIncome - dailyExpensesMap[d].totalExpense;
      dailyExpensesMap[d].monthlyItems = monthlyExpenseItems;
    }

    // Add monthly share to today's expense if looking at current month
    if (now.getMonth() + 1 === month && now.getFullYear() === year) {
      todayExpense += dailyShareOfMonthly;
    }

    // Calculate net values
    const todayNet = todayIncome - todayExpense;
    const monthNet = monthIncome - monthExpense;
    const yearNet = yearIncome - yearExpense;

    // Calculate daily and monthly averages (Image 1)
    const currentDay = now.getMonth() + 1 === month && now.getFullYear() === year ? now.getDate() : daysInMonth;
    const avgDailyExpense = currentDay > 0 ? Math.round(monthExpense / currentDay) : 0;
    const avgDailyIncome = currentDay > 0 ? Math.round(monthIncome / currentDay) : 0;

    const currentMonthNum = now.getFullYear() === year ? now.getMonth() + 1 : 12;
    const avgMonthlyExpense = currentMonthNum > 0 ? Math.round(yearExpense / currentMonthNum) : 0;
    const avgMonthlyIncome = currentMonthNum > 0 ? Math.round(yearIncome / currentMonthNum) : 0;

    // Compute net for each month in yearly data
    yearlyMonthsData.forEach((m) => {
      m.net = m.income - m.expense;
    });

    // Accounts
    const accounts = await prisma.account.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true, accountName: true, balance: true },
    });

    // Categories
    const categories = await prisma.account_category.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true, name: true, type: true },
    });

    return {
      success: true,
      data: {
        todayIncome,
        todayExpense,
        todayNet,
        monthIncome,
        monthExpense,
        monthNet,
        yearIncome,
        yearExpense,
        yearNet,
        avgDailyIncome,
        avgDailyExpense,
        avgMonthlyIncome,
        avgMonthlyExpense,
        daysInMonth,
        dailyExpensesMap,
        monthlyExpenseItems,
        totalMonthlyExpense,
        monthAllIncomes,
        monthAllDailyExpenses,
        yearlyMonthsData,
        accounts,
        categories,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" };
  }
}

// 3. Copy expenses from a previous date to a target date
export async function copyDayExpensesAction(data: {
  sourceDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  userId: number;
  organizationId: number;
}) {
  try {
    const sDate = new Date(`${data.sourceDate}T00:00:00+07:00`);
    const sDateEnd = new Date(`${data.sourceDate}T23:59:59+07:00`);

    const sourceTxs = await prisma.account_transaction.findMany({
      where: {
        organizationId: data.organizationId,
        type: "EXPENSE",
        OR: [
          { date: { gte: sDate, lte: sDateEnd } },
          { date: null, createdAt: { gte: sDate, lte: sDateEnd } },
        ],
      },
    });

    if (sourceTxs.length === 0) {
      throw new Error("ไม่พบรายการรายจ่ายในวันที่เลือกสำหรับคัดลอก");
    }

    return await prisma.$transaction(async (tx) => {
      const creatorId = await getValidCreatorId(tx, data.userId, data.organizationId);
      const targetDateObj = new Date(`${data.targetDate}T12:00:00+07:00`);

      for (const item of sourceTxs) {
        const rawAmount = Math.abs(Number(item.amount));
        const account = await tx.account.findUnique({ where: { id: item.accountId } });
        const newBalance = (account?.balance || 0) - rawAmount;

        if (account) {
          await tx.account.update({
            where: { id: account.id },
            data: { balance: newBalance },
          });
        }

        await tx.account_transaction.create({
          data: {
            organizationId: data.organizationId,
            accountId: item.accountId,
            categoryId: item.categoryId,
            type: "EXPENSE",
            amount: -rawAmount,
            accountBalance: newBalance,
            title: item.title,
            note: item.note ? `${item.note} (คัดลอกจาก ${data.sourceDate})` : `คัดลอกจาก ${data.sourceDate}`,
            createdById: creatorId,
            date: targetDateObj,
          },
        });
      }

      return {
        success: true,
        message: `คัดลอกรายจ่ายจำนวน ${sourceTxs.length} รายการสำเร็จ`,
      };
    });
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการคัดลอก" };
  }
}

// 4. Update an existing transaction
export async function updateExpenseAction(data: {
  id: number;
  title: string;
  amount: number;
  categoryName: string;
  userId: number;
  organizationId: number;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.account_transaction.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("ไม่พบรายการที่ต้องการแก้ไข");

      const oldAmount = Math.abs(Number(existing.amount));
      const newAmount = Math.abs(data.amount);
      const diff = newAmount - oldAmount;

      const account = await tx.account.findUnique({ where: { id: existing.accountId } });
      if (account) {
        const newBalance =
          existing.type === "EXPENSE"
            ? account.balance - diff
            : account.balance + diff;
        await tx.account.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });
      }

      let categoryId = existing.categoryId;
      if (data.categoryName?.trim()) {
        const cleanCat = data.categoryName.trim();
        let cat = await tx.account_category.findFirst({
          where: {
            name: cleanCat,
            type: existing.type,
            organizationId: data.organizationId,
          },
        });
        if (!cat) {
          cat = await tx.account_category.create({
            data: {
              name: cleanCat,
              type: existing.type,
              status: "ACTIVE",
              organizationId: data.organizationId,
            },
          });
        }
        categoryId = cat.id;
      }

      await tx.account_transaction.update({
        where: { id: data.id },
        data: {
          title: data.title,
          amount: existing.type === "EXPENSE" ? -newAmount : newAmount,
          categoryId,
        },
      });

      revalidatePath("/expenses");
      revalidatePath("/accounting");
      revalidatePath("/settings");
      revalidatePath("/settings/accounting");

      return { success: true, message: "แก้ไขรายการสำเร็จ" };
    });
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}

// 5. Delete an existing transaction
export async function deleteExpenseAction(id: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.account_transaction.findUnique({ where: { id } });
      if (!existing) throw new Error("ไม่พบรายการที่ต้องการลบ");

      const rawAmount = Math.abs(Number(existing.amount));
      const account = await tx.account.findUnique({ where: { id: existing.accountId } });
      if (account) {
        const newBalance =
          existing.type === "EXPENSE"
            ? account.balance + rawAmount
            : account.balance - rawAmount;
        await tx.account.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });
      }

      await tx.account_transaction.delete({ where: { id } });

      revalidatePath("/expenses");
      revalidatePath("/accounting");
      revalidatePath("/settings");
      revalidatePath("/settings/accounting");

      return { success: true, message: "ลบรายการสำเร็จ" };
    });
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการลบ" };
  }
}

