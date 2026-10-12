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

