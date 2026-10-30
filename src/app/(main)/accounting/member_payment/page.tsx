import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MemberPaymentPage from "@/components/accounting/MemberPaymentPage";
import { AccountItem, Member, MemberTransaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = Number(
    (session?.user as { orgId?: number })?.orgId || session?.user?.id || 1
  );

  const [membersRaw, shopAccountsRaw] = await Promise.all([
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
  ]);

  const members = membersRaw as unknown as (Member & {
    transactions?: MemberTransaction[];
  })[];
  const shopAccounts = shopAccountsRaw as unknown as AccountItem[];

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <MemberPaymentPage
        initialMembers={members}
        shopAccounts={shopAccounts}
        userId={userId}
        organizationId={organizationId}
      />
    </div>
  );
}

