"use server";

import prisma from "@/lib/prisma";
import { auth, signIn, signOut } from "../auth";

/** ดึงข้อมูล Session ปัจจุบันผ่าน Server Action */
export async function getSessionAction() {
  const session = await auth();
  return session;
}

export async function loginAction(formData: FormData) {
  try {
    const orgCode = formData.get("orgCode") as string;
    const password = formData.get("password") as string;

    if (!orgCode || !password) {
      return { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" };
    }

    await signIn("credentials", {
      username: orgCode.trim(),
      password: password,
      redirect: false,
    });

    return { success: true };
  } catch (error: any) {
    if (error.type === "CredentialsSignin") {
      return { success: false, message: "รหัสบริษัท หรือ รหัสผ่าน ไม่ถูกต้อง" };
    }
    // กรณี Next.js Redirect ให้ผ่าน
    if (error.message?.includes("NEXT_REDIRECT")) {
      return { success: true };
    }
    return { success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function verifyPinOnlyAction(pin: string) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return {
      success: false,
      message: "เซสชันร้านค้าหมดอายุ โปรดเข้าสู่ระบบใหม่",
    };
  }

  try {
    const employee = await prisma.employees.findFirst({
      where: {
        organizationId: session.user.orgId,
        isActive: true,
        pin: pin,
      },
      include: {
        permission: true,
      },
    });

    if (!employee) {
      return {
        success: false,
        message: "รหัส PIN ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าใช้งาน",
      };
    }

    return {
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        img: employee.img,
        permission: employee.permission,
      },
    };
  } catch (error) {
    return { success: false, message: "เกิดข้อผิดพลาดในการตรวจสอบระบบ" };
  }
}
