import { ReceiptSlipProps } from "@/lib/types";
import { renderOptionsText } from "./renderOptionsText";

export default function ReceiptSlip({ order, payment }: ReceiptSlipProps) {
  return (
    <div className="bg-white w-full max-w-[340px] rounded-sm shadow-xl relative overflow-hidden pb-6">
      {/* ขอบใบเสร็จหยักๆ ด้านบน */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmZmZmYiIHBvaW50cz0iMCwwIDgsMCA0LDgiLz48L3N2Zz4=')] bg-repeat-x -mt-[1px] z-10" />

      <div className="p-6 pt-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
            POSX
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            ใบเสร็จรับเงินออนไลน์ / Receipt
          </p>
        </div>

        <div className="space-y-3 border-b border-dashed border-slate-300 pb-4 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">หมายเลขบิล</span>
            <span className="font-bold text-slate-800">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">โต๊ะ/ลูกค้า</span>
            <span className="font-bold text-slate-800">
              {order.qrcode?.tableName || order.customerName || "ทั่วไป"}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">วันที่ทำรายการ</span>
            <span className="font-bold text-slate-800 text-right">
              {new Date(order.createdAt).toLocaleDateString("th-TH")} <br />
              {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="pt-2 mb-4">
          <h3 className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-wider">
            รายการสินค้า
          </h3>
          <div className="space-y-3">
            {order.items.map((item: any) => {
              const subOptions = renderOptionsText(item.options);
              return (
                <div
                  key={item.id}
                  className="flex justify-between text-xs items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-800 font-semibold">
                      <span className="mr-1.5">{item.quantity}x</span>
                      {item.product.name}
                    </span>
                    {subOptions && (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight ml-4">
                        {subOptions}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 shrink-0">
                    {(item.priceAtTime * item.quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed border-slate-300 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">ยอดรวม</span>
            <span className="font-bold text-slate-800">
              {order.totalAmount.toLocaleString()} LAK
            </span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span>ส่วนลด</span>
              <span>- {order.discount.toLocaleString()} LAK</span>
            </div>
          )}

          <div className="flex justify-between items-center font-black text-[15px] text-slate-900 pt-2">
            <span>ยอดชำระสุทธิ</span>
            <span>{order.netAmount.toLocaleString()} LAK</span>
          </div>
        </div>

        {payment && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>รับชำระ ({payment.method})</span>
              <span>
                {(payment.receivedAmount || payment.amount).toLocaleString()}{" "}
                LAK
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>เงินทอน</span>
              <span>{(payment.changeAmount || 0).toLocaleString()} LAK</span>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 mb-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-xs text-slate-400 font-bold">
            ชำระเงินเรียบร้อยแล้ว
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            ขอบคุณที่ใช้บริการครับ/ค่ะ
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmZmZmYiIHBvaW50cz0iMCwwIDgsMCA0LDgiLz48L3N2Zz4=')] bg-repeat-x rotate-180 mb-[1px]" />
    </div>
  );
}
