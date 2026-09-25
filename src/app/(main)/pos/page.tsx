import prisma from "@/lib/prisma";
import POSView from "@/components/pos/POSView";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function POSHomePage() {

  const session = await auth();
  const userAny = session?.user as any;
  const orgId = Number(userAny?.orgId);

  if (!orgId || isNaN(orgId)) {
    redirect("/");
  }

  const [categories, products] = await Promise.all([
    prisma.categories.findMany({
      where: {
        isActive: true,
        organizationId: orgId, // 👈 กรองเฉพาะหมวดหมู่ของร้านค้านี้
      },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    }),
    prisma.products.findMany({
      where: {
        isActive: true,
        organizationId: orgId, // 👈 กรองเฉพาะสินค้าของร้านค้านี้
      },
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        cost: true,
        stock: true,
        barcode: true,
        detail: true,
        image: true,
        categoryId: true,
        category: {
          select: { name: true, id: true },
        },
        optionGroups: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isRequired: true,
            allowMultiple: true,
            choices: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                priceAdd: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <POSView categories={categories} products={products} />;
}
