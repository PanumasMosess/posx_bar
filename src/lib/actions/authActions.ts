"use server";

import prisma from "@/lib/prisma";
import { signIn, signOut, auth } from "../auth";

// 🌟 1. เพิ่มฟังก์ชันนี้กลับเข้ามา เพื่อให้ MainLayout ดึงข้อมูล Session ได้
export async function getSessionAction() {
  try {
    const session = await auth();
    return session;
  } catch (error) {
    console.error("getSessionAction Error:", error);
    return null;
  }
}

// 2. ฟังก์ชัน Login องค์กร
export async function loginAction(
  formData: FormData,
): Promise<{ success: boolean; message?: string; orgId?: number }> {
  try {
    const orgCode = formData.get("orgCode") as string;
    const password = formData.get("password") as string;

    if (!orgCode || !password) {
      return { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" };
    }

    const usernameInput = orgCode.trim();

    const org = await prisma.organizations.findUnique({
      where: { username: usernameInput },
      select: { id: true },
    });

    if (!org) {
      return { success: false, message: "ไม่พบรหัสบริษัท/ร้านค้านี้" };
    }

    await signIn("credentials", {
      username: usernameInput,
      password: password,
      redirect: false,
    });

    return { success: true, orgId: org.id };
  } catch (error: any) {
    if (
      error.type === "CredentialsSignin" ||
      error.message?.includes("CredentialsSignin")
    ) {
      return { success: false, message: "รหัสบริษัท หรือ รหัสผ่าน ไม่ถูกต้อง" };
    }
    if (error.message?.includes("NEXT_REDIRECT")) {
      return { success: true };
    }
    return { success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}

// 3. ฟังก์ชัน Logout องค์กร
export async function logoutAction() {
  await signOut({ redirectTo: "/", redirect: true });
}

// 4. ฟังก์ชันตรวจสอบ PIN พนักงาน
export async function verifyPinOnlyAction(pin: string, orgId: number) {
  try {
    const cleanPin = String(pin || "").trim();
    if (!cleanPin || cleanPin.length !== 4) {
      return { success: false, message: "กรุณากรอกรหัส PIN 4 หลัก" };
    }

    const parsedOrgId = Number(orgId);
    if (!parsedOrgId || isNaN(parsedOrgId)) {
      return {
        success: false,
        message: "ไม่พบข้อมูลรหัสร้านค้า โปรดล็อกอินใหม่",
      };
    }

    const employee = await prisma.employees.findFirst({
      where: {
        organizationId: parsedOrgId,
        pin: cleanPin,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        img: true,
      },
    });

    if (!employee) {
      return { success: false, message: "รหัส PIN ไม่ถูกต้อง" };
    }

    return {
      success: true,
      employee: JSON.parse(JSON.stringify(employee)), // บังคับแปลงเป็น JSON พื้นฐานกัน Next.js Crash
    };
  } catch (error: any) {
    console.error("SERVER ACTION ERROR:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบ PIN",
    };
  }
}
