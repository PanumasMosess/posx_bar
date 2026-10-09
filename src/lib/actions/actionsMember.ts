"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MemberTransactionType, MemberWalletType } from "@/lib/types";

// =========================================================================
// 1. ดึงข้อมูลสมาชิก (Fetch Members & Stats)
// =========================================================================

export async function getMembersAction(params: {
  organizationId: number;
  search?: string;
  status?: string;
  tierId?: number | null;
  page?: number;
  limit?: number;
}) {
  const {
    organizationId,
    search = "",
    status,
    tierId,
    page = 1,
    limit = 50,
  } = params;

  if (!organizationId) {
    return { success: false, message: "ไม่พบรหัสร้านค้า (Organization ID)", data: [], total: 0 };
  }

  try {
    const where: any = { organizationId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (tierId !== undefined && tierId !== null) {
      where.tierId = tierId;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { phone: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }

    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          tier: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    return {
      success: true,
      data: members,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก", data: [], total: 0 };
  }
}

export async function getMemberStatsAction(organizationId: number) {
  if (!organizationId) {
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalPoints: 0,
      totalCreditBalance: 0,
    };
  }

  try {
    const [totalMembers, activeMembers, aggregateResult] = await Promise.all([
      prisma.member.count({
        where: { organizationId },
      }),
      prisma.member.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      prisma.member.aggregate({
        where: { organizationId },
        _sum: {
          points: true,
          creditBalance: true,
        },
      }),
    ]);

    return {
      totalMembers,
      activeMembers,
      totalPoints: aggregateResult._sum.points || 0,
      totalCreditBalance: aggregateResult._sum.creditBalance || 0,
    };
  } catch (error) {
    console.error("Error fetching member stats:", error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalPoints: 0,
      totalCreditBalance: 0,
    };
  }
}

// =========================================================================
// 2. สร้างสมาชิกใหม่ (Create Member)
// =========================================================================

export async function createMemberAction(data: {
  organizationId: number;
  phone: string;
  firstName: string;
  lastName?: string | null;
  points?: number;
  creditBalance?: number;
  tierId?: number | null;
  status?: string;
  createdById?: number | null;
}) {
  const {
    organizationId,
    phone,
    firstName,
    lastName,
    points = 0,
    creditBalance = 0,
    tierId,
    status = "ACTIVE",
    createdById,
  } = data;

  if (!organizationId) {
    return { success: false, message: "ไม่พบรหัสร้านค้า (Organization ID)" };
  }

  const cleanPhone = phone?.trim();
  const cleanFirstName = firstName?.trim();
  const cleanLastName = lastName?.trim() || null;

  if (!cleanPhone) {
    return { success: false, message: "กรุณาระบุเบอร์โทรศัพท์ของสมาชิก" };
  }
  if (!cleanFirstName) {
    return { success: false, message: "กรุณาระบุชื่อจริงของสมาชิก" };
  }

  const initialPoints = Math.max(0, Math.floor(Number(points) || 0));
  const initialCredit = Math.max(0, Number(creditBalance) || 0);

  try {
    // ตรวจสอบเบอร์โทรซ้ำในร้านเดียวกัน
    const existing = await prisma.member.findUnique({
      where: {
        phone_organizationId: {
          phone: cleanPhone,
          organizationId,
        },
      },
    });

    if (existing) {
      return { success: false, message: `เบอร์โทรศัพท์ ${cleanPhone} นี้เป็นสมาชิกอยู่แล้ว` };
    }

    // สร้างข้อมูลสมาชิกและบันทึก Transaction เริ่มต้นใน $transaction
    const result = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          organizationId,
          phone: cleanPhone,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          points: initialPoints,
          creditBalance: initialCredit,
          tierId: tierId ? Number(tierId) : null,
          status: status || "ACTIVE",
        },
        include: {
          tier: true,
        },
      });

      // ถ้ามีแต้มเริ่มต้น ให้ลงบันทึกใน membertransaction
      if (initialPoints > 0) {
        await tx.membertransaction.create({
          data: {
            organizationId,
            memberId: newMember.id,
            type: "EARN",
            walletType: "POINT",
            amount: initialPoints,
            balanceAfter: initialPoints,
            note: "แต้มเริ่มต้นตอนเปิดบัตรสมาชิก",
            createdById: createdById || null,
          },
        });
      }

      // ถ้ามีเครดิตเริ่มต้น ให้ลงบันทึกใน membertransaction
      if (initialCredit > 0) {
        await tx.membertransaction.create({
          data: {
            organizationId,
            memberId: newMember.id,
            type: "TOPUP",
            walletType: "CREDIT",
            amount: initialCredit,
            balanceAfter: initialCredit,
            note: "เครดิตเริ่มต้นตอนเปิดบัตรสมาชิก",
            createdById: createdById || null,
          },
        });
      }

      return newMember;
    });

    revalidatePath("/settings");
    return { success: true, message: "เพิ่มสมาชิกใหม่สำเร็จ", data: result };
  } catch (error: any) {
    console.error("Error creating member:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้างสมาชิก" };
  }
}

// =========================================================================
// 3. แก้ไขข้อมูลสมาชิก (Update Member)
// =========================================================================

export async function updateMemberAction(data: {
  id: number;
  organizationId: number;
  phone: string;
  firstName: string;
  lastName?: string | null;
  tierId?: number | null;
  status?: string;
  points?: number;
  creditBalance?: number;
}) {
  const {
    id,
    organizationId,
    phone,
    firstName,
    lastName,
    tierId,
    status,
    points,
    creditBalance,
  } = data;

  if (!id || !organizationId) {
    return { success: false, message: "ข้อมูลไม่ครบถ้วน" };
  }

  const cleanPhone = phone?.trim();
  const cleanFirstName = firstName?.trim();
  const cleanLastName = lastName?.trim() || null;

  if (!cleanPhone) {
    return { success: false, message: "กรุณาระบุเบอร์โทรศัพท์" };
  }
  if (!cleanFirstName) {
    return { success: false, message: "กรุณาระบุชื่อจริง" };
  }

  try {
    // ตรวจสอบว่าเบอร์ใหม่ซ้ำกับสมาชิกท่านอื่นในร้านหรือไม่
    const existing = await prisma.member.findFirst({
      where: {
        organizationId,
        phone: cleanPhone,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, message: `เบอร์โทรศัพท์ ${cleanPhone} นี้ถูกใช้งานโดยสมาชิกท่านอื่นแล้ว` };
    }

    const updateData: any = {
      phone: cleanPhone,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      tierId: tierId ? Number(tierId) : null,
    };

    if (status) {
      updateData.status = status;
    }

    if (points !== undefined) {
      updateData.points = Math.max(0, Math.floor(Number(points) || 0));
    }

    if (creditBalance !== undefined) {
      updateData.creditBalance = Math.max(0, Number(creditBalance) || 0);
    }

    const updated = await prisma.member.update({
      where: { id },
      data: updateData,
      include: {
        tier: true,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "อัปเดตข้อมูลสมาชิกสำเร็จ", data: updated };
  } catch (error: any) {
    console.error("Error updating member:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสมาชิก" };
  }
}

// =========================================================================
// 4. ลบสมาชิก (Delete Member)
// =========================================================================

export async function deleteMemberAction(id: number, organizationId: number) {
  if (!id || !organizationId) {
    return { success: false, message: "ข้อมูลไม่ครบถ้วน" };
  }

  try {
    const member = await prisma.member.findFirst({
      where: { id, organizationId },
    });

    if (!member) {
      return { success: false, message: "ไม่พบข้อมูลสมาชิกนี้" };
    }

    await prisma.$transaction(async (tx) => {
      // ปลดลิงก์ออเดอร์ก่อนถ้ามี
      await tx.orders.updateMany({
        where: { memberId: id },
        data: { memberId: null },
      });

      // ลบรายการ transaction ของสมาชิก
      await tx.membertransaction.deleteMany({
        where: { memberId: id },
      });

      // ลบสมาชิก
      await tx.member.delete({
        where: { id },
      });
    });

    revalidatePath("/settings");
    return { success: true, message: "ลบสมาชิกสำเร็จ" };
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return { success: false, message: error.message || "ไม่สามารถลบสมาชิกได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง" };
  }
}

// =========================================================================
// 5. ปรับยอดแต้ม / เครดิต (Adjust Member Wallet / Points)
// =========================================================================

export async function adjustMemberWalletAction(data: {
  memberId: number;
  organizationId: number;
  walletType: MemberWalletType; // "POINT" | "CREDIT"
  action: "ADD" | "DEDUCT";     // เพิ่ม หรือ ลด
  amount: number;
  note?: string;
  createdById?: number | null;
}) {
  const {
    memberId,
    organizationId,
    walletType,
    action,
    amount,
    note,
    createdById,
  } = data;

  if (!memberId || !organizationId || !amount || amount <= 0) {
    return { success: false, message: "จำนวนต้องมากกว่า 0" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findFirst({
        where: { id: memberId, organizationId },
      });

      if (!member) {
        throw new Error("ไม่พบข้อมูลสมาชิก");
      }

      let newBalance = 0;
      let txType: MemberTransactionType = "EARN";

      if (walletType === "POINT") {
        const changePoints = Math.floor(amount);
        if (action === "DEDUCT" && member.points < changePoints) {
          throw new Error(`แต้มสะสมมีไม่พอ (ปัจจุบันมี ${member.points} แต้ม)`);
        }

        newBalance = action === "ADD" ? member.points + changePoints : member.points - changePoints;
        txType = action === "ADD" ? "EARN" : "REDEEM";

        await tx.member.update({
          where: { id: memberId },
          data: { points: newBalance },
        });

        await tx.membertransaction.create({
          data: {
            organizationId,
            memberId,
            type: txType,
            walletType: "POINT",
            amount: action === "ADD" ? changePoints : -changePoints,
            balanceAfter: newBalance,
            note: note || (action === "ADD" ? "ปรับเพิ่มแต้มโดยผู้ดูแล" : "ปรับลดแต้มโดยผู้ดูแล"),
            createdById: createdById || null,
          },
        });
      } else {
        // CREDIT
        const changeCredit = Number(amount);
        if (action === "DEDUCT" && member.creditBalance < changeCredit) {
          throw new Error(`เครดิตเงินสดมีไม่พอ (ปัจจุบันมี ฿${member.creditBalance})`);
        }

        newBalance = action === "ADD" ? member.creditBalance + changeCredit : member.creditBalance - changeCredit;
        txType = action === "ADD" ? "TOPUP" : "SPEND";

        await tx.member.update({
          where: { id: memberId },
          data: { creditBalance: newBalance },
        });

        await tx.membertransaction.create({
          data: {
            organizationId,
            memberId,
            type: txType,
            walletType: "CREDIT",
            amount: action === "ADD" ? changeCredit : -changeCredit,
            balanceAfter: newBalance,
            note: note || (action === "ADD" ? "เติมเครดิตเงินสด" : "หักเครดิตเงินสด"),
            createdById: createdById || null,
          },
        });
      }

      return { newBalance, walletType };
    });

    revalidatePath("/settings");
    return {
      success: true,
      message: `ปรับปรุงยอด${walletType === "POINT" ? "แต้ม" : "เครดิต"}สำเร็จ`,
      data: result,
    };
  } catch (error: any) {
    console.error("Error adjusting member wallet:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการปรับยอด" };
  }
}

// =========================================================================
// 6. จัดการระดับสมาชิก (Member Tiers)
// =========================================================================

export async function getMemberTiersAction(organizationId: number) {
  if (!organizationId) return [];

  try {
    const tiers = await prisma.membertier.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { minSpending: "asc" },
    });
    return tiers;
  } catch (error) {
    console.error("Error fetching member tiers:", error);
    return [];
  }
}

export async function createMemberTierAction(data: {
  organizationId: number;
  name: string;
  minSpending?: number;
  pointMultiplier?: number;
  discountPercent?: number;
}) {
  const {
    organizationId,
    name,
    minSpending = 0,
    pointMultiplier = 1.0,
    discountPercent = 0.0,
  } = data;

  if (!organizationId || !name?.trim()) {
    return { success: false, message: "กรุณาระบุชื่อระดับสมาชิก" };
  }

  try {
    const newTier = await prisma.membertier.create({
      data: {
        organizationId,
        name: name.trim(),
        minSpending: Number(minSpending) || 0,
        pointMultiplier: Number(pointMultiplier) || 1.0,
        discountPercent: Number(discountPercent) || 0.0,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "สร้างระดับสมาชิกสำเร็จ", data: newTier };
  } catch (error: any) {
    console.error("Error creating member tier:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้างระดับสมาชิก" };
  }
}

export async function updateMemberTierAction(data: {
  id: number;
  organizationId: number;
  name: string;
  minSpending?: number;
  pointMultiplier?: number;
  discountPercent?: number;
}) {
  const {
    id,
    organizationId,
    name,
    minSpending = 0,
    pointMultiplier = 1.0,
    discountPercent = 0.0,
  } = data;

  if (!id || !organizationId || !name?.trim()) {
    return { success: false, message: "กรุณาระบุชื่อระดับสมาชิก" };
  }

  try {
    const updated = await prisma.membertier.update({
      where: { id },
      data: {
        name: name.trim(),
        minSpending: Number(minSpending) || 0,
        pointMultiplier: Number(pointMultiplier) || 1.0,
        discountPercent: Number(discountPercent) || 0.0,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "อัปเดตระดับสมาชิกสำเร็จ", data: updated };
  } catch (error: any) {
    console.error("Error updating member tier:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการอัปเดตระดับสมาชิก" };
  }
}

export async function deleteMemberTierAction(id: number, organizationId: number) {
  if (!id || !organizationId) {
    return { success: false, message: "ข้อมูลไม่ครบถ้วน" };
  }

  try {
    // ตรวจสอบว่ามีสมาชิกที่ผูกกับระดับนี้อยู่หรือไม่
    const memberCount = await prisma.member.count({
      where: { tierId: id, organizationId },
    });

    if (memberCount > 0) {
      // ปลด tierId ออกจากสมาชิกเป็น null ก่อน
      await prisma.member.updateMany({
        where: { tierId: id, organizationId },
        data: { tierId: null },
      });
    }

    await prisma.membertier.delete({
      where: { id },
    });

    revalidatePath("/settings");
    return { success: true, message: "ลบระดับสมาชิกสำเร็จ" };
  } catch (error: any) {
    console.error("Error deleting member tier:", error);
    return { success: false, message: error.message || "ไม่สามารถลบระดับสมาชิกได้" };
  }
}

// =========================================================================
// 7. ดึงประวัติธุรกรรมสมาชิก (Member Transactions History)
// =========================================================================

export async function getMemberTransactionsAction(memberId: number, organizationId: number) {
  if (!memberId || !organizationId) return [];

  try {
    const transactions = await prisma.membertransaction.findMany({
      where: { memberId, organizationId },
      include: {
        employee: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching member transactions:", error);
    return [];
  }
}

// =========================================================================
// 8. ค้นหาสมาชิกด้วยเบอร์โทรศัพท์ (Search Member by Phone)
// =========================================================================

export async function searchMemberByPhoneAction(organizationId: number, phone: string) {
  if (!organizationId || !phone?.trim()) {
    return { success: false, message: "กรุณาระบุเบอร์โทรศัพท์", data: null };
  }

  try {
    const cleanPhone = phone.trim();
    // ค้นหาแบบตรงตัวก่อน
    let member = await prisma.member.findFirst({
      where: {
        organizationId,
        phone: cleanPhone,
        status: "ACTIVE",
      },
      include: {
        tier: true,
      },
    });

    // หากไม่พบ และค้นหามากกว่า 3 ตัว ให้ค้นหาแบบ contains
    if (!member && cleanPhone.length >= 3) {
      member = await prisma.member.findFirst({
        where: {
          organizationId,
          phone: { contains: cleanPhone },
          status: "ACTIVE",
        },
        include: {
          tier: true,
        },
      });
    }

    if (!member) {
      return { success: false, message: "ไม่พบข้อมูลสมาชิกนี้", data: null };
    }

    return {
      success: true,
      data: {
        id: member.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        phone: member.phone,
        points: member.points,
        balance: member.creditBalance,
        discountPercent: member.tier?.discountPercent || 0,
        tierName: member.tier?.name || "สมาชิกทั่วไป",
      },
    };
  } catch (error: any) {
    console.error("Error searching member by phone:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการค้นหา", data: null };
  }
}

