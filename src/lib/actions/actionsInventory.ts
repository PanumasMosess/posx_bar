"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleTrackStockDB(
  productId: number,
  currentStatus: boolean,
) {
  try {
    await prisma.products.update({
      where: { id: productId },
      data: { isTrackStock: !currentStatus },
    });
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Toggle Stock Error:", error);
    return { success: false, message: error.message };
  }
}

export async function adjustStockDB({
  productId,
  organizationId,
  quantity,
  type,
  note,
  createdBy = "System",
}: {
  productId: number;
  organizationId: number;
  quantity: number;
  type: "IN" | "OUT" | "ADJUST";
  note: string;
  createdBy?: string;
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.products.findUnique({
        where: { id: productId },
      });
      if (!product) throw new Error("ไม่พบสินค้า");

      const currentStock = product.stock || 0;
      // ถ้ารับเข้า (IN) ให้บวกเพิ่ม, ถ้าจ่ายออก (OUT/ADJUST) ให้ลบออก
      const qtyToUpdate = type === "IN" ? quantity : -quantity;
      const newStock = currentStock + qtyToUpdate;

      // อัปเดตตารางสินค้า
      const updatedProduct = await tx.products.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      // บันทึกประวัติ
      await tx.stockMovement.create({
        data: {
          productId,
          organizationId,
          type,
          quantity: qtyToUpdate,
          balanceBefore: currentStock,
          balanceAfter: newStock,
          note,
          createdBy,
        },
      });

      return updatedProduct;
    });

    revalidatePath("/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Adjust Stock Error:", error);
    return { success: false, message: error.message };
  }
}
