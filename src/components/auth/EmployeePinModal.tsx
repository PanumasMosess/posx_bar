"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmployee } from "@/components/providers/EmployeeContext";
import { verifyPinOnlyAction } from "@/lib/actions/authActions"; // ระบุ Path Action ของคุณให้ถูกต้อง

export default function EmployeePinModal() {
  const router = useRouter();
  const { setEmployeeSession } = useEmployee();

  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setErrorMessage("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage("");
  };

  const handleClear = () => {
    setPin("");
    setErrorMessage("");
  };

  const handleVerifyPin = async (currentPin: string) => {
    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await verifyPinOnlyAction(currentPin);

      if (res.success && res.employee) {
        setEmployeeSession(res.employee);

        // 🌟 ถ้าสำเร็จ: สั่งย้ายหน้าทันที และไม่ต้องสั่ง setIsVerifying(false)
        // เพื่อให้ไอคอน "กำลังโหลด" ค้างไว้จนกว่าจะย้ายหน้า /pos เสร็จ
        router.push("/pos");
        router.refresh();
      } else {
        // 🌟 ถ้าผิด: ค่อยโชว์ Error แจ้งเตือน เคลียร์รหัสผ่าน และปลดล็อกหน้าจอ
        setErrorMessage(res.message || "รหัส PIN ไม่ถูกต้อง");
        setPin("");
        setIsVerifying(false);
      }
    } catch (err) {
      setErrorMessage("ระบบขัดข้อง โปรดลองอีกครั้ง");
      setPin("");
      setIsVerifying(false);
    }
  };

  // ตรวจสอบและล็อกอินอัตโนมัติทันทีที่กรอกครบ 4 หลัก
  useEffect(() => {
    if (pin.length === 4) {
      handleVerifyPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      {/* Modal Container */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center relative">
        {/* Logout Button (มุมขวาบน) */}
        <button
          onClick={() => window.location.reload()}
          className="absolute top-5 right-5 w-9 h-9 bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 rounded-full flex items-center justify-center transition-colors"
          title="ออกจากระบบร้านค้า"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header & Logo */}
        <div className="flex flex-col items-center space-y-4 w-full mb-6 mt-2">
          <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100 shadow-inner">
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              เข้าสู่ระบบ POS
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              กรอกรหัส PIN พนักงาน 4 หลัก
            </p>
          </div>
        </div>

        {/* PIN Indicators & Error Space */}
        <div className="w-full space-y-4 mb-8">
          {/* PIN Bullets */}
          <div className="flex justify-center gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? "bg-sky-500 border-sky-500 scale-125 shadow-md shadow-sky-500/40"
                    : "border-slate-300 bg-slate-50"
                }`}
              />
            ))}
          </div>

          <div className="h-5 text-center flex flex-col justify-center">
            {isVerifying ? (
              <div className="flex items-center justify-center gap-2 text-sky-600 font-bold text-xs animate-pulse">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>กำลังเข้าสู่ระบบ...</span>
              </div>
            ) : errorMessage ? (
              <p className="text-xs font-black text-rose-500 animate-fade-in">
                ⚠️ {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        {/* Touch Keypad */}
        <div className="w-full grid grid-cols-3 gap-3 sm:gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              disabled={isVerifying || pin.length >= 4}
              onClick={() => handleKeyPress(num)}
              className="py-4 rounded-2xl bg-slate-50 hover:bg-sky-50 active:bg-sky-100 border border-slate-200/80 active:scale-95 font-black text-2xl text-slate-800 transition-all disabled:opacity-40 shadow-2xs"
            >
              {num}
            </button>
          ))}

          <button
            disabled={isVerifying || pin.length === 0}
            onClick={handleClear}
            className="py-4 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 font-black text-xs text-rose-600 transition-all disabled:opacity-40"
          >
            CLEAR
          </button>

          <button
            disabled={isVerifying || pin.length >= 4}
            onClick={() => handleKeyPress("0")}
            className="py-4 rounded-2xl bg-slate-50 hover:bg-sky-50 active:bg-sky-100 border border-slate-200/80 active:scale-95 font-black text-2xl text-slate-800 transition-all disabled:opacity-40 shadow-2xs"
          >
            0
          </button>

          <button
            disabled={isVerifying || pin.length === 0}
            onClick={handleDelete}
            className="py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 font-black text-lg text-slate-600 transition-all disabled:opacity-40"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
