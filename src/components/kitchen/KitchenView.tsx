"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateKitchenItemStatusDB,
  markAllItemsServedDB,
} from "@/lib/actions/actionsKitchen";
import { KitchenViewProps } from "@/lib/interface";

import KitchenHeader from "./KitchenHeader";
import KitchenEmptyState from "./KitchenEmptyState";
import KitchenOrderCard from "./KitchenOrderCard";

export default function KitchenView({ activeKitchenOrders }: KitchenViewProps) {
  const router = useRouter();
  const [orders, setActiveOrders] = useState<any[]>(activeKitchenOrders);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Sync props กับ local state
  useEffect(() => {
    setActiveOrders(activeKitchenOrders);
  }, [activeKitchenOrders]);

  // Auto Refresh ทุก 10 วินาที เพื่อดึงบิลใหม่จาก Server
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  // กดเสิร์ฟรายการเดี่ยว
  const handleServeItem = async (itemId: number) => {
    setProcessingId(itemId);
    const res = await updateKitchenItemStatusDB(itemId, "SERVED");
    if (res.success) {
      setActiveOrders((prev) =>
        prev
          .map((order) => ({
            ...order,
            items: order.items.filter((item: any) => item.id !== itemId),
          }))
          .filter((order) => order.items.length > 0),
      );
    } else {
      alert("เกิดข้อผิดพลาดในการอัปเดตรายการ");
    }
    setProcessingId(null);
  };

  // กดเสิร์ฟทั้งบิล
  const handleServeAllInOrder = async (orderId: number) => {
    setProcessingId(orderId);
    const res = await markAllItemsServedDB(orderId);
    if (res.success) {
      setActiveOrders((prev) => prev.filter((order) => order.id !== orderId));
    } else {
      alert("เกิดข้อผิดพลาดในการอัปเดตบิล");
    }
    setProcessingId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-pos-bg text-pos-text overflow-hidden select-none font-sans transition-colors duration-300">
      <KitchenHeader
        orderCount={orders.length}
        onRefresh={() => router.refresh()}
      />

      {/* Main Container แสดงรายการบิล */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto custom-scroll bg-pos-bg transition-colors duration-300">
        {orders.length === 0 ? (
          <KitchenEmptyState />
        ) : (
          <div className="flex gap-4 items-start min-w-max pb-4">
            {orders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                processingId={processingId}
                onServeItem={handleServeItem}
                onServeAll={handleServeAllInOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
