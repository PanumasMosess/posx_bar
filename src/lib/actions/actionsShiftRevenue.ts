"use server";

import prisma from "@/lib/prisma";

export async function getShiftSalesSummaryDB(shiftId: number) {
  try {
    if (!shiftId) {
      throw new Error("ไม่พบข้อมูล Shift ID ที่ส่งมา");
    }

    const payments = await prisma.payments.findMany({
      where: {
        shiftId: Number(shiftId),
        isCompleted: true,
      },
      select: {
        method: true,
        amount: true,
        isCompleted: true,
      },
    });

    const summary = {
      cashSales: 0,
      qrSales: 0,
      cardSales: 0,
      memberSales: 0,
      totalRevenue: 0,
    };

    payments.forEach((payment) => {
      if (payment.isCompleted === true) {
        const amount = payment.amount || 0;
        summary.totalRevenue += amount;

        switch (payment.method) {
          case "CASH":
            summary.cashSales += amount;
            break;
          case "QR":
            summary.qrSales += amount;
            break;
          case "CARD":
            summary.cardSales += amount;
            break;
          case "MEMBER":
            summary.memberSales += amount;
            break;
        }
      }
    });

    return { success: true, data: summary };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
