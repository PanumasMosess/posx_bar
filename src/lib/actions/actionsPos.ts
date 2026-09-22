"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  deleteFileS3,
  getS3KeyFromUrl,
  sendbase64toS3DataMultifile,
} from "@/lib/actions";

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
        image: finalImageUrl, // ใช้ URL จาก S3
        detail: data.detail || null,
        barcode: data.barcode || null,

        categoryId: data.categoryId ? Number(data.categoryId) : null,
        organizationId: 1,
        isActive: true,

        // บันทึกกลุ่มตัวเลือก
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
  }>;
  totalAmount: number;
  netAmount: number;
  customerName?: string;
  qrCodeId?: number | null;
  kitchenStatus?: "IDLE" | "IN_KITCHEN" | "NOT_REQUIRED";
}) {
  try {
    const kStatus = payload.kitchenStatus || "IDLE";

    // 🌟 หากเป็นการอัปเดตบิลเดิมที่ดึงคืนมา
    if (payload.orderId) {
      // 2. ลบรายการออเดอร์เดิมทั้งหมดใน Database ออกก่อน
      await prisma.orderitems.deleteMany({
        where: { orderId: payload.orderId },
      });

      // บันทึกบิลพร้อมรายการสินค้าชุดใหม่ล่าสุด
      const updatedOrder = await prisma.orders.update({
        where: { id: payload.orderId },
        data: {
          status: "HOLD",
          totalAmount: payload.totalAmount,
          netAmount: payload.netAmount,
          customerName: payload.customerName,
          qrCodeId: payload.qrCodeId,
          kitchenStatus: kStatus,
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime,
              options: item.options || "",
              status: kStatus,
            })),
          },
        },
      });
      return { success: true, order: updatedOrder };
    }

    // กรณีเป็นบิลใหม่
    const orderNumber = `HOLD-${Date.now().toString().slice(-6)}`;
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
        qrCodeId: payload.qrCodeId,
        items: {
          create: payload.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
            options: item.options || "",
            status: kStatus,
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
