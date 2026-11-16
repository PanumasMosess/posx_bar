import ReceiptSlip from "@/components/receipt/ReceiptSlip";
import prisma from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Receipt | ใบเสร็จรับเงินออนไลน์",
  description: "Receipt Details | รายละเอียดใบเสร็จรับเงินของคุณ",
};

export default async function ReceiptOnlinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);

  if (!orderId || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-bold p-4 text-center">
        <p>รหัสใบเสร็จไม่ถูกต้อง</p>
        <p className="text-sm font-normal text-slate-400 mt-1">Invalid Receipt ID</p>
      </div>
    );
  }

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      qrcode: { select: { tableName: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-bold p-4 text-center">
        <p>ไม่พบข้อมูลใบเสร็จนี้ในระบบ</p>
        <p className="text-sm font-normal text-slate-400 mt-1">Receipt not found in system</p>
      </div>
    );
  }

  const payment = order.payments.length > 0 ? order.payments[0] : null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <ReceiptSlip order={order} payment={payment} />
    </div>
  );
}
