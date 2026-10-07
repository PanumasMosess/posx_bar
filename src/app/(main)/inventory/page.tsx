import InventoryClient from "@/components/inventory/InventoryClient";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "คลังสินค้า | ระบบ POS",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const orgId = resolvedParams.orgId ? Number(resolvedParams.orgId) : 1;

  const [products, stockMovements] = await Promise.all([
    prisma.products.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        image: true,
        stock: true,
        isTrackStock: true,
        isActive: true,
        organizationId: true,
        cost: true,
        price: true,
      },
    }),

    // 2. ดึงประวัติความเคลื่อนไหวสต๊อก
    prisma.stockMovement.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { name: true, code: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <InventoryClient products={products} movements={stockMovements} />
    </main>
  );
}
