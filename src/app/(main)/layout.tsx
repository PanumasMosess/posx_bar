"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import CartDrawer from "@/components/pos/CartDrawer";
import { CartProvider } from "@/components/providers/CartContext";
import { ShiftProvider } from "@/components/providers/ShiftContext";
import { OrganizationSettingsProvider } from "@/components/providers/OrganizationSettingsContext";
import { LanguageProvider } from "@/lib/language/LanguageContext";
import { getSessionAction } from "@/lib/actions/authActions";
import { useEmployee } from "@/components/providers/EmployeeContext";
import EmployeePinModal from "@/components/auth/EmployeePinModal";
import { ShiftRevenueProvider } from "@/components/providers/ShiftRevenueContext";
import { MemberProvider } from "@/components/providers/MemberContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<number>(1);
  const pathname = usePathname();

  // 🌟 ดึงข้อมูลพนักงานจาก Context
  const { currentEmployee, activeOrgId, isPinExpired, setOrgId } =
    useEmployee();

  // 🌟 ตรวจสอบว่าอยู่หน้าขาย (POS) หรือไม่ ถ้าไม่ใช่ให้ปิด Cart อัตโนมัติ
  const isPosPage = pathname === "/pos";
  const isAuthPage = pathname === "/login" || pathname === "/signin";

  const toggleCart = () => setIsCartOpen((prev) => !prev);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);

  // 🌟 ดึงข้อมูล Session จาก Server Action เพื่อเอา organizationId
  useEffect(() => {
    let isMounted = true;
    getSessionAction()
      .then((session) => {
        if (!isMounted) return;
        const orgId = (session as any)?.orgId ?? (session?.user as any)?.orgId;
        if (session && orgId) {
          setOrganizationId(orgId);
          setOrgId(orgId); // 🌟 เซฟ orgId เข้า EmployeeContext ทันที
        }
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [setOrgId]);

  // 🌟 เช็คอัตโนมัติ: ถ้าออกจากหน้า POS ให้ปิดตะกร้าเสมอ
  useEffect(() => {
    if (!isPosPage) {
      const timer = setTimeout(() => {
        setIsCartOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isPosPage]);

  const currentOrgId = activeOrgId || organizationId;

  return (
    <>
      {isAuthPage ? (
        <main className="w-full min-h-screen">{children}</main>
      ) : (
        /* 🌟 ครอบ OrganizationSettingsProvider โดยส่ง currentOrgId เข้าไป */
        <OrganizationSettingsProvider organizationId={currentOrgId}>
          <LanguageProvider>
            <CartProvider>
              <MemberProvider>
                <ShiftProvider>
                  <ShiftRevenueProvider>
                    <div className="flex flex-col h-[100dvh] w-full bg-pos-bg text-pos-text overflow-hidden selection:bg-sky-500/30">
                      <Header onToggleCart={isPosPage ? toggleCart : () => {}} />

                      <div className="flex-1 flex overflow-hidden relative">
                        <Sidebar />

                        <main className="flex-1 flex flex-col min-w-0 bg-pos-bg overflow-hidden relative">
                          <div className="flex-1 overflow-y-auto">{children}</div>
                          <MobileNav
                            onToggleCart={isPosPage ? toggleCart : () => {}}
                          />
                        </main>

                        {isPosPage && (
                          <CartDrawer
                            isOpen={isCartOpen}
                            onClose={closeCart}
                            onOpen={openCart}
                          />
                        )}
                      </div>
                    </div>
                  </ShiftRevenueProvider>
                </ShiftProvider>
              </MemberProvider>
            </CartProvider>
          </LanguageProvider>
        </OrganizationSettingsProvider>
      )}

      {/* 🌟 แสดง Modal เฉพาะตอนไม่ใช่หน้า Auth และยังไม่มีพนักงานล็อกอิน หรือ PIN หมดอายุ */}
      {!isAuthPage && (!currentEmployee || isPinExpired) && (
        <EmployeePinModal orgId={currentOrgId} />
      )}
    </>
  );
}
