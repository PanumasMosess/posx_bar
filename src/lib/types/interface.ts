export interface ToastAlertProps {
  isOpen: boolean;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export interface ProductCardProps {
  product: {
    id: number | string;
    code?: string | null;
    name: string;
    price: number | string;
    stock?: number | null;
    image?: string | null;
    category?: { name: string } | null;
    optionGroups?: any[];
  };
  isSelected?: boolean;
  onAdd: () => void;
  onEdit?: () => void;
}

export interface FloatingSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export interface ProductOptionModalProps {
  product: any;
  onClose: () => void;
  onConfirm: (cartItem: any) => void;
}

export interface PrismaProduct {
  id: number;
  code?: string | null;
  name: string;
  price: number;
  cost?: number | null;
  image: string | null;
  stock: number;
  barcode?: string | null;
  detail?: string | null;
  categoryId?: number | null;
  isActive: boolean;
  category?: { id: number; name: string } | null;
  optionGroups?: any[];
}

export interface ProductFormModalProps {
  onClose: () => void;
  initialCategories?: { id: number; name: string }[];
}

export interface ProductGridProps {
  initialProducts?: any[];
  onAddToCart?: (item: any) => void;
  onEditProduct?: (product: any) => void;
  onDeleteProduct?: (product: any) => void;
}

export interface CategoryPillsProps {
  initialCategories?: { id: number; name: string }[];
}

export interface ExtendedCategoryPillsProps extends CategoryPillsProps {
  selectedCategoryId?: number | null;
  onSelectCategory?: (id: number | null) => void;
}

export interface POSViewProps {
  categories: { id: number; name: string }[];
  products: any[];
}

export interface EditProductModalProps {
  productToEdit: any;
  initialCategories: { id: number; name: string }[];
  onClose: () => void;
}

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export interface CartItem {
  id: string;
  product: any;
  quantity: number;
  selectedOptions?: Record<string, any>;
  totalPrice: number;
}

export interface HeldBill {
  id: number;
  orderNumber: string;
  customerName?: string | null;
  qrCodeId?: number | null;
  kitchenStatus?: string;
  items: any[];
  totalPrice: number;
  heldAt: Date;
}

export interface CartContextType {
  cart: CartItem[];
  activeBillId: number | null;
  activeBillNumber: string | null;
  activeBillInfo: HeldBill | null;
  addToCart: (item: {
    product: any;
    quantity: number;
    selectedOptions?: any;
    totalPrice: number;
  }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  heldBills: HeldBill[];
  holdBill: (
    organizationId: number,
    options?: {
      customerName?: string;
      qrCodeId?: number | null;
      sendToKitchen?: boolean;
      kitchenItemIds?: string[];
    },
  ) => Promise<boolean>;
  resumeBill: (billId: number) => void;
  deleteBill: (billId: number) => Promise<void>;
  checkoutBill: (billId: number | string) => void;
  fetchHeldBills: (organizationId: number) => Promise<void>;
  isHolding: boolean;
}

export interface PaymentModalProps {
  billId: number | string | null;
  onClose: () => void;
}
