"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getFilteredTransactions(filters: {
  accountId?: string;
  types?: string[];
  startDate?: string;
  endDate?: string;
  organizationId: number;
}) {
  try {
    const whereClause: Prisma.account_transactionWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.accountId && filters.accountId !== "all") {
      whereClause.accountId = parseInt(filters.accountId);
    }

    if (filters.types && filters.types.length > 0) {
      whereClause.type = { in: filters.types as Prisma.Enumaccount_tx_typeFilter["in"] };
    }

    if (filters.startDate || filters.endDate) {
      const dateGte = filters.startDate
        ? new Date(`${filters.startDate}T00:00:00+07:00`)
        : undefined;
      const dateLte = filters.endDate
        ? new Date(`${filters.endDate}T23:59:59+07:00`)
        : undefined;

      whereClause.OR = [
        {
          date: {
            gte: dateGte,
            lte: dateLte,
          },
        },
        {
          date: null,
          createdAt: {
            gte: dateGte,
            lte: dateLte,
          },
        },
      ];
    }

    const txLogs = await prisma.account_transaction.findMany({
      where: whereClause,
      include: {
        account: { select: { accountName: true } },
        category: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: txLogs };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "เกิดข้อผิดพลาด", data: [] };
  }
}

