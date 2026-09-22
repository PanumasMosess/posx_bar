import prisma from "@/lib/prisma";
import POSView from "@/components/pos/POSView";

export default async function POSHomePage() {
  const [categories, products] = await Promise.all([
    prisma.categories.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    }),
    prisma.products.findMany({
      where: { isActive: true },
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
