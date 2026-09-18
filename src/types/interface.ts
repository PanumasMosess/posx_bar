export interface PrismaProduct {
  id: number;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  isActive: boolean;
}

export interface ProductGridProps {
  products: PrismaProduct[];
}
