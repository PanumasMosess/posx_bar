"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import CartDrawer from "@/components/pos/CartDrawer";
import { CartProvider } from "@/components/providers/CartContext";
import { ShiftProvider } from "@/components/providers/ShiftContext";
import { getSessionAction } from "@/lib/actions/authActions";
import { useEmployee } from "@/components/providers/EmployeeContext";
import EmployeePinModal from "@/components/auth/EmployeePinModal";

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

  // ดึง Session องค์กรแค่วาระแรกที่เริ่มโหลดหน้าจอเท่านั้น
  useEffect(() => {
    getSessionAction().then((session) => {
      const userAny = session?.user as any;
      if (userAny?.orgId) {
        const parsedOrgId = Number(userAny.orgId);
        setOrganizationId(parsedOrgId);
        if (!activeOrgId) {
          setOrgId(parsedOrgId);
        }
      }
    });
  }, []); 

  const isAuthPage = pathname === "/" || pathname === "/login";
  const isPosPage = pathname === "/pos";

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const isDesktop = window.innerWidth >= 1024;
        if (!isDesktop && isCartOpen) {
          closeCart();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen]);

  useEffect(() => {
    if (!isPosPage) {
      closeCart();
    }
  }, [isPosPage]);

  const currentOrgId = activeOrgId || organizationId;

  return (
    <>
      {isAuthPage ? (
        <main className="w-full min-h-screen">{children}</main>
      ) : (
        <CartProvider>
          <ShiftProvider organizationId={currentOrgId}>
            <div className="flex flex-col h-[100dvh] w-full bg-pos-bg text-pos-text overflow-hidden selection:bg-sky-500/30">
              <Header onToggleCart={isPosPage ? toggleCart : () => {}} />

              <div className="flex-1 flex overflow-hidden relative">
                <Sidebar />

                <main className="flex-1 flex flex-col min-w-0 bg-pos-bg overflow-hidden relative">
                  <div className="flex-1 overflow-y-auto">{children}</div>
                  <MobileNav onToggleCart={isPosPage ? toggleCart : () => {}} />
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
          </ShiftProvider>
        </CartProvider>
      )}

      {/* 🌟 แสดง Modal เฉพาะตอนไม่ใช่หน้า Auth และยังไม่มีพนักงานล็อกอิน หรือ PIN หมดอายุ */}
      {!isAuthPage && (!currentEmployee || isPinExpired) && (
        <EmployeePinModal orgId={currentOrgId} />
      )}
    </>
  );
}
