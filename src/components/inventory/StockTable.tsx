"use client";

import { useState } from "react";
import Image from "next/image";
import { StockTableProps } from "@/lib/types";

export default function StockTable({ products, isPending, onToggleTrack, onOpenAdjustModal }: StockTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🌟 ฟังก์ชันค้นหา
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // 🌟 คำนวณการแบ่งหน้า (Pagination)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // เมื่อพิมพ์ค้นหา ให้กลับไปหน้า 1
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in flex flex-col">
      {/* ส่วนค้นหา */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสสินค้า..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
          />
        </div>
        {isPending && <span className="text-xs font-bold text-sky-500 animate-pulse">กำลังอัปเดต...</span>}
      </div>

      {/* ตารางสินค้า */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">รหัส / สินค้า</th>
              <th className="px-6 py-4 text-center">เปิดนับสต๊อก</th>
              <th className="px-6 py-4 text-right">คงเหลือ</th>
              <th className="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className={`transition ${!product.isActive ? "opacity-50 bg-slate-50" : "hover:bg-slate-50/80"}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : <span className="text-xl">📦</span>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {product.name} {!product.isActive && <span className="text-[10px] text-rose-500 border border-rose-200 px-1.5 py-0.5 rounded ml-2">(ปิดขาย)</span>}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{product.code || "ไม่มีรหัส"}</p>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer justify-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={product.isTrackStock} 
                      disabled={isPending}
                      onChange={() => onToggleTrack(product.id, product.isTrackStock)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </td>

                <td className="px-6 py-4 text-right">
                  {product.isTrackStock ? (
                    <span className={`font-black text-lg ${product.stock <= 5 ? "text-rose-500" : "text-emerald-600"}`}>
                      {product.stock.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-300 font-bold">-</span>
                  )}
                </td>
                
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onOpenAdjustModal(product)}
                    disabled={!product.isTrackStock || isPending}
                    className="text-sky-500 hover:text-sky-600 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition"
                  >
                    ปรับยอด
                  </button>
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-400">ไม่พบสินค้าที่คุณค้นหา</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            แสดงรายการที่ {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredProducts.length)} จากทั้งหมด {filteredProducts.length} รายการ
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <div className="flex items-center px-3 text-xs font-bold text-slate-700">
              หน้า {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}