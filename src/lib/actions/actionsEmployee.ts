"use server";

import prisma from "@/lib/prisma";

// 1. ดึงข้อมูลพนักงานและร้านค้า
export async function getShopAndEmployees(organizationId: number) {
  const shop = await prisma.organizations.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      employees: {
        include: {
          permission: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return shop;
}

// 2. เพิ่มพนักงานใหม่
export async function createEmployeeAction(data: {
  name: string;
  role: string;
  pin: string;
  organizationId: number;
}) {
  if (data.pin.length !== 4) throw new Error("PIN_LENGTH_ERROR");

  const existingEmployee = await prisma.employees.findFirst({
    where: {
      organizationId: data.organizationId,
      pin: data.pin,
    },
  });

  if (existingEmployee) {
    throw new Error("DUPLICATE_PIN");
  }

  return await prisma.employees.create({
    data: {
      name: data.name,
      role: data.role,
      pin: data.pin,
      organizationId: data.organizationId,
      permission: {
        create: {
          accessPos: false,
          accessSettings: false,
          accessReports: false,
          accessExpenses: false,
          cancelRefund: false,
        },
      },
    },
    include: {
      permission: true,
    },
  });
}

// 3. เปิด/ปิด สถานะการใช้งานพนักงาน
export async function toggleEmployeeStatusAction(
  employeeId: number,
  isActive: boolean,
) {
  return await prisma.employees.update({
    where: { id: employeeId },
    data: { isActive },
  });
}

// 4. อัปเดตสิทธิ์การใช้งาน
export async function updateEmployeePermissionAction(
  employeeId: number,
  permKey: string,
  value: boolean,
) {
  return await prisma.employee_permissions.update({
    where: { employeeId: employeeId },
    data: {
      [permKey]: value,
    },
  });
}

// 5. แก้ไขข้อมูลพื้นฐานของพนักงาน (ชื่อ, ตำแหน่ง, PIN)
export async function updateEmployeeInfoAction(
  employeeId: number,
  data: { name: string; role: string; pin: string; organizationId: number },
) {
  if (data.pin.length !== 4) throw new Error("PIN_LENGTH_ERROR");

  // ตรวจสอบ PIN ซ้ำ (ยกเว้นตัวเอง)
  const existingEmployee = await prisma.employees.findFirst({
    where: {
      organizationId: data.organizationId,
      pin: data.pin,
      id: { not: employeeId }, // หาคนอื่นที่ใช้รหัสนี้
    },
  });

  if (existingEmployee) {
    throw new Error("DUPLICATE_PIN");
  }

  return await prisma.employees.update({
    where: { id: employeeId },
    data: {
      name: data.name,
      role: data.role,
      pin: data.pin,
    },
  });
}