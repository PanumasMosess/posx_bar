import * as XLSX from "xlsx";
import { ReportTabKey } from "@/lib/types";

export function exportReportToExcel(
  reportType: ReportTabKey,
  data: any,
  fileName: string = "report"
) {
  const isThai = data?.isThai !== false;
  const L = (th: string, en: string) => (isThai ? th : en);
  try {
    const isThai = data?.isThai !== false;
    const L = (th: string, en: string) => (isThai ? th : en);
    const wb = XLSX.utils.book_new();

    if (reportType === "total") {
      const bills = data.billsList || [];
      const totalQty = bills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
      const totalGross = bills.reduce((s: number, b: any) => s + (b.grossAmount || 0), 0);
      const totalNet = bills.reduce((s: number, b: any) => s + (b.netAmount || 0), 0);

      const summarySheetData: any[] = [
        [L("ร้าน", "Store"), data.shopName || (isThai ? "ร้านค้า" : "Store")],
        [L("ช่วงวัน", "Date Range"), data.dateRangeText || ""],
        [L("สกุลเงิน", "Currency"), "THB"],
        [],
        [L("ลำดับ", "No."), L("วันที่", "Date"), L("เวลา", "Time"), L("เลขที่เอกสาร", "Document No."), L("สถานะ", "Status"), L("ช่องทางชำระ", "Payment Method"), L("จำนวน", "Quantity"), L("ยอดรวม", "Subtotal"), L("ส่วนลดโปรโมชั่น", "Promo Discount"), L("ส่วนลดที่หักจากภาษีได้", "Tax-Deductible Discount"), L("ยอดสุทธิ", "Net Total")],
        ...bills.map((b: any) => [
          b.index,
          b.date,
          b.time,
          b.orderNumber,
          b.status,
          b.paymentMethod,
          b.quantity,
          Number(b.grossAmount || 0).toFixed(2),
          "0.00",
          "0.00",
          Number(b.netAmount || 0).toFixed(2),
        ]),
        ["", L("รวม", "Total"), "", "", "", "", totalQty, Number(totalGross).toFixed(2), "0.00", "0.00", Number(totalNet).toFixed(2)],
        [L("หมายเหตุ...", "Notes...")],
      ];

      const ws = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, ws, "sales-summary");
    } else if (reportType === "product") {
      const isLowSellers = data.productFilterMode === "worst";
      const shopName = data.shopName || (isThai ? "ซูชิ" : "Store");
      const dateRange = data.dateRangeText || "";
      const currency = "THB";

      if (isLowSellers) {
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

        const lowSellersSheetData = [
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
          ...items.map((p: any, idx: number) => [
            idx + 1,
            p.name,
            p.code || "",
            p.categoryName || "",
            Number(p.price || 0).toFixed(2),
            p.quantity || 0,
            Number(p.sales || 0).toFixed(2),
            Number(p.profit || 0).toFixed(2),
            p.stock ?? 0,
            Number((p.stock ?? 0) * (p.cost || p.price || 0)).toFixed(2),
            p.quantity === 0 ? L("ไม่ขายเลย", "Unsold") : L("ขายได้น้อย", "Low Sales"),
          ]),
          [
            "",
            L("รวม", "Total"),
            "",
            "",
            "",
            totalQty,
            totalSales.toFixed(2),
            totalProfit.toFixed(2),
            totalStock,
            totalStockVal.toFixed(2),
            isThai ? `ไม่ขายเลย ${unsoldProductsCount} รายการ` : `${unsoldProductsCount} Unsold Items`,
          ],
          [L("หมายเหตุ...", "Notes...")],
        ];

        const ws = XLSX.utils.aoa_to_sheet(lowSellersSheetData);
        XLSX.utils.book_append_sheet(wb, ws, "LowSellers");
      } else {
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

        const productsSheetData = [
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
          ...items.map((p: any, idx: number) => {
            const qty = p.quantity || 0;
            const sales = Number(p.sales || 0);
            const cost = Number(qty * (p.cost || 0));
            const profit = Number(p.profit || 0);
            const pct = sales > 0 ? Math.round((profit / sales) * 100) : 0;
            const avg = qty > 0 ? Number(sales / qty).toFixed(2) : "0.00";
            return [
              idx + 1,
              p.name,
              p.code || "",
              p.categoryName || "",
              qty,
              sales.toFixed(2),
              "0.00",
              "0.00",
              "0.00",
              "0.00",
              sales.toFixed(2),
              cost.toFixed(2),
              profit.toFixed(2),
              pct,
              avg,
              "0.00",
              "0.00",
              "0.00",
            ];
          }),
          [
            "",
            L("รวม", "Total"),
            "",
            "",
            totalQty,
            totalSales.toFixed(2),
            "0.00",
            "0.00",
            "0.00",
            "0.00",
            totalSales.toFixed(2),
            totalCost.toFixed(2),
            totalProfit.toFixed(2),
            avgProfitPct,
            avgPrice,
            "0.00",
            "0.00",
            "0.00",
          ],
          [L("หมายเหตุ...", "Notes...")],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(productsSheetData);
        XLSX.utils.book_append_sheet(wb, ws1, "Products");

        const bills = data.productBillsList || [];
        const billsQty = bills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
        const billsSales = bills.reduce((s: number, b: any) => s + (b.sales || 0), 0);
        const billsCost = bills.reduce((s: number, b: any) => s + (b.cost || 0), 0);
        const billsProfit = bills.reduce((s: number, b: any) => s + (b.grossProfit || 0), 0);

        const billsSheetData = [
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
          ...bills.map((b: any, idx: number) => [
            idx + 1,
            b.orderNumber,
            b.date,
            b.time,
            b.productName,
            b.productCode || "",
            b.categoryName || "",
            b.quantity,
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
          ]),
          [
            "",
            L("รวม", "Total"),
            "",
            "",
            "",
            "",
            "",
            billsQty,
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
          ],
          [L("หมายเหตุ...", "Notes...")],
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(billsSheetData);
        XLSX.utils.book_append_sheet(wb, ws2, "ProductBills");
      }
    } else if (reportType === "employee") {
      const shopName = data.shopName || (isThai ? "ซูชิ" : "Store");
      const dateRange = data.dateRangeText || "";
      const currency = "THB";
      const employees = data.employees || [];
      const staffBills = data.staffBillsList || [];
      const staffItems = data.staffItemsList || [];

      const totalBills = employees.reduce((s: number, e: any) => s + (e.completedBills || 0), 0);
      const totalSales = employees.reduce((s: number, e: any) => s + (e.totalSales || 0), 0);
      const avgBill = totalBills > 0 ? totalSales / totalBills : 0;
      const totalCash = employees.reduce((s: number, e: any) => s + (e.cashSales || 0), 0);
      const totalTransfer = employees.reduce((s: number, e: any) => s + (e.transferSales || 0), 0);
      const totalCancelled = employees.reduce((s: number, e: any) => s + (e.cancelledBills || 0), 0);

      const staffSheetData: any[] = [
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
        ...employees.map((e: any, idx: number) => [
          idx + 1,
          e.name,
          e.completedBills || 0,
          Number(e.totalSales || 0).toFixed(2),
          e.percentage || 0,
          Number(e.averageBill || 0).toFixed(2),
          Number(e.cashSales || 0).toFixed(2),
          Number(e.transferSales || 0).toFixed(2),
          "0.00",
          e.cancelledBills || 0,
          "0.00",
          0,
          "0.00",
          0,
          "0.00",
          "0.00",
          0,
          "0.00",
          "0.00",
          0,
          0,
          "0.00",
          Number(e.totalSales || 0).toFixed(2),
        ]),
        [
          "",
          L("รวม", "Total"),
          totalBills,
          totalSales.toFixed(2),
          "",
          avgBill.toFixed(2),
          totalCash.toFixed(2),
          totalTransfer.toFixed(2),
          "0.00",
          totalCancelled,
          "0.00",
          0,
          "0.00",
          0,
          "0.00",
          "0.00",
          0,
          "0.00",
          "0.00",
          0,
          0,
          "0.00",
          totalSales.toFixed(2),
        ],
        [L("หมายเหตุ...", "Notes...")],
        [L("ยกเลิก...", "Cancelled...")],
      ];
      const wsStaff = XLSX.utils.aoa_to_sheet(staffSheetData);
      XLSX.utils.book_append_sheet(wb, wsStaff, "Staff");

      const totalPaid = staffBills.reduce((s: number, b: any) => s + (b.paidAmount || b.netAmount || 0), 0);
      const totalBillsNet = staffBills.reduce((s: number, b: any) => s + (b.netAmount || 0), 0);

      const staffBillsSheetData: any[] = [
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
        ...staffBills.map((b: any, idx: number) => [
          idx + 1,
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
        ]),
        [
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
        ],
        [L("หมายเหตุ...", "Notes...")],
      ];
      const wsBills = XLSX.utils.aoa_to_sheet(staffBillsSheetData);
      XLSX.utils.book_append_sheet(wb, wsBills, "StaffBills");

      const totalItemsQty = staffItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalItemsSales = staffItems.reduce((s: number, it: any) => s + (it.sales || 0), 0);

      const staffItemsSheetData: any[] = [
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
        ...staffItems.map((it: any, idx: number) => [
          idx + 1,
          it.employeeName || "",
          it.productName || "",
          it.productCode || "",
          it.categoryName || "",
          it.quantity || 0,
          Number(it.sales || 0).toFixed(2),
          Number(it.netSales || it.sales || 0).toFixed(2),
        ]),
        [
          "",
          L("รวม", "Total"),
          "",
          "",
          "",
          totalItemsQty,
          totalItemsSales.toFixed(2),
          totalItemsSales.toFixed(2),
        ],
        [L("หมายเหตุ...", "Notes...")],
      ];
      const wsItems = XLSX.utils.aoa_to_sheet(staffItemsSheetData);
      XLSX.utils.book_append_sheet(wb, wsItems, "StaffItems");
    } else if (reportType === "bills") {
      const shopName = data.shopName || (isThai ? "ซูชิ" : "Store");
      const dateRange = data.dateRangeText || "";
      const currency = "THB";
      const bills = data.billsExportList || [];
      const billItems = data.billItemsExportList || [];

      const completedBills = bills.filter((b: any) => b.isCompleted || (b.status === "สำเร็จ" || b.status === "Completed"));
      const totalCompletedQty = completedBills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
      const totalCompletedSales = completedBills.reduce((s: number, b: any) => s + (b.paidAmount || b.grossAmount || 0), 0);

      const billsSheetData: any[] = [
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
        ...bills.map((b: any) => [
          b.index,
          b.orderNumber || "",
          b.date || "",
          b.time || "",
          b.tableName || "",
          b.note || "",
          b.status || L("สำเร็จ", "Completed"),
          b.paymentMethod || L("เงินสด", "Cash"),
          b.quantity || 1,
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
        ]),
        [
          "",
          L("รวม (เฉพาะบิลสำเร็จ)", "Total (Completed Bills Only)"),
          "",
          "",
          "",
          "",
          "",
          "",
          totalCompletedQty,
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
        ],
        [L("หมายเหตุ...", "Notes...")],
      ];
      const wsBills = XLSX.utils.aoa_to_sheet(billsSheetData);
      XLSX.utils.book_append_sheet(wb, wsBills, "Bills");

      const completedItems = billItems.filter((it: any) => it.isCompleted !== false && (it.status !== "ยกเลิก" && it.status !== "Cancelled"));
      const totalItemQty = completedItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalItemGross = completedItems.reduce((s: number, it: any) => s + (it.grossAmount || 0), 0);
      const totalItemNet = completedItems.reduce((s: number, it: any) => s + (it.netSales || it.grossAmount || 0), 0);

      const billItemsSheetData: any[] = [
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
        ...billItems.map((it: any) => [
          it.index,
          it.orderNumber || "",
          it.date || "",
          it.time || "",
          it.status || L("สำเร็จ", "Completed"),
          it.productName || "",
          it.productCode || "",
          it.options || "",
          it.note || "",
          it.quantity || 0,
          Number(it.grossAmount || 0).toFixed(2),
          "0.00",
          "0.00",
          Number(it.netSales || it.grossAmount || 0).toFixed(2),
        ]),
        [
          "",
          L("รวม (เฉพาะบิลสำเร็จ)", "Total (Completed Bills Only)"),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          totalItemQty,
          totalItemGross.toFixed(2),
          "0.00",
          "0.00",
          totalItemNet.toFixed(2),
        ],
        [L("หมายเหตุ...", "Notes...")],
      ];
      const wsBillItems = XLSX.utils.aoa_to_sheet(billItemsSheetData);
      XLSX.utils.book_append_sheet(wb, wsBillItems, "BillItems");
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Export to Excel failed:", error);
    alert(isThai ? "เกิดข้อผิดพลาดในการดาวน์โหลด Excel" : "Error downloading Excel file");
  }
}

