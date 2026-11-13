"use client";

import { FloatingSearchProps } from "@/lib/interface";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/language/LanguageContext";

export default function FloatingSearch({
  searchTerm,
  setSearchTerm,
}: FloatingSearchProps) {
  const { t } = useTranslation();
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
      target.closest("button") ||
      target.getAttribute("data-close-btn")
    ) {
      return;
    }

    isDraggingRef.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    if (position) {
      elementStartPos.current = { ...position };
    }

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (Math.hypot(dx, dy) > 6) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      let newX = elementStartPos.current.x + dx;
      let newY = elementStartPos.current.y + dy;

      if (typeof window !== "undefined") {
        const padding = 16;
        const elemWidth = isOpen ? 320 : 48;
        const elemHeight = 48;

        newX = Math.max(
          padding,
          Math.min(newX, window.innerWidth - elemWidth - padding),
        );
        newY = Math.max(
          padding,
          Math.min(newY, window.innerHeight - elemHeight - padding),
        );
      }

      const nextPos = { x: newX, y: newY };
      currentPosRef.current = nextPos;
      setPosition(nextPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  if (!position) return null;

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
      }}
      className="touch-none select-none"
    >
      <div className="relative">
        {!isOpen ? (
          /* ปุ่มวงกลมไอคอนแว่นขยาย */
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={toggleOpen}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-xl shadow-sky-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform"
            title={t("pos.search_placeholder")}
          >
            <svg
              className="w-5 h-5 pointer-events-none"
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
              placeholder={t("pos.search_placeholder")}
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
