"use client";

import {
  PaymentMethodPickerProps,
  PaymentMethodType,
} from "@/lib/interface";

export default function PaymentMethodPicker({
  currentMethod,
  onChange,
}: PaymentMethodPickerProps) {
  const methods = [
    { id: "CASH", label: "เงินสด", icon: "💵" },
    { id: "QR", label: "สแกน QR", icon: "📱" },
    { id: "CARD", label: "บัตร", icon: "💳" },
    { id: "MEMBER", label: "สมาชิก", icon: "👑" },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id as PaymentMethodType)}
          className={`py-2 px-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition ${
            currentMethod === m.id
              ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-2xs"
              : "bg-pos-bg border-pos-border text-pos-text/70 hover:border-pos-border/80"
          }`}
        >
          <span>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
