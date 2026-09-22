"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  holdOrderToDB,
  getHeldOrdersFromDB,
  deleteHeldOrderFromDB,
} from "@/lib/actions/actionsPos";
import { CartContextType, CartItem, HeldBill } from "@/lib/types/interface";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isHolding, setIsHolding] = useState(false);

  const [activeBillId, setActiveBillId] = useState<number | null>(null);
  const [activeBillNumber, setActiveBillNumber] = useState<string | null>(null);
  const [activeBillInfo, setActiveBillInfo] = useState<HeldBill | null>(null);

  useEffect(() => {
    fetchHeldBills(1);
  }, []);

  // 🌟 ฟังก์ชันล้างบิลทั้งหมด (เคลียร์ความจำหน้าจอ + ลบออกจาก DB ถ้ามี activeBillId)
  const clearCart = async () => {
    if (activeBillId) {
      await deleteHeldOrderFromDB(activeBillId);
      await fetchHeldBills(1);
    }
    setCart([]);
    setActiveBillId(null);
    setActiveBillNumber(null);
    setActiveBillInfo(null);
  };

  const addToCart = (item: {
    product: any;
    quantity: number;
    selectedOptions?: any;
    totalPrice: number;
  }) => {
    setCart((prev) => {
      const productId = item.product?.id || item.product?.productId;
      const optionKey = JSON.stringify(item.selectedOptions || {});

      const existingIdx = prev.findIndex((c) => {
        const cProductId = c.product?.id || c.product?.productId;
        const cOptionKey = JSON.stringify(c.selectedOptions || {});
        return (
          Number(cProductId) === Number(productId) && cOptionKey === optionKey
        );
      });

      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + item.quantity;
        const unitPrice = existing.totalPrice / existing.quantity;

        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          totalPrice: unitPrice * newQty,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        product: item.product,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || {},
        totalPrice: item.totalPrice,
      };
      return [...prev, newItem];
    });
  };

  // 🌟 ปรับปรุง: พอกดลบสินค้า ถ้าเมนูหมดตะกร้า (เหลือ 0) สั่งล้างบิล + ลบออกจาก DB ทันที
  const removeFromCart = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id);

    if (updatedCart.length === 0) {
      clearCart();
    } else {
      setCart(updatedCart);
    }
  };

  // 🌟 ปรับปรุง: พอกดลดจำนวนสินค้าลงเรื่อยๆ จนเมนูหมดตะกร้า (เหลือ 0) สั่งล้างบิล + ลบออกจาก DB ทันที
  const updateQuantity = (id: string, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const unitPrice = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            totalPrice: unitPrice * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    if (updatedCart.length === 0) {
      clearCart();
    } else {
      setCart(updatedCart);
    }
  };

  const fetchHeldBills = async (organizationId: number) => {
    const result = await getHeldOrdersFromDB(organizationId);
    if (result.success && result.data) {
      const formatted: HeldBill[] = result.data.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        qrCodeId: order.qrCodeId,
        kitchenStatus: order.kitchenStatus,
        items: order.items,
        totalPrice: order.netAmount || order.totalAmount,
        heldAt: new Date(order.createdAt),
      }));
      setHeldBills(formatted);
    }
  };

  const holdBill = async (
    organizationId: number,
    options?: {
      customerName?: string;
      qrCodeId?: number | null;
      sendToKitchen?: boolean;
    },
  ) => {
    if (cart.length === 0) return false;
    setIsHolding(true);

    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const kStatus = options?.sendToKitchen ? "IN_KITCHEN" : "IDLE";

    const payload = {
      orderId: activeBillId,
      organizationId,
      customerName:
        options?.customerName ||
        (activeBillNumber ? `บิล ${activeBillNumber}` : "บิลพักชั่วคราว"),
      qrCodeId: options?.qrCodeId || null,
      kitchenStatus: kStatus as any,
      totalAmount: subtotal,
      netAmount: subtotal,
      items: cart.map((item) => ({
        productId: item.product.id || item.product.productId,
        quantity: item.quantity,
        priceAtTime: item.totalPrice / item.quantity,
        options: JSON.stringify(item.selectedOptions || {}),
      })),
    };

    const result = await holdOrderToDB(payload);
    setIsHolding(false);

    if (result.success) {
      setCart([]);
      setActiveBillId(null);
      setActiveBillNumber(null);
      setActiveBillInfo(null);
      await fetchHeldBills(organizationId);
      return true;
    }
    return false;
  };

  const resumeBill = (billId: number) => {
    const bill = heldBills.find((b) => b.id === billId);
    if (!bill) return;

    setActiveBillId(bill.id);
    setActiveBillNumber(bill.orderNumber);
    setActiveBillInfo(bill);

    const reloadedCart: CartItem[] = bill.items.map((item: any) => {
      let parsedOptions = {};
      try {
        parsedOptions = item.options
          ? typeof item.options === "string"
            ? JSON.parse(item.options)
            : item.options
          : {};
      } catch (e) {
        parsedOptions = {};
      }

      const targetProduct = item.product || item;
      const qty = item.quantity || 1;
      const unitPrice = item.priceAtTime || targetProduct.price || 0;

      return {
        id: `${targetProduct.id}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        product: targetProduct,
        quantity: qty,
        selectedOptions: parsedOptions,
        totalPrice: unitPrice * qty,
      };
    });

    setCart(reloadedCart);
    setHeldBills((prev) => prev.filter((b) => b.id !== billId));
  };

  const deleteBill = async (billId: number) => {
    const result = await deleteHeldOrderFromDB(billId);
    if (result.success) {
      setHeldBills((prev) => prev.filter((b) => b.id !== billId));
      if (activeBillId === billId) {
        setCart([]);
        setActiveBillId(null);
        setActiveBillNumber(null);
        setActiveBillInfo(null);
      }
    } else {
      alert(result.message || "ไม่สามารถลบบิลได้");
    }
  };

  const checkoutBill = (billId: number | string) => {
    setHeldBills((prev) => prev.filter((b) => b.id !== billId));
    if (Number(billId) === Number(activeBillId)) {
      setCart([]);
      setActiveBillId(null);
      setActiveBillNumber(null);
      setActiveBillInfo(null);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        activeBillId,
        activeBillNumber,
        activeBillInfo,
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
        fetchHeldBills,
        isHolding,
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
