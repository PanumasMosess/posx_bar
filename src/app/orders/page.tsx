import POSQR from "@/components/pos/by_tables/POSQR";
import prisma from "@/lib/prisma";


export default async function QROrderingPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; tableId?: string }>;
}) {
  const resolvedParams = await searchParams;

  const orgId = resolvedParams.orgId ? Number(resolvedParams.orgId) : 1;
  const tableId = resolvedParams.tableId
    ? Number(resolvedParams.tableId)
    : undefined;

  if (!orgId || isNaN(orgId)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold p-4 text-center">
        QR Code ไม่ถูกต้อง หรือไม่พบข้อมูลร้านค้า
      </div>
    );
  }

  // 🌟 ดึงข้อมูล โต๊ะ จาก model qrcodes
  let tableName = undefined;
  if (tableId) {
    const tableInfo = await prisma.qrcodes.findFirst({
      where: {
        id: tableId,
        organizationId: orgId, // เช็กให้ชัวร์ว่าเป็นโต๊ะของร้านนี้จริงๆ
        isActive: true,
      },
      select: { tableName: true },
    });
    if (tableInfo) {
      tableName = tableInfo.tableName;
    }
  }

  const [categories, products] = await Promise.all([
    prisma.categories.findMany({
      where: { isActive: true, organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    }),
    prisma.products.findMany({
      where: { isActive: true, organizationId: orgId },
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
        category: { select: { name: true, id: true } },
        optionGroups: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isRequired: true,
            allowMultiple: true,
            choices: {
              where: { isActive: true },
              select: { id: true, name: true, priceAdd: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <POSQR
      categories={categories}
      products={products}
      orgId={orgId}
      tableId={tableId}
      tableName={tableName} // 🌟 ส่งชื่อโต๊ะจริงๆ ไปให้ UI
    />
  );
}
