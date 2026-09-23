"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import CartDrawer from "@/components/pos/CartDrawer";
import { CartProvider } from "@/components/providers/CartContext";
import { ShiftProvider } from "@/components/providers/ShiftContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();

  // 🌟 เช็กว่าผู้ใช้อยู่หน้า /pos หรือไม่ (รวมถึงหน้าแรก /)
  const isPosPage = pathname === "/pos" || pathname === "/";

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // ดักจับการกดปุ่ม Escape เพื่อปิด CartDrawer ในหน้าจอมือถือ/แท็บเล็ต
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

  // ปิด CartDrawer อัตโนมัติเมื่อย้ายไปหน้าอื่นที่ไม่ใช่ /pos
  useEffect(() => {
    if (!isPosPage) {
      closeCart();
    }
  }, [isPosPage]);

  return (
    <CartProvider>
      <ShiftProvider organizationId={1}>
        <div className="flex flex-col h-[100dvh] w-full bg-pos-bg text-pos-text overflow-hidden selection:bg-sky-500/30">
          {/* ส่ง toggleCart ให้ Header เฉพาะหน้า /pos */}
          <Header onToggleCart={isPosPage ? toggleCart : () => {}} />

          <div className="flex-1 flex overflow-hidden relative">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 bg-pos-bg overflow-hidden relative">
              <div className="flex-1 overflow-y-auto">{children}</div>
              {/* ส่ง toggleCart ให้ MobileNav เฉพาะหน้า /pos */}
              <MobileNav onToggleCart={isPosPage ? toggleCart : () => {}} />
            </main>

            {/* 🌟 แสดง CartDrawer เฉพาะหน้า /pos เท่านั้น */}
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
  );
}
