import KitchenView from "@/components/kitchen/KitchenView";
import prisma from "@/lib/prisma";


export default async function KitchenHomePage() {
  const activeKitchenOrders = await prisma.orders.findMany({
    where: {
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
