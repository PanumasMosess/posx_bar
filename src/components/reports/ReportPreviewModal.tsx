"use client";

import { useState } from "react";

import { useTranslation } from "@/lib/language/LanguageContext";
import { ReportPreviewModalProps } from "@/lib/types";

export default function ReportPreviewModal({
  isOpen,
  onClose,
  title,
  reportType,
  data,
  onDownload,
}: ReportPreviewModalProps) {
  const { isThai } = useTranslation();
  const L = (th: string, en: string) => (isThai ? th : en);

  const [activeProductSheet, setActiveProductSheet] = useState<"Products" | "ProductBills">("Products");
  const [activeEmployeeSheet, setActiveEmployeeSheet] = useState<"Staff" | "StaffBills" | "StaffItems">("Staff");
  const [activeBillSheet, setActiveBillSheet] = useState<"Bills" | "BillItems">("Bills");

  if (!isOpen || !data) return null;

  const now = new Date();
  const dateSuffix =
    data.dateRangeCode ||
    `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;

  let fileName = "";
  if (reportType === "product") {
    fileName =
      data.productFilterMode === "worst"
        ? `low-sellers-${dateSuffix}.xlsx`
        : `product-sales-all-${dateSuffix}.xlsx`;
  } else if (reportType === "total") {
    fileName = `sales-summary-${dateSuffix}.xlsx`;
  } else if (reportType === "employee") {
    fileName = `staff-sales-${dateSuffix}.xlsx`;
  } else if (reportType === "bills") {
    fileName = `bills-${dateSuffix}.xlsx`;
  } else {
    fileName = `${reportType}-report-${dateSuffix}.xlsx`;
  }

  // ตัวช่วยสร้างตัวอักษรหัวคอลัมน์ A, B, C, ... AA, AB...
  const getColLetters = (count: number) => {
    const letters: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i < 26) {
        letters.push(String.fromCharCode(65 + i));
      } else {
        const first = String.fromCharCode(65 + Math.floor(i / 26) - 1);
        const second = String.fromCharCode(65 + (i % 26));
        letters.push(`${first}${second}`);
      }
    }
    return letters;
  };

  const buildSpreadsheetRows = () => {
    const shopName = data.shopName || (isThai ? "ซูชิ" : "Store");
    const dateRange = data.dateRangeText || "";
    const currency = data.currency || "THB";

    if (reportType === "total") {
      const bills = data.billsList || [];
      const totalQty = bills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
      const totalGross = bills.reduce((s: number, b: any) => s + (b.grossAmount || 0), 0);
      const totalNet = bills.reduce((s: number, b: any) => s + (b.netAmount || 0), 0);

      const rows: Array<string[]> = [
        [L("ร้าน", "Store"), shopName],
        [L("ช่วงวัน...", "Date Range..."), dateRange],
        [L("สกุลเงิน", "Currency"), currency],
        [],
        [
          L("ลำดับ", "No."),
          L("วันที่", "Date"),
          L("เวลา", "Time"),
          L("เลขที่เอกสาร", "Document No."),
          L("สถานะ", "Status"),
          L("ช่องทางชำระ", "Payment Method"),
          L("จำนวน", "Quantity"),
          L("ยอดรวม", "Subtotal"),
          L("ส่วนลดโปรโมชั่น", "Promo Discount"),
          L("ส่วนลดที่หักจากภาษีได้", "Tax-Deductible Discount"),
          L("ยอดสุทธิ", "Net Total"),
        ],
      ];

      bills.forEach((b: any, idx: number) => {
        rows.push([
          `${idx + 1}`,
          b.date || "",
          b.time || "",
          b.orderNumber || "",
          b.status || L("สำเร็จ", "Completed"),
          b.paymentMethod || L("เงินสด", "Cash"),
          `${b.quantity || 1}`,
          Number(b.grossAmount || b.netAmount || 0).toFixed(2),
          "0.00",
          "0.00",
          Number(b.netAmount || 0).toFixed(2),
        ]);
      });

      // แถวรวม
      rows.push([
        "",
        L("รวม", "Total"),
        "",
        "",
        "",
        "",
        `${totalQty}`,
        Number(totalGross || data.totalSales || 0).toFixed(2),
        "0.00",
        "0.00",
        Number(totalNet || data.totalSales || 0).toFixed(2),
      ]);

      // แถวหมายเหตุ
      rows.push([L("หมายเหตุ...", "Notes...")]);
      return { columns: getColLetters(11), rows };
    }

    if (reportType === "bills") {
      const bills = data.billsExportList || [];
      const billItems = data.billItemsExportList || [];

      if (activeBillSheet === "Bills") {
        const completedBills = bills.filter((b: any) => b.isCompleted || (b.status === "สำเร็จ" || b.status === "Completed"));
        const totalCompletedQty = completedBills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
        const totalCompletedSales = completedBills.reduce((s: number, b: any) => s + (b.paidAmount || b.grossAmount || 0), 0);

        const rows: Array<string[]> = [
          [L("ร้าน", "Store"), shopName],
          [L("ช่วงวัน...", "Date Range..."), dateRange],
          [L("สกุลเงิน", "Currency"), currency],
          [],
          [
            L("ลำดับ", "No."),
            L("เลขที่เอกสาร", "Document No."),
            L("วันที่", "Date"),
            L("เวลา", "Time"),
            L("ชื่อลูกค้า/โต๊ะ", "Customer / Table"),
            L("หมายเหตุ", "Note"),
            L("สถานะ", "Status"),
            L("ช่องทางชำระ", "Payment Method"),
            L("จำนวน", "Quantity"),
            L("ยอดรวม", "Subtotal"),
            L("ส่วนลดโปรโมชั่น", "Promo Discount"),
            L("โปรโมชั่น", "Promotion"),
            L("ส่วนลดที่พนักงานให้", "Staff Discount"),
            L("ยอดชำระ", "Paid Amount"),
            L("ค่าธรรมเนียมแอป", "App Fee"),
            L("เงินเข้าร้านจริง", "Net Income"),
            L("เงินรับ", "Received"),
            L("เงินทอน", "Change"),
            L("บันทึกร้าน-ส่วนลดโปร", "Shop Promo"),
            L("เรทค่าธรรมเนียม (%)", "Fee Rate (%)"),
            L("ค่าธรรมเนียมบัตร", "Card Fee"),
            L("เลขคิว", "Queue No."),
            L("ยกเลิกโดย", "Cancelled By"),
            L("เหตุผลที่ยกเลิก", "Cancel Reason"),
            L("แก้ไขเมื่อ", "Edited At"),
            L("แก้ไขโดย", "Edited By"),
            L("เหตุผลที่แก้ไข", "Edit Reason"),
            L("ส่วนเงินสด เบิก/ทอน", "Cash Payout/Change"),
            L("ส่วนเงินโอน เบิก/ทอน", "Transfer Payout/Change"),
            L("ประวัติโต๊ะ", "Table History"),
            L("ผู้บันทึก", "Recorded By"),
            L("ส่วนลดรายการ", "Item Discount"),
            L("ส่วนลดท้ายบิล", "Bill Discount"),
            L("VAT ที่รวมในบิล", "VAT in Bill"),
            L("เศษปัด", "Rounding"),
            L("คืนบิลเมื่อ", "Refunded At"),
            L("คืนบิลโดย", "Refunded By"),
            L("เหตุผลที่คืนบิล", "Refund Reason"),
            L("เหตุผลที่ขอยกเลิก", "Cancel Request Reason"),
          ],
        ];

        bills.forEach((b: any) => {
          rows.push([
            `${b.index}`,
            b.orderNumber || "",
            b.date || "",
            b.time || "",
            b.tableName || "",
            b.note || "",
            b.status || L("สำเร็จ", "Completed"),
            b.paymentMethod || L("เงินสด", "Cash"),
            `${b.quantity || 1}`,
            Number(b.grossAmount || 0).toFixed(2),
            "0.00",
            b.promoName || "",
            "0.00",
            Number(b.paidAmount || 0).toFixed(2),
            "0.00",
            Number(b.netIncome || 0).toFixed(2),
            b.isCompleted !== false ? Number(b.receivedAmount || 0).toFixed(2) : "",
            b.isCompleted !== false ? Number(b.changeAmount || 0).toFixed(2) : "",
            "",
            "",
            "",
            b.queueNumber || "",
            b.cancelledBy || "",
            b.cancelReason || "",
            b.editedAt || "",
            b.editedBy || "",
            b.editReason || "",
            "",
            "",
            b.tableHistory || "",
            b.cashierName || "",
            "0.00",
            "0.00",
            "0.00",
            "0.00",
            b.refundedAt || "",
            b.refundedBy || "",
            b.refundReason || "",
            b.cancelRequestReason || "",
          ]);
        });

        rows.push([
          "",
          L("รวม (เฉพาะบิลสำเร็จ)", "Total (Completed Bills Only)"),
          "",
          "",
          "",
          "",
          "",
          "",
          `${totalCompletedQty}`,
          totalCompletedSales.toFixed(2),
          "0.00",
          "",
          "0.00",
          totalCompletedSales.toFixed(2),
          "0.00",
          totalCompletedSales.toFixed(2),
          "",
          "",
          "",
          "",
          "0.00",
          "",
          "",
          "",
          "",
          "",
          "",
          "0.00",
          "0.00",
          "",
          "",
          "0.00",
          "0.00",
          "0.00",
          "0.00",
          "",
          "",
          "",
          "",
        ]);

        rows.push([L("หมายเหตุ...", "Notes...")]);
        return { columns: getColLetters(39), rows };
      }

      const completedItems = billItems.filter((it: any) => it.isCompleted !== false && (it.status !== "ยกเลิก" && it.status !== "Cancelled"));
      const totalItemQty = completedItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalItemGross = completedItems.reduce((s: number, it: any) => s + (it.grossAmount || 0), 0);
      const totalItemNet = completedItems.reduce((s: number, it: any) => s + (it.netSales || it.grossAmount || 0), 0);

      const rows: Array<string[]> = [
        [L("ร้าน", "Store"), shopName],
        [L("ช่วงวัน...", "Date Range..."), dateRange],
        [L("สกุลเงิน", "Currency"), currency],
        [],
        [
          L("ลำดับ", "No."),
          L("เลขที่เอกสาร", "Document No."),
          L("วันที่", "Date"),
          L("เวลา", "Time"),
          L("สถานะ", "Status"),
          L("ชื่อสินค้า", "Product Name"),
          L("รหัสสินค้า", "Product Code"),
          L("ตัวเลือก", "Options"),
          L("หมายเหตุ", "Note"),
          L("จำนวน", "Quantity"),
          L("ยอดรวม", "Subtotal"),
          L("ส่วนลดโปรโมชั่น", "Promo Discount"),
          L("ส่วนลดรายการ", "Item Discount"),
          L("ยอดขายสุทธิ", "Net Sales"),
        ],
      ];

      billItems.forEach((it: any) => {
        rows.push([
          `${it.index}`,
          it.orderNumber || "",
          it.date || "",
          it.time || "",
          it.status || L("สำเร็จ", "Completed"),
          it.productName || "",
          it.productCode || "",
          it.options || "",
          it.note || "",
          `${it.quantity || 0}`,
          Number(it.grossAmount || 0).toFixed(2),
          "0.00",
          "0.00",
          Number(it.netSales || it.grossAmount || 0).toFixed(2),
        ]);
      });

      rows.push([
        "",
        L("รวม (เฉพาะบิลสำเร็จ)", "Total (Completed Bills Only)"),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        `${totalItemQty}`,
        totalItemGross.toFixed(2),
        "0.00",
        "0.00",
        totalItemNet.toFixed(2),
      ]);

      rows.push([L("หมายเหตุ...", "Notes...")]);
      return { columns: getColLetters(14), rows };
    }

    if (reportType === "product") {
      if (data.productFilterMode === "worst") {
        // ========================================================
        // 📉 โหมดขายไม่ดี
        // มี 11 คอลัมน์: A ถึง K
        // รวมถึง มูลค่าสต๊อกคงเหลือ และ สถานะ (ไม่ขายเลย / ขายได้น้อย)
        // ช่องรวมตรงสถานะ: ไม่ขายเลย ... รายการ
        // ========================================================
        const items = data.worst?.quantity || [];
        const unsoldProductsCount = items.filter((p: any) => p.quantity === 0).length;

        const totalQty = items.reduce((s: number, p: any) => s + (p.quantity || 0), 0);
        const totalSales = items.reduce((s: number, p: any) => s + (p.sales || 0), 0);
        const totalProfit = items.reduce((s: number, p: any) => s + (p.profit || 0), 0);
        const totalStock = items.reduce((s: number, p: any) => s + (p.stock || 0), 0);
        const totalStockVal = items.reduce(
          (s: number, p: any) => s + (p.stock || 0) * (p.cost || p.price || 0),
          0
        );

        const rows: Array<string[]> = [
          [L("ร้าน", "Store"), shopName],
          [L("ช่วงวัน...", "Date Range..."), dateRange],
          [L("สกุลเงิน", "Currency"), currency],
          [],
          [
            L("ลำดับ", "No."),
            L("ชื่อสินค้า", "Product Name"),
            L("รหัสสินค้า", "Product Code"),
            L("หมวดหมู่", "Category"),
            L("ราคาขาย", "Price"),
            L("จำนวนขาย", "Qty Sold"),
            L("ยอดขายรวม", "Total Sales"),
            L("กำไรขั้นต้น", "Gross Profit"),
            L("คงเหลือในสต๊อก", "In Stock"),
            L("มูลค่าสต๊อกคงเหลือ", "Stock Value"),
            L("สถานะ", "Status"),
          ],
        ];

        items.forEach((p: any, idx: number) => {
          rows.push([
            `${idx + 1}`,
            p.name || "",
            p.code || "",
            p.categoryName || "",
            Number(p.price || 0).toFixed(2),
            `${p.quantity || 0}`,
            Number(p.sales || 0).toFixed(2),
            Number(p.profit || 0).toFixed(2),
            `${p.stock ?? 0}`,
            Number((p.stock ?? 0) * (p.cost || p.price || 0)).toFixed(2),
            p.quantity === 0 ? L("ไม่ขายเลย", "Unsold") : L("ขายได้น้อย", "Low Sales"),
          ]);
        });

        // แถวรวม
        rows.push([
          "",
          L("รวม", "Total"),
          "",
          "",
          "",
          `${totalQty}`,
          totalSales.toFixed(2),
          totalProfit.toFixed(2),
          `${totalStock}`,
          totalStockVal.toFixed(2),
          isThai ? `ไม่ขายเลย ${unsoldProductsCount} รายการ` : `${unsoldProductsCount} Unsold Items`,
        ]);

        rows.push([L("หมายเหตุ...", "Notes...")]);
        return { columns: getColLetters(11), rows };
      }

      // ========================================================
      // 📈 โหมดขายดี
      // ========================================================
      if (activeProductSheet === "Products") {
        // Sheet 1: Products
        const items = data.best?.quantity || [];
        const totalQty = items.reduce((s: number, p: any) => s + (p.quantity || 0), 0);
        const totalSales = items.reduce((s: number, p: any) => s + (p.sales || 0), 0);
        const totalCost = items.reduce(
          (s: number, p: any) => s + (p.quantity || 0) * (p.cost || 0),
          0
        );
        const totalProfit = items.reduce((s: number, p: any) => s + (p.profit || 0), 0);
        const avgProfitPct = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;
        const avgPrice = totalQty > 0 ? Number(totalSales / totalQty).toFixed(2) : "0.00";

        const rows: Array<string[]> = [
          [L("ร้าน", "Store"), shopName],
          [L("ช่วงวัน...", "Date Range..."), dateRange],
          [L("สกุลเงิน", "Currency"), currency],
          [],
          [
            L("ลำดับ", "No."),
            L("ชื่อสินค้า", "Product Name"),
            L("รหัสสินค้า", "Product Code"),
            L("หมวดหมู่", "Category"),
            L("จำนวนขาย", "Qty Sold"),
            L("ยอดขายรวม", "Total Sales"),
            L("ส่วนลดโปรโมชั่น", "Promo Discount"),
            L("ส่วนลดที่พนักงานให้", "Staff Discount"),
            L("ค่าธรรมเนียม", "Fee"),
            L("ค่าบริการ", "Service Charge"),
            L("ยอดขายสุทธิ", "Net Sales"),
            L("ต้นทุนรวม", "Total Cost"),
            L("กำไรขั้นต้น", "Gross Profit"),
            L("%กำไร", "% Profit"),
            L("ราคาเฉลี่ย/ชิ้น", "Avg Price/Piece"),
            L("VAT ที่รวมในราคา", "VAT in Price"),
            L("เศษปัด", "Rounding"),
            L("ค่าส่งกลับบ้าน", "Takeaway Fee"),
          ],
        ];

        items.forEach((p: any, idx: number) => {
          const qty = p.quantity || 0;
          const sales = Number(p.sales || 0);
          const cost = Number(qty * (p.cost || 0));
          const profit = Number(p.profit || 0);
          const pct = sales > 0 ? Math.round((profit / sales) * 100) : 0;
          const avg = qty > 0 ? Number(sales / qty).toFixed(2) : "0.00";

          rows.push([
            `${idx + 1}`,
            p.name || "",
            p.code || "",
            p.categoryName || "",
            `${qty}`,
            sales.toFixed(2),
            "0.00",
            "0.00",
            "0.00",
            "0.00",
            sales.toFixed(2),
            cost.toFixed(2),
            profit.toFixed(2),
            `${pct}`,
            avg,
            "0.00",
            "0.00",
            "0.00",
          ]);
        });

        // แถวรวม
        rows.push([
          "",
          L("รวม", "Total"),
          "",
          "",
          `${totalQty}`,
          totalSales.toFixed(2),
          "0.00",
          "0.00",
          "0.00",
          "0.00",
          totalSales.toFixed(2),
          totalCost.toFixed(2),
          totalProfit.toFixed(2),
          `${avgProfitPct}`,
          avgPrice,
          "0.00",
          "0.00",
          "0.00",
        ]);

        rows.push([L("หมายเหตุ...", "Notes...")]);
        return { columns: getColLetters(18), rows };
      }

      // Sheet 2: ProductBills 
      const bills = data.productBillsList || [];
      const billsQty = bills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
      const billsSales = bills.reduce((s: number, b: any) => s + (b.sales || 0), 0);
      const billsCost = bills.reduce((s: number, b: any) => s + (b.cost || 0), 0);
      const billsProfit = bills.reduce((s: number, b: any) => s + (b.grossProfit || 0), 0);

      const rows: Array<string[]> = [
        [L("ร้าน", "Store"), shopName],
        [L("ช่วงวัน...", "Date Range..."), dateRange],
        [L("สกุลเงิน", "Currency"), currency],
        [],
        [
          L("ลำดับ", "No."),
          L("เลขที่เอกสาร", "Document No."),
          L("วันที่", "Date"),
          L("เวลา", "Time"),
          L("ชื่อสินค้า", "Product Name"),
          L("รหัสสินค้า", "Product Code"),
          L("หมวดหมู่", "Category"),
          L("จำนวน", "Quantity"),
          L("ยอดขาย", "Sales"),
          L("ส่วนลดโปรโมชั่น", "Promo Discount"),
          L("ส่วนลดที่พนักงานให้", "Staff Discount"),
          L("ค่าธรรมเนียม", "Fee"),
          L("ยอดขายสุทธิ", "Net Sales"),
          L("ต้นทุน", "Cost"),
          L("กำไรขั้นต้น", "Gross Profit"),
          L("VAT ที่รวมในราคา", "VAT in Price"),
          L("เศษปัด", "Rounding"),
          L("ผู้บันทึก", "Recorded By"),
          L("ค่าส่งกลับบ้าน", "Takeaway Fee"),
        ],
      ];

      bills.forEach((b: any, idx: number) => {
        rows.push([
          `${idx + 1}`,
          b.orderNumber || "",
          b.date || "",
          b.time || "",
          b.productName || "",
          b.productCode || "",
          b.categoryName || "",
          `${b.quantity || 1}`,
          Number(b.sales || 0).toFixed(2),
          "0.00",
          "0.00",
          "0.00",
          Number(b.netSales || b.sales || 0).toFixed(2),
          Number(b.cost || 0).toFixed(2),
          Number(b.grossProfit || 0).toFixed(2),
          "0.00",
          "0.00",
          b.cashierName || "Admin",
          "0.00",
        ]);
      });

      // แถวรวม
      rows.push([
        "",
        L("รวม", "Total"),
        "",
        "",
        "",
        "",
        "",
        `${billsQty}`,
        billsSales.toFixed(2),
        "0.00",
        "0.00",
        "0.00",
        billsSales.toFixed(2),
        billsCost.toFixed(2),
        billsProfit.toFixed(2),
        "0.00",
        "0.00",
        "",
        "0.00",
      ]);

      rows.push([L("หมายเหตุ...", "Notes...")]);
      return { columns: getColLetters(19), rows };
    }

    // Employee report
    const employees = data.employees || [];
    const staffBills = data.staffBillsList || [];
    const staffItems = data.staffItemsList || [];

    // Sheet 1: Staff
    if (activeEmployeeSheet === "Staff") {
      const totalBills = employees.reduce((s: number, e: any) => s + (e.completedBills || 0), 0);
      const totalSales = employees.reduce((s: number, e: any) => s + (e.totalSales || 0), 0);
      const avgBill = totalBills > 0 ? totalSales / totalBills : 0;
      const totalCash = employees.reduce((s: number, e: any) => s + (e.cashSales || 0), 0);
      const totalTransfer = employees.reduce((s: number, e: any) => s + (e.transferSales || 0), 0);
      const totalCancelled = employees.reduce((s: number, e: any) => s + (e.cancelledBills || 0), 0);

      const rows: Array<string[]> = [
        [L("ร้าน", "Store"), shopName],
        [L("ช่วงวัน...", "Date Range..."), dateRange],
        [L("สกุลเงิน", "Currency"), currency],
        [],
        [
          L("ลำดับ", "No."),
          L("พนักงาน", "Staff"),
          L("จำนวนบิล", "Bills Count"),
          L("ยอดขาย", "Sales"),
          L("% ของยอดขาย", "% of Sales"),
          L("เฉลี่ย/บิล", "Avg/Bill"),
          L("เงินสด", "Cash"),
          L("โอน", "Transfer"),
          L("เดลิเวอรี่", "Delivery"),
          L("ยกเลิกบิล (ใบ)", "Cancelled Bills"),
          L("ยอดบิลที่ยกเลิก", "Cancelled Amount"),
          L("ลบสินค้า (ชิ้น)", "Deleted Items"),
          L("ยอดสินค้าที่ลบ", "Deleted Amount"),
          L("สั่งเปิดลิ้นชัก (ครั้ง)", "Drawer Opens"),
          L("ใส่เงินเข้าลิ้นชัก", "Cash In"),
          L("นำเงินออกจากลิ้นชัก", "Cash Out"),
          L("เปิดกะไม่ส่งยอด", "Unsubmitted Shifts"),
          L("ส่วนลดรายการ", "Item Discount"),
          L("ส่วนลดท้ายบิล", "Bill Discount"),
          L("ฟรีบิล (ครั้ง)", "Free Bills"),
          L("คืนบิล (ใบ)", "Refunded Bills"),
          L("บัตรเครดิต", "Credit Card"),
          L("ยอดขายสุทธิ", "Net Sales"),
        ],
      ];

      employees.forEach((e: any, idx: number) => {
        rows.push([
          `${idx + 1}`,
          e.name || "",
          `${e.completedBills || 0}`,
          Number(e.totalSales || 0).toFixed(2),
          `${e.percentage || 0}`,
          Number(e.averageBill || 0).toFixed(2),
          Number(e.cashSales || 0).toFixed(2),
          Number(e.transferSales || 0).toFixed(2),
          "0.00",
          `${e.cancelledBills || 0}`,
          "0.00",
          "0",
          "0.00",
          "0",
          "0.00",
          "0.00",
          "0",
          "0.00",
          "0.00",
          "0",
          "0",
          "0.00",
          Number(e.totalSales || 0).toFixed(2),
        ]);
      });
      rows.push([
        "",
        L("รวม", "Total"),
        `${totalBills}`,
        totalSales.toFixed(2),
        "",
        avgBill.toFixed(2),
        totalCash.toFixed(2),
        totalTransfer.toFixed(2),
        "0.00",
        `${totalCancelled}`,
        "0.00",
        "0",
        "0.00",
        "0",
        "0.00",
        "0.00",
        "0",
        "0.00",
        "0.00",
        "0",
        "0",
        "0.00",
        totalSales.toFixed(2),
      ]);

      rows.push([L("หมายเหตุ...", "Notes...")]);
      rows.push([L("ยกเลิก...", "Cancelled...")]);
      return { columns: getColLetters(23), rows };
    }

    // Sheet 2: StaffBills
    if (activeEmployeeSheet === "StaffBills") {
      const totalPaid = staffBills.reduce((s: number, b: any) => s + (b.paidAmount || b.netAmount || 0), 0);
      const totalBillsNet = staffBills.reduce((s: number, b: any) => s + (b.netAmount || 0), 0);

      const rows: Array<string[]> = [
        [L("ร้าน", "Store"), shopName],
        [L("ช่วงวัน...", "Date Range..."), dateRange],
        [L("สกุลเงิน", "Currency"), currency],
        [],
        [
          L("ลำดับ", "No."),
          L("เลขที่เอกสาร", "Document No."),
          L("วันที่", "Date"),
          L("เวลา", "Time"),
          L("พนักงาน", "Staff"),
          L("ชื่อลูกค้า/โต๊ะ", "Customer / Table"),
          L("ช่องทางชำระ", "Payment Method"),
          L("ยอดชำระ", "Paid Amount"),
          L("ส่วนลดรายการ", "Item Discount"),
          L("ส่วนลดท้ายบิล", "Bill Discount"),
          L("ยอดสุทธิ", "Net Total"),
        ],
      ];

      staffBills.forEach((b: any, idx: number) => {
        rows.push([
          `${idx + 1}`,
          b.orderNumber || "",
          b.date || "",
          b.time || "",
          b.employeeName || "",
          b.customerOrTable || "",
          b.paymentMethod || L("เงินสด", "Cash"),
          Number(b.paidAmount || b.netAmount || 0).toFixed(2),
          "0.00",
          "0.00",
          Number(b.netAmount || 0).toFixed(2),
        ]);
      });

      rows.push([
        "",
        L("รวม", "Total"),
        "",
        "",
        "",
        "",
        "",
        totalPaid.toFixed(2),
        "0.00",
        "0.00",
        totalBillsNet.toFixed(2),
      ]);

      rows.push([L("หมายเหตุ...", "Notes...")]);
      return { columns: getColLetters(11), rows };
    }

    // Sheet 3: StaffItems
    const totalItemsQty = staffItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
    const totalItemsSales = staffItems.reduce((s: number, it: any) => s + (it.sales || 0), 0);

    const rows: Array<string[]> = [
      [L("ร้าน", "Store"), shopName],
      [L("ช่วงวัน...", "Date Range..."), dateRange],
      [L("สกุลเงิน", "Currency"), currency],
      [],
      [
        L("ลำดับ", "No."),
        L("พนักงาน", "Staff"),
        L("ชื่อสินค้า", "Product Name"),
        L("รหัสสินค้า", "Product Code"),
        L("หมวดหมู่", "Category"),
        L("จำนวนขาย", "Qty Sold"),
        L("ยอดขายรวม", "Total Sales"),
        L("ยอดขายสุทธิ", "Net Sales"),
      ],
    ];

    staffItems.forEach((it: any, idx: number) => {
      rows.push([
        `${idx + 1}`,
        it.employeeName || "",
        it.productName || "",
        it.productCode || "",
        it.categoryName || "",
        `${it.quantity || 0}`,
        Number(it.sales || 0).toFixed(2),
        Number(it.netSales || it.sales || 0).toFixed(2),
      ]);
    });

    rows.push([
      "",
      L("รวม", "Total"),
      "",
      "",
      "",
      `${totalItemsQty}`,
      totalItemsSales.toFixed(2),
      totalItemsSales.toFixed(2),
    ]);

    rows.push([L("หมายเหตุ...", "Notes...")]);
    return { columns: getColLetters(8), rows };
  };

  const { columns, rows } = buildSpreadsheetRows();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Green Excel Icon */}
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {isThai ? "ตัวอย่างไฟล์ก่อนดาวน์โหลด" : "File Preview Before Download"}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {fileName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs inline-block min-w-full">
            <table className="border-collapse text-[11px] font-sans w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                  {/* Top-left corner cell */}
                  <th className="w-10 min-w-10 py-1 px-2 border-r border-slate-300 dark:border-slate-700 text-center font-normal text-slate-400 text-[10px]">
                    
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="py-1 px-3 border-r border-slate-300 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400 text-center text-[11px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((rowCells, rIdx) => {
                  const rowNumber = rIdx + 1;
                  const isHeaderRow = rowNumber === 5;
                  const isSummaryRow = typeof rowCells[1] === "string" && rowCells[1].startsWith(L("รวม", "Total"));

                  return (
                    <tr
                      key={rowNumber}
                      className={`border-b border-slate-200 dark:border-slate-800 ${
                        isHeaderRow
                          ? "bg-slate-50/80 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-slate-100"
                          : isSummaryRow
                            ? "bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-slate-100"
                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      {/* Row number column */}
                      <td className="py-1 px-2 bg-slate-100 dark:bg-slate-800/90 border-r border-slate-300 dark:border-slate-700 text-center font-normal text-slate-400 text-[10px] select-none">
                        {rowNumber}
                      </td>

                      {/* Row Cells */}
                      {columns.map((col, cIdx) => {
                        const cellVal = rowCells[cIdx] || "";
                        const isNumber =
                          !isNaN(Number(cellVal)) &&
                          cellVal !== "" &&
                          !cellVal.includes("/") &&
                          !cellVal.includes(":") &&
                          !cellVal.includes("-");

                        return (
                          <td
                            key={col}
                            className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap ${
                              isHeaderRow
                                ? "text-center font-bold text-slate-800 dark:text-slate-100"
                                : isNumber
                                  ? "text-right font-mono"
                                  : "text-left"
                            }`}
                          >
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {reportType === "product" && data.productFilterMode !== "worst" && (
          <div className="bg-slate-100 dark:bg-slate-800/90 px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 select-none font-medium">
              {isThai ? "2 ชีต" : "2 Sheets"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveProductSheet("Products")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeProductSheet === "Products"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => setActiveProductSheet("ProductBills")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeProductSheet === "ProductBills"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                ProductBills
              </button>
            </div>
          </div>
        )}

        {reportType === "employee" && (
          <div className="bg-slate-100 dark:bg-slate-800/90 px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 select-none font-medium">
              {isThai ? "3 ชีต" : "3 Sheets"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveEmployeeSheet("Staff")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeEmployeeSheet === "Staff"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => setActiveEmployeeSheet("StaffBills")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeEmployeeSheet === "StaffBills"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                StaffBills
              </button>
              <button
                type="button"
                onClick={() => setActiveEmployeeSheet("StaffItems")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeEmployeeSheet === "StaffItems"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                StaffItems
              </button>
            </div>
          </div>
        )}

        {reportType === "bills" && (
          <div className="bg-slate-100 dark:bg-slate-800/90 px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 select-none font-medium">
              {isThai ? "2 ชีต" : "2 Sheets"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveBillSheet("Bills")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeBillSheet === "Bills"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Bills
              </button>
              <button
                type="button"
                onClick={() => setActiveBillSheet("BillItems")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeBillSheet === "BillItems"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                BillItems
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => {
              onDownload();
              onClose();
            }}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[#0d7482] hover:bg-[#0b6470] dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isThai ? "ดาวน์โหลด Excel (.xlsx)" : "Download Excel (.xlsx)"}
          </button>
        </div>
      </div>
    </div>
  );
}
