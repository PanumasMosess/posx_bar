import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SettingAccountingPage from "@/components/settings/accounting/SettingAccountingPage";
import { redirect } from "next/navigation";
import {
  AccountItem,
  AccountCategoryItem,
  AccountTransactionItem,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface SessionUserWithOrg {
  id?: string;
  orgId?: number;
}

export default async function SettingAccountingRoutePage() {
  const session = await auth();
  const user = session?.user as SessionUserWithOrg | undefined;
  const organizationId = Number(user?.orgId || user?.id || 0);

  if (!organizationId) {
    redirect("/");
  }

  const userId = session?.user?.id ? parseInt(session.user.id) : 0;

  const [accountsData, categoriesData, txLogData] = await Promise.all([
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
        creator: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return (
    <SettingAccountingPage
      accounts={accountsData as unknown as AccountItem[]}
      categories={categoriesData as unknown as AccountCategoryItem[]}
      txLogs={txLogData as unknown as AccountTransactionItem[]}
      userId={userId}
      organizationId={organizationId}
    />
  );
}

