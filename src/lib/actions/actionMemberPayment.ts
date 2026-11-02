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
        type: "REFUND";
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

      if (data.paymentType === "CLEAR_DEBT") {
        // หาบิลที่ต้องตัดหนี้
        let billsToProcess = [];
        if (data.clearingTransactionIds && data.clearingTransactionIds.length > 0) {
          billsToProcess = await tx.membertransaction.findMany({
            where: { id: { in: data.clearingTransactionIds }, type: "SPEND" },
            orderBy: { createdAt: "asc" },
          });
        } else {
          // ตัดยอดอัตโนมัติ (FIFO): ดึงบิล SPEND ทั้งหมดของสมาชิกเรียงตาม createdAt: "asc" (เก่าสุดก่อน)
          billsToProcess = await tx.membertransaction.findMany({
            where: { memberId: data.memberId, walletType: "CREDIT", type: "SPEND" },
            orderBy: { createdAt: "asc" },
          });
        }

        // หาประวัติ REFUND ทั้งหมดของสมาชิกนี้เพื่อคำนวณยอดค้างของแต่ละบิล
        const allMemberRefunds = await tx.membertransaction.findMany({
          where: { memberId: data.memberId, walletType: "CREDIT", type: "REFUND" },
          orderBy: { createdAt: "asc" },
        });

        const allMemberSpends = await tx.membertransaction.findMany({
          where: { memberId: data.memberId, walletType: "CREDIT", type: "SPEND" },
          orderBy: { createdAt: "asc" },
        });

        // 1. คำนวณยอดที่แต่ละบิลจ่ายไปแล้วจาก REFUND ที่ระบุ referenceTxId
        const paidMap = new Map<number, number>();
        allMemberSpends.forEach((b) => paidMap.set(b.id, 0));

        let unreferencedPool = 0;
        for (const ref of allMemberRefunds) {
          if (ref.referenceTxId && paidMap.has(ref.referenceTxId)) {
            paidMap.set(ref.referenceTxId, (paidMap.get(ref.referenceTxId) || 0) + ref.amount);
          } else {
            unreferencedPool += ref.amount;
          }
        }

        // 2. กระจายยอด unreferenced pool ให้บิลเก่าสุดก่อน (FIFO)
        for (const bill of allMemberSpends) {
          if (unreferencedPool <= 0) break;
          const billAmount = Math.abs(bill.amount);
          const currentPaid = paidMap.get(bill.id) || 0;
          const remainingOnBill = billAmount - currentPaid;
          if (remainingOnBill > 0) {
            const allocate = Math.min(unreferencedPool, remainingOnBill);
            paidMap.set(bill.id, currentPaid + allocate);
            unreferencedPool -= allocate;
          }
        }

        // 3. นำเงินที่ชำระรอบนี้ไปตัดยอดบิล
        for (const bill of billsToProcess) {
          if (remainingMoney <= 0) break;
          const billAmount = Math.abs(bill.amount);
          const paidAlready = paidMap.get(bill.id) || 0;
          const remainingDebt = billAmount - paidAlready;

          if (remainingDebt > 0) {
            const payAmount = Math.min(remainingMoney, remainingDebt);
            currentCreditBalance += payAmount;

            memberTransactionsToInsert.push({
              organizationId: data.organizationId,
              type: "REFUND",
              walletType: "CREDIT",
              amount: payAmount,
              balanceAfter: currentCreditBalance,
              note: data.note || `รับชำระบิลค้าง #${bill.orderId || bill.id}`,
              memberId: data.memberId,
              createdById: creatorId,
              referenceTxId: bill.id,
              paymentGroupId: paymentGroupId,
              date: targetDate,
            });

            paidMap.set(bill.id, paidAlready + payAmount);
            remainingMoney -= payAmount;
          }
        }
      }

      if (remainingMoney > 0) {
        currentCreditBalance += remainingMoney;
        memberTransactionsToInsert.push({
          organizationId: data.organizationId,
          type: "REFUND",
          walletType: "CREDIT",
          amount: remainingMoney,
          balanceAfter: currentCreditBalance,
          note:
            data.note ||
            (data.paymentType === "CLEAR_DEBT"
              ? "ชำระหนี้ค้างส่ง (เงินจ่ายล่วงหน้า/เกิน)"
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

      const updatedMember = await tx.member.findUnique({
        where: { id: data.memberId },
        include: {
          transactions: {
            where: {
              walletType: "CREDIT",
              type: { in: ["SPEND", "TOPUP", "REFUND"] },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return {
        success: true as const,
        message: "บันทึกรายการรับชำระเงินเรียบร้อยแล้ว",
        updatedMember,
      };
    });
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false as const,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    };
  }
}

