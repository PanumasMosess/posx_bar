"use client";

import { useState, useEffect } from "react";
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

  return (
    <CartProvider>
      <ShiftProvider organizationId={1}>
        <div className="flex flex-col h-[100dvh] w-full bg-pos-bg text-pos-text overflow-hidden selection:bg-sky-500/30">
          <Header onToggleCart={toggleCart} />

          <div className="flex-1 flex overflow-hidden relative">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 bg-pos-bg overflow-hidden relative">
              <div className="flex-1 overflow-y-auto">{children}</div>
              <MobileNav onToggleCart={toggleCart} />
            </main>

            <CartDrawer
              isOpen={isCartOpen}
              onClose={closeCart}
              onOpen={openCart}
            />
          </div>
        </div>
      </ShiftProvider>
    </CartProvider>
  );
}
