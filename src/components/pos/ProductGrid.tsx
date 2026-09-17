"use client";
import ProductCard from "./ProductCard";
import { useCart, Product } from "./CartContext"; // นำเข้า context

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "เหล้าขาว",
    image: "https://lh3.googleusercontent.com/aida/AEtjO1VKkf-raXcUrQOkCjOFepuc7XS6YZ-IV_H9Z10Iwh9Af33VAm3fZtSzsUZs33WgfayhbbHbWOIwVNRrCu-OnJ2gC75S9-3kK3p51K_AmbONV-ccgX_-dSSG_Mr1ETvXnfa20infBGRganyyvQeZRGU4KTp378evzMO7MFxAhESv3wITbCWGiS5N0pUXRyvEQPvywzhbs54AfynHuKu9TUl6DUDY_zD91W1ncqS68GqJ_d-sEzc8saIesqZF", // ใส่ URL รูปให้ครบตามเดิม
    price: 100000,
    stockText: "คงเหลือ 18 ขวด",
    optionsText: "2 ขนาด: กลม/แบน",
  },
  {
    id: "p2",
    title: "pr1 (PR บริการ)",
    image: "https://lh3.googleusercontent.com/aida/AEtjO1VKkf-raXcUrQOkCjOFepuc7XS6YZ-IV_H9Z10Iwh9Af33VAm3fZtSzsUZs33WgfayhbbHbWOIwVNRrCu-OnJ2gC75S9-3kK3p51K_AmbONV-ccgX_-dSSG_Mr1ETvXnfa20infBGRganyyvQeZRGU4KTp378evzMO7MFxAhESv3wITbCWGiS5N0pUXRyvEQPvywzhbs54AfynHuKu9TUl6DUDY_zD91W1ncqS68GqJ_d-sEzc8saIesqZF",
    price: 300000,
    stockText: "บริการพิเศษ",
    badgeStyle: "pink",
    optionsText: "บริการ 1 ชม. / ดื่ม",
  },
  {
    id: "p3",
    title: "เบียร์ลาว",
    image: "https://lh3.googleusercontent.com/aida/AEtjO1VKkf-raXcUrQOkCjOFepuc7XS6YZ-IV_H9Z10Iwh9Af33VAm3fZtSzsUZs33WgfayhbbHbWOIwVNRrCu-OnJ2gC75S9-3kK3p51K_AmbONV-ccgX_-dSSG_Mr1ETvXnfa20infBGRganyyvQeZRGU4KTp378evzMO7MFxAhESv3wITbCWGiS5N0pUXRyvEQPvywzhbs54AfynHuKu9TUl6DUDY_zD91W1ncqS68GqJ_d-sEzc8saIesqZF",
    price: 18000,
    stockText: "คงเหลือ 24 กระป๋อง",
    optionsText: "ตัวเลือก (ขวด/กระป๋อง)",
  },
  {
    id: "p4",
    title: "น้ำดื่ม (Aurora Pure)",
    image: "https://lh3.googleusercontent.com/aida/AEtjO1VKkf-raXcUrQOkCjOFepuc7XS6YZ-IV_H9Z10Iwh9Af33VAm3fZtSzsUZs33WgfayhbbHbWOIwVNRrCu-OnJ2gC75S9-3kK3p51K_AmbONV-ccgX_-dSSG_Mr1ETvXnfa20infBGRganyyvQeZRGU4KTp378evzMO7MFxAhESv3wITbCWGiS5N0pUXRyvEQPvywzhbs54AfynHuKu9TUl6DUDY_zD91W1ncqS68GqJ_d-sEzc8saIesqZF",
    price: 5000,
    stockText: "คงเหลือ 50 ขวด",
    optionsText: "เย็น / ไม่เย็น",
  },
];

export default function ProductGrid() {
  const { addToCart, cart } = useCart(); // เรียกใช้งานตะกร้า

  return (
    <div className="flex-1 overflow-y-auto custom-scroll p-3 sm:p-4 lg:p-5 pb-24 md:pb-28 lg:pb-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 max-w-7xl mx-auto">
        {MOCK_PRODUCTS.map((product) => {
          // ตรวจสอบว่ามีสินค้านี้ในตะกร้าไหม (เพื่อโชว์ badge กำลังเลือก)
          const isSelected = cart.some((item) => item.id === product.id);

          return (
            <ProductCard
              key={product.id}
              {...product}
              isSelected={isSelected}
              onAdd={() => addToCart(product)} // กดแล้วเพิ่มลงตะกร้าทันที!
            />
          );
        })}
      </div>
    </div>
  );
}