"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Product {
    id: string;
    title: string;
    image: string;
    price: number;
    stockText: string;
    optionsText?: string;
    badgeStyle?: "sky" | "pink";
}

export interface CartItem extends Product {
    quantity: number;
}

export interface HeldBill {
    id: string;
    label: string;
    items: CartItem[];
    totalPrice: number;
    heldAt: Date;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    // --- พักบิล ---
    heldBills: HeldBill[];
    holdBill: (label?: string) => void;
    resumeBill: (billId: string) => void;
    deleteBill: (billId: string) => void;
    checkoutBill: (billId: string) => void;  // จ่ายเงินบิลที่พักโดยตรง
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
    const [billCounter, setBillCounter] = useState(1);

    // เพิ่มลงตะกร้า (ถ้ามีอยู่แล้ว +1)
    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    // ลบออกจากตะกร้า
    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    // ปรับจำนวน (+ / -) ถ้าน้อยกว่า 1 จะลบทิ้ง
    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(id);
            return;
        }
        setCart((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };

    // ล้างบิล
    const clearCart = () => setCart([]);

    // พักบิล: snapshot cart ปัจจุบัน → ล้าง cart
    const holdBill = (label?: string) => {
        if (cart.length === 0) return;
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newBill: HeldBill = {
            id: `hold-${Date.now()}`,
            label: label ?? `บิล #${String(billCounter).padStart(4, "0")}`,
            items: [...cart],
            totalPrice: subtotal,
            heldAt: new Date(),
        };
        setHeldBills((prev) => [...prev, newBill]);
        setBillCounter((n) => n + 1);
        setCart([]);
    };

    // คืนบิลที่พัก: merge items กลับมาใส่ cart
    const resumeBill = (billId: string) => {
        const bill = heldBills.find((b) => b.id === billId);
        if (!bill) return;
        setCart((prev) => {
            let merged = [...prev];
            bill.items.forEach((billItem) => {
                const idx = merged.findIndex((c) => c.id === billItem.id);
                if (idx >= 0) {
                    merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + billItem.quantity };
                } else {
                    merged.push({ ...billItem });
                }
            });
            return merged;
        });
        setHeldBills((prev) => prev.filter((b) => b.id !== billId));
    };

    // ลบบิลที่พักออกโดยไม่คืน
    const deleteBill = (billId: string) => {
        setHeldBills((prev) => prev.filter((b) => b.id !== billId));
    };

    // ชำระเงินบิลที่พักโดยตรง (ไม่ต้องโหลดกลับ cart)
    const checkoutBill = (billId: string) => {
        // ในอนาคตเชื่อมกับระบบการจ่ายเงินได้ที่นี่
        setHeldBills((prev) => prev.filter((b) => b.id !== billId));
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                heldBills,
                holdBill,
                resumeBill,
                deleteBill,
                checkoutBill,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};