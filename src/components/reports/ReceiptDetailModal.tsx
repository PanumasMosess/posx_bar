"use client";

import { useEffect, useState } from "react";
import ReceiptSlip from "@/components/receipt/ReceiptSlip";
import { getOrderReceiptAction } from "@/lib/actions/actionsReports";

import { ReceiptDetailModalProps, OrderData } from "@/lib/types";

export default function ReceiptDetailModal({
  orderId,
  onClose,
}: ReceiptDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [prevOrderId, setPrevOrderId] = useState<number | null>(null);

  if (orderId !== prevOrderId) {
    setPrevOrderId(orderId);
    setOrder(null);
    setLoading(Boolean(orderId));
  }

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    getOrderReceiptAction(orderId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setOrder(res.data as OrderData);
        }
      })
      .catch((err) => {
        console.error("Failed to load receipt:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (!orderId) return null;

  const payment = order?.payments?.[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            รายละเอียดใบเสร็จ
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-4 overflow-y-auto flex-1 flex justify-center bg-slate-100 dark:bg-slate-950">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              กำลังโหลดใบเสร็จ...
            </div>
          ) : order ? (
            <ReceiptSlip order={order} payment={payment} />
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              ไม่พบข้อมูลใบเสร็จ
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white shadow-sm transition"
          >
            พิมพ์ใบเสร็จ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}