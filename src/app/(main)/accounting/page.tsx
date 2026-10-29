import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AccountingHubView from "@/components/accounting/AccountingHubView";
import { getAccountingReportData } from "@/lib/actions/actionAccountingReport";
import {
  AccountItem,
  AccountTransactionItem,
  Member,
  MemberTransaction,
  AccountingTabKey,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function AccountingPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = Number(
    (session?.user as { orgId?: number })?.orgId || session?.user?.id || 1
  );

  const resolvedParams = searchParams ? await searchParams : {};
  const defaultTab = (resolvedParams.tab as AccountingTabKey) || "member_payment";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatDate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
  };

  const initialStartDate = formatDate(startOfMonth);
  const initialEndDate = formatDate(now);

  const [membersRaw, accountsRaw, txLogsRaw, reportDataRes] =
    await Promise.all([
      prisma.member.findMany({
        where: { organizationId, status: "ACTIVE" },
        include: {
          transactions: {
            where: {
              walletType: "CREDIT",
              type: { in: ["SPEND", "TOPUP"] },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { firstName: "asc" },
      }),

      prisma.account.findMany({
        where: { organizationId, status: "ACTIVE" },
        orderBy: { accountName: "asc" },
      }),

      prisma.account_transaction.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(`${initialStartDate}T00:00:00.000Z`),
            lte: new Date(`${initialEndDate}T23:59:59.999Z`),
          },
        },
        include: {
          account: { select: { accountName: true } },
          category: { select: { name: true } },
          creator: { select: { name: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),

      getAccountingReportData({
        startDate: initialStartDate,
        endDate: initialEndDate,
        organizationId,
      }),
    ]);

  const initialMembers = membersRaw as unknown as (Member & {
    transactions?: MemberTransaction[];
  })[];
  const accounts = accountsRaw as unknown as AccountItem[];
  const txLogs = txLogsRaw as unknown as AccountTransactionItem[];
  const reportData = reportDataRes.success && reportDataRes.data ? reportDataRes.data : null;

  return (
    <AccountingHubView
      initialMembers={initialMembers}
      accounts={accounts}
      txLogs={txLogs}
      reportData={reportData}
      userId={userId}
      organizationId={organizationId}
      initialStartDate={initialStartDate}
      initialEndDate={initialEndDate}
      defaultTab={defaultTab}
    />
  );
}
