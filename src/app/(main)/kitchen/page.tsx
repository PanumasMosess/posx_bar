import KitchenView from "@/components/kitchen/KitchenView";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth"; 
import { redirect } from "next/navigation"; 

export default async function KitchenHomePage() {
  // 🌟 2. ดึงข้อมูล Session และ orgId
  const session = await auth();
  const userAny = session?.user as any;
  const orgId = Number(userAny?.orgId);

  // 🌟 3. ตรวจสอบ orgId ถ้าไม่มีให้เด้งกลับหน้า Login
  if (!orgId || isNaN(orgId)) {
    redirect("/");
  }

  const activeKitchenOrders = await prisma.orders.findMany({
    where: {
      organizationId: orgId, 
      items: {
        some: {
          status: "IN_KITCHEN",
        },
      },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      orderType: true,
      kitchenStatus: true,
      totalAmount: true,
      discount: true,
      netAmount: true,
      customerName: true,
      customerPhone: true,
      createdAt: true,
      qrcode: {
        select: { id: true, tableName: true },
      },
      items: {
        where: {
          status: "IN_KITCHEN",
        },
        select: {
          id: true,
          quantity: true,
          priceAtTime: true,
          options: true,
          status: true,
          product: {
            select: { id: true, name: true, price: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return <KitchenView activeKitchenOrders={activeKitchenOrders} />;
}