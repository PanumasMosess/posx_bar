

import { auth } from "@/lib/auth";
import ReportsPage from "@/components/reports/ReportsPage";

export const metadata = {
  title: "Report | POS System",
};

export default async function Report() {
  const session = await auth();
  const userAny = session?.user as any;
  const orgId = Number(userAny?.orgId);

  return <ReportsPage />;
}



