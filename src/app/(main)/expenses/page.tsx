import { auth } from "@/lib/auth";
import ExpenseCalendarPage from "@/components/accounting/ExpenseCalendarPage";
import { getCalendarExpensesAction } from "@/lib/actions/actionAccountingRecord";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = Number(
    (session?.user as { orgId?: number })?.orgId || session?.user?.id || 1
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const res = await getCalendarExpensesAction(currentYear, currentMonth, organizationId);
  const initialData = res.success && res.data ? res.data : null;

  return (
    <div className="w-full h-full">
      <ExpenseCalendarPage
        organizationId={organizationId}
        userId={userId}
        initialData={initialData}
      />
    </div>
  );
}

