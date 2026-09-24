"use client";

import SigninForm from "@/components/auth/SigninForm";

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-slate-50 text-slate-800 flex transition-colors duration-300 font-sans overflow-hidden">
      <div className="w-full grid min-h-screen grid-cols-1 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* LEFT PANEL: Branding & Wallpaper Area (5/12 Cols) */}
        {/* ========================================================================= */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-slate-900 p-10 xl:p-14 select-none">
          {/* 🖼️ ภาพ Wallpaper พื้นหลังที่ระบุ */}
          <img
            src="https://wallpapercave.com/wp/wp8284081.jpg"
            alt="POSX Background"
            className="absolute inset-0 w-full h-full object-cover opacity-50 filter contrast-110 brightness-90 scale-105 transition-all duration-700"
          />

          {/* 🎨 Overlay โทนน้ำเงิน/ฟ้า ซ้อนทับให้ตัวหนังสือสีขาวอ่านง่าย ชัดเจน */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-sky-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.35),transparent_70%)]" />

          {/* Top Logo */}
          <div className="relative z-10">
            <a href="/" className="inline-block transition active:scale-95">
              <img
                src="https://app.posx.co/img/POSX_2.png"
                alt="POSX Logo"
                className="h-12 w-auto object-contain filter drop-shadow-md"
              />
            </a>
          </div>

          {/* Hero Content Section */}
          <div className="relative z-10 my-auto space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-black font-mono tracking-wider backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              POSX SYSTEM ONLINE v2.5
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                ยินดีต้อนรับสู่
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-teal-200">
                  ระบบผู้ช่วยร้านอาหาร Online
                </span>
              </h1>
              <p className="text-slate-200/90 text-sm xl:text-base font-medium leading-relaxed drop-shadow-xs">
                จัดการทุกออเดอร์หน้าร้าน ออกบิล สรุปยอดกะ และจอครัว KDS
                ได้อย่างลื่นไหลไม่มีสะดุด รองรับทุกอุปกรณ์ของคุณ
              </p>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md shadow-lg">
                <p className="text-[11px] font-black text-sky-300 uppercase tracking-wider">
                  ความเร็วประมวลผล
                </p>
                <p className="text-lg font-black text-white font-mono mt-0.5">
                  &lt; 0.1s Realtime
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md shadow-lg">
                <p className="text-[11px] font-black text-teal-300 uppercase tracking-wider">
                  ระบบความปลอดภัย
                </p>
                <p className="text-lg font-black text-white font-mono mt-0.5">
                  Cloud Encrypted
                </p>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>© {new Date().getFullYear()} infinitx Technology</span>
            <span className="font-mono text-slate-400">v2.5.0-Release</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Form Container Area (7/12 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 lg:p-12 bg-slate-50 relative">
          {/* Mobile Header Branding */}
          <div className="lg:hidden flex flex-col items-center mb-8 text-center space-y-2">
            <img
              src="https://app.posx.co/img/POSX_2.png"
              alt="POSX Logo"
              className="h-12 w-auto object-contain filter drop-shadow-xs"
            />
            <p className="text-xs font-bold text-slate-500">
              ระบบผู้ช่วยจัดการร้านอาหาร Online
            </p>
          </div>

          {/* Form Container Card - สีขาว สะอาดตา */}
          <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-7 sm:p-10 shadow-xl shadow-slate-200/60 transition-all duration-300">
            <SigninForm />
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-8 text-center text-xs text-slate-400 font-semibold">
            © {new Date().getFullYear()} infinitx Technology. All rights
            reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
