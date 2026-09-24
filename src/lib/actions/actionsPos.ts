"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  deleteFileS3,
  getS3KeyFromUrl,
  sendbase64toS3DataMultifile,
} from "@/lib/actions";
import { ProcessPaymentPayload } from "../interface";

export const addProductToDB = async (data: any) => {
  try {
    let finalImageUrl = data.image || null;

    if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
      const matches = finalImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];

        const uploadResult = await sendbase64toS3DataMultifile(
          base64Data,
          "products",
          contentType,
        );

        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
        } else {
          console.error("S3 Upload Failed");
          return { success: false, error: "อัปโหลดรูปภาพไม่สำเร็จ" };
        }
      }
    }

    await prisma.products.create({
      data: {
        code: data.code || null,
        name: data.name,
        price: Number(data.price),
        cost: Number(data.cost) || 0,
        stock: Number(data.stock) || 0,
        image: finalImageUrl,
        detail: data.detail || null,
        barcode: data.barcode || null,

        categoryId: data.categoryId ? Number(data.categoryId) : null,
        organizationId: 1,
        isActive: true,

        optionGroups: {
          create:
            data.optionGroups?.map((group: any) => ({
              name: group.name,
              isRequired: group.isRequired,
              allowMultiple: group.allowMultiple,
              isActive: true,
              choices: {
                create: group.choices.map((choice: any) => ({
                  name: choice.name,
                  priceAdd: Number(choice.priceAdd) || 0,
                  isActive: true,
                })),
              },
            })) || [],
        },
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add product:", error);
    return { success: false, error: "เพิ่มสินค้าไม่สำเร็จ" };
  }
};

export const addCategoryToDB = async (data: { name: string }) => {
  try {
    const newCat = await prisma.categories.create({
      data: {
        name: data.name,
        organizationId: 1,
        isActive: true,
      },
    });
    revalidatePath("/");
    return { success: true, id: newCat.id };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

export const updateProductToDB = async (payload: any) => {
  try {
    const existingProduct = await prisma.products.findUnique({
      where: { id: payload.id },
      select: { image: true },
    });

    if (!existingProduct) {
      return { success: false, message: "ไม่พบสินค้าในระบบ" };
    }

    let finalImageUrl = existingProduct.image;
    const isNewImage = payload.image && payload.image.startsWith("data:image");
    const isImageRemoved = payload.image === "";

    if (isNewImage || isImageRemoved) {
      if (existingProduct.image) {
        const oldKey = await getS3KeyFromUrl(existingProduct.image);
        if (oldKey) {
          const cleanKey = oldKey.replace(`${process.env.S3_BUCKET}/`, "");
          await deleteFileS3(cleanKey);
        }
      }

      if (isNewImage) {
        const matches = payload.image.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/,
        );
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];

          const uploadResult = await sendbase64toS3DataMultifile(
            base64Data,
            "products",
            contentType,
          );

          if (uploadResult.success && uploadResult.url) {
            finalImageUrl = uploadResult.url;
          } else {
            return {
              success: false,
              message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
            };
          }
        }
      } else if (isImageRemoved) {
        finalImageUrl = null;
      }
    }

    const updatedProduct = await prisma.products.update({
      where: { id: payload.id },
      data: {
        code: payload.code || null,
        name: payload.name,
        price: Number(payload.price),
        cost: Number(payload.cost || 0),
        stock: Number(payload.stock || 0),
        barcode: payload.barcode || null,
        detail: payload.detail || null,
        categoryId: payload.categoryId ? Number(payload.categoryId) : null,
        image: finalImageUrl,

        optionGroups: {
          deleteMany: {},
          create: payload.optionGroups.map((group: any) => ({
            name: group.name,
            isRequired: group.isRequired,
            allowMultiple: group.allowMultiple,
            choices: {
              create: group.choices.map((choice: any) => ({
                name: choice.name,
                priceAdd: Number(choice.priceAdd || 0),
              })),
            },
          })),
        },
      },
    });
    revalidatePath("/pos");
    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error("Update Product Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
  }
};

export const deleteProductFromDB = async (id: number) => {
  try {
    await prisma.products.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    console.error("Delete Product Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบสินค้า" };
  }
};

export async function getTablesFromDB(organizationId: number) {
  try {
    const tables = await prisma.qrcodes.findMany({
      where: { organizationId, isActive: true },
      orderBy: { tableName: "asc" },
    });
    return { success: true, data: tables };
  } catch (error) {
    console.error("Get Tables Error:", error);
    return { success: false, data: [] };
  }
}

export async function holdOrderToDB(payload: {
  orderId?: number | null;
  organizationId: number;
  items: Array<{
    productId: number;
    quantity: number;
    priceAtTime: number;
    options?: string;
    status?: string; // 🌟 รับสถานะเฉพาะรายการอาหารเข้ามา
  }>;
  totalAmount: number;
  netAmount: number;
  customerName?: string;
  qrCodeId?: number | null;
  kitchenStatus?: "SERVED" | "IN_KITCHEN" | "NOT_REQUIRED";
}) {
  try {
    const kStatus = payload.kitchenStatus || "SERVED";

    // 🌟 หากเป็นการอัปเดตบิลเดิมที่ดึงคืนมา
    if (payload.orderId) {
      await prisma.orderitems.deleteMany({
        where: { orderId: payload.orderId },
      });

      const updatedOrder = await prisma.orders.update({
        where: { id: payload.orderId },
        data: {
          status: "HOLD",
          totalAmount: payload.totalAmount,
          netAmount: payload.netAmount,
          customerName: payload.customerName,
          qrCodeId: payload.qrCodeId,
          kitchenStatus: kStatus,
          createdBy: "0",
          updatedAt: new Date(),
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime,
              options: item.options || "",
              status: (item.status as any) || kStatus,
            })),
          },
        },
      });
      return { success: true, order: updatedOrder };
    }

    // กรณีเป็นบิลใหม่
    const orderNumber = `ORDER-${Date.now().toString().slice(-6)}`;
    const newOrder = await prisma.orders.create({
      data: {
        orderNumber,
        status: "HOLD",
        orderType: "DINE_IN",
        kitchenStatus: kStatus,
        totalAmount: payload.totalAmount,
        netAmount: payload.netAmount,
        customerName: payload.customerName || "บิลพักชั่วคราว",
        organizationId: payload.organizationId,
        createdBy: "0",
        qrCodeId: payload.qrCodeId,
        items: {
          create: payload.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
            options: item.options || "",
            status: (item.status as any) || kStatus,
          })),
        },
      },
    });
    return { success: true, order: newOrder };
  } catch (error) {
    console.error("Hold Order Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการพักบิล" };
  }
}

export async function getHeldOrdersFromDB(organizationId: number) {
  try {
    const heldOrders = await prisma.orders.findMany({
      where: {
        organizationId,
        status: "HOLD",
      },
      include: {
        qrcode: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: heldOrders };
  } catch (error) {
    console.error("Get Held Orders Error:", error);
    return { success: false, data: [] };
  }
}

export async function deleteHeldOrderFromDB(orderId: number) {
  try {
    await prisma.orders.delete({
      where: { id: orderId },
    });

    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    console.error("Delete Held Order Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบบิล" };
  }
}

export async function createTableInDB(
  organizationId: number,
  tableName: string,
) {
  try {
    const generateToken = () =>
      Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const newTable = await prisma.qrcodes.create({
      data: {
        tableName: tableName,
        token: generateToken(),
        organizationId: organizationId,
        isActive: true,
      },
    });

    return { success: true, data: newTable };
  } catch (error) {
    console.error("Create Table Error:", error);
    return { success: false, message: "ไม่สามารถสร้างโต๊ะได้" };
  }
}

export async function processPaymentDB(payload: ProcessPaymentPayload) {
  try {
    let paymentMethodString: "CASH" | "QR" | "CARD" | "MEMBER" = "CASH";

    if (payload.method === "CASH") {
      paymentMethodString = "CASH";
    } else if (payload.method === "QR") {
      paymentMethodString = "QR";
    } else if (payload.method === "CARD") {
      paymentMethodString = "CARD";
    } else if (payload.method === "MEMBER") {
      paymentMethodString = "MEMBER";
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payments.create({
        data: {
          amount: payload.amount,
          receivedAmount: payload.receivedAmount || payload.amount,
          changeAmount: payload.changeAmount || 0,
          method: paymentMethodString as any,
          referenceNo: payload.referenceNo || null,
          isCompleted: true,
          orderId: payload.orderId,
          organizationId: payload.organizationId,
          shiftId: payload.shiftId || null,
          createdBy: payload.createdBy || "cashier",
        },
      });

      // 2. อัปเดตสถานะบิลหลักเป็น COMPLETED
      const updatedOrder = await tx.orders.update({
        where: { id: payload.orderId },
        data: {
          status: "COMPLETED" as any,
        },
      });

      // 3. อัปเดตสถานะรายการสินค้าย่อยใน orderitems เป็น COMPLETED
      await tx.orderitems.updateMany({
        where: { orderId: payload.orderId },
        data: {
          status: "COMPLETED" as any,
        },
      });

      return { payment, updatedOrder };
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Payment error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการชำระเงิน",
    };
  }
}

export async function getActiveShiftDB(organizationId: number) {
  try {
    const activeShift = await prisma.shifts.findFirst({
      where: {
        organizationId,
        status: "OPEN",
      },
      include: {
        payments: true,
      },
    });

    if (!activeShift) {
      return { success: true, shift: null };
    }

    return { success: true, shift: activeShift };
  } catch (error: any) {
    console.error("Get Active Shift Error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลกะปัจจุบัน",
      shift: null,
    };
  }
}

export async function openShiftDB(data: {
  startingCash: number;
  openedBy: string;
  organizationId: number;
}) {
  try {
    // เช็กว่ามีกะที่กำลังเปิดค้างไว้อยู่แล้วหรือไม่
    const existingOpenShift = await prisma.shifts.findFirst({
      where: {
        organizationId: data.organizationId,
        status: "OPEN",
      },
    });

    if (existingOpenShift) {
      return {
        success: false,
        message: `มีกะหมายเลข ${existingOpenShift.shiftNumber} เปิดค้างไว้อยู่แล้ว`,
        shift: existingOpenShift,
      };
    }

    // สร้างรหัสกะอัตโนมัติ สไตล์ SHIFT-YYYYMMDD-001
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    // นับจำนวนกะที่เกิดขึ้นในวันนี้เพื่อรันเลขลำดับ
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const countToday = await prisma.shifts.count({
      where: {
        organizationId: data.organizationId,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    const shiftNumber = `SHIFT-${datePrefix}-${String(countToday + 1).padStart(3, "0")}`;

    // สร้างข้อมูลกะใหม่ลง DB
    const newShift = await prisma.shifts.create({
      data: {
        shiftNumber,
        startingCash: data.startingCash,
        openedBy: data.openedBy,
        organizationId: data.organizationId,
        status: "OPEN",
      },
    });

    return { success: true, shift: newShift };
  } catch (error: any) {
    console.error("Open Shift Error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการเปิดกะ",
    };
  }
}

export async function closeShiftDB(data: {
  shiftId: number;
  endingCash: number; // เงินสดที่แคชเชียร์นับได้จริงในลิ้นชัก
  closedBy: string;
  note?: string;
}) {
  try {
    // 1. ดึงข้อมูลกะเดิมเพื่อตรวจสอบ
    const currentShift = await prisma.shifts.findUnique({
      where: { id: data.shiftId },
    });

    if (!currentShift) {
      return { success: false, message: "ไม่พบข้อมูลกะการทำงานนี้" };
    }

    if (currentShift.status === "CLOSED") {
      return { success: false, message: "กะการทำงานนี้ถูกปิดไปแล้ว" };
    }

    // 2. ดึงประวัติการชำระเงินที่สมบูรณ์ในกะนี้มาคำนวณสรุปยอดขาย
    const shiftPayments = await prisma.payments.findMany({
      where: {
        shiftId: data.shiftId,
        isCompleted: true,
      },
    });

    let cashSales = 0;
    let qrSales = 0;
    let cardSales = 0;
    let memberSales = 0;

    shiftPayments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.method === "CASH") {
        cashSales += amt;
      } else if (p.method === "QR" || (p.method as string) === "TRANSFER") {
        qrSales += amt;
      } else if (p.method === "CARD") {
        cardSales += amt;
      } else if (p.method === "MEMBER") {
        memberSales += amt;
      }
    });

    const totalSales = cashSales + qrSales + cardSales + memberSales;

    const expectedCash = Number(currentShift.startingCash || 0) + cashSales;

    const cashDifference = data.endingCash - expectedCash;

    const closedShift = await prisma.shifts.update({
      where: { id: data.shiftId },
      data: {
        status: "CLOSED",
        endingCash: data.endingCash,
        expectedCash,
        cashDifference,
        totalSales,
        cashSales,
        qrSales,
        cardSales,
        memberSales,
        closedBy: data.closedBy,
        note: data.note || null,
        closedAt: new Date(),
      },
    });

    return { success: true, shift: closedShift };
  } catch (error: any) {
    console.error("Close Shift Error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการปิดกะ",
    };
  }
}
