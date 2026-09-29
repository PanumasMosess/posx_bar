"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  updateKitchenItemStatusDB,
  markAllItemsServedDB,
  getActiveKitchenOrdersJSON,
} from "@/lib/actions/actionsKitchen";
import { KitchenViewProps } from "@/lib/interface";

import KitchenHeader from "./KitchenHeader";
import KitchenEmptyState from "./KitchenEmptyState";
import KitchenOrderCard from "./KitchenOrderCard";

export default function KitchenView({ activeKitchenOrders }: KitchenViewProps) {
  const [orders, setActiveOrders] = useState<any[]>(activeKitchenOrders);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const previousOrderIds = useRef<Set<number>>(
    new Set(activeKitchenOrders.map((o) => o.id)),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "https://tvposx.sgp1.cdn.digitaloceanspaces.com/uploads/sound/notification-aero.mp3",
      );
    }
  }, []);

  const testSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.error("Audio error:", e);
        alert("เบราว์เซอร์บล็อกเสียง กรุณากดอนุญาตให้เว็บไซต์เล่นเสียงได้ครับ");
      });
    }
  };

  const checkNewOrdersAndPlaySound = (currentOrders: any[]) => {
    const currentIds = currentOrders.map((o) => o.id);
    const hasNewOrder = currentIds.some(
      (id) => !previousOrderIds.current.has(id),
    );

    if (hasNewOrder && isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.log("Audio blocked:", e));
    }

    previousOrderIds.current = new Set(currentIds);
  };

  useEffect(() => {
    setActiveOrders(activeKitchenOrders);
    checkNewOrdersAndPlaySound(activeKitchenOrders);
  }, [activeKitchenOrders]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await getActiveKitchenOrdersJSON();
        if (res && res.success && res.data) {
          setActiveOrders(res.data);
          checkNewOrdersAndPlaySound(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch kitchen orders:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isSoundEnabled]);

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
        onRefresh={async () => {
          const res = await getActiveKitchenOrdersJSON();
          if (res && res.success) {
            setActiveOrders(res.data);
            checkNewOrdersAndPlaySound(res.data);
          }
        }}
      />

      {/* แถบเมนูควบคุมเสียง */}
      <div className="px-4 sm:px-6 pt-4 pb-0 flex justify-end gap-2">
        <button
          onClick={testSound}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-colors shadow-sm border bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
        >
          🎵 ทดสอบเสียง
        </button>
        <button
          onClick={() => {
            setIsSoundEnabled(!isSoundEnabled);
            // ถ้ากดเปิดเสียง ให้เล่นเสียง 1 ครั้งเพื่อยืนยันว่าทำงาน
            if (!isSoundEnabled) testSound();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-colors shadow-sm border ${
            isSoundEnabled
              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
              : "bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
          }`}
        >
          {isSoundEnabled
            ? "🔊 เปิดเสียงแจ้งเตือนแล้ว"
            : "🔇 ปิดเสียงอยู่ (กดเพื่อเปิด)"}
        </button>
      </div>

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
