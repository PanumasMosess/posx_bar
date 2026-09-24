export type ModalView = "ADD_PRODUCT" | "ADD_CATEGORY" | "ADD_OPTION";

export type SettingsSection =
  | 'shop-team'
  | 'payment'
  | 'misc'
  | 'vat'
  | 'scan'
  | 'restaurant-mode'
  | 'currency'
  | 'business-hours'
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
  plan: 'trial' | 'paid';
  planExpiry: string;
  employees: Employee[];
}

export const PERMISSION_CONFIG: { key: keyof Permissions; label: string; desc: string }[] = [
  { key: 'accessPos', label: 'เข้าใช้งานหน้า POS', desc: 'สามารถเข้าถึงหน้าจอรับออเดอร์และคิดเงินได้' },
  { key: 'cancelRefund', label: 'ยกเลิกและคืนบิล', desc: 'สามารถยกเลิกออเดอร์ที่สั่งไปแล้วหรือคืนเงินได้' },
  { key: 'accessExpenses', label: 'จัดการรายจ่าย', desc: 'เข้าถึงหน้าบันทึกรายจ่ายประจำวันของร้าน' },
  { key: 'accessReports', label: 'ดูรายงาน', desc: 'สามารถเข้าถึงหน้าดูสรุปยอดขายและรายงานต่างๆ' },
  { key: 'accessSettings', label: 'การตั้งค่าระบบ', desc: 'เข้าถึงหน้าตั้งค่าร้านค้าและจัดการพนักงานได้' },
];