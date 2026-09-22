"use client";

import { FloatingSearchProps } from "@/lib/types/interface";
import { useState, useRef, useEffect } from "react";


export default function FloatingSearch({
  searchTerm,
  setSearchTerm,
}: FloatingSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 16, y: 300 });

  // เช็คว่าปุ่มอยู่ครึ่งซ้ายหรือครึ่งขวาของหน้าจอ
  const isLeftSide =
    typeof window !== "undefined"
      ? (position?.x || 0) < window.innerWidth / 2
      : true;

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 🌟 ขยับตำแหน่ง Y ตั้งต้นให้สูงขึ้นเพื่อหลบ Floating Bar มือถือด้านล่าง
      const isMobile = window.innerWidth < 768;
      const initialPos = {
        x: 16,
        y: window.innerHeight - (isMobile ? 180 : 120),
      };
      setPosition(initialPos);
      currentPosRef.current = initialPos;
    }
  }, []);

  const toggleOpen = () => {
    if (isDraggingRef.current) return;

    setIsOpen((prev) => {
      const nextState = !prev;
      if (typeof window !== "undefined" && nextState) {
        const boxWidth = Math.min(window.innerWidth * 0.85, 320);
        let currentX = currentPosRef.current.x;

        if (currentX + boxWidth > window.innerWidth - 16) {
          currentX = Math.max(16, window.innerWidth - boxWidth - 16);
          currentPosRef.current.x = currentX;
          setPosition({ x: currentX, y: currentPosRef.current.y });
        }
      }
      return nextState;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.closest("button[data-close-btn]")
    ) {
      return;
    }

    isDraggingRef.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...currentPosRef.current };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current) {
        const currentWidth = isOpen
          ? Math.min(window.innerWidth * 0.85, 320)
          : 56;

        const maxAllowedX = Math.max(16, window.innerWidth - currentWidth - 16);
        // 🌟 จำกัดขอบล่างไม่ให้โดน Navigation / Floating Bar มือถือบัง
        const isMobile = window.innerWidth < 768;
        const maxAllowedY = Math.max(
          16,
          window.innerHeight - (isMobile ? 130 : 80),
        );

        const newX = Math.max(
          16,
          Math.min(maxAllowedX, elementStartPos.current.x + deltaX),
        );
        const newY = Math.max(
          16,
          Math.min(maxAllowedY, elementStartPos.current.y + deltaY),
        );

        currentPosRef.current = { x: newX, y: newY };
        setPosition({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  if (!position) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      /* 🌟 ดัน z-index ขึ้นมาที่ z-[90] เหนือ Floating Bar และปุ่มอื่นๆ */
      className="z-[90] select-none"
    >
      <div className="relative">
        {!isOpen ? (
          /* ปุ่มค้นหากลม */
          <button
            onPointerDown={handlePointerDown}
            onClick={toggleOpen}
            className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-cyan-500 text-white rounded-full shadow-2xl shadow-sky-500/50 flex items-center justify-center hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing outline-none border-none transition-transform"
            title="ลากเพื่อย้ายตำแหน่ง / คลิกเพื่อค้นหา"
          >
            <svg
              className="w-6 h-6 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </button>
        ) : (
          /* แถบช่องค้นหา */
          <div
            onPointerDown={handlePointerDown}
            className={`bg-pos-surface p-1.5 rounded-full shadow-2xl border border-pos-border flex items-center gap-2 w-[80vw] sm:w-[320px] max-w-sm cursor-grab active:cursor-grabbing animate-in zoom-in-95 duration-150 ${
              isLeftSide ? "origin-left" : "origin-right"
            }`}
          >
            <div className="pl-2.5 text-sky-500 shrink-0 pointer-events-none">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="ค้นหา ชื่อ, รหัส, ราคา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-pos-text placeholder-slate-400 py-1 w-full font-medium cursor-text min-w-0"
            />

            <button
              type="button"
              data-close-btn="true"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 rounded-full transition-colors shrink-0 outline-none border-none cursor-pointer"
            >
              <svg
                className="w-4 h-4 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
