import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const smsMessage = body.sms_message;

    if (!smsMessage) {
      return NextResponse.json(
        { success: false, message: "ไม่มีข้อความส่งมา" },
        { status: 400 },
      );
    }

    // console.log("📨 ได้รับ SMS:", smsMessage);

    let amount = 0;
    let match = null;
    
    const bankSpecificPattern =
      /มีเงิน\s*([0-9,]+\.\d{2})|รับโอนจาก\S+\s+([0-9,]+\.\d{2})|(?:\s|^)([0-9,]+\.\d{2})\s+จาก/;
    match = smsMessage.match(bankSpecificPattern);

    if (match) {
      const extractedAmount = match[1] || match[2] || match[3];
      amount = parseFloat(extractedAmount.replace(/,/g, ""));
    }

    if (!amount) {
      match = smsMessage.match(
        /(?:เงินเข้า|จำนวน|จำนวนเงิน|ยอด|ยอดเงิน|รับโอนเงิน|โอนเข้า)\s*([0-9,]+\.\d{2})/,
      );
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ""));
      }
    }

    if (!amount) {
      match = smsMessage.match(/([0-9,]+\.\d{2})\s*(?:บ\.|บาท|THB|thb|Baht)/i);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ""));
      }
    }

    if (!amount) {
      match = smsMessage.match(/([0-9,]+\.\d{2})/);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ""));
      }
    }

    if (!amount) {
      match = smsMessage.match(/(?:เงินเข้า|จำนวน|ยอด)\s*([\d,]+)/);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ""));
      }
    }

    // console.log("💰 ยอดเงินที่สกัดได้:", amount);

    if (amount > 0) {
      const now = new Date();
      const intent = await prisma.qr_payment_intents.findFirst({
        where: {
          expectedAmount: amount,
          status: "PENDING",
          expiresAt: {
            gt: now, 
          },
        },
        orderBy: {
          createdAt: "asc", 
        },
      });

      if (intent) {
        await prisma.qr_payment_intents.update({
          where: { id: intent.id },
          data: {
            status: "PAID",
          },
        });

        // console.log(`✅ อัปเดต Intent ID ${intent.id} เป็น PAID สำเร็จ! ยอด: ${amount}`);
      } else {
        // console.log(`⚠️ ไม่พบรายการ QR Intent ที่รอรับยอด ${amount} หรือรายการอาจจะหมดอายุไปแล้ว`);
      }
    }

    return NextResponse.json({
      success: true,
      extractedAmount: amount,
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 },
    );
  }
}
