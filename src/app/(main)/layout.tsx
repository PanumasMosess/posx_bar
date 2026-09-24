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
import { EmployeeProvider } from "@/components/providers/EmployeeContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<number>(1);
  const pathname = usePathname();

  useEffect(() => {
    getSessionAction().then((session) => {
      if (session?.user?.orgId) {
        setOrganizationId(session.user.orgId);
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

  return (
    <EmployeeProvider>
      {isAuthPage ? (
        <main className="w-full min-h-screen">{children}</main>
      ) : (
        <CartProvider>
          <ShiftProvider organizationId={organizationId}>
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
    </EmployeeProvider>
  );
}
