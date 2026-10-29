"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AccountItem, AccountCategoryItem, AccountTransactionItem } from "@/lib/types";

export async function getValidCreatorId(
  tx: Prisma.TransactionClient,
  createdById: number | undefined | null,
  organizationId: number
): Promise<number> {
  if (createdById && createdById > 0) {
    const emp = await tx.employees.findUnique({
      where: { id: createdById },
      select: { id: true },
    });
    if (emp) return emp.id;
  }
  const firstEmp = await tx.employees.findFirst({
    where: { organizationId },
    select: { id: true },
  });
  if (firstEmp) return firstEmp.id;

  // Fallback กรณีไม่มีพนักงานในร้าน ให้หาพนักงานคนแรกในระบบ
  const anyEmp = await tx.employees.findFirst({
    select: { id: true },
  });
  return anyEmp?.id || 1;
}

// ==========================================
// 1. จัดการบัญชี (Accounts)
// ==========================================

export const createAccount = async (data: {
  accountName: string;
  initialBalance: number;
  organizationId: number;
  createdById?: number;
}) => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. สร้างบัญชีใหม่
      const newAcc = await tx.account.create({
        data: {
          accountName: data.accountName.trim(),
          status: "ACTIVE",
          balance: data.initialBalance || 0,
          organizationId: data.organizationId,
        },
      });

      // 2. ถ้ามีการใส่เงินตั้งต้น ให้บันทึก Log เป็น OVERRIDE_BALANCE ทันที
      if (data.initialBalance > 0) {
        const creatorId = await getValidCreatorId(tx, data.createdById, data.organizationId);

        await tx.account_transaction.create({
          data: {
            organizationId: data.organizationId,
            accountId: newAcc.id,
            type: "OVERRIDE_BALANCE",
            amount: data.initialBalance,
            accountBalance: data.initialBalance,
            title: "ยอดยกมาตั้งต้น",
            note: "กำหนดเงินตั้งต้นตอนสร้างบัญชี",
            createdById: creatorId,
            date: new Date(),
          },
        });
      }
    });

    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");

    return { success: true, error: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างบัญชี";
    console.error("createAccount error:", err);
    return { success: false, error: true, message };
  }
};

export const updateAccountStatus = async (id: number, status: string) => {
  try {
    await prisma.account.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");
    return { success: true, error: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, error: true, message };
  }
};

export const updateAccountName = async (id: number, name: string) => {
  try {
    await prisma.account.update({
      where: { id },
      data: { accountName: name.trim(), updatedAt: new Date() },
    });
    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");
    return { success: true, error: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, error: true, message };
  }
};

// ==========================================
// 2. จัดการเงิน: แก้ไข/เพิ่ม/ลด ยอดเงินโดยตรง (มี Log)
// ==========================================
export const adjustAccountBalance = async (
  accountId: number,
  amount: number,
  mode: "OVERRIDE" | "ADD" | "REDUCE",
  note: string,
  createdById: number,
  organizationId: number
) => {
  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error("ไม่พบข้อมูลบัญชี");

      let diffAmount = amount;
      let newBalance = account.balance;
      let txType: "OVERRIDE_BALANCE" | "ADJUSTMENT_UP" | "ADJUSTMENT_DOWN" = "OVERRIDE_BALANCE";

      if (mode === "OVERRIDE") {
        // แก้ไขยอดเงินคงเหลือสุทธิโดยตรง
        diffAmount = amount - account.balance;
        newBalance = amount;
        txType = "OVERRIDE_BALANCE";
      } else if (mode === "ADD") {
        diffAmount = amount;
        newBalance = account.balance + amount;
        txType = "ADJUSTMENT_UP";
      } else if (mode === "REDUCE") {
        if (account.balance < amount) throw new Error("ยอดเงินในบัญชีไม่เพียงพอ");
        diffAmount = amount;
        newBalance = account.balance - amount;
        txType = "ADJUSTMENT_DOWN";
      }

      // 1. อัปเดตยอดคงเหลือในบัญชี
      await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });

      const creatorId = await getValidCreatorId(tx, createdById, organizationId);

      // 2. บันทึก Transaction Log
      await tx.account_transaction.create({
        data: {
          organizationId,
          accountId,
          type: txType,
          amount: diffAmount,
          accountBalance: newBalance,
          title: mode === "OVERRIDE" ? "ปรับแก้ไขยอดเงินในบัญชี" : mode === "ADD" ? "เพิ่มเงินในบัญชี" : "ลดเงินในบัญชี",
          note: note || (mode === "OVERRIDE" ? "แก้ไขยอดเงินสุทธิ" : mode === "ADD" ? "เพิ่มเงินเข้าบัญชี" : "ลดเงินจากบัญชี"),
          createdById: creatorId,
          date: new Date(),
        },
      });
    });

    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");

    return { success: true, message: "บันทึกรายการสำเร็จ" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการทำรายการ";
    return { success: false, message };
  }
};

// ==========================================
// 3. จัดการเงิน: โอนเงินระหว่างบัญชี (มี Log คู่)
// ==========================================
export const transferMoney = async (
  fromAccountId: number,
  toAccountId: number,
  amount: number,
  note: string,
  createdById: number,
  organizationId: number
) => {
  try {
    if (fromAccountId === toAccountId) throw new Error("ไม่สามารถโอนเข้าบัญชีเดียวกันได้");
    if (amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");

    await prisma.$transaction(async (tx) => {
      const fromAcc = await tx.account.findUnique({ where: { id: fromAccountId } });
      const toAcc = await tx.account.findUnique({ where: { id: toAccountId } });

      if (!fromAcc || !toAcc) throw new Error("ไม่พบบัญชีต้นทางหรือปลายทาง");
      if (fromAcc.balance < amount) throw new Error("เงินในบัญชีต้นทางไม่เพียงพอ");

      const fromNewBalance = fromAcc.balance - amount;
      const toNewBalance = toAcc.balance + amount;

      // หักเงินต้นทาง
      await tx.account.update({ where: { id: fromAccountId }, data: { balance: fromNewBalance } });
      // เพิ่มเงินปลายทาง
      await tx.account.update({ where: { id: toAccountId }, data: { balance: toNewBalance } });

      const creatorId = await getValidCreatorId(tx, createdById, organizationId);

      // สร้าง Log ฝั่งโอนออก
      const txOut = await tx.account_transaction.create({
        data: {
          organizationId,
          accountId: fromAccountId,
          type: "TRANSFER_OUT",
          amount,
          accountBalance: fromNewBalance,
          title: `โอนเงินไป ${toAcc.accountName}`,
          note: note || "-",
          createdById: creatorId,
          date: new Date(),
        },
      });

      // สร้าง Log ฝั่งรับเข้า
      const txIn = await tx.account_transaction.create({
        data: {
          organizationId,
          accountId: toAccountId,
          type: "TRANSFER_IN",
          amount,
          accountBalance: toNewBalance,
          title: `รับเงินโอนจาก ${fromAcc.accountName}`,
          note: note || "-",
          createdById: creatorId,
          transferPairId: txOut.id,
          date: new Date(),
        },
      });

      // อัปเดตฝั่งโอนออกให้รู้จักฝั่งรับเข้า
      await tx.account_transaction.update({
        where: { id: txOut.id },
        data: { transferPairId: txIn.id },
      });
    });

    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");

    return { success: true, message: "โอนเงินสำเร็จ" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโอนเงิน";
    return { success: false, message };
  }
};

// ==========================================
// 4. จัดการหมวดหมู่ (Categories)
// ==========================================
export const createCategory = async (data: { name: string; type: string; organizationId: number }) => {
  try {
    await prisma.account_category.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        status: "ACTIVE",
        organizationId: data.organizationId,
      },
    });
    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, message };
  }
};

export const updateCategoryStatus = async (id: number, status: string) => {
  try {
    await prisma.account_category.update({ where: { id }, data: { status, updatedAt: new Date() } });
    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, message };
  }
};

export const updateCategoryName = async (id: number, name: string) => {
  try {
    await prisma.account_category.update({ where: { id }, data: { name: name.trim(), updatedAt: new Date() } });
    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, message };
  }
};

// ==========================================
// 5. ตั้งค่าบัญชีรับเงินหน้าร้าน POS
// ==========================================
export const setAccPosPayment = async (id: number, organizationId: number) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.account.updateMany({
        where: { organizationId },
        data: { accPosPayment: false },
      });

      await tx.account.update({
        where: { id },
        data: { accPosPayment: true },
      });
    });

    revalidatePath("/settings");
    revalidatePath("/settings/accounting");
    revalidatePath("/accounting");

    return { success: true, message: "เปลี่ยนช่องทางรับเงินหน้าร้านสำเร็จ" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนช่องทางรับเงิน";
    return { success: false, message };
  }
};


// Get all setting data for Accounting Setting page / component
export async function getAccountingSettingDataAction(organizationId: number) {
  try {
    const [accounts, categories, txLogs] = await Promise.all([
      prisma.account.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.account_category.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.account_transaction.findMany({
        where: {
          organizationId,
          type: {
            in: [
              "ADJUSTMENT_UP",
              "ADJUSTMENT_DOWN",
              "OVERRIDE_BALANCE",
              "TRANSFER_IN",
              "TRANSFER_OUT",
            ],
          },
        },
        include: {
          account: { select: { accountName: true } },
          category: { select: { name: true } },
          creator: { select: { name: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 100,
      }),
    ]);
    return {
      success: true,
      data: {
        accounts: accounts as unknown as AccountItem[],
        categories: categories as unknown as AccountCategoryItem[],
        txLogs: txLogs as unknown as AccountTransactionItem[],
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || 'เกิดข้อผิดพลาด' };
  }
}
