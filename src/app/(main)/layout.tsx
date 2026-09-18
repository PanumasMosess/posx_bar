"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import CartDrawer from "@/components/pos/CartDrawer";
import { CartProvider } from "@/components/pos/CartContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !isCartOpen) {
      } else if (!isDesktop && isCartOpen) {
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCartOpen]);

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
      <div className="flex flex-col h-screen w-full bg-pos-bg text-pos-text overflow-hidden selection:bg-sky-500/30">
        <Header onToggleCart={toggleCart} />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0 bg-pos-bg overflow-hidden relative">
            {children}

            <MobileNav onToggleCart={toggleCart} />
          </main>
          <CartDrawer
            isOpen={isCartOpen}
            onClose={closeCart}
            onOpen={openCart}
          />
        </div>
      </div>
    </CartProvider>
  );
}
