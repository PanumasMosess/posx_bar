"use server";

import prisma from "@/lib/prisma";
import { getValidCreatorId } from "@/lib/actions/actionAccounting";

export async function executeMemberPayment(data: {
  memberId: number;
  companyAccountId: number;
  paymentType: "CLEAR_DEBT" | "TOPUP_CREDIT";
  amount: number;
  note: string;
  userId: number;
  organizationId: number;
  clearingTransactionIds?: number[];
  paymentDate?: string;
}) {
  try {
    if (data.amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");
    const targetDate = data.paymentDate
      ? new Date(`${data.paymentDate}T12:00:00Z`)
      : new Date();

    return await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: data.memberId } });
      if (!member) throw new Error("ไม่พบข้อมูลสมาชิกในระบบ");

      const shopAccount = await tx.account.findUnique({ where: { id: data.companyAccountId } });
      if (!shopAccount) throw new Error("ไม่พบข้อมูลบัญชีรับเงินของร้าน");

      const creatorId = await getValidCreatorId(tx, data.userId, data.organizationId);

      const paymentGroupId = `PAY-${Date.now()}`;
      let remainingMoney = data.amount;
      let currentCreditBalance = member.creditBalance;
      const memberTransactionsToInsert: {
        organizationId: number;
        type: "TOPUP";
        walletType: "CREDIT";
        amount: number;
        balanceAfter: number;
        note: string;
        memberId: number;
        createdById: number | null;
        referenceTxId: number | null;
        paymentGroupId: string;
        date: Date;
      }[] = [];

      if (data.clearingTransactionIds && data.clearingTransactionIds.length > 0) {
        const bills = await tx.membertransaction.findMany({
          where: { id: { in: data.clearingTransactionIds }, type: "SPEND" },
          orderBy: { createdAt: "asc" },
        });

        const pastPayments = await tx.membertransaction.findMany({
          where: { referenceTxId: { in: data.clearingTransactionIds }, type: "TOPUP" },
        });

        for (const bill of bills) {
          if (remainingMoney <= 0) break;

          const paidAlready = pastPayments
            .filter((p) => p.referenceTxId === bill.id)
            .reduce((sum, p) => sum + p.amount, 0);

          const remainingDebt = Math.abs(bill.amount) - paidAlready;

          if (remainingDebt > 0) {
            const payAmount = Math.min(remainingMoney, remainingDebt);
            currentCreditBalance += payAmount;

            memberTransactionsToInsert.push({
              organizationId: data.organizationId,
              type: "TOPUP",
              walletType: "CREDIT",
              amount: payAmount,
              balanceAfter: currentCreditBalance,
              note: data.note || `ชำระหนี้บิล #${bill.orderId || bill.id}`,
              memberId: data.memberId,
              createdById: creatorId,
              referenceTxId: bill.id,
              paymentGroupId: paymentGroupId,
              date: targetDate,
            });

            remainingMoney -= payAmount;
          }
        }
      }

      if (remainingMoney > 0) {
        currentCreditBalance += remainingMoney;
        memberTransactionsToInsert.push({
          organizationId: data.organizationId,
          type: "TOPUP",
          walletType: "CREDIT",
          amount: remainingMoney,
          balanceAfter: currentCreditBalance,
          note:
            data.note ||
            (data.paymentType === "CLEAR_DEBT"
              ? "ชำระหนี้ค้างส่ง"
              : "เติมเงินเครดิตล่วงหน้า"),
          memberId: data.memberId,
          createdById: creatorId,
          referenceTxId: null,
          paymentGroupId: paymentGroupId,
          date: targetDate,
        });
      }

      const oldMemberCredit = member.creditBalance;
      const newMemberCredit = oldMemberCredit + data.amount;
      await tx.member.update({
        where: { id: data.memberId },
        data: { creditBalance: newMemberCredit },
      });

      await tx.membertransaction.createMany({
        data: memberTransactionsToInsert,
      });

      const oldShopBalance = shopAccount.balance;
      const newShopBalance = oldShopBalance + data.amount;

      await tx.account.update({
        where: { id: data.companyAccountId },
        data: { balance: newShopBalance },
      });

      await tx.account_transaction.create({
        data: {
          organizationId: data.organizationId,
          accountId: data.companyAccountId,
          type: "AR_PAYMENT",
          amount: data.amount,
          accountBalance: newShopBalance,
          title: `รับชำระเงินสมาชิก (${member.firstName} ${member.lastName || ""})`,
          note: data.note || "-",
          createdById: creatorId,
          date: targetDate,
        },
      });

      return { success: true, message: "บันทึกรายการรับชำระเงินเรียบร้อยแล้ว" };
    });
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    };
  }
}

