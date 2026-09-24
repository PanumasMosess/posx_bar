'use server';

import prisma from '@/lib/prisma';

export async function getShopProfileSettings(organizationId: number) {
  const shop = await prisma.organizations.findUnique({
    where: { id: organizationId },
    include: {
      organizationSetting: true 
    }
  });

  if (!shop) return null;

  const createdDate = new Date(shop.createdAt);
  const formatter = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const phoneData = Array.isArray(shop.organizationSetting) 
    ? shop.organizationSetting[0]?.phone 
    : shop.organizationSetting?.phone;

  return {
    name: shop.name,
    phone: phoneData || 'ยังไม่ได้ตั้งค่าเบอร์โทร',
    createdDateStr: formatter.format(createdDate)
  };
}

export async function updateShopNameAction(organizationId: number, newName: string) {
  return await prisma.organizations.update({
    where: { id: organizationId },
    data: { name: newName },
  });
}