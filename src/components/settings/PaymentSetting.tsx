'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useEmployee } from '@/components/providers/EmployeeContext';
import {
  getPaymentSettingsAction,
  savePaymentSettingsAction,
} from '@/lib/actions/actionsSettings';

/* ==================== PromptPay EMVCo Helper ==================== */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');

  let targetType = '01';
  let formattedTarget = '';

  if (cleanTarget.length === 10) {
    targetType = '01';
    formattedTarget = '0066' + cleanTarget.substring(1);
  } else if (cleanTarget.length === 13) {
    targetType = '02';
    formattedTarget = cleanTarget;
  } else if (cleanTarget.length === 15) {
    targetType = '03';
    formattedTarget = cleanTarget;
  } else {
    if (cleanTarget.startsWith('0')) {
      targetType = '01';
      formattedTarget = '0066' + cleanTarget.substring(1).padStart(9, '0');
    } else {
      targetType = '02';
      formattedTarget = cleanTarget.padStart(13, '0');
    }
  }

  const sub00 = formatTag('00', 'A000000677010111');
  const sub01 = formatTag(targetType, formattedTarget);
  const tag29 = formatTag('29', sub00 + sub01);

  const tag00 = formatTag('00', '01');
  const tag01 = formatTag('01', amount ? '12' : '11');
  const tag53 = formatTag('53', '764');

  let tag54 = '';
  if (amount && amount > 0) {
    tag54 = formatTag('54', amount.toFixed(2));
  }

  const tag58 = formatTag('58', 'TH');

  const rawPayload = tag00 + tag01 + tag29 + tag53 + tag54 + tag58 + '6304';
  const checksum = crc16(rawPayload);

  return rawPayload + checksum;
}

/**
 * วาดสี่เหลี่ยมมุมโค้งมน (Canvas Helper)
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * วาด QR Code สไตล์โมเดิร์น สวยงาม คมชัด หลอมรวมเป็นเนื้อเดียวกัน
 * - Data Modules: Rounded squircles สีน้ำเงินเข้ม PromptPay Navy (#002b5c)
 * - Corner Finder Patterns: สไตล์โค้งมน พรีเมียม 1:1:3:1:1
 * - ตัดช่องว่างตรงกลางแบบวงกลมสะอาดตา ไร้รอยแหว่งของจุด
 * - ฝังโลโก้ POSX ตรงกลางเป็นเนื้อเดียวกันอย่างประณีต
 */
function drawCustomQrToCanvas(
  ctx: CanvasRenderingContext2D,
  payload: string,
  startX: number,
  startY: number,
  size: number
) {
  const qr = (QRCode as any).create(payload, { errorCorrectionLevel: 'H' });
  const moduleCount: number = qr.modules.size;
  const cellSize = size / moduleCount;

  // สีหลักของ QR Code: Deep PromptPay Navy Blue & Accent Sky
  const primaryNavy = '#002b5c';
  const accentSky = '#0284c7';

  // พิกัดกึ่งกลาง QR
  const centerModule = moduleCount / 2;
  // รัศมีพื้นที่ตรงกลางสำหรับโลโก้ (ตัดเว้นว่างไว้เพื่อความเนียน ไม่ให้จุดมาชน)
  const logoRadiusModules = 4.2;

  // ฟังก์ชันเช็คว่าโมดูลนี้อยู่ใน Corner Finder Pattern หรือ Separator หรือไม่
  const isFinderZone = (r: number, c: number) => {
    if (r <= 7 && c <= 7) return true;
    if (r <= 7 && c >= moduleCount - 8) return true;
    if (r >= moduleCount - 8 && c <= 7) return true;
    return false;
  };

  // ฟังก์ชันเช็คว่าโมดูลนี้อยู่ในพื้นที่โลโก้ตรงกลางหรือไม่
  const isCenterLogoZone = (r: number, c: number) => {
    const dr = r + 0.5 - centerModule;
    const dc = c + 0.5 - centerModule;
    return Math.sqrt(dr * dr + dc * dc) <= logoRadiusModules;
  };

  // 1. วาดจุด Data Modules ทั้งหมด
  ctx.fillStyle = primaryNavy;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderZone(r, c) || isCenterLogoZone(r, c)) continue;

      if (qr.modules.get(r, c)) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        // วาดเป็น squircle มนสวยงาม นุ่มนวล
        const pad = cellSize * 0.08;
        const dotSize = cellSize - pad * 2;
        const dotRadius = dotSize * 0.35;
        drawRoundedRect(ctx, x + pad, y + pad, dotSize, dotSize, dotRadius);
        ctx.fill();
      }
    }
  }

  // 2. วาด Finder Patterns ทั้ง 3 มุมแบบพรีเมียม (Top-Left, Top-Right, Bottom-Left)
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 },
  ];

  finderPositions.forEach(({ r, c }) => {
    const x = startX + c * cellSize;
    const y = startY + r * cellSize;
    const eyeSize = 7 * cellSize;

    // เคลียร์พื้นหลังสีขาวของ Finder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, eyeSize, eyeSize);

    // 2.1 กรอบนอก 7x7
    ctx.fillStyle = primaryNavy;
    drawRoundedRect(ctx, x, y, eyeSize, eyeSize, 1.8 * cellSize);
    ctx.fill();

    // 2.2 รูเจาะด้านใน 5x5 สีขาว
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, 1.1 * cellSize);
    ctx.fill();

    // 2.3 จุดกึ่งกลาง (Pupil) 3x3 สีฟ้าไล่เฉดไปน้ำเงินเข้ม
    const pupilX = x + 2 * cellSize;
    const pupilY = y + 2 * cellSize;
    const pupilSize = 3 * cellSize;

    const pupilGrad = ctx.createLinearGradient(pupilX, pupilY, pupilX + pupilSize, pupilY + pupilSize);
    pupilGrad.addColorStop(0, accentSky);
    pupilGrad.addColorStop(1, primaryNavy);

    ctx.fillStyle = pupilGrad;
    drawRoundedRect(ctx, pupilX, pupilY, pupilSize, pupilSize, 0.8 * cellSize);
    ctx.fill();
  });

  // 3. วาดโลโก้ POSX ตรงกลางอย่างประณีตและกลมกลืน
  const logoDiameter = (logoRadiusModules * 2 - 0.2) * cellSize;
  const centerX = startX + size / 2;
  const centerY = startY + size / 2;

  // 3.1 วงแหวนสีขาวรอบนอก + เงาละมุน (Safe Cutout Ring)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 43, 92, 0.16)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, centerY, logoDiameter / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3.2 วงกลมด้านในไล่เฉด Gradient สไตล์ POSX
  const innerRadius = logoDiameter / 2 - cellSize * 0.65;
  const logoGrad = ctx.createLinearGradient(
    centerX - innerRadius,
    centerY - innerRadius,
    centerX + innerRadius,
    centerY + innerRadius
  );
  logoGrad.addColorStop(0, '#06b6d4'); // Cyan
  logoGrad.addColorStop(0.5, '#0284c7'); // Sky
  logoGrad.addColorStop(1, '#002b5c'); // Deep Navy

  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // 3.3 วาดสัญลักษณ์ POSX สีขาว คมชัด สวยงาม
  ctx.save();
  const iconSpan = innerRadius * 0.85;
  const iconY = centerY - innerRadius * 0.14;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, innerRadius * 0.18);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // ขาไขว้ 1
  ctx.moveTo(centerX - iconSpan / 2, iconY - iconSpan / 2);
  ctx.lineTo(centerX + iconSpan / 2, iconY + iconSpan / 2);
  // ขาไขว้ 2
  ctx.moveTo(centerX + iconSpan / 2, iconY - iconSpan / 2);
  ctx.lineTo(centerX - iconSpan / 2, iconY + iconSpan / 2);
  ctx.stroke();

  // จุดกลาง
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, iconY, innerRadius * 0.13, 0, Math.PI * 2);
  ctx.fill();

  // ตัวอักษร POSX ใต้สัญลักษณ์
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(innerRadius * 0.38)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('POSX', centerX, centerY + innerRadius * 0.58);
  ctx.restore();
}

/**
 * สร้างรูปภาพ QR Code สี่เหลี่ยมจัตุรัสความละเอียดสูง (800 x 800 px)
 * แสดงเฉพาะตัว QR Code เพียวๆ ในกรอบหน้าจอตั้งค่า
 */
function generateCustomQrCode(payload: string): string {
  const canvas = document.createElement('canvas');
  const size = 800;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // พื้นหลังสีขาว
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // วาด QR Code โดยเว้นระยะขอบ (Margin) รอบตัว QR ให้อ่านง่าย
  const margin = 48;
  const qrSize = size - margin * 2;
  drawCustomQrToCanvas(ctx, payload, margin, margin, qrSize);

  return canvas.toDataURL('image/png');
}

/**
 * สร้างภาพการ์ด QR Code ชำระเงินขนาดเต็ม (800 x 1060 px)
 * สำหรับดาวน์โหลดไปพิมพ์ติดหน้าร้าน พร้อมข้อมูลที่ Mask เลขเพื่อความปลอดภัย (PDPA)
 */
function generateFullPaymentCard(
  payload: string,
  accountName: string,
  promptPayNumber: string
): string {
  const canvas = document.createElement('canvas');
  const w = 800;
  const h = 1060;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. พื้นหลังการ์ดสีขาวบริสุทธิ์
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 2. แถบหัวด้านบนสีน้ำเงินเข้ม THAI QR PAYMENT (PromptPay Official Theme)
  const headerH = 150;
  const headGrad = ctx.createLinearGradient(0, 0, w, 0);
  headGrad.addColorStop(0, '#002b5c');
  headGrad.addColorStop(0.5, '#003868');
  headGrad.addColorStop(1, '#025298');
  ctx.fillStyle = headGrad;
  ctx.fillRect(0, 0, w, headerH);

  // ข้อความหัว THAI QR PAYMENT
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText('THAI QR PAYMENT', w / 2, 58);

  ctx.fillStyle = '#93c5fd'; // sky-300
  ctx.font = '600 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('สแกน QR Code เพื่อชำระเงิน', w / 2, 102);

  // 3. กรอบกล่องสีขาวสำหรับวาง QR Code
  const qrBoxSize = 510;
  const qrBoxX = (w - qrBoxSize) / 2;
  const qrBoxY = 195;

  // กรอบสีเทาอ่อนล้อมรอบ QR ให้ดูเป็นการ์ดพรีเมียม
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, qrBoxX - 16, qrBoxY - 16, qrBoxSize + 32, qrBoxSize + 32, 24);
  ctx.stroke();

  // 4. วาดตัว QR Code ลวดลายโมเดิร์น สวยงาม พร้อมโลโก้ POSX ตรงกลาง
  drawCustomQrToCanvas(ctx, payload, qrBoxX, qrBoxY, qrBoxSize);

  // 5. เส้นคั่นแบ่งโซน
  const dividerY = 765;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, dividerY);
  ctx.lineTo(w - 80, dividerY);
  ctx.stroke();

  // 6. ชื่อบัญชี / ชื่อกำกับใต้ QR
  const displayName = accountName.trim() || 'พร้อมเพย์ (PromptPay)';
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(displayName, w / 2, 815);

  // 7. เลขพร้อมเพย์แบบ Mask เพื่อความปลอดภัย (PDPA Security)
  if (promptPayNumber.trim()) {
    const clean = promptPayNumber.trim().replace(/\D/g, '');
    let displayNum = '';

    if (clean.length === 10) {
      // เบอร์โทรศัพท์: ซ่อน 3 ตัวกลาง แสดง 3 ตัวหน้าและ 4 ตัวท้าย
      displayNum = `${clean.slice(0, 3)}-xxx-${clean.slice(6)}`;
    } else if (clean.length === 13) {
      // เลขบัตรประชาชน: ซ่อนข้อมูลส่วนบุคคล แสดงเฉพาะ 3 ตัวท้ายเพื่อยืนยัน ป้องกันมิจฉาชีพ
      displayNum = `x-xxxx-xxxxx-${clean.slice(10, 12)}-${clean.slice(12)}`;
    } else if (clean.length > 5) {
      displayNum = `${clean.slice(0, 3)}****${clean.slice(-3)}`;
    } else {
      displayNum = clean;
    }

    ctx.fillStyle = '#475569'; // slate-600
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`พร้อมเพย์: ${displayNum}`, w / 2, 870);
  }

  // 8. ข้อความกำกับด้านล่าง
  ctx.fillStyle = '#0284c7'; // sky-600
  ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
  ctx.fillText('รองรับการโอนผ่านทุกธนาคารและ Mobile Banking', w / 2, 930);

  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('POWERED BY POSX', w / 2, 985);

  return canvas.toDataURL('image/png');
}

/* ==================== SVG Icons ==================== */
function CashHandIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 13" />
      <circle cx="16" cy="6" r="3" />
    </svg>
  );
}

function QrTransferIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <circle cx="17.5" cy="17.5" r="1.75" fill="currentColor" />
      <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CardIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function SplitBranchIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="6" r="2" />
      <path d="M6 8v8" />
      <path d="M6 12h5a5 5 0 0 0 5-5V8" />
    </svg>
  );
}

function WalletIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <rect x="15" y="9" width="7" height="6" rx="2" />
      <circle cx="18.5" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ChevronUpIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PhoneIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function ImageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
    </svg>
  );
}

function UploadArrowIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function DownloadIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

/* ==================== Types ==================== */
export type PaymentChannelType = 'cash' | 'transfer' | 'credit' | 'split' | 'custom';

export interface PaymentChannel {
  id: string;
  type: PaymentChannelType;
  title: string;
  subtext?: string;
  canExpand: boolean;
  config: {
    // for transfer
    transferTab?: 'phone' | 'id_card' | 'qr';
    phone?: string;
    idCard?: string;
    accountName?: string;
    qrImageUrl?: string | null;
    // for credit
    creditCardFee?: number;
    // for custom
    customName?: string;
  };
}

const DEFAULT_CHANNELS: PaymentChannel[] = [
  {
    id: 'cash',
    type: 'cash',
    title: 'เงินสด',
    canExpand: false,
    config: {},
  },
  {
    id: 'transfer',
    type: 'transfer',
    title: 'โอนเงิน',
    subtext: 'ยังไม่ได้ตั้งค่า',
    canExpand: true,
    config: {
      transferTab: 'phone',
      phone: '',
      idCard: '',
      accountName: '',
      qrImageUrl: null,
    },
  },
];

/* ==================== Main Component ==================== */
export default function PaymentSetting() {
  const { organizationId } = useEmployee();
  const storageKey = `posx_payment_channels_${organizationId || 'default'}`;

  const [channels, setChannels] = useState<PaymentChannel[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_CHANNELS;
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Transfer Form State (เบอร์โทรและเลขบัตรคือช่องเดียวกัน ค่าเดียวกัน promptPayNumber)
  const [transferTab, setTransferTab] = useState<'phone' | 'id_card' | 'qr'>('phone');
  const [promptPayNumber, setPromptPayNumber] = useState(''); // ค่าเดียวกันสำหรับทั้งเบอร์โทรและเลขบัตร
  const [transferAccountName, setTransferAccountName] = useState(''); // ชื่อใต้รูป
  const [transferQrImage, setTransferQrImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Credit Card Form State
  const [creditFee, setCreditFee] = useState<number>(3);

  // Custom Form State
  const [customChannelName, setCustomChannelName] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(channels));
    } catch (e) {
      console.error(e);
    }
  }, [channels, storageKey]);

  // โหลดข้อมูลการตั้งค่าจากฐานข้อมูล (payments_settings) เมื่อเข้าหน้า
  useEffect(() => {
    async function loadSettingsFromDB() {
      if (!organizationId) return;
      try {
        const res = await getPaymentSettingsAction(Number(organizationId));
        if (res.success && res.data) {
          const dbData = res.data;
          const pNum = dbData.promptPayNumber || '';
          const pName = dbData.promptPayName || '';
          const qrUrl = dbData.qrImageUrl || null;
          const ccFee = dbData.creditCardFee;

          setPromptPayNumber(pNum);
          setTransferAccountName(pName);
          setTransferQrImage(qrUrl);

          let transferSubtext = 'ยังไม่ได้ตั้งค่า';
          if (qrUrl) {
            transferSubtext = 'สแกน QR Code พร้อมเพย์';
          } else if (pNum) {
            transferSubtext = `พร้อมเพย์: ${pNum}`;
          } else if (pName) {
            transferSubtext = `บัญชี: ${pName}`;
          }

          setChannels((prev) => {
            const hasCredit = ccFee !== null && ccFee !== undefined;
            // 1. อัปเดตข้อมูลในช่องทางเดิม
            let updated = prev.map((c) => {
              if (c.type === 'transfer') {
                return {
                  ...c,
                  subtext: transferSubtext,
                  config: {
                    ...c.config,
                    transferTab: c.config.transferTab || 'phone',
                    phone: pNum,
                    idCard: pNum,
                    accountName: pName,
                    qrImageUrl: qrUrl,
                  },
                };
              }
              if (c.type === 'credit') {
                return {
                  ...c,
                  subtext: `ค่าธรรมเนียม ${ccFee}%`,
                  config: { ...c.config, creditCardFee: Number(ccFee) },
                };
              }
              return c;
            });

            // 2. ตรวจสอบบัตรเครดิต: ถ้ามีค่า creditCardFee ให้แสดง ถ้าไม่มีให้กรองออก (ไม่ต้องเอามาแสดง)
            if (hasCredit) {
              if (!updated.some((c) => c.type === 'credit')) {
                updated.push({
                  id: 'credit',
                  type: 'credit',
                  title: 'บัตรเครดิต',
                  subtext: `ค่าธรรมเนียม ${ccFee}%`,
                  canExpand: true,
                  config: { creditCardFee: Number(ccFee) },
                });
              }
            } else {
              updated = updated.filter((c) => c.type !== 'credit');
            }

            return updated;
          });

          if (ccFee !== null && ccFee !== undefined) {
            setCreditFee(Number(ccFee));
          }
        } else {
          // หากไม่มีข้อมูลใน DB ช่องทางบัตรเครดิตจะไม่แสดง
          setChannels((prev) => prev.filter((c) => c.type !== 'credit'));
        }
      } catch (err) {
        console.error('Failed to load payment settings:', err);
      }
    }

    loadSettingsFromDB();
  }, [organizationId]);

  // When expanding a channel, load its config into form state
  const handleToggleExpand = (channel: PaymentChannel) => {
    if (!channel.canExpand) return;

    if (expandedId === channel.id) {
      setExpandedId(null);
    } else {
      setExpandedId(channel.id);
      if (channel.type === 'transfer') {
        setTransferTab(channel.config.transferTab || 'phone');
        const num = channel.config.phone || channel.config.idCard || '';
        setPromptPayNumber(num);
        setTransferAccountName(channel.config.accountName || '');
        setTransferQrImage(channel.config.qrImageUrl || null);
      } else if (channel.type === 'credit') {
        setCreditFee(channel.config.creditCardFee ?? 3);
      } else if (channel.type === 'custom') {
        setCustomChannelName(channel.config.customName || channel.title);
      }
    }
  };

  // Delete / Remove channel
  const handleDeleteChannel = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`คุณต้องการลบช่องทาง "${title}" หรือไม่?`)) {
      const targetChannel = channels.find((c) => c.id === id);

      // หากเป็นการลบช่องทางบัตรเครดิต ให้อัปเดต creditCardFee เป็น null ใน DB
      if (targetChannel?.type === 'credit' && organizationId) {
        try {
          await savePaymentSettingsAction({
            organizationId: Number(organizationId),
            creditCardFee: null,
          });
        } catch (err) {
          console.error('Failed to clear creditCardFee in DB:', err);
        }
      }

      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
      showToast(`ลบช่องทาง "${title}" สำเร็จ`, 'success');
    }
  };

  // Save Transfer Config (บันทึกข้อมูลโอนเงินลง Database ผ่าน actionsSettings.ts)
  const handleSaveTransfer = async (channelId: string) => {
    let subtext = 'ยังไม่ได้ตั้งค่า';
    if (transferTab === 'phone' && promptPayNumber.trim()) {
      subtext = `พร้อมเพย์: ${promptPayNumber.trim()}`;
    } else if (transferTab === 'id_card' && promptPayNumber.trim()) {
      subtext = `เลขบัตร: ${promptPayNumber.trim()}`;
    } else if (transferTab === 'qr' && transferQrImage) {
      subtext = 'สแกน QR Code พร้อมเพย์';
    } else if (transferAccountName.trim()) {
      subtext = `บัญชี: ${transferAccountName.trim()}`;
    }

    if (organizationId) {
      try {
        setIsSaving(true);
        const res = await savePaymentSettingsAction({
          organizationId: Number(organizationId),
          promptPayNumber: promptPayNumber.trim() || null,
          promptPayName: transferAccountName.trim() || null,
          qrImageUrl: transferQrImage,
        });

        if (!res.success) {
          showToast(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
          return;
        }

        if (res.data?.qrImageUrl) {
          setTransferQrImage(res.data.qrImageUrl);
        }
      } catch (err) {
        console.error('Save payment settings error:', err);
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        return;
      } finally {
        setIsSaving(false);
      }
    }

    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            subtext,
            config: {
              ...c.config,
              transferTab,
              phone: promptPayNumber.trim(),
              idCard: promptPayNumber.trim(),
              accountName: transferAccountName.trim(),
              qrImageUrl: transferQrImage,
            },
          };
        }
        return c;
      })
    );

    showToast('บันทึกข้อมูลโอนเงินเรียบร้อยแล้ว', 'success');
  };

  // Credit Card Auto-save Timeout Ref
  const creditSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (creditSaveTimeoutRef.current) {
        clearTimeout(creditSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save Credit Card Config ทันทีเมื่อมีการแก้ไขค่า (Auto-save ไม่ต้องมีปุ่มกด)
  const handleCreditFeeChange = (valStr: string, channelId: string) => {
    const rawNum = parseFloat(valStr);
    const feeNum = isNaN(rawNum) ? 0 : Math.max(0, Math.min(100, rawNum));
    setCreditFee(feeNum);

    // อัปเดต state ทันที
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId || c.type === 'credit') {
          return {
            ...c,
            subtext: `ค่าธรรมเนียม ${feeNum}%`,
            config: {
              ...c.config,
              creditCardFee: feeNum,
            },
          };
        }
        return c;
      })
    );

    // Debounce บันทึกลงฐานข้อมูลอัตโนมัติ
    if (creditSaveTimeoutRef.current) {
      clearTimeout(creditSaveTimeoutRef.current);
    }

    creditSaveTimeoutRef.current = setTimeout(async () => {
      if (organizationId) {
        try {
          await savePaymentSettingsAction({
            organizationId: Number(organizationId),
            creditCardFee: feeNum,
          });
          showToast(`บันทึกค่าธรรมเนียม ${feeNum}% เรียบร้อยแล้ว`, 'success');
        } catch (err) {
          console.error('Auto-save credit fee error:', err);
        }
      }
    }, 400);
  };

  // Save Custom Config
  const handleSaveCustom = (channelId: string) => {
    const finalName = customChannelName.trim() || 'ช่องทางอื่น';
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            title: finalName,
            subtext: 'ตั้งชื่อเอง',
            config: {
              ...c.config,
              customName: finalName,
            },
          };
        }
        return c;
      })
    );
    showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
  };

  // Handle QR Image Upload (ทำเหมือน FormProduct.tsx)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('ขนาดรูปภาพต้องไม่เกิน 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferQrImage(reader.result as string);
        showToast('เลือกรูป QR เรียบร้อยแล้ว (กดบันทึกเพื่ออัปเดต)', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // ลบรูปภาพ QR Code (ทำเหมือน FormProduct.tsx)
  const removeImage = () => {
    setTransferQrImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('ลบรูป QR เรียบร้อยแล้ว (กดบันทึกเพื่ออัปเดต)', 'success');
  };

  // สร้างรูป QR Code จากเลขพร้อมเพย์
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const handleGenerateQrFromPromptPay = async () => {
    const rawNumber = promptPayNumber.trim();
    if (!rawNumber) {
      showToast('กรุณากรอกเบอร์โทรหรือเลขบัตรประชาชนก่อนสร้าง QR', 'error');
      return;
    }

    try {
      setIsGeneratingQr(true);
      const payload = generatePromptPayPayload(rawNumber);
      // สร้างเฉพาะรูป QR Code สี่เหลี่ยมจัตุรัสลายสวยงามพร้อมโลโก้ POSX ตรงกลาง (สำหรับแสดงในกรอบ)
      const qrDataUrl = generateCustomQrCode(payload);

      setTransferQrImage(qrDataUrl);
      setTransferTab('qr');
      showToast('สร้างรูป QR Code พร้อมเพย์สำเร็จแล้ว! (กดบันทึกเพื่อใช้งาน)', 'success');
    } catch (err) {
      console.error('Error generating QR from PromptPay:', err);
      showToast('เกิดข้อผิดพลาดในการสร้าง QR Code', 'error');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // ดาวน์โหลดรูป QR พร้อมเพย์สำหรับการ์ดพิมพ์ติดหน้าร้าน (มีหัวข้อ ชื่อ และเลข Mask ป้องกันความเป็นส่วนตัว)
  const handleDownloadPrintableQr = async () => {
    if (!transferQrImage && !promptPayNumber.trim()) {
      showToast('กรุณากรอกเลขพร้อมเพย์หรืออัปโหลดรูป QR ก่อนดาวน์โหลด', 'error');
      return;
    }

    try {
      let finalCardUrl = '';
      if (promptPayNumber.trim()) {
        const payload = generatePromptPayPayload(promptPayNumber.trim());
        finalCardUrl = generateFullPaymentCard(payload, transferAccountName, promptPayNumber.trim());
      } else if (transferQrImage) {
        finalCardUrl = transferQrImage;
      }

      if (!finalCardUrl) {
        showToast('ไม่พบข้อมูลรูป QR Code', 'error');
        return;
      }

      const safeName = (transferAccountName || promptPayNumber || 'PromptPay').replace(/[^a-zA-Z0-9ก-๙]/g, '_');

      // ถ้าเป็น Data URL ดาวน์โหลดได้โดยตรงทันที
      if (finalCardUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = finalCardUrl;
        a.download = `QR_PromptPay_${safeName}.png`;
        a.click();
      } else {
        // หากเป็น S3 URL โหลดผ่าน canvas ก่อนดาวน์โหลด
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = finalCardUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 1060;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `QR_PromptPay_${safeName}.png`;
          a.click();
        }
      }

      showToast('ดาวน์โหลดรูป QR สำหรับปริ้นท์เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error('Error downloading printable QR:', err);
      showToast('เกิดข้อผิดพลาดในการดาวน์โหลดรูป QR', 'error');
    }
  };

  // Add Channel from Modal
  const handleAddChannel = async (type: PaymentChannelType) => {
    if (type === 'credit') {
      const exists = channels.some((c) => c.type === 'credit');
      if (exists) {
        showToast('มีช่องทางบัตรเครดิตอยู่แล้ว', 'error');
        return;
      }

      if (organizationId) {
        try {
          await savePaymentSettingsAction({
            organizationId: Number(organizationId),
            creditCardFee: 3,
          });
        } catch (err) {
          console.error('Failed to set default credit fee:', err);
        }
      }

      const newChannel: PaymentChannel = {
        id: `credit_${Date.now()}`,
        type: 'credit',
        title: 'บัตรเครดิต',
        subtext: 'ค่าธรรมเนียม 3%',
        canExpand: true,
        config: { creditCardFee: 3 },
      };
      setChannels((prev) => [...prev, newChannel]);
      setExpandedId(newChannel.id);
      setCreditFee(3);
      setIsAddModalOpen(false);
      showToast('เพิ่มช่องทางบัตรเครดิตเรียบร้อยแล้ว', 'success');
    } else if (type === 'split') {
      const exists = channels.some((c) => c.type === 'split');
      if (exists) {
        showToast('มีช่องทางผสม 2 ช่องทางอยู่แล้ว', 'error');
        return;
      }
      const newChannel: PaymentChannel = {
        id: `split_${Date.now()}`,
        type: 'split',
        title: 'ผสม 2 ช่องทาง',
        subtext: 'เช่น คนละครึ่งคู่กับเงินสด',
        canExpand: true,
        config: {},
      };
      setChannels((prev) => [...prev, newChannel]);
      setExpandedId(newChannel.id);
      setIsAddModalOpen(false);
      showToast('เพิ่มช่องทางผสมเรียบร้อยแล้ว', 'success');
    } else if (type === 'custom') {
      const newChannel: PaymentChannel = {
        id: `custom_${Date.now()}`,
        type: 'custom',
        title: 'ช่องทางอื่น',
        subtext: 'ตั้งชื่อเอง เช่น คนละครึ่ง',
        canExpand: true,
        config: { customName: 'ช่องทางอื่น' },
      };
      setChannels((prev) => [...prev, newChannel]);
      setExpandedId(newChannel.id);
      setCustomChannelName('ช่องทางอื่น');
      setIsAddModalOpen(false);
      showToast('เพิ่มช่องทางอื่นเรียบร้อยแล้ว', 'success');
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/80 dark:border-teal-700 dark:text-teal-100'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'
            }`}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container Card (White box with rounded corners) */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-pos-border dark:border-slate-500/40 bg-pos-surface shadow-2xs overflow-hidden transition-colors duration-300">
        {channels.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm font-semibold">ยังไม่มีช่องทางการชำระเงิน</p>
            <p className="text-xs mt-1">กดปุ่ม &quot;เพิ่มช่องทาง&quot; ด้านล่างเพื่อเพิ่ม</p>
          </div>
        ) : (
          channels.map((ch, index) => {
            const isExpanded = expandedId === ch.id;
            const isLast = index === channels.length - 1;

            return (
              <div
                key={ch.id}
                className={`${!isLast ? 'border-b border-dashed border-pos-border dark:border-slate-500/40' : ''}`}
              >
                {/* Row Header */}
                <div
                  onClick={() => handleToggleExpand(ch)}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 transition select-none ${
                    ch.canExpand ? 'cursor-pointer hover:bg-pos-hover/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon Container */}
                    <div className="w-9 h-9 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs">
                      {ch.type === 'cash' && <CashHandIcon className="w-5 h-5" />}
                      {ch.type === 'transfer' && <QrTransferIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      {ch.type === 'credit' && <CardIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      {ch.type === 'split' && <SplitBranchIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      {ch.type === 'custom' && <WalletIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                    </div>

                    {/* Title & Subtitle */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-pos-text leading-tight truncate">
                        {ch.title}
                      </p>
                      {ch.subtext && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {ch.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions (Chevron & Delete) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ch.canExpand && (
                      <div className="text-slate-400 dark:text-slate-500 hover:text-pos-text transition">
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </div>
                    )}
                    {ch.type !== 'cash' && ch.type !== 'transfer' && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteChannel(e, ch.id, ch.title)}
                        title={`ลบช่องทาง ${ch.title}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ================= Expanded Panel: โอนเงิน (Transfer) ================= */}
                {isExpanded && ch.type === 'transfer' && (
                  <div className="px-4 pb-5 pt-1 sm:px-6 space-y-4 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    {/* 3-Tab Segmented Control */}
                    <div className="p-1 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 grid grid-cols-3 gap-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTransferTab('phone')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          transferTab === 'phone'
                            ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border dark:border-slate-500/40'
                            : 'text-slate-400 dark:text-slate-500 hover:text-pos-text'
                        }`}
                      >
                        <PhoneIcon className="w-4 h-4" />
                        <span>เบอร์โทร</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferTab('id_card')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          transferTab === 'id_card'
                            ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border dark:border-slate-500/40'
                            : 'text-slate-400 dark:text-slate-500 hover:text-pos-text'
                        }`}
                      >
                        <CardIcon className="w-4 h-4" />
                        <span>เลขบัตร</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferTab('qr')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          transferTab === 'qr'
                            ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border dark:border-slate-500/40'
                            : 'text-slate-400 dark:text-slate-500 hover:text-pos-text'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>รูป QR</span>
                      </button>
                    </div>

                    {/* Tab 1: เบอร์โทร (ใช้ promptPayNumber ค่าเดียวกัน) */}
                    {transferTab === 'phone' && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={promptPayNumber}
                            onChange={(e) => setPromptPayNumber(e.target.value)}
                            placeholder="เบอร์โทรศัพท์ (พร้อมเพย์)"
                            className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs font-mono"
                          />
                          {promptPayNumber.trim() && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleGenerateQrFromPromptPay}
                                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition"
                              >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>สร้างรูป QR จากเบอร์นี้</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={transferAccountName}
                          onChange={(e) => setTransferAccountName(e.target.value)}
                          placeholder="ชื่อบัญชี (แสดงใต้ QR)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                      </div>
                    )}

                    {/* Tab 2: เลขบัตร (ใช้ promptPayNumber ค่าเดียวกันกับเบอร์โทร) */}
                    {transferTab === 'id_card' && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={promptPayNumber}
                            onChange={(e) => setPromptPayNumber(e.target.value)}
                            placeholder="เลขบัตรประชาชน"
                            className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs font-mono"
                          />
                          {promptPayNumber.trim() && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleGenerateQrFromPromptPay}
                                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition"
                              >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>สร้างรูป QR จากเลขบัตรนี้</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={transferAccountName}
                          onChange={(e) => setTransferAccountName(e.target.value)}
                          placeholder="ชื่อบัญชี (แสดงใต้ QR)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                        />
                      </div>
                    )}

                    {/* Tab 3: รูป QR (ทำเหมือนตัว FormProduct.tsx: มีปุ่มเปลี่ยนรูป, ปุ่มลบรูป, ปุ่มสร้าง QR และปุ่มดาวน์โหลดสำหรับปริ้นท์) */}
                    {transferTab === 'qr' && (
                      <div className="space-y-3 animate-fadeIn">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />

                        {/* แถบปุ่มเครื่องมือ: สร้าง QR จากเลขพร้อมเพย์ & ดาวน์โหลดรูปปริ้นท์ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isGeneratingQr}
                            onClick={handleGenerateQrFromPromptPay}
                            className="py-2.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-sky-500/20 transition cursor-pointer active:scale-98"
                            title="สร้างรูป QR Code จากเลขพร้อมเพย์ที่กรอกไว้"
                          >
                            <SparklesIcon className="w-4 h-4 text-sky-500 shrink-0" />
                            <span>{isGeneratingQr ? 'กำลังสร้าง QR...' : 'สร้าง QR จากเลขพร้อมเพย์'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadPrintableQr}
                            className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-500/20 transition cursor-pointer active:scale-98"
                            title="ดาวน์โหลดรูป QR Code พร้อมชื่อใต้รูปสำหรับพิมพ์ติดหน้าร้าน"
                          >
                            <DownloadIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>ดาวน์โหลดรูปสำหรับปริ้นท์</span>
                          </button>
                        </div>

                        {/* Upload Card Box */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full rounded-2xl border-2 border-dashed border-pos-border dark:border-slate-500/40 bg-pos-surface hover:bg-pos-hover/50 p-6 sm:p-8 flex flex-col items-center justify-center relative cursor-pointer transition group shadow-2xs"
                        >
                          {transferQrImage ? (
                            <div className="relative flex flex-col items-center gap-2 group/preview">
                              <div className="relative rounded-xl overflow-hidden border border-pos-border shadow-xs bg-white">
                                <img
                                  src={transferQrImage}
                                  alt="QR Code"
                                  className="max-h-48 max-w-full object-contain p-1"
                                />
                                {/* Overlay ปุ่มเปลี่ยนรูป และปุ่มลบรูป แบบ FormProduct */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fileInputRef.current?.click();
                                    }}
                                    className="p-2 bg-white text-sky-600 rounded-full hover:bg-sky-50 transition shadow-sm cursor-pointer"
                                    title="เปลี่ยนรูป"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImage();
                                    }}
                                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition shadow-sm cursor-pointer"
                                    title="ลบรูป"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-1">
                                แตะเพื่อเปลี่ยนรูป QR
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2.5 text-center">
                              <QrTransferIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition" />
                              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                                แตะเพื่ออัปโหลดรูป QR หรือกดสร้างด้านบน
                              </p>
                              <p className="text-[11px] text-slate-400">
                                รองรับไฟล์ JPG, PNG (สูงสุด 5MB)
                              </p>
                            </div>
                          )}

                          {/* Round Upload Button in bottom right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="absolute bottom-3 right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer"
                          >
                            <UploadArrowIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            ชื่อบัญชี (แสดงใต้ QR Code และในรูปดาวน์โหลดสำหรับปริ้นท์)
                          </label>
                          <input
                            type="text"
                            value={transferAccountName}
                            onChange={(e) => setTransferAccountName(e.target.value)}
                            placeholder="ชื่อบัญชี (แสดงใต้ QR)"
                            className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button: บันทึก */}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveTransfer(ch.id)}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <span>บันทึก</span>
                      )}
                    </button>
                  </div>
                )}

                {/* ================= Expanded Panel: บัตรเครดิต (Credit Card) ================= */}
                {isExpanded && ch.type === 'credit' && (
                  <div className="px-4 pb-5 pt-3 sm:px-6 space-y-4 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-pos-text">
                          ค่าธรรมเนียมบัตรเครดิต
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          กำหนดค่าเริ่มต้น ปรับได้รายบิล
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-pos-surface border border-pos-border dark:border-slate-500/40 rounded-xl px-3 py-1.5 shadow-2xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={creditFee}
                            onChange={(e) => handleCreditFeeChange(e.target.value, ch.id)}
                            className="w-14 text-center text-sm font-bold text-pos-text bg-transparent focus:outline-none"
                          />
                          <span className="text-sm font-semibold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= Expanded Panel: ผสม 2 ช่องทาง ================= */}
                {isExpanded && ch.type === 'split' && (
                  <div className="px-4 pb-5 pt-3 sm:px-6 space-y-3 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    <p className="text-xs sm:text-sm font-semibold text-pos-text">
                      การชำระแบบผสม (Split Payment)
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      เปิดใช้งานการแบ่งยอดชำระ เช่น แบ่งจ่ายเงินสดส่วนหนึ่งและโอนเงินอีกส่วนหนึ่ง บนหน้าจอรับชำระเงิน
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(null);
                        showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
                      }}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
                    >
                      บันทึก
                    </button>
                  </div>
                )}

                {/* ================= Expanded Panel: ช่องทางอื่น (Custom) ================= */}
                {isExpanded && ch.type === 'custom' && (
                  <div className="px-4 pb-5 pt-3 sm:px-6 space-y-3 animate-fadeIn border-t border-pos-border/60 dark:border-slate-500/30 bg-pos-bg/30">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        ชื่อช่องทางชำระเงิน
                      </label>
                      <input
                        type="text"
                        value={customChannelName}
                        onChange={(e) => setCustomChannelName(e.target.value)}
                        placeholder="เช่น คนละครึ่ง, บัตรสวัสดิการ, TrueMoney"
                        className="w-full px-4 py-2.5 rounded-2xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveCustom(ch.id)}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
                    >
                      บันทึก
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Button: เพิ่มช่องทาง (Add Channel) */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="w-full py-3.5 rounded-2xl bg-pos-surface hover:bg-pos-hover border border-pos-border dark:border-slate-500/40 text-pos-text font-semibold text-sm transition active:scale-[0.99] cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
      >
        <span>เพิ่มช่องทาง</span>
      </button>

      {/* ==================== Modal: เลือกช่องทางที่ต้องการเพิ่ม ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-sm border border-pos-border dark:border-slate-500/40 overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-pos-border dark:border-slate-500/40">
              <h3 className="font-bold text-base text-pos-text">
                เลือกช่องทางที่ต้องการเพิ่ม
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-pos-text hover:bg-pos-hover transition cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - List of Addable Options */}
            <div className="p-4 sm:p-5 space-y-2">
              {/* Option 1: บัตรเครดิต */}
              {!channels.some((c) => c.type === 'credit') && (
                <div
                  onClick={() => handleAddChannel('credit')}
                  className="p-3.5 rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40 hover:bg-pos-hover/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-sky-500 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs transition">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                        บัตรเครดิต
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        รูดบัตรผ่านเครื่องของร้าน
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0 shadow-2xs">
                    <PlusIcon className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Option 2: ผสม 2 ช่องทาง */}
              <div
                onClick={() => handleAddChannel('split')}
                className="p-3.5 rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40 hover:bg-pos-hover/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-sky-500 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs transition">
                    <SplitBranchIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                      ผสม 2 ช่องทาง
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      เช่น คนละครึ่งคู่กับเงินสด
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0 shadow-2xs">
                  <PlusIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Option 3: ช่องทางอื่น */}
              <div
                onClick={() => handleAddChannel('custom')}
                className="p-3.5 rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40 hover:bg-pos-hover/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pos-bg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-sky-500 shrink-0 border border-pos-border dark:border-slate-500/40 shadow-2xs transition">
                    <WalletIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                      ช่องทางอื่น
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      ตั้งชื่อเอง เช่น คนละครึ่ง
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0 shadow-2xs">
                  <PlusIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
