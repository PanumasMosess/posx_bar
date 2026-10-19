import * as XLSX from "xlsx";
import { ReportTabKey } from "@/lib/types";

export function exportReportToExcel(
  reportType: ReportTabKey,
  data: any,
  fileName: string = "report"
) {
  try {
    const wb = XLSX.utils.book_new();

    if (reportType === "total") {
      const bills = data.billsList || [];
      const totalQty = bills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
      const totalGross = bills.reduce((s: number, b: any) => s + (b.grossAmount || 0), 0);
      const totalNet = bills.reduce((s: number, b: any) => s + (b.netAmount || 0), 0);

      const summarySheetData: any[] = [
        ["ร้าน", data.shopName || "ร้านค้า"],
        ["ช่วงวัน", data.dateRangeText || ""],
        ["สกุลเงิน", "THB"],
        [],
        ["ลำดับ", "วันที่", "เวลา", "เลขที่เอกสาร", "สถานะ", "ช่องทางชำระ", "จำนวน", "ยอดรวม", "ส่วนลดโปรโมชั่น", "ส่วนลดที่หักจากภาษีได้", "ยอดสุทธิ"],
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
        ["", "รวม", "", "", "", "", totalQty, Number(totalGross).toFixed(2), "0.00", "0.00", Number(totalNet).toFixed(2)],
        ["หมายเหตุ..."],
      ];

      const ws = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, ws, "sales-summary");
    } else if (reportType === "product") {
      const isLowSellers = data.productFilterMode === "worst";
      const shopName = data.shopName || "ซูชิ";
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
          ["ร้าน", shopName],
          ["ช่วงวัน...", dateRange],
          ["สกุลเงิน", currency],
          [],
          [
            "ลำดับ",
            "ชื่อสินค้า",
            "รหัสสินค้า",
            "หมวดหมู่",
            "ราคาขาย",
            "จำนวนขาย",
            "ยอดขายรวม",
            "กำไรขั้นต้น",
            "คงเหลือในสต๊อก",
            "มูลค่าสต๊อกคงเหลือ",
            "สถานะ",
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
            p.quantity === 0 ? "ไม่ขายเลย" : "ขายได้น้อย",
          ]),
          [
            "",
            "รวม",
            "",
            "",
            "",
            totalQty,
            totalSales.toFixed(2),
            totalProfit.toFixed(2),
            totalStock,
            totalStockVal.toFixed(2),
            `ไม่ขายเลย ${unsoldProductsCount} รายการ`,
          ],
          ["หมายเหตุ..."],
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
          ["ร้าน", shopName],
          ["ช่วงวัน...", dateRange],
          ["สกุลเงิน", currency],
          [],
          [
            "ลำดับ",
            "ชื่อสินค้า",
            "รหัสสินค้า",
            "หมวดหมู่",
            "จำนวนขาย",
            "ยอดขายรวม",
            "ส่วนลดโปรโมชั่น",
            "ส่วนลดที่พนักงานให้",
            "ค่าธรรมเนียม",
            "ค่าบริการ",
            "ยอดขายสุทธิ",
            "ต้นทุนรวม",
            "กำไรขั้นต้น",
            "%กำไร",
            "ราคาเฉลี่ย/ชิ้น",
            "VAT ที่รวมในราคา",
            "เศษปัด",
            "ค่าส่งกลับบ้าน",
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
            "รวม",
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
          ["หมายเหตุ..."],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(productsSheetData);
        XLSX.utils.book_append_sheet(wb, ws1, "Products");

        const bills = data.productBillsList || [];
        const billsQty = bills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
        const billsSales = bills.reduce((s: number, b: any) => s + (b.sales || 0), 0);
        const billsCost = bills.reduce((s: number, b: any) => s + (b.cost || 0), 0);
        const billsProfit = bills.reduce((s: number, b: any) => s + (b.grossProfit || 0), 0);

        const billsSheetData = [
          ["ร้าน", shopName],
          ["ช่วงวัน...", dateRange],
          ["สกุลเงิน", currency],
          [],
          [
            "ลำดับ",
            "เลขที่เอกสาร",
            "วันที่",
            "เวลา",
            "ชื่อสินค้า",
            "รหัสสินค้า",
            "หมวดหมู่",
            "จำนวน",
            "ยอดขาย",
            "ส่วนลดโปรโมชั่น",
            "ส่วนลดที่พนักงานให้",
            "ค่าธรรมเนียม",
            "ยอดขายสุทธิ",
            "ต้นทุน",
            "กำไรขั้นต้น",
            "VAT ที่รวมในราคา",
            "เศษปัด",
            "ผู้บันทึก",
            "ค่าส่งกลับบ้าน",
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
            "รวม",
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
          ["หมายเหตุ..."],
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(billsSheetData);
        XLSX.utils.book_append_sheet(wb, ws2, "ProductBills");
      }
    } else if (reportType === "employee") {
      const shopName = data.shopName || "ซูชิ";
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
        ["ร้าน", shopName],
        ["ช่วงวัน...", dateRange],
        ["สกุลเงิน", currency],
        [],
        [
          "ลำดับ",
          "พนักงาน",
          "จำนวนบิล",
          "ยอดขาย",
          "% ของยอดขาย",
          "เฉลี่ย/บิล",
          "เงินสด",
          "โอน",
          "เดลิเวอรี่",
          "ยกเลิกบิล (ใบ)",
          "ยอดบิลที่ยกเลิก",
          "ลบสินค้า (ชิ้น)",
          "ยอดสินค้าที่ลบ",
          "สั่งเปิดลิ้นชัก (ครั้ง)",
          "ใส่เงินเข้าลิ้นชัก",
          "นำเงินออกจากลิ้นชัก",
          "เปิดกะไม่ส่งยอด",
          "ส่วนลดรายการ",
          "ส่วนลดท้ายบิล",
          "ฟรีบิล (ครั้ง)",
          "คืนบิล (ใบ)",
          "บัตรเครดิต",
          "ยอดขายสุทธิ",
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
          "รวม",
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
        ["หมายเหตุ..."],
        ["ยกเลิก..."],
      ];
      const wsStaff = XLSX.utils.aoa_to_sheet(staffSheetData);
      XLSX.utils.book_append_sheet(wb, wsStaff, "Staff");

      const totalPaid = staffBills.reduce((s: number, b: any) => s + (b.paidAmount || b.netAmount || 0), 0);
      const totalBillsNet = staffBills.reduce((s: number, b: any) => s + (b.netAmount || 0), 0);

      const staffBillsSheetData: any[] = [
        ["ร้าน", shopName],
        ["ช่วงวัน...", dateRange],
        ["สกุลเงิน", currency],
        [],
        [
          "ลำดับ",
          "เลขที่เอกสาร",
          "วันที่",
          "เวลา",
          "พนักงาน",
          "ชื่อลูกค้า/โต๊ะ",
          "ช่องทางชำระ",
          "ยอดชำระ",
          "ส่วนลดรายการ",
          "ส่วนลดท้ายบิล",
          "ยอดสุทธิ",
        ],
        ...staffBills.map((b: any, idx: number) => [
          idx + 1,
          b.orderNumber || "",
          b.date || "",
          b.time || "",
          b.employeeName || "",
          b.customerOrTable || "",
          b.paymentMethod || "เงินสด",
          Number(b.paidAmount || b.netAmount || 0).toFixed(2),
          "0.00",
          "0.00",
          Number(b.netAmount || 0).toFixed(2),
        ]),
        [
          "",
          "รวม",
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
        ["หมายเหตุ..."],
      ];
      const wsBills = XLSX.utils.aoa_to_sheet(staffBillsSheetData);
      XLSX.utils.book_append_sheet(wb, wsBills, "StaffBills");

      const totalItemsQty = staffItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalItemsSales = staffItems.reduce((s: number, it: any) => s + (it.sales || 0), 0);

      const staffItemsSheetData: any[] = [
        ["ร้าน", shopName],
        ["ช่วงวัน...", dateRange],
        ["สกุลเงิน", currency],
        [],
        [
          "ลำดับ",
          "พนักงาน",
          "ชื่อสินค้า",
          "รหัสสินค้า",
          "หมวดหมู่",
          "จำนวนขาย",
          "ยอดขายรวม",
          "ยอดขายสุทธิ",
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
          "รวม",
          "",
          "",
          "",
          totalItemsQty,
          totalItemsSales.toFixed(2),
          totalItemsSales.toFixed(2),
        ],
        ["หมายเหตุ..."],
      ];
      const wsItems = XLSX.utils.aoa_to_sheet(staffItemsSheetData);
      XLSX.utils.book_append_sheet(wb, wsItems, "StaffItems");
    } else if (reportType === "bills") {
      const shopName = data.shopName || "ซูชิ";
      const dateRange = data.dateRangeText || "";
      const currency = "THB";
      const bills = data.billsExportList || [];
      const billItems = data.billItemsExportList || [];

      const completedBills = bills.filter((b: any) => b.isCompleted || b.status === "สำเร็จ");
      const totalCompletedQty = completedBills.reduce((s: number, b: any) => s + (b.quantity || 0), 0);
      const totalCompletedSales = completedBills.reduce((s: number, b: any) => s + (b.paidAmount || b.grossAmount || 0), 0);

      const billsSheetData: any[] = [
        ["ร้าน", shopName],
        ["ช่วงวัน...", dateRange],
        ["สกุลเงิน", currency],
        [],
        [
          "ลำดับ",
          "เลขที่เอกสาร",
          "วันที่",
          "เวลา",
          "ชื่อลูกค้า/โต๊ะ",
          "หมายเหตุ",
          "สถานะ",
          "ช่องทางชำระ",
          "จำนวน",
          "ยอดรวม",
          "ส่วนลดโปรโมชั่น",
          "โปรโมชั่น",
          "ส่วนลดที่พนักงานให้",
          "ยอดชำระ",
          "ค่าธรรมเนียมแอป",
          "เงินเข้าร้านจริง",
          "เงินรับ",
          "เงินทอน",
          "บันทึกร้าน-ส่วนลดโปร",
          "เรทค่าธรรมเนียม (%)",
          "ค่าธรรมเนียมบัตร",
          "เลขคิว",
          "ยกเลิกโดย",
          "เหตุผลที่ยกเลิก",
          "แก้ไขเมื่อ",
          "แก้ไขโดย",
          "เหตุผลที่แก้ไข",
          "ส่วนเงินสด เบิก/ทอน",
          "ส่วนเงินโอน เบิก/ทอน",
          "ประวัติโต๊ะ",
          "ผู้บันทึก",
          "ส่วนลดรายการ",
          "ส่วนลดท้ายบิล",
          "VAT ที่รวมในบิล",
          "เศษปัด",
          "คืนบิลเมื่อ",
          "คืนบิลโดย",
          "เหตุผลที่คืนบิล",
          "เหตุผลที่ขอยกเลิก",
        ],
        ...bills.map((b: any) => [
          b.index,
          b.orderNumber || "",
          b.date || "",
          b.time || "",
          b.tableName || "",
          b.note || "",
          b.status || "สำเร็จ",
          b.paymentMethod || "เงินสด",
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
          "รวม (เฉพาะบิลสำเร็จ)",
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
        ["หมายเหตุ..."],
      ];
      const wsBills = XLSX.utils.aoa_to_sheet(billsSheetData);
      XLSX.utils.book_append_sheet(wb, wsBills, "Bills");

      const completedItems = billItems.filter((it: any) => it.isCompleted !== false && it.status !== "ยกเลิก");
      const totalItemQty = completedItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalItemGross = completedItems.reduce((s: number, it: any) => s + (it.grossAmount || 0), 0);
      const totalItemNet = completedItems.reduce((s: number, it: any) => s + (it.netSales || it.grossAmount || 0), 0);

      const billItemsSheetData: any[] = [
        ["ร้าน", shopName],
        ["ช่วงวัน...", dateRange],
        ["สกุลเงิน", currency],
        [],
        [
          "ลำดับ",
          "เลขที่เอกสาร",
          "วันที่",
          "เวลา",
          "สถานะ",
          "ชื่อสินค้า",
          "รหัสสินค้า",
          "ตัวเลือก",
          "หมายเหตุ",
          "จำนวน",
          "ยอดรวม",
          "ส่วนลดโปรโมชั่น",
          "ส่วนลดรายการ",
          "ยอดขายสุทธิ",
        ],
        ...billItems.map((it: any) => [
          it.index,
          it.orderNumber || "",
          it.date || "",
          it.time || "",
          it.status || "สำเร็จ",
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
          "รวม (เฉพาะบิลสำเร็จ)",
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
        ["หมายเหตุ..."],
      ];
      const wsBillItems = XLSX.utils.aoa_to_sheet(billItemsSheetData);
      XLSX.utils.book_append_sheet(wb, wsBillItems, "BillItems");
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Export to Excel failed:", error);
    alert("เกิดข้อผิดพลาดในการดาวน์โหลด Excel");
  }
}

