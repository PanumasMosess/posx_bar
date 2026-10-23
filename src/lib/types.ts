export type ModalView = "ADD_PRODUCT" | "ADD_CATEGORY" | "ADD_OPTION";

export type SettingsSection =
  | "shop-team"
  | "member"
  | "payment"
  | "misc"
  | "vat"
  | "scan"
  | "restaurant-mode"
  | "currency"
  | "business-hours"
  | null;

export interface Permissions {
  accessPos: boolean;
  accessSettings: boolean;
  accessReports: boolean;
  accessExpenses: boolean;
  cancelRefund: boolean;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  pin: string;
  img: string | null;
  isActive: boolean;
  permission: Permissions;
}

export interface ShopInfo {
  id: number;
  name: string;
  plan: "trial" | "paid";
  planExpiry: string;
  employees: Employee[];
}

export const PERMISSION_CONFIG: {
  key: keyof Permissions;
  label: string;
  desc: string;
}[] = [
  {
    key: "accessPos",
    label: "เข้าใช้งานหน้า POS",
    desc: "สามารถเข้าถึงหน้าจอรับออเดอร์และคิดเงินได้",
  },
  {
    key: "cancelRefund",
    label: "ยกเลิกและคืนบิล",
    desc: "สามารถยกเลิกออเดอร์ที่สั่งไปแล้วหรือคืนเงินได้",
  },
  {
    key: "accessExpenses",
    label: "จัดการรายจ่าย",
    desc: "เข้าถึงหน้าบันทึกรายจ่ายประจำวันของร้าน",
  },
  {
    key: "accessReports",
    label: "ดูรายงาน",
    desc: "สามารถเข้าถึงหน้าดูสรุปยอดขายและรายงานต่างๆ",
  },
  {
    key: "accessSettings",
    label: "การตั้งค่าระบบ",
    desc: "เข้าถึงหน้าตั้งค่าร้านค้าและจัดการพนักงานได้",
  },
];

export interface ReceiptSlipProps {
  order: any;
  payment?: any | null;
}

export interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  isPending: boolean;
  onSave: (data: {
    type: "IN" | "OUT";
    quantity: number;
    note: string;
  }) => void;
}

export interface StockTableProps {
  products: any[];
  isPending: boolean;
  onToggleTrack: (id: number, status: boolean) => void;
  onOpenAdjustModal: (product: any) => void;
}

// ------------------------------------------------------
// ระบบสมาชิก (Member System) Interfaces
// ------------------------------------------------------
export type MemberTransactionType = "EARN" | "REDEEM" | "TOPUP" | "SPEND" | "REFUND";
export type MemberWalletType = "POINT" | "CREDIT";

export interface MemberTier {
  id: number;
  organizationId: number;
  name: string;
  minSpending: number;
  pointMultiplier: number;
  discountPercent: number;
  _count?: {
    members: number;
  };
}

export interface MemberTransaction {
  id: number;
  organizationId: number;
  type: MemberTransactionType;
  walletType: MemberWalletType;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string | Date;
  referenceTxId?: number | null;
  paymentGroupId?: string | null;
  memberId: number;
  orderId?: number | null;
  createdById?: number | null;
  employee?: {
    id: number;
    name: string;
  } | null;
}

export interface Member {
  id: number;
  organizationId: number;
  phone: string;
  firstName: string;
  lastName: string | null;
  points: number;
  creditBalance: number;
  tierId: number | null;
  status: string; // ACTIVE, INACTIVE, BANNED
  createdAt: string | Date;
  updatedAt: string | Date;
  tier?: MemberTier | null;
  transactions?: MemberTransaction[];
}

// ------------------------------------------------------
// ระบบรายงาน (Reports System) Interfaces
// ------------------------------------------------------
export type ReportPeriod = "today" | "week" | "month" | "custom";
export type PeriodType = ReportPeriod;
export type ReportTabKey = "total" | "product" | "employee" | "bills";

export interface DateFilterInput {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ReportDateSelectorProps {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
}

export interface ReportSidebarProps {
  activeTab: ReportTabKey;
  onSelectTab: (tab: ReportTabKey) => void;
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  className?: string;
}

export interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reportType: ReportTabKey;
  data: any;
  onDownload: () => void;
}

export interface ReceiptDetailModalProps {
  orderId: number | null;
  onClose: () => void;
}

// 1. Total Sales Report
export interface ReportDailyItem {
  day: number;
  label: string;
  dayText: string;
  amount: number;
  count: number;
}
export type DailyItem = ReportDailyItem;

export interface ReportDailyStats {
  daysCount?: number;
  daysText?: string;
  bestDay?: { dayText: string; amount: number };
  worstDay?: { dayText: string; amount: number };
  averagePerDay?: number;
  activeDaysCount?: number;
}

export interface ReportPaymentSplit {
  cashAmount?: number;
  cashCount?: number;
  transferAmount?: number;
  transferCount?: number;
  otherAmount?: number;
}

export interface ReportHourlyItem {
  hour: number;
  label: string;
  amount: number;
  count: number;
}

export interface ReportHourlyStats {
  rangeText?: string;
  peakHourText?: string;
  peakAmount?: number;
  worstHourText?: string;
  worstAmount?: number;
  averageHourText?: string;
  averageAmount?: number;
  averagePerHour?: number;
  activeHoursCount?: number;
}

export interface TotalSalesReportData {
  dateRangeText?: string;
  totalSales?: number;
  completedBills?: number;
  averageBill?: number;
  totalCost?: number;
  grossProfit?: number;
  costPercentage?: number;
  profitPercentage?: number;
  activeEmployeesCount?: number;
  categoryCount?: number;
  cancelledBills?: number;
  totalItemsSold?: number;
  categoryBreakdown?: { categoryName: string; quantity: number }[];
  isMultiDay?: boolean;
  dailySales?: ReportDailyItem[];
  dailyStats?: ReportDailyStats;
  paymentSplit?: ReportPaymentSplit;
  hourlyChartData?: ReportHourlyItem[];
  hourlyStats?: ReportHourlyStats;
  billsList?: any[];
}

export interface TotalSalesReportViewProps {
  data: TotalSalesReportData;
  isMobile?: boolean;
}

// 2. Product Sales Report
export interface ProductReportItem {
  productId: number;
  name: string;
  image: string | null;
  categoryName: string;
  price: number;
  cost: number;
  quantity: number;
  sales: number;
  profit: number;
}
export type ProductItem = ProductReportItem;

export interface ProductSalesReportData {
  dateRangeText: string;
  dateRangeCode?: string;
  totalSales: number;
  allProducts: ProductReportItem[];
  best: {
    quantity: ProductReportItem[];
    sales: ProductReportItem[];
    profit: ProductReportItem[];
  };
  worst: {
    quantity: ProductReportItem[];
    sales: ProductReportItem[];
    profit: ProductReportItem[];
  };
  productsList?: any[];
  productBillsList?: any[];
  shopName?: string;
  currency?: string;
  productFilterMode?: "best" | "worst";
}

export interface ProductSalesReportViewProps {
  data: ProductSalesReportData;
  filterMode?: "best" | "worst";
  onFilterModeChange?: (mode: "best" | "worst") => void;
  isMobile?: boolean;
}

// 3. Employee Sales Report
export interface EmployeeOrderItem {
  id: number;
  orderNumber: string;
  createdAt: string;
  formattedTime?: string;
  paymentMethodLabel?: string;
  tableName?: string;
  netAmount: number;
  itemsCount: number;
  itemsSummary: string;
}
export type OrderItem = EmployeeOrderItem;

export interface EmployeeReportItem {
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
    productCode?: string;
    categoryName?: string;
    image: string | null;
    quantity: number;
    totalAmount: number;
  }[];
  orders: EmployeeOrderItem[];
  shifts?: any[];
}

export interface EmployeeSalesReportData {
  dateRangeText: string;
  dateRangeCode?: string;
  totalSales: number;
  employees: EmployeeReportItem[];
  staffList?: any[];
  staffBillsList?: any[];
  staffItemsList?: any[];
  shopName?: string;
  currency?: string;
}

export interface EmployeeSalesReportViewProps {
  data: EmployeeSalesReportData;
  isMobile?: boolean;
}

// 4. Bills & Receipts Report
export interface BillReportItem {
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
}
export type BillItem = BillReportItem;

export interface BillDateGroup {
  dateKey: string;
  dateTitleThai: string;
  bills: BillReportItem[];
}
export type DateGroup = BillDateGroup;

export interface BillsReceiptsReportData {
  dateRangeText: string;
  dateRangeCode?: string;
  totalSales: number;
  counts: {
    all: number;
    cash: number;
    qr: number;
  };
  dateGroups: BillDateGroup[];
  billsExportList?: any[];
  billItemsExportList?: any[];
  shopName?: string;
  currency?: string;
}

export interface BillsReceiptsReportViewProps {
  data: BillsReceiptsReportData;
  search: string;
  onSearchChange: (q: string) => void;
  paymentMethodFilter: "ALL" | "CASH" | "QR";
  onPaymentMethodFilterChange: (method: "ALL" | "CASH" | "QR") => void;
  isMobile?: boolean;
}

export interface OrderData {
  payments?: any[];
  [key: string]: any;
}
