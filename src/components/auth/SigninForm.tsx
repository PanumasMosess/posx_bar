"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions/authActions";
import EmployeePinModal from "@/components/auth/EmployeePinModal";
import { useEmployee } from "../providers/EmployeeContext";

interface SigninFormProps {
  onSuccess?: () => void;
}

export default function SigninForm({ onSuccess }: SigninFormProps) {
  const [orgCode, setOrgCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isOrgLoggedIn, setIsOrgLoggedIn] = useState(false);
  // 🌟 State เก็บ orgId เพื่อส่งต่อให้ Modal
  const [loggedOrgId, setLoggedOrgId] = useState<number>(0);
  const { setOrgId } = useEmployee();

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
        if (res.orgId) {
          setOrgId(res.orgId); // 🌟 เซฟ orgId ทันที ชัวร์ 100%
          setLoggedOrgId(res.orgId);
        }

        if (onSuccess) {
          onSuccess();
        } else {
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

  // 🌟 ส่ง orgId ผ่าน Props ไปให้ Modal ทันที (ไม่ต้องรอ Cookie)
  if (isOrgLoggedIn && loggedOrgId) {
    return <EmployeePinModal orgId={loggedOrgId} />;
  }

  return (
    <div className="w-full space-y-7">
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

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-extrabold flex items-center gap-3 animate-fade-in shadow-xs">
          <span className="text-xl">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-black text-slate-700 tracking-wide uppercase">
            บริษัท / ร้านค้า <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              disabled={isLoading}
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              placeholder="เช่น 18BAR"
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-black font-mono uppercase outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-black text-slate-700 tracking-wide uppercase">
              รหัสผ่าน (Password) <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-black text-slate-800 outline-none focus:border-sky-500"
            />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white font-black text-base shadow-lg transition-all"
          >
            {isLoading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบ POSX ➔"}
          </button>
        </div>
      </form>
    </div>
  );
}
