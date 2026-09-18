import CategoryPills from "@/components/pos/CategoryPills";
import ProductGrid from "@/components/pos/ProductGrid";

export default async function POSHomePage() {
  // const products = await prisma.products.findMany(...)

  return (
    <>
      <CategoryPills />
      <ProductGrid />
    </>
  );
}
