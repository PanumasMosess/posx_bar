import { auth } from "@/lib/auth";
import AccountingReportPage from "@/components/accounting/AccountingReportPage";
import { getAccountingReportData } from "@/lib/actions/actionAccountingReport";

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

  const initialDataRes = await getAccountingReportData({
    startDate: initialStartDate,
    endDate: initialEndDate,
    organizationId,
  });

  const initialData = initialDataRes.success && initialDataRes.data ? initialDataRes.data : null;

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-6">
      <AccountingReportPage
        organizationId={organizationId}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialData={initialData}
      />
    </div>
  );
}

