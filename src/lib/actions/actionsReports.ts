"use server";

import prisma from "@/lib/prisma";

import { resolveDateRange, formatDateRangeThai } from "@/components/reports/dateReportUtils";

const formatYMD = (d: Date) =>
  `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}`;

// -------------------------------------------------------------
// 1. รายงานยอดขายทั้งหมด (Total Sales Report)
// -------------------------------------------------------------
export async function getTotalSalesReportAction(params: {
  organizationId: number;
  period: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { start, end } = resolveDateRange(params.period, params.startDate, params.endDate);
    const dateRangeText = formatDateRangeThai(params.period, start, end);
    const dateRangeCode = `${formatYMD(start)}-${formatYMD(end)}`;

    // ดึงออเดอร์ทั้งหมดในช่วงเวลา
    const orders = await prisma.orders.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        payments: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

    let totalSales = 0;
    let totalItemsSold = 0;
    let cashSales = 0;
    let cashBillsCount = 0;
    let transferSales = 0;
    let transferBillsCount = 0;
    let otherSales = 0;

    // ยอดขายรายชั่วโมง (0 - 23)
    const hourlyMap: { [hour: number]: { amount: number; count: number } } = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[h] = { amount: 0, count: 0 };
    }

    const categoryMap: { [name: string]: number } = {};

    completedOrders.forEach((ord) => {
      const net = ord.netAmount || 0;
      totalSales += net;

      // จัดชั่วโมง
      const ordHour = new Date(ord.createdAt).getHours();
      hourlyMap[ordHour].amount += net;
      hourlyMap[ordHour].count += 1;

      // รายการสินค้า & หมวดหมู่
      ord.items.forEach((item) => {
        const qty = item.quantity || 1;
        totalItemsSold += qty;
        const catName = item.product?.category?.name || "ทั่วไป";
        categoryMap[catName] = (categoryMap[catName] || 0) + qty;
      });

      // ช่องทางการชำระ
      if (ord.payments && ord.payments.length > 0) {
        ord.payments.forEach((p) => {
          if (p.method === "CASH") {
            cashSales += p.amount;
            cashBillsCount += 1;
          } else if (p.method === "QR") {
            transferSales += p.amount;
            transferBillsCount += 1;
          } else {
            otherSales += p.amount;
          }
        });
      } else {
        // Fallback default เป็น cash
        cashSales += net;
        cashBillsCount += 1;
      }
    });

    const completedBills = completedOrders.length;
    const averageBill = completedBills > 0 ? Math.round(totalSales / completedBills) : 0;
    const cancelledBills = cancelledOrders.length;

    // คำนวณยอดขายรายวัน (Daily Sales) สำหรับสัปดาห์นี้ / เดือนนี้ / กำหนดเอง
    const thaiMonthsShort = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const dayMap: {
      [key: string]: {
        day: number;
        label: string;
        dayText: string;
        amount: number;
        count: number;
      };
    } = {};

    const curr = new Date(start);
    curr.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(23, 59, 59, 999);

    let daysTotalCount = 0;
    while (curr <= last) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const d = curr.getDate();
      const key = `${y}-${(m + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

      dayMap[key] = {
        day: d,
        label: `${d}`,
        dayText: `${d} ${thaiMonthsShort[m]}`,
        amount: 0,
        count: 0,
      };
      daysTotalCount++;
      curr.setDate(curr.getDate() + 1);
    }

    // รวมยอดขายตามวัน
    completedOrders.forEach((ord) => {
      const d = new Date(ord.createdAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      if (dayMap[key]) {
        dayMap[key].amount += ord.netAmount || 0;
        dayMap[key].count += 1;
      }
    });

    const dailySales = Object.values(dayMap);

    // หาวันขายดีสุด / ขายน้อยสุด
    let bestDay = { dayText: "-", amount: 0 };
    let worstDay = { dayText: "-", amount: 0 };
    let activeDaysCount = 0;
    let sumDayAmounts = 0;

    const daysWithSales = dailySales.filter((d) => d.amount > 0);
    if (daysWithSales.length > 0) {
      activeDaysCount = daysWithSales.length;
      const sortedBySales = [...daysWithSales].sort((a, b) => b.amount - a.amount);
      bestDay = { dayText: sortedBySales[0].dayText, amount: sortedBySales[0].amount };
      worstDay = {
        dayText: sortedBySales[sortedBySales.length - 1].dayText,
        amount: sortedBySales[sortedBySales.length - 1].amount,
      };
      sumDayAmounts = daysWithSales.reduce((acc, c) => acc + c.amount, 0);
    }

    const averagePerDay = activeDaysCount > 0 ? Math.round(sumDayAmounts / activeDaysCount) : 0;

    // หาช่วงชั่วโมงที่ขายดีสุด / ขายน้อยสุด
    let peakHour = 15;
    let peakAmount = 0;
    let worstHour = 15;
    let worstHourAmount = Infinity;
    let activeHoursCount = 0;
    let sumHourlyAmounts = 0;

    let minHour = 24;
    let maxHour = -1;

    Object.entries(hourlyMap).forEach(([hStr, data]) => {
      const h = Number(hStr);
      if (data.amount > 0) {
        if (h < minHour) minHour = h;
        if (h > maxHour) maxHour = h;
        if (data.amount > peakAmount) {
          peakAmount = data.amount;
          peakHour = h;
        }
        if (data.amount < worstHourAmount) {
          worstHourAmount = data.amount;
          worstHour = h;
        }
        activeHoursCount += 1;
        sumHourlyAmounts += data.amount;
      }
    });

    if (minHour === 24) {
      minHour = 10;
      maxHour = 20;
      peakHour = 15;
      worstHour = 15;
      worstHourAmount = 0;
    }

    const averagePerHour = activeHoursCount > 0 ? Math.round(sumHourlyAmounts / activeHoursCount) : 0;

    // Category breakdown list
    const categoryBreakdown = Object.entries(categoryMap).map(([categoryName, quantity]) => ({
      categoryName,
      quantity,
    }));

    // ข้อมูลยอดขายรายชั่วโมงสำหรับทำ Bar Chart
    const hourlyChartData: Array<{
      hour: number;
      label: string;
      amount: number;
      count: number;
    }> = [];

    for (let h = minHour; h <= maxHour; h++) {
      hourlyChartData.push({
        hour: h,
        label: `${h.toString().padStart(2, "0")}:00`,
        amount: hourlyMap[h]?.amount || 0,
        count: hourlyMap[h]?.count || 0,
      });
    }

    // ถ้ามีวันเดียว (เช่น สัปดาห์นี้ที่เพิ่งเป็นวันจันทร์ หรือ วันนี้) ไม่ต้องแสดงยอดรายวัน
    const isMultiDay = daysTotalCount > 1;

    return {
      success: true,
      data: {
        dateRangeText,
        dateRangeCode,
        totalSales,
        completedBills,
        averageBill,
        cancelledBills,
        totalItemsSold,
        categoryBreakdown,
        isMultiDay,
        dailySales,
        dailyStats: {
          daysCount: daysTotalCount,
          daysText: `${daysTotalCount} วัน`,
          bestDay,
          worstDay,
          averagePerDay,
          activeDaysCount,
        },
        paymentSplit: {
          cashAmount: cashSales,
          cashCount: cashBillsCount,
          transferAmount: transferSales,
          transferCount: transferBillsCount,
          otherAmount: otherSales,
        },
        hourlyChartData,
        hourlyStats: {
          rangeText: `${minHour.toString().padStart(2, "0")}:00 - ${maxHour.toString().padStart(2, "0")}:00`,
          peakHourText: `${peakHour.toString().padStart(2, "0")}:00`,
          peakAmount,
          worstHourText: `${worstHour.toString().padStart(2, "0")}:00`,
          worstAmount: worstHourAmount === Infinity ? 0 : worstHourAmount,
          averageHourText: `${peakHour.toString().padStart(2, "0")}:00`,
          averageAmount: peakAmount > 0 ? peakAmount : averagePerHour,
          averagePerHour,
          activeHoursCount: activeHoursCount || 1,
        },
        billsList: completedOrders.map((ord, idx) => {
          const d = new Date(ord.createdAt);
          const beYear = d.getFullYear() + 543;
          const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${beYear}`;
          const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          const paymentMethod = ord.payments?.[0]?.method === "QR" ? "เงินโอน" : "เงินสด";
          const totalQty = ord.items.reduce((s, it) => s + (it.quantity || 1), 0);
          return {
            index: idx + 1,
            date: dateStr,
            time: timeStr,
            orderNumber: ord.orderNumber,
            status: "สำเร็จ",
            paymentMethod,
            quantity: totalQty,
            grossAmount: ord.totalAmount || ord.netAmount || 0,
            promoDiscount: 0,
            taxDiscount: 0,
            netAmount: ord.netAmount || 0,
          };
        }),
      },
    };
  } catch (error: any) {
    console.error("Error in getTotalSalesReportAction:", error);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// 2. รายงานยอดขายตามสินค้า (Sales by Product Report)
// -------------------------------------------------------------
export async function getProductSalesReportAction(params: {
  organizationId: number;
  period: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { start, end } = resolveDateRange(params.period, params.startDate, params.endDate);
    const dateRangeText = formatDateRangeThai(params.period, start, end);

    // ดึงสินค้าทั้งหมดของร้าน
    const allProducts = await prisma.products.findMany({
      where: {
        organizationId: params.organizationId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // ดึงพนักงานทั้งหมดของร้าน เพื่อแปลง createdBy (ที่เป็น ID) ให้เป็นชื่อพนักงาน
    const employees = await prisma.employees.findMany({
      where: {
        organizationId: params.organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const empIdToNameMap = new Map<string, string>();
    employees.forEach((emp) => {
      empIdToNameMap.set(String(emp.id), emp.name);
      empIdToNameMap.set(emp.name, emp.name);
    });

    const getCashierName = (createdBy: string | null | undefined) => {
      if (!createdBy) return "Admin";
      const key = String(createdBy).trim();
      const found = empIdToNameMap.get(key);
      if (found) return found;
      if (key === "0" || key.toLowerCase() === "system") return "ระบบ";
      if (key === "QR_ORDER") return "สั่งผ่าน QR";
      if (key.toLowerCase() === "cashier") return "แคชเชียร์";
      return key;
    };

    const dateRangeCode = `${formatYMD(start)}-${formatYMD(end)}`;

    // ดึงรายการสั่งซื้อที่ COMPLETED ในช่วงเวลา พร้อมข้อมูลสินค้าและบิล
    const orderItems = await prisma.orderitems.findMany({
      where: {
        order: {
          organizationId: params.organizationId,
          status: "COMPLETED",
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
            createdBy: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const productStatsMap: {
      [id: number]: {
        productId: number;
        code: string;
        name: string;
        image: string | null;
        categoryName: string;
        price: number;
        cost: number;
        stock: number;
        stockValue: number;
        quantity: number;
        sales: number;
        profit: number;
        status: string;
      };
    } = {};

    allProducts.forEach((p) => {
      productStatsMap[p.id] = {
        productId: p.id,
        code: p.code || "",
        name: p.name,
        image: p.image,
        categoryName: p.category?.name || "ทั่วไป",
        price: p.price,
        cost: p.cost || 0,
        stock: p.stock ?? 0,
        stockValue: (p.stock ?? 0) * (p.cost || p.price || 0),
        quantity: 0,
        sales: 0,
        profit: 0,
        status: "ไม่ขายเลย",
      };
    });

    let totalSales = 0;

    // สร้างข้อมูลสำหรับแท็บ ProductBills ใน Excel
    const productBillsList = orderItems.map((item, idx) => {
      const d = new Date(item.order.createdAt);
      const beYear = d.getFullYear() + 543;
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${beYear}`;
      const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const p = item.product;
      const qty = item.quantity || 1;
      const price = item.priceAtTime ?? p?.price ?? 0;
      const cost = Number(p?.cost ?? 0);
      const subtotal = qty * price;
      const subProfit = subtotal - qty * cost;

      return {
        index: idx + 1,
        orderNumber: item.order.orderNumber,
        date: dateStr,
        time: timeStr,
        productName: p?.name || "สินค้า",
        productCode: p?.code || "",
        categoryName: p?.category?.name || "ทั่วไป",
        quantity: qty,
        sales: subtotal,
        promoDiscount: 0,
        staffDiscount: 0,
        fee: 0,
        netSales: subtotal,
        cost: qty * cost,
        grossProfit: subProfit,
        vat: 0,
        roundDiff: 0,
        cashierName: getCashierName(item.order.createdBy),
        deliveryFee: 0,
      };
    });

    orderItems.forEach((item) => {
      const pId = item.productId;
      const qty = item.quantity || 1;
      const price = item.priceAtTime ?? item.product?.price ?? 0;
      const cost = Number(item.product?.cost ?? productStatsMap[pId]?.cost ?? 0);
      const subtotal = qty * price;
      const subProfit = subtotal - qty * cost;

      totalSales += subtotal;

      if (!productStatsMap[pId]) {
        productStatsMap[pId] = {
          productId: pId,
          code: item.product?.code || "",
          name: item.product?.name || "สินค้าไม่ทราบชื่อ",
          image: item.product?.image || null,
          categoryName: "ทั่วไป",
          price,
          cost,
          stock: item.product?.stock ?? 0,
          stockValue: (item.product?.stock ?? 0) * (cost || price || 0),
          quantity: 0,
          sales: 0,
          profit: 0,
          status: "ไม่ขายเลย",
        };
      }

      productStatsMap[pId].quantity += qty;
      productStatsMap[pId].sales += subtotal;
      productStatsMap[pId].profit += subProfit;
      productStatsMap[pId].status = "ขายได้น้อย";
    });

    const productsList = Object.values(productStatsMap);

    // สินค้าขายดี (เรียงตามจำนวน, ยอดขาย, กำไร)
    const bestByQuantity = [...productsList]
      .filter((p) => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);

    const bestBySales = [...productsList]
      .filter((p) => p.sales > 0)
      .sort((a, b) => b.sales - a.sales);

    const bestByProfit = [...productsList]
      .filter((p) => p.sales > 0)
      .sort((a, b) => b.profit - a.profit);

    // สินค้าขายไม่ดี (เรียงจากน้อยไปมาก โดยสินค้าที่ยอดขายเป็น 0 หรือขายไม่ได้ จะอยู่บนสุดเสมอ)
    const worstByQuantity = [...productsList].sort((a, b) => {
      if (a.quantity === 0 && b.quantity > 0) return -1;
      if (b.quantity === 0 && a.quantity > 0) return 1;
      return a.quantity - b.quantity;
    });

    const worstBySales = [...productsList].sort((a, b) => {
      if (a.quantity === 0 && b.quantity > 0) return -1;
      if (b.quantity === 0 && a.quantity > 0) return 1;
      return a.sales - b.sales;
    });

    const worstByProfit = [...productsList].sort((a, b) => {
      if (a.quantity === 0 && b.quantity > 0) return -1;
      if (b.quantity === 0 && a.quantity > 0) return 1;
      return a.profit - b.profit;
    });

    return {
      success: true,
      data: {
        dateRangeText,
        dateRangeCode,
        totalSales,
        allProducts: productsList,
        productBillsList,
        best: {
          quantity: bestByQuantity,
          sales: bestBySales,
          profit: bestByProfit,
        },
        worst: {
          quantity: worstByQuantity,
          sales: worstBySales,
          profit: worstByProfit,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getProductSalesReportAction:", error);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// 3. รายงานยอดขายตามพนักงาน (Sales by Employee Report)
// -------------------------------------------------------------
export async function getEmployeeSalesReportAction(params: {
  organizationId: number;
  period: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { start, end } = resolveDateRange(params.period, params.startDate, params.endDate);
    const dateRangeText = formatDateRangeThai(params.period, start, end);
    const dateRangeCode =
      params.period === "today"
        ? formatYMD(start)
        : `${formatYMD(start)}-${formatYMD(end)}`;

    // ดึงพนักงานทั้งหมด
    const employees = await prisma.employees.findMany({
      where: {
        organizationId: params.organizationId,
      },
    });

    // ดึงออเดอร์ทั้งหมด
    const orders = await prisma.orders.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        payments: true,
        qrcode: { select: { tableName: true } },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

    let orgTotalSales = 0;
    completedOrders.forEach((o) => (orgTotalSales += o.netAmount || 0));

    // โครงสร้างพนักงาน
    type EmpReport = {
      employeeId: number | string;
      name: string;
      role: string;
      img: string | null;
      totalSales: number;
      percentage: number;
      completedBills: number;
      averageBill: number;
      cancelledBills: number;
      cashSales: number;
      transferSales: number;
      totalItemsSold: number;
      categoryBreakdown: { categoryName: string; quantity: number }[];
      soldProducts: {
        productId: number;
        productName: string;
        productCode: string;
        categoryName: string;
        image: string | null;
        quantity: number;
        totalAmount: number;
      }[];
      orders: {
        id: number;
        orderNumber: string;
        createdAt: string;
        formattedTime: string;
        paymentMethodLabel: string;
        tableName: string;
        netAmount: number;
        itemsCount: number;
        itemsSummary: string;
      }[];
    };

    // สร้าง Map สำหรับจับคู่ข้อมูลพนักงานตาม ID และ Name
    const empReportById = new Map<number, EmpReport>();
    const empIdByName = new Map<string, number>();

    employees.forEach((emp) => {
      const rep: EmpReport = {
        employeeId: emp.id,
        name: emp.name,
        role: emp.role || "พนักงาน",
        img: emp.img || null,
        totalSales: 0,
        percentage: 0,
        completedBills: 0,
        averageBill: 0,
        cancelledBills: 0,
        cashSales: 0,
        transferSales: 0,
        totalItemsSold: 0,
        categoryBreakdown: [],
        soldProducts: [],
        orders: [],
      };
      empReportById.set(emp.id, rep);
      empIdByName.set(emp.name.toLowerCase().trim(), emp.id);
    });

    const extraReports = new Map<string, EmpReport>();

    const resolveEmployeeReport = (createdBy: string | null | undefined): EmpReport => {
      const key = String(createdBy || "").trim();
      const numId = Number(key);
      if (!isNaN(numId) && numId > 0 && empReportById.has(numId)) {
        return empReportById.get(numId)!;
      }
      if (key && empIdByName.has(key.toLowerCase())) {
        const id = empIdByName.get(key.toLowerCase())!;
        return empReportById.get(id)!;
      }

      let displayName = key;
      if (!key || key === "0" || key.toLowerCase() === "system") {
        displayName = "ระบบ";
      } else if (key === "QR_ORDER") {
        displayName = "สั่งผ่าน QR";
      } else if (key.toLowerCase() === "cashier") {
        displayName = "แคชเชียร์";
      } else if (!isNaN(numId) && numId > 0) {
        displayName = `พนักงาน (ID: ${key})`;
      }

      if (extraReports.has(displayName)) {
        return extraReports.get(displayName)!;
      }

      const fallback: EmpReport = {
        employeeId: key || displayName,
        name: displayName,
        role: "พนักงาน",
        img: null,
        totalSales: 0,
        percentage: 0,
        completedBills: 0,
        averageBill: 0,
        cancelledBills: 0,
        cashSales: 0,
        transferSales: 0,
        totalItemsSold: 0,
        categoryBreakdown: [],
        soldProducts: [],
        orders: [],
      };
      extraReports.set(displayName, fallback);
      return fallback;
    };

    // วนลูปออเดอร์ที่สำเร็จ
    completedOrders.forEach((ord) => {
      const report = resolveEmployeeReport(ord.createdBy);
      const net = ord.netAmount || 0;
      report.totalSales += net;
      report.completedBills += 1;

      // ช่องทางการชำระ
      if (ord.payments && ord.payments.length > 0) {
        ord.payments.forEach((p) => {
          if (p.method === "CASH") report.cashSales += p.amount;
          else if (p.method === "QR") report.transferSales += p.amount;
        });
      } else {
        report.cashSales += net;
      }

      // รายการสินค้า
      let orderItemsCount = 0;
      const orderItemNames: string[] = [];

      ord.items.forEach((item) => {
        const qty = item.quantity || 1;
        const subtotal = qty * (item.priceAtTime ?? item.product?.price ?? 0);
        report.totalItemsSold += qty;
        orderItemsCount += qty;
        orderItemNames.push(`${qty}× ${item.product?.name || "สินค้า"}`);

        // Category breakdown
        const catName = item.product?.category?.name || "ทั่วไป";
        const prodCode = item.product?.code || "";
        const existingCat = report.categoryBreakdown.find((c) => c.categoryName === catName);
        if (existingCat) {
          existingCat.quantity += qty;
        } else {
          report.categoryBreakdown.push({ categoryName: catName, quantity: qty });
        }

        // เพิ่มเข้า soldProducts
        const existingProd = report.soldProducts.find((p) => p.productId === item.productId);
        if (existingProd) {
          existingProd.quantity += qty;
          existingProd.totalAmount += subtotal;
        } else {
          report.soldProducts.push({
            productId: item.productId,
            productName: item.product?.name || "สินค้า",
            productCode: prodCode,
            categoryName: catName,
            image: item.product?.image || null,
            quantity: qty,
            totalAmount: subtotal,
          });
        }
      });

      // จัดรูปแบบวันเวลาสำหรับบิลของพนักงาน
      const ordDate = new Date(ord.createdAt);
      const pad2 = (n: number) => n.toString().padStart(2, "0");
      const formattedTime = `${pad2(ordDate.getDate())}/${pad2(ordDate.getMonth() + 1)}/${ordDate.getFullYear() + 543} ${pad2(ordDate.getHours())}:${pad2(ordDate.getMinutes())}`;
      const firstPayment = ord.payments[0];
      const method = firstPayment?.method || "CASH";
      const paymentMethodLabel = method === "CASH" ? "เงินสด" : method === "QR" ? "เงินโอน" : method;
      const tableName = ord.qrcode?.tableName || "ขายหน้าร้าน";

      // เพิ่มเข้า orders
      report.orders.push({
        id: ord.id,
        orderNumber: ord.orderNumber,
        createdAt: ord.createdAt.toISOString(),
        formattedTime,
        paymentMethodLabel,
        tableName,
        netAmount: net,
        itemsCount: orderItemsCount,
        itemsSummary: orderItemNames.join(" · "),
      });
    });

    // วนลูปบิลที่ยกเลิก
    cancelledOrders.forEach((ord) => {
      const report = resolveEmployeeReport(ord.createdBy);
      report.cancelledBills += 1;
    });

    // 🌟 เฉพาะพนักงานที่มียอดขายในช่วงเวลาที่เลือกเท่านั้น
    const employeeList = [
      ...Array.from(empReportById.values()),
      ...Array.from(extraReports.values()),
    ]
      .filter((emp) => emp.completedBills > 0 || emp.totalSales > 0)
      .map((emp) => {
        emp.averageBill = emp.completedBills > 0 ? Number((emp.totalSales / emp.completedBills).toFixed(2)) : 0;
        emp.percentage = orgTotalSales > 0 ? Math.round((emp.totalSales / orgTotalSales) * 100) : 0;
        return emp;
      });

    // เรียงพนักงานตามยอดขายมากไปน้อย
    employeeList.sort((a, b) => b.totalSales - a.totalSales);

    // สร้างข้อมูล staffBillsList สำหรับ Sheet StaffBills ใน Excel
    const staffBillsList = completedOrders.map((ord, idx) => {
      const d = new Date(ord.createdAt);
      const beYear = d.getFullYear() + 543;
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${beYear}`;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const rep = resolveEmployeeReport(ord.createdBy);
      const firstPayment = ord.payments?.[0];
      const method = firstPayment?.method || "CASH";
      const paymentMethodLabel = method === "CASH" ? "เงินสด" : method === "QR" ? "เงินโอน" : method;
      const tableName = ord.qrcode?.tableName || "";

      return {
        index: idx + 1,
        orderNumber: ord.orderNumber,
        date: dateStr,
        time: timeStr,
        employeeName: rep.name,
        customerOrTable: tableName,
        paymentMethod: paymentMethodLabel,
        paidAmount: ord.netAmount || 0,
        itemDiscount: 0,
        billDiscount: 0,
        netAmount: ord.netAmount || 0,
      };
    });

    // สร้างข้อมูล staffItemsList สำหรับ Sheet StaffItems ใน Excel
    const staffItemsList: any[] = [];
    let itemIdx = 1;
    employeeList.forEach((emp) => {
      emp.soldProducts.forEach((p) => {
        staffItemsList.push({
          index: itemIdx++,
          employeeName: emp.name,
          productName: p.productName,
          productCode: p.productCode || "",
          categoryName: p.categoryName || "ทั่วไป",
          quantity: p.quantity,
          sales: p.totalAmount,
          netSales: p.totalAmount,
        });
      });
    });

    return {
      success: true,
      data: {
        dateRangeText,
        dateRangeCode,
        totalSales: orgTotalSales,
        employees: employeeList,
        staffBillsList,
        staffItemsList,
      },
    };
  } catch (error: any) {
    console.error("Error in getEmployeeSalesReportAction:", error);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// 4. รายงานรายการบิล / ใบเสร็จ (Bills & Receipts Report)
// -------------------------------------------------------------
export async function getBillsReceiptsReportAction(params: {
  organizationId: number;
  period: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
  paymentMethod?: "ALL" | "CASH" | "QR";
  search?: string;
}) {
  try {
    const { start, end } = resolveDateRange(params.period, params.startDate, params.endDate);
    const dateRangeText = formatDateRangeThai(params.period, start, end);
    const dateRangeCode =
      params.period === "today"
        ? formatYMD(start)
        : `${formatYMD(start)}-${formatYMD(end)}`;

    const orders = await prisma.orders.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        payments: true,
        qrcode: { select: { tableName: true } },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ดึงพนักงานทั้งหมดเพื่อแปลง createdBy (ID) ให้เป็นชื่อพนักงาน
    const employees = await prisma.employees.findMany({
      where: {
        organizationId: params.organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const empNameMap = new Map<string, string>();
    employees.forEach((emp) => {
      empNameMap.set(String(emp.id), emp.name);
      empNameMap.set(emp.name, emp.name);
    });

    const getCashierName = (createdBy: string | null | undefined) => {
      if (!createdBy) return "ระบบ";
      const key = String(createdBy).trim();
      const found = empNameMap.get(key);
      if (found) return found;
      if (key === "0" || key.toLowerCase() === "system") return "ระบบ";
      if (key === "QR_ORDER") return "สั่งผ่าน QR";
      if (key.toLowerCase() === "cashier") return "แคชเชียร์";
      return key;
    };

    // นับจำนวนทั้งหมด แยกตามวิธีการชำระเงิน
    let totalCashCount = 0;
    let totalQrCount = 0;
    let totalSales = 0;

    orders.forEach((ord) => {
      if (ord.status === "COMPLETED") {
        totalSales += ord.netAmount || 0;
      }
      const isCash = ord.payments.some((p) => p.method === "CASH") || ord.payments.length === 0;
      const isQr = ord.payments.some((p) => p.method === "QR");
      if (isCash) totalCashCount++;
      if (isQr) totalQrCount++;
    });

    // กรองตาม Payment Method
    let filteredOrders = orders;
    if (params.paymentMethod === "CASH") {
      filteredOrders = filteredOrders.filter(
        (o) => o.payments.some((p) => p.method === "CASH") || o.payments.length === 0
      );
    } else if (params.paymentMethod === "QR") {
      filteredOrders = filteredOrders.filter((o) =>
        o.payments.some((p) => p.method === "QR")
      );
    }

    // กรองตามคำค้นหา search (search orderNumber, customerName, tableName, cashier name, product name)
    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim().toLowerCase();
      filteredOrders = filteredOrders.filter((ord) => {
        const matchOrderNumber = ord.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = ord.customerName?.toLowerCase().includes(q);
        const matchTable = ord.qrcode?.tableName?.toLowerCase().includes(q);
        const cashier = getCashierName(ord.createdBy);
        const matchCashier = cashier.toLowerCase().includes(q);
        const matchProduct = ord.items.some((i) =>
          i.product?.name?.toLowerCase().includes(q)
        );
        return matchOrderNumber || matchCustomer || matchTable || matchCashier || matchProduct;
      });
    }

    // จัดกลุ่มตามวัน (Date Groups) เช่น "วันศุกร์ที่ 16 ตุลาคม 2569"
    const thaiMonthsFull = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const thaiDaysFull = [
      "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ",
      "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"
    ];

    const groupMap: {
      [dateKey: string]: {
        dateTitleThai: string;
        bills: Array<{
          id: number;
          orderNumber: string;
          createdAt: string;
          formattedTime: string;
          paymentMethod: string;
          paymentMethodLabel: string;
          tableName: string;
          itemsSummary: string;
          cashierName: string;
          netAmount: number;
        }>;
      };
    } = {};

    filteredOrders.forEach((ord) => {
      const d = new Date(ord.createdAt);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

      if (!groupMap[dateKey]) {
        const dayTitle = thaiDaysFull[d.getDay()];
        const monthTitle = thaiMonthsFull[d.getMonth()];
        const yearTitle = d.getFullYear() + 543;
        groupMap[dateKey] = {
          dateTitleThai: `${dayTitle}ที่ ${d.getDate()} ${monthTitle} ${yearTitle}`,
          bills: [],
        };
      }

      // เวลา เช่น 16/10/2569 14:01
      const pad = (n: number) => n.toString().padStart(2, "0");
      const formattedTime = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear() + 543} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

      // ช่องทางการชำระ
      const firstPayment = ord.payments[0];
      const method = firstPayment?.method || "CASH";
      const paymentMethodLabel = method === "CASH" ? "เงินสด" : method === "QR" ? "เงินโอน" : method;

      // โต๊ะ หรือ หน้าร้าน
      const tableName = ord.qrcode?.tableName ? ord.qrcode.tableName : "ขายหน้าร้าน";

      // สรุปรายการสินค้า เช่น "2x โค้ก · 1x น้ำเปล่า"
      const itemsSummary = ord.items
        .map((i) => `${i.quantity}x ${i.product?.name || "สินค้า"}`)
        .join(" · ");

      const cashier = getCashierName(ord.createdBy);
      const cashierName = `บันทึกโดย ${cashier}`;

      groupMap[dateKey].bills.push({
        id: ord.id,
        orderNumber: ord.orderNumber,
        createdAt: ord.createdAt.toISOString(),
        formattedTime,
        paymentMethod: method,
        paymentMethodLabel,
        tableName,
        itemsSummary,
        cashierName,
        netAmount: ord.netAmount || 0,
      });
    });

    const dateGroups = Object.keys(groupMap)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        dateKey: key,
        dateTitleThai: groupMap[key].dateTitleThai,
        bills: groupMap[key].bills,
      }));

    // สร้างข้อมูลสำหรับแท็บ Bills (39 คอลัมน์ A ถึง AM)
    const billsExportList = orders.map((ord, idx) => {
      const d = new Date(ord.createdAt);
      const beYear = d.getFullYear() + 543;
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${beYear}`;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const firstPayment = ord.payments?.[0];
      const method = firstPayment?.method || "CASH";
      const paymentMethodLabel = method === "CASH" ? "เงินสด" : method === "QR" ? "เงินโอน" : method;
      const tableName = ord.qrcode?.tableName || "";
      const cashier = getCashierName(ord.createdBy);
      const totalQty = ord.items.reduce((s, it) => s + (it.quantity || 1), 0);
      const isCompleted = ord.status === "COMPLETED";

      const netAmt = ord.netAmount || 0;
      const receivedAmt = firstPayment?.receivedAmount ?? (isCompleted ? netAmt : 0);
      const changeAmt = firstPayment?.changeAmount ?? Math.max(0, receivedAmt - netAmt);

      return {
        index: idx + 1,
        orderNumber: ord.orderNumber,
        date: dateStr,
        time: timeStr,
        tableName,
        note: (ord as any).note || "",
        status: isCompleted ? "สำเร็จ" : "ยกเลิก",
        paymentMethod: paymentMethodLabel,
        quantity: totalQty,
        grossAmount: netAmt,
        promoDiscount: 0,
        promoName: "",
        staffDiscount: 0,
        paidAmount: isCompleted ? netAmt : 0,
        appFee: 0,
        netIncome: isCompleted ? netAmt : 0,
        receivedAmount: receivedAmt,
        changeAmount: changeAmt,
        shopPromoNote: "",
        feeRatePercent: "",
        cardFee: 0,
        queueNumber: String(orders.length - idx),
        cancelledBy: !isCompleted ? cashier : "",
        cancelReason: !isCompleted ? ((ord as any).cancelReason || "") : "",
        editedAt: "",
        editedBy: "",
        editReason: "",
        cashCashierDiff: 0,
        transferCashierDiff: 0,
        tableHistory: "",
        cashierName: cashier,
        itemDiscount: 0,
        billDiscount: 0,
        vatInBill: 0,
        roundDiff: 0,
        refundedAt: "",
        refundedBy: "",
        refundReason: "",
        cancelRequestReason: "",
        isCompleted,
      };
    });

    // สร้างข้อมูลสำหรับแท็บ BillItems (ชีตที่ 2)
    const billItemsExportList: any[] = [];
    let bItemIdx = 1;
    orders.forEach((ord) => {
      const d = new Date(ord.createdAt);
      const beYear = d.getFullYear() + 543;
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${beYear}`;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const cashier = getCashierName(ord.createdBy);

      const isCompleted = ord.status === "COMPLETED";

      ord.items.forEach((it) => {
        const qty = it.quantity || 1;
        const price = it.priceAtTime ?? it.product?.price ?? 0;
        const subtotal = qty * price;
        billItemsExportList.push({
          index: bItemIdx++,
          orderNumber: ord.orderNumber,
          date: dateStr,
          time: timeStr,
          status: isCompleted ? "สำเร็จ" : "ยกเลิก",
          productName: it.product?.name || "สินค้า",
          productCode: it.product?.code || "",
          options: it.options || "",
          note: "",
          quantity: qty,
          grossAmount: subtotal,
          promoDiscount: 0,
          itemDiscount: 0,
          netSales: subtotal,
          isCompleted,
        });
      });
    });

    return {
      success: true,
      data: {
        dateRangeText,
        dateRangeCode,
        totalSales,
        counts: {
          all: orders.length,
          cash: totalCashCount,
          qr: totalQrCount,
        },
        dateGroups,
        billsExportList,
        billItemsExportList,
      },
    };
  } catch (error: any) {
    console.error("Error in getBillsReceiptsReportAction:", error);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// 5. ดึงข้อมูลใบเสร็จรับเงินสำหรับดูรายละเอียด (Receipt Detail)
// -------------------------------------------------------------
export async function getOrderReceiptAction(orderId: number) {
  try {
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
      return { success: false, message: "ไม่พบข้อมูลบิลนี้ในระบบ" };
    }

    let cashierName = "ระบบ";
    if (order.createdBy) {
      const key = String(order.createdBy).trim();
      const numId = Number(key);
      if (!isNaN(numId) && numId > 0) {
        const emp = await prisma.employees.findUnique({
          where: { id: numId },
          select: { name: true },
        });
        cashierName = emp?.name || key;
      } else if (key === "QR_ORDER") {
        cashierName = "สั่งผ่าน QR";
      } else if (key.toLowerCase() === "system" || key === "0") {
        cashierName = "ระบบ";
      } else {
        cashierName = key;
      }
    }

    return { success: true, data: { ...order, cashierName } };
  } catch (error: any) {
    console.error("Error in getOrderReceiptAction:", error);
    return { success: false, message: error.message };
  }
}

