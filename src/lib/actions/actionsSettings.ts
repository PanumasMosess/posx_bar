"use server";

import prisma from "@/lib/prisma";

export async function getShopProfileSettings(organizationId: number) {
  const shop = await prisma.organizations.findUnique({
    where: { id: organizationId },
    include: {
      organizationSetting: true,
    },
  });

  if (!shop) return null;

  const createdDate = new Date(shop.createdAt);
  const formatter = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const setting = Array.isArray(shop.organizationSetting)
    ? shop.organizationSetting[0]
    : shop.organizationSetting;

  return {
    name: shop.name,
    phone: setting?.phone || "",
    address: setting?.address || "",
    receiptFooter: setting?.receiptFooter || "",
    taxId: setting?.taxId || "",
    currencyCode: setting?.currencyCode || "THB",
    openTime: setting?.openTime || null,
    closeTime: setting?.closeTime || null,
    isManualOpenClose: setting?.isManualOpenClose ?? false,
    createdDateStr: formatter.format(createdDate),
  };
}

export async function updateShopNameAction(
  organizationId: number,
  newName: string,
) {
  return await prisma.organizations.update({
    where: { id: organizationId },
    data: { name: newName },
  });
}

// 1. อัปเดต/เพิ่ม สกุลเงิน (Currency)
export async function updateCurrencyAction(
  organizationId: number,
  currencyCode: string,
) {
  return await prisma.organizations_settings.upsert({
    where: { organizationId },
    update: { currencyCode },
    create: {
      organizationId,
      currencyCode,
    },
  });
}

// 2. อัปเดต/เพิ่ม เวลาเปิด-ปิด และโหมดเปิด-ปิดร้าน (Business Hours)
export async function updateBusinessHoursAction(
  organizationId: number,
  data: {
    openTime: string | null;
    closeTime: string | null;
    isManualOpenClose: boolean;
  },
) {
  return await prisma.organizations_settings.upsert({
    where: { organizationId },
    update: {
      openTime: data.openTime,
      closeTime: data.closeTime,
      isManualOpenClose: data.isManualOpenClose,
    },
    create: {
      organizationId,
      openTime: data.openTime,
      closeTime: data.closeTime,
      isManualOpenClose: data.isManualOpenClose,
    },
  });
}

export async function updateMiscSettingsAction(
  organizationId: number,
  data: {
    phone: string;
    address: string;
    receiptFooter: string;
    taxId: string;
  },
) {
  return await prisma.organizations_settings.upsert({
    where: { organizationId },
    update: {
      phone: data.phone,
      address: data.address,
      receiptFooter: data.receiptFooter,
      taxId: data.taxId,
    },
    create: {
      organizationId,
      phone: data.phone,
      address: data.address,
      receiptFooter: data.receiptFooter,
      taxId: data.taxId,
    },
  });
}

// -------------------------------------------------------------
// 3. จัดการ QR Code สำหรับสั่งอาหารที่โต๊ะ (Table QR Codes)
// -------------------------------------------------------------

export async function getQRCodesAction(organizationId: number) {
  return await prisma.qrcodes.findMany({
    where: { organizationId },
    orderBy: { id: "asc" },
  });
}

export async function createQRCodeAction(data: {
  organizationId: number;
  tableName: string;
  token?: string | null;
  createdBy?: string;
}) {
  const trimmedName = data.tableName.trim();
  const existing = await prisma.qrcodes.findFirst({
    where: {
      organizationId: data.organizationId,
      tableName: trimmedName,
    },
  });

  if (existing) {
    throw new Error(`โต๊ะ "${trimmedName}" มีอยู่ในระบบแล้ว`);
  }

  return await prisma.qrcodes.create({
    data: {
      organizationId: data.organizationId,
      tableName: trimmedName,
      token: data.token || null,
      isActive: true,
      createdBy: data.createdBy || null,
    },
  });
}

export async function createBatchQRCodesAction(data: {
  organizationId: number;
  tableNames: string[];
  createdBy?: string;
}) {
  const existing = await prisma.qrcodes.findMany({
    where: {
      organizationId: data.organizationId,
      tableName: { in: data.tableNames },
    },
    select: { tableName: true },
  });

  const existingSet = new Set(existing.map((e) => e.tableName));
  const toCreate = data.tableNames
    .filter((name) => !existingSet.has(name))
    .map((name) => ({
      organizationId: data.organizationId,
      tableName: name,
      token: null,
      isActive: true,
      createdBy: data.createdBy || null,
    }));

  if (toCreate.length > 0) {
    await prisma.qrcodes.createMany({
      data: toCreate,
    });
  }

  return {
    createdCount: toCreate.length,
    skippedCount: existing.length,
  };
}

export async function toggleQRCodeStatusAction(id: number, isActive: boolean) {
  return await prisma.qrcodes.update({
    where: { id },
    data: { isActive },
  });
}

export async function updateQRCodeAction(
  id: number,
  data: { tableName?: string; isActive?: boolean },
) {
  return await prisma.qrcodes.update({
    where: { id },
    data: {
      ...(data.tableName !== undefined
        ? { tableName: data.tableName.trim() }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function getOrganizationSettingsDB(organizationId: number) {
  try {
    let settings = await prisma.organizations_settings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      settings = await prisma.organizations_settings.create({
        data: {
          organizationId,
          currencyCode: "THB", 
          isManualOpenClose: false,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return { success: false, data: null };
  }
}
