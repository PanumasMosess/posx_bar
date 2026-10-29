import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProfitLossPage from "@/components/accounting/ProfitLossPage";
import { AccountItem, AccountTransactionItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const organizationId = Number(
    (session?.user as { orgId?: number })?.orgId || session?.user?.id || 1
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatDate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
  };

  const initialStartDate = formatDate(startOfMonth);
  const initialEndDate = formatDate(now);
  const start = new Date(`${initialStartDate}T00:00:00+07:00`);
  const end = new Date(`${initialEndDate}T23:59:59+07:00`);

  const [accountsRaw, defaultTxLogsRaw] = await Promise.all([
    prisma.account.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account_transaction.findMany({
      where: {
        organizationId,
        type: { in: ["SALES", "INCOME", "AR_PAYMENT", "EXPENSE"] },
        OR: [
          { date: { gte: start, lte: end } },
          { date: null, createdAt: { gte: start, lte: end } },
        ],
      },
      include: {
        account: { select: { accountName: true } },
        category: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const accounts = accountsRaw as unknown as AccountItem[];
  const defaultTxLogs = defaultTxLogsRaw as unknown as AccountTransactionItem[];

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-6">
      <ProfitLossPage
        accounts={accounts}
        defaultTxLogs={defaultTxLogs}
        organizationId={organizationId}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
      />
    </div>
  );
}

