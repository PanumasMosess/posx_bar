"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendbase64toS3DataMultifile } from "@/lib/actions";

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
          // ถ้าอัปโหลดสำเร็จ เอา URL จริงที่ได้จาก S3 มาเซ็ตแทน Base64 เดิม
          finalImageUrl = uploadResult.url;
        } else {
          console.error("S3 Upload Failed");
          return { success: false, error: "อัปโหลดรูปภาพไม่สำเร็จ" };
        }
      }
    }

    await prisma.products.create({
      data: {
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
