'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import CategoryPills from '@/components/pos/CategoryPills';
import ProductGrid from '@/components/pos/ProductGrid';
import CartDrawer from '@/components/pos/CartDrawer';
// นำเข้า CartProvider จากไฟล์ Context (แก้ Path ให้ตรงกับโฟลเดอร์ของคุณ)
import { CartProvider } from '@/components/providers/CartContext';

export default function POSXApp() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Handle window resizing to restore normal desktop layout
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !isCartOpen) {
        // We don't necessarily force it open in state, but the CSS handles lg:flex
        // The drawer component itself uses lg:flex to always show on desktop
      } else if (!isDesktop && isCartOpen) {
        // Keep it open if they resize down
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCartOpen]);

  // Keyboard shortcut: Escape to close menus/drawers, F12 to checkout
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const isDesktop = window.innerWidth >= 1024;
        if (!isDesktop && isCartOpen) {
          closeCart();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen]);

  return (
    // ครอบโค้ดทั้งหมดด้วย CartProvider
    <CartProvider>
      <Header onToggleCart={toggleCart} />

      {/* MAIN APP BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />

        {/* CENTER CATALOG SECTION (Takes all remaining width, cards wrap naturally) */}
        <main className="flex-1 flex flex-col min-w-0 bg-pos-bg overflow-hidden relative">
          <CategoryPills />
          <ProductGrid />
          <MobileNav onToggleCart={toggleCart} />
        </main>

        <CartDrawer
          isOpen={isCartOpen}
          onClose={closeCart}
          onOpen={openCart}
        />
      </div>
    </CartProvider>
  );
}