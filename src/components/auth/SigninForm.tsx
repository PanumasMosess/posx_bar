"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/authActions";
import EmployeeSelectPage from "@/components/auth/EmployeePinModal";

interface SigninFormProps {
  onSuccess?: () => void;
}

export default function SigninForm({ onSuccess }: SigninFormProps) {
  const router = useRouter();
  const [orgCode, setOrgCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // State สำหรับสลับไปแสดงหน้าเลือกพนักงาน EmployeeSelectPage
  const [isOrgLoggedIn, setIsOrgLoggedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("orgCode", orgCode);
      formData.append("password", password);

      const res = await loginAction(formData);

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          // 🌟 สลับ View ไปยังหน้า EmployeeSelectPage สำหรับกรอก PIN พนักงาน
          setIsOrgLoggedIn(true);
        }
      } else {
        setErrorMessage(
          res.message || "กรุณาระบุรหัสบริษัทและรหัสผ่านให้ถูกต้อง",
        );
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง");
      setIsLoading(false);
    }
  };

  // 🌟 เมื่อผ่าน Step 1 (รหัสร้านค้า) ให้เปลี่ยนมาแสดง EmployeeSelectPage ทันที
  if (isOrgLoggedIn) {
    return <EmployeeSelectPage />;
  }

  return (
    <div className="w-full space-y-7">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 text-xs font-black font-mono tracking-wider uppercase">
          <span>🏢</span> ENTERPRISE POS LOGIN
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          เข้าสู่ระบบ
        </h2>
        <p className="text-sm sm:text-base text-slate-500 font-semibold">
          กรอกชื่อบริษัท/ร้านค้า และรหัสผ่านเพื่อเข้าใช้งาน
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-extrabold flex items-center gap-3 animate-fade-in shadow-xs">
          <span className="text-xl">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Code Input */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-black text-slate-700 tracking-wide uppercase">
            บริษัท / ร้านค้า <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <input
              type="text"
              required
              disabled={isLoading}
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              placeholder="เช่น 18BAR"
              className="w-full pl-13 sm:pl-14 pr-4 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base sm:text-lg font-black font-mono text-slate-800 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-bold placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/15 transition-all duration-200 disabled:opacity-50 shadow-xs"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-black text-slate-700 tracking-wide uppercase">
              รหัสผ่าน (Password) <span className="text-rose-500">*</span>
            </label>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "โปรดติดต่อผู้จัดการร้านหรือ Admin ประจำสาขาเพื่อรับการรีเซ็ตรหัสผ่าน",
                );
              }}
              className="text-xs sm:text-sm font-extrabold text-sky-600 hover:text-sky-700 hover:underline transition"
            >
              ลืมรหัสผ่าน?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-13 sm:pl-14 pr-13 sm:pr-14 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base sm:text-lg font-black text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/15 transition-all duration-200 disabled:opacity-50 shadow-xs"
            />

            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer disabled:opacity-50"
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 0111.411 12.023m-2.128 2.127l-15.82 15.82"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg shadow-sky-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                <span>กำลังตรวจสอบสิทธิ์...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ POSX</span>
                <span className="text-xl">➔</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
