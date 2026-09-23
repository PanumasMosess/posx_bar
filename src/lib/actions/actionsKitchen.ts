"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateKitchenItemStatusDB(
  itemId: number,
  status: "SERVED" | "COMPLETED",
) {
  try {
    const item = await prisma.orderitems.update({
      where: { id: itemId },
      data: { status },
      include: { order: true },
    });

    // ตรวจสอบว่าเมนูทั้งหมดในบิลนี้เสิร์ฟหมดหรือยัง
    const remainingItems = await prisma.orderitems.count({
      where: {
        orderId: item.orderId,
        status: "IN_KITCHEN",
      },
    });

    // ถ้าไม่มีรายการเหลือในครัวแล้ว ให้อัปเดตสถานะบิลหลักด้วย
    if (remainingItems === 0) {
      await prisma.orders.update({
        where: { id: item.orderId },
        data: { kitchenStatus: "SERVED" },
      });
    }

    revalidatePath("/kitchen");
    return { success: true };
  } catch (error: any) {
    console.error("Update Kitchen Item Error:", error);
    return { success: false, message: error.message };
  }
}

// อัปเดตสถานะเสิร์ฟยกบิล
export async function markAllItemsServedDB(orderId: number) {
  try {
    await prisma.$transaction([
      prisma.orderitems.updateMany({
        where: { orderId, status: "IN_KITCHEN" },
        data: { status: "SERVED" },
      }),
      prisma.orders.update({
        where: { id: orderId },
        data: { kitchenStatus: "SERVED" },
      }),
    ]);

    revalidatePath("/kitchen");
    return { success: true };
  } catch (error: any) {
    console.error("Mark All Served Error:", error);
    return { success: false, message: error.message };
  }
}
