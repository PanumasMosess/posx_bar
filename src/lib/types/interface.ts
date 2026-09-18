export interface PrismaProduct {
  id: number;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  isActive: boolean;
}

export interface ProductFormModalProps {
  onClose: () => void;
  initialCategories?: { id: number; name: string }[];
}

export interface ProductGridProps {
  initialProducts?: any[];
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
