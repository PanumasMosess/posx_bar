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
import { CartContextType, CartItem, HeldBill } from "@/lib/interface";
import { useEmployee } from "@/components/providers/EmployeeContext";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isHolding, setIsHolding] = useState(false);

  const [activeBillId, setActiveBillId] = useState<number | null>(null);
  const [activeBillNumber, setActiveBillNumber] = useState<string | null>(null);
  const [activeBillInfo, setActiveBillInfo] = useState<any | null>(null);

  const { organizationId } = useEmployee();

  useEffect(() => {
    if (organizationId) {
      fetchHeldBills(organizationId);
    }
  }, [organizationId]);

  const clearCart = async () => {
    if (activeBillId) {
      await deleteHeldOrderFromDB(activeBillId);
      await fetchHeldBills(organizationId);
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
        status: "SERVED",
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id);

    if (updatedCart.length === 0) {
      clearCart();
    } else {
      setCart(updatedCart);
    }
  };

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
      const formatted: any[] = result.data.map((order: any) => {
        const tableRelation =
          order.qrcode || order.qrcodes || order.qrCode || order.table;
        const extractedTableName =
          tableRelation?.tableName ||
          (order.qrCodeId ? `โต๊ะ ${order.qrCodeId}` : null);

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          qrCodeId: order.qrCodeId,
          tableName: extractedTableName,
          kitchenStatus: order.kitchenStatus,
          items: order.items,
          totalPrice: order.netAmount || order.totalAmount,
          heldAt: new Date(order.createdAt),
          qrcode: tableRelation,
        };
      });
      setHeldBills(formatted);
    }
  };

  const holdBill = async (
    organizationId: number,
    options?: {
      customerName?: string;
      qrCodeId?: number | null;
      sendToKitchen?: boolean;
      kitchenItemIds?: string[];
      createdBy?: string;
    },
  ) => {
    if (cart.length === 0) return false;
    setIsHolding(true);

    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    const payload = {
      orderId: activeBillId,
      organizationId,
      createdBy: options?.createdBy || "0",
      customerName:
        options?.customerName ||
        activeBillInfo?.customerName ||
        (activeBillNumber ? `บิล ${activeBillNumber}` : "บิลพักชั่วคราว"),
      qrCodeId: options?.qrCodeId || activeBillInfo?.qrCodeId || null,
      kitchenStatus: options?.sendToKitchen
        ? ("IN_KITCHEN" as const)
        : ("SERVED" as const),
      totalAmount: subtotal,
      netAmount: subtotal,
      items: cart.map((item) => {
        const isSelectedForKitchen = options?.kitchenItemIds
          ? options.kitchenItemIds.includes(item.id) ||
            options.kitchenItemIds.includes(String((item as any).dbItemId))
          : !!options?.sendToKitchen;

        let finalStatus = (item as any).status || "SERVED";
        if (isSelectedForKitchen) {
          finalStatus = "IN_KITCHEN";
        }

        return {
          id: (item as any).dbItemId || undefined,
          productId: item.product.id || item.product.productId,
          quantity: item.quantity,
          priceAtTime: item.totalPrice / item.quantity,
          options: JSON.stringify(item.selectedOptions || {}),
          status: finalStatus,
        };
      }),
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

    // นำบิลที่เลือกใส่ไว้ใน activeBillInfo (มี tableName ติดไปด้วยแล้ว)
    setActiveBillInfo({
      ...bill,
      qrCodeId: bill.qrCodeId,
      customerName: bill.customerName,
      tableName: (bill as any).tableName,
    });

    // 🌟 สร้าง Map เพื่อจัดกลุ่มและรวม(Merge)สินค้าที่เหมือนกันเข้าด้วยกัน
    const mergedCartMap = new Map<string, any>();

    bill.items.forEach((item: any) => {
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
      const status = item.status || "SERVED";

      // 🌟 คีย์สำหรับการรวม (สินค้าเดียวกัน + ตัวเลือกเดียวกันเป๊ะ + สถานะครัวเหมือนกัน)
      const optionString = JSON.stringify(parsedOptions);
      const uniqueKey = `${targetProduct.id}_${optionString}_${status}`;

      if (mergedCartMap.has(uniqueKey)) {
        // ถ้ามีสินค้านี้อยู่ใน Map แล้ว ให้บวกจำนวนและราคาเพิ่มเข้าไป
        const existingItem = mergedCartMap.get(uniqueKey);
        existingItem.quantity += qty;
        existingItem.totalPrice += unitPrice * qty;
      } else {
        // ถ้ายะงไม่มี ให้สร้างบรรทัดใหม่
        mergedCartMap.set(uniqueKey, {
          id: `${targetProduct.id}-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          dbItemId: item.id, // เก็บอ้างอิง ID ใน Database ไว้
          product: targetProduct,
          quantity: qty,
          selectedOptions: parsedOptions,
          totalPrice: unitPrice * qty,
          status: status,
        });
      }
    });

    // แปลงกลับเป็น Array เพื่อนำไปแสดงในตะกร้า
    const reloadedCart: CartItem[] = Array.from(mergedCartMap.values());

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
