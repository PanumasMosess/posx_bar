"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmployee } from "@/components/providers/EmployeeContext";
import { verifyPinOnlyAction } from "@/lib/actions/authActions";

interface EmployeePinModalProps {
  orgId?: number;
}

export default function EmployeePinModal({ orgId }: EmployeePinModalProps) {
  const router = useRouter(); // 🌟 ใช้ router ในการเปลี่ยนหน้า
  const { setEmployeeSession, activeOrgId: contextOrgId } = useEmployee();

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
      const targetOrgId = orgId || contextOrgId;

      if (!targetOrgId || isNaN(targetOrgId)) {
        setErrorMessage("ไม่พบข้อมูลองค์กร โปรดเข้าสู่ระบบร้านค้าใหม่อีกครั้ง");
        setPin("");
        setIsVerifying(false); 
        return;
      }

      const res = await verifyPinOnlyAction(currentPin, targetOrgId);

      if (res.success && res.employee) {
        setEmployeeSession(res.employee);
        router.push("/pos");
      } else {
        setErrorMessage(res.message || "รหัส PIN ไม่ถูกต้อง");
        setPin("");
        setIsVerifying(false); 
      }
    } catch (err: any) {
      console.error("Client PIN Error:", err);
      setErrorMessage("ระบบขัดข้อง โปรดลองอีกครั้ง");
      setPin("");
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleVerifyPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 animate-fade-in select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-sm bg-pos-surface border border-pos-border text-pos-text rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center relative transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => window.location.reload()}
          className="absolute top-5 right-5 w-9 h-9 bg-pos-hover text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-colors cursor-pointer"
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

        <div className="flex flex-col items-center space-y-4 w-full mb-6 mt-2">
          <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 shadow-inner">
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-pos-text tracking-tight">
              เข้าสู่ระบบ POS
            </h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">
              กรอกรหัส PIN พนักงาน 4 หลัก
            </p>
          </div>
        </div>

        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-center gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? "bg-sky-500 border-sky-500 scale-125 shadow-md shadow-sky-500/40"
                    : "border-pos-border bg-pos-hover"
                }`}
              />
            ))}
          </div>

          <div className="h-5 text-center flex flex-col justify-center">
            {isVerifying ? (
              <div className="flex items-center justify-center gap-2 text-sky-500 font-bold text-xs animate-pulse">
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

        <div className="w-full grid grid-cols-3 gap-3 sm:gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              disabled={isVerifying || pin.length >= 4}
              onClick={() => handleKeyPress(num)}
              className="py-4 rounded-2xl bg-pos-hover hover:bg-sky-500/10 active:bg-sky-500/20 border border-pos-border active:scale-95 font-black text-2xl text-pos-text transition-all disabled:opacity-40 cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            disabled={isVerifying || pin.length === 0}
            onClick={handleClear}
            className="py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 font-black text-xs text-rose-500 border border-rose-500/20 transition-all disabled:opacity-40 cursor-pointer"
          >
            CLEAR
          </button>

          <button
            disabled={isVerifying || pin.length >= 4}
            onClick={() => handleKeyPress("0")}
            className="py-4 rounded-2xl bg-pos-hover hover:bg-sky-500/10 active:bg-sky-500/20 border border-pos-border active:scale-95 font-black text-2xl text-pos-text transition-all disabled:opacity-40 cursor-pointer"
          >
            0
          </button>

          <button
            disabled={isVerifying || pin.length === 0}
            onClick={handleDelete}
            className="py-4 rounded-2xl bg-pos-hover hover:bg-slate-500/20 active:scale-95 font-black text-lg text-slate-400 transition-all disabled:opacity-40 cursor-pointer"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
