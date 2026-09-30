'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useEmployee } from '@/components/providers/EmployeeContext';
import {
  getQRCodesAction,
  createQRCodeAction,
  createBatchQRCodesAction,
  toggleQRCodeStatusAction,
  updateQRCodeAction,
  getShopProfileSettings,
} from '@/lib/actions/actionsSettings';

/* ==================== SVG Icons ==================== */
function ChevronDown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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

function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  );
}

/* ==================== QR Code Helper Components ==================== */
function QRThumb({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(url, { width: 80, margin: 1 })
      .then((res) => {
        if (isMounted) setDataUrl(res);
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!dataUrl) {
    return <div className="w-9 h-9 rounded-lg bg-pos-bg border border-pos-border animate-pulse shrink-0" />;
  }

  return (
    <img
      src={dataUrl}
      alt="QR"
      className="w-9 h-9 rounded-lg border border-pos-border dark:border-slate-500/40 shadow-2xs object-contain shrink-0 bg-white"
    />
  );
}

function QRBigCard({
  url,
  tableName,
  shopName,
}: {
  url: string;
  tableName: string;
  shopName: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(url, {
      width: 440,
      margin: 1,
      // สำคัญมาก: ต้องใช้ errorCorrectionLevel 'H' เพื่อให้เอาวงกลมทับตรงกลางได้โดยสแกนติด
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((res) => {
        if (isMounted) setDataUrl(res);
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    // เปลี่ยนธีมเป็น PosX (น้ำเงินเข้ม/เทาเข้ม) แทนสีน้ำตาล
    <div className="w-full max-w-[270px] mx-auto bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center gap-5 border border-slate-700">
      <h4 className="font-bold text-lg text-white tracking-wide truncate max-w-full text-center">
        {shopName || 'ร้านค้า'}
      </h4>

      <div className="relative p-2 bg-white rounded-xl shadow-md w-full aspect-square flex items-center justify-center">
        {dataUrl ? (
          <img src={dataUrl} alt="QR Code" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
        )}

        {/* วงกลมเลขโต๊ะตรงกลาง */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
            <span className="text-white font-black text-sm tracking-widest">{tableName}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 w-full text-center">
        <p className="text-sm font-bold text-sky-400 tracking-wider mt-1">
          สแกนเพื่อสั่งอาหาร
        </p>
        <p className="text-[9px] font-medium text-slate-500 tracking-widest opacity-70 mt-1.5 uppercase">
          Powered by PosX
        </p>
      </div>
    </div>
  );
}

/* ==================== Main Component ==================== */
export default function ScanSetting() {
  const { organizationId: contextOrgId } = useEmployee();
  const orgId = contextOrgId || 1;

  const [shopName, setShopName] = useState('ร้านค้า');
  const [isQrAccordionOpen, setIsQrAccordionOpen] = useState(false);
  const [showAddQrModal, setShowAddQrModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ id: number; tableName: string; isActive: boolean } | null>(null);

  // List of QR Codes from DB
  const [qrList, setQrList] = useState<Array<{ id: number; tableName: string; isActive: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Modal Form State
  const [qrType, setQrType] = useState<'table' | 'counter'>('table');
  const [usageMethod, setUsageMethod] = useState<'permanent' | 'new_each_time'>('permanent');
  const [creationMode, setCreationMode] = useState<'single' | 'batch'>('batch');
  const [singleTableNum, setSingleTableNum] = useState('');
  const [fromNum, setFromNum] = useState('1');
  const [toNum, setToNum] = useState('20');
  const [prefix, setPrefix] = useState('');
  const [padZero, setPadZero] = useState(false);

  // Edit Modal Form State
  const [editTableName, setEditTableName] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch shop data and QR codes from DB
  const fetchQRCodes = useCallback(async () => {
    if (!orgId) return;
    try {
      const [qrs, shopProfile] = await Promise.all([
        getQRCodesAction(orgId),
        getShopProfileSettings(orgId),
      ]);
      setQrList(qrs);
      if (shopProfile?.name) setShopName(shopProfile.name);
    } catch (error) {
      console.error('Failed to load QR codes:', error);
      showToast('ไม่สามารถดึงข้อมูล QR Code ได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    const initData = async () => {
      await fetchQRCodes();
    };
    initData();
  }, [fetchQRCodes]);

  // URL Helper
  const getOrigin = () => {
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  };

  const getQRUrl = (tableName: string) => {
    return `${getOrigin()}/orders?orgId=${orgId}&tableId=${encodeURIComponent(tableName)}`;
  };

  // Preview Summary Calculation
  const fromVal = parseInt(fromNum) || 1;
  const toVal = parseInt(toNum) || 1;
  const count = Math.max(0, toVal - fromVal + 1);

  const formatNum = (n: number) => {
    const s = n.toString();
    if (!padZero) return s;
    return s.padStart(2, '0');
  };

  const previewSummary =
    creationMode === 'batch'
      ? `จะได้ ${count} โต๊ะ : ${prefix ? prefix : ''}${formatNum(fromVal)} ถึง ${prefix ? prefix : ''}${formatNum(toVal)}`
      : `โต๊ะเลขที่ : ${singleTableNum.trim() || 'ยังไม่ได้ระบุ'}`;

  // Handle Save (Add QR)
  const handleSaveAdd = async () => {
    setIsSubmitting(true);
    try {
      if (creationMode === 'single') {
        const name = singleTableNum.trim();
        if (!name) {
          showToast('กรุณาระบุเลขโต๊ะ', 'error');
          setIsSubmitting(false);
          return;
        }
        await createQRCodeAction({
          organizationId: orgId,
          tableName: name,
        });
        showToast(`สร้าง QR โต๊ะ "${name}" สำเร็จ`, 'success');
      } else {
        if (count <= 0) {
          showToast('จำนวนโต๊ะต้องมากกว่า 0', 'error');
          setIsSubmitting(false);
          return;
        }
        if (count > 200) {
          showToast('สามารถสร้างได้สูงสุด 200 โต๊ะต่อครั้ง', 'error');
          setIsSubmitting(false);
          return;
        }
        const names: string[] = [];
        for (let i = fromVal; i <= toVal; i++) {
          names.push(`${prefix || ''}${formatNum(i)}`);
        }
        const res = await createBatchQRCodesAction({
          organizationId: orgId,
          tableNames: names,
        });
        showToast(`สร้าง QR สำเร็จ ${res.createdCount} โต๊ะ (ซ้ำ ${res.skippedCount} โต๊ะ)`, 'success');
      }

      setShowAddQrModal(false);
      setSingleTableNum('');
      await fetchQRCodes();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (e: React.MouseEvent, id: number, currentStatus: boolean, tableName: string) => {
    e.stopPropagation();
    try {
      const nextStatus = !currentStatus;
      setQrList((prev) => prev.map((q) => (q.id === id ? { ...q, isActive: nextStatus } : q)));
      await toggleQRCodeStatusAction(id, nextStatus);
      showToast(`${nextStatus ? 'เปิดรับออเดอร์' : 'ปิดรับออเดอร์'} โต๊ะ "${tableName}" แล้ว`, 'success');
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'error');
      fetchQRCodes();
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (qr: { id: number; tableName: string; isActive: boolean }) => {
    setSelectedQR(qr);
    setEditTableName(qr.tableName);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!selectedQR) return;
    const trimmed = editTableName.trim();
    if (!trimmed) {
      showToast('กรุณาระบุเลขโต๊ะ', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateQRCodeAction(selectedQR.id, { tableName: trimmed });
      showToast(`อัปเดตข้อมูลโต๊ะ "${trimmed}" สำเร็จ`, 'success');
      setSelectedQR(null);
      await fetchQRCodes();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'เกิดข้อผิดพลาดในการอัปเดต', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // ดาวน์โหลด QR Code ผ่าน HTML Canvas เพื่อประกอบภาพให้สมบูรณ์
  // =========================================================================
  const handleDownloadQR = async (tableName: string, url: string, currentShopName: string) => {
    try {
      // 1. วาด QR Code เป็น DataURL ด้วย Error Correction ระดับสูง (H) เพื่อให้วงกลมทับได้
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 600,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
      });

      // 2. โหลดรูป QR Code ลงใน Image Object
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => { qrImg.onload = resolve; });

      // 3. สร้าง Canvas จำลอง
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const canvasWidth = 800;
      const canvasHeight = 980; // เผื่อพื้นที่ด้านล่าง
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // สีธีม PosX
      const bgColor = '#0f172a'; // slate-900
      const textColor = '#ffffff'; // สีขาว
      const brandColor = '#38bdf8'; // sky-400

      // 4. เทพื้นหลัง
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 5. เขียนชื่อร้านด้านบน
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 50px sans-serif';
      ctx.fillText(currentShopName || 'ร้านค้า', canvasWidth / 2, 80);

      // 6. วาดกรอบสีขาวสี่เหลี่ยมสำหรับวาง QR Code
      const qrBoxSize = 640;
      const qrBoxX = (canvasWidth - qrBoxSize) / 2;
      const qrBoxY = 150;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // 7. วาด QR Code ลงไปในกล่องสีขาว (เหลือขอบนิดนึง)
      const qrPadding = 20;
      ctx.drawImage(
        qrImg,
        qrBoxX + qrPadding,
        qrBoxY + qrPadding,
        qrBoxSize - (qrPadding * 2),
        qrBoxSize - (qrPadding * 2)
      );

      // 8. วาดวงกลมพื้นหลังทับตรงกลาง
      const centerX = canvasWidth / 2;
      const centerY = qrBoxY + (qrBoxSize / 2);
      const circleRadius = 80;

      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = bgColor;
      ctx.fill();

      // เส้นขอบวงกลมสีขาว
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // 9. เขียนเลขโต๊ะลงในวงกลม
      ctx.fillStyle = textColor;
      ctx.font = 'bold 50px sans-serif';
      ctx.fillText(tableName, centerX, centerY + 4); // +4 เพื่อให้ดูอยู่ตรงกลางสายตา

      // 10. เขียนข้อความ "สแกนเพื่อสั่งอาหาร" ให้ชัดเจน
      ctx.fillStyle = brandColor; // สี sky-400
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('สแกนเพื่อสั่งอาหาร', canvasWidth / 2, 860);

      // 11. เขียนชื่อแบรนด์ PosX แบบเล็กลงเหมือนลายน้ำ
      ctx.fillStyle = '#475569'; // สี slate-600 (เทาเข้ม) ให้ดูกลืนไปกับพื้นหลัง
      ctx.font = 'normal 18px sans-serif';
      ctx.fillText('POWERED BY POSX', canvasWidth / 2, 920);

      // 12. แปลง Canvas เป็นรูปลงเครื่อง
      const finalDataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = finalDataUrl;
      a.download = `QR_โต๊ะ_${tableName}.png`;
      a.click();

      showToast('ดาวน์โหลด QR Code เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการดาวน์โหลด', 'error');
    }
  };

  // Copy Link
  const handleCopyLink = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('คัดลอกลิงก์สำเร็จแล้ว', 'success');
    }
  };

  // 9 Menu items matching mockup background
  const scanMenuItems = [
    {
      id: 'open-close-order',
      title: 'การเปิด-ปิดรับออเดอร์',
      desc: 'กำหนดเอง',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
        </svg>
      ),
    },
    {
      id: 'order-conditions',
      title: 'เงื่อนไขการสั่ง',
      desc: 'บังคับกรอกเบอร์โทร',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      ),
    },
    {
      id: 'payment',
      title: 'การชำระเงิน',
      desc: 'เงินสด',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
        </svg>
      ),
    },
    {
      id: 'auto-close-bill',
      title: 'การปิดบิลอัตโนมัติ',
      desc: 'ไม่ได้ใช้งาน',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      id: 'display',
      title: 'การแสดงผล',
      desc: 'เหมือนหน้าขาย · กริด 3 คอลัมน์ · แสดงราคา',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
        </svg>
      ),
    },
    {
      id: 'hide-customer-side',
      title: 'ปิดขายฝั่งลูกค้า',
      desc: 'ลูกค้าเห็นครบทุกรายการ',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ),
    },
    {
      id: 'promotions',
      title: 'โปรโมชั่น',
      desc: '',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.87 2.664.408l4.453-2.327c.884-.462 1.343-1.464 1.114-2.434l-1.32-5.61a2.25 2.25 0 00-.66-1.121L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'voice-call',
      title: 'การเรียกคิวด้วยเสียง',
      desc: 'ปิดอยู่',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      ),
    },
    {
      id: 'call-notify',
      title: 'แจ้งเตือนเมื่อลูกค้าเรียก',
      desc: 'เปิดที่แอปเครื่องนี้',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${toast.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/80 dark:border-teal-700 dark:text-teal-100'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'
              }`}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Outer Card with Rows */}
      <div className="rounded-3xl border border-pos-border dark:border-slate-500/40 bg-pos-surface shadow-2xs divide-y divide-pos-border dark:divide-slate-500/40 overflow-hidden transition-colors duration-300">
        {/* 1. Accordion Item: QR Code */}
        <div>
          <div
            onClick={() => setIsQrAccordionOpen(!isQrAccordionOpen)}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-pos-hover/60 transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-slate-400 dark:text-slate-500 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h3v3h-3v-3zM18 18h2.25v2.25H18V18zM13.5 19.5h2.25V21H13.5v-1.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-pos-text">
                  QR Code
                </p>
                {qrList.length > 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {qrList.length} โต๊ะ
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    ยังไม่มีข้อมูลโต๊ะ
                  </p>
                )}
              </div>
            </div>

            <div className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isQrAccordionOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* กางลงมา: สแกนหน้าร้านและโต๊ะ + ปุ่มเพิ่ม QR + ตารางรายการโต๊ะ */}
          {isQrAccordionOpen && (
            <div className="px-4 sm:px-6 pb-6 pt-1 bg-pos-surface animate-fadeIn space-y-4">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-pos-bg px-2.5 py-1 rounded-full font-medium border border-pos-border dark:border-slate-500/30">
                  สแกนหน้าร้านและโต๊ะ
                </span>
              </div>

              {/* ปุ่มแถบสีเทาตรงกลางเต็มแถว */}
              <button
                type="button"
                onClick={() => setShowAddQrModal(true)}
                className="w-full py-3 rounded-2xl bg-pos-bg hover:bg-pos-hover border border-pos-border dark:border-slate-500/40 text-pos-text font-semibold text-xs sm:text-sm transition cursor-pointer text-center shadow-2xs"
              >
                เพิ่ม QR Code
              </button>

              {/* ตารางรายการโต๊ะพร้อมแถบเลื่อน */}
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  กำลังโหลดข้อมูล QR Code...
                </div>
              ) : qrList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  ยังไม่มี QR Code โต๊ะในระบบ กด &quot;เพิ่ม QR Code&quot; เพื่อเริ่มต้นใช้งาน
                </div>
              ) : (
                <div className="rounded-2xl border border-pos-border dark:border-slate-500/40 bg-pos-surface overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-pos-bg/80 border-b border-pos-border dark:border-slate-500/40 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                    <span>ใบ QR</span>
                    <span>สถานะ</span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto custom-scroll divide-y divide-dashed divide-pos-border dark:divide-slate-500/40">
                    {qrList.map((qr) => {
                      const qrUrl = getQRUrl(qr.tableName);

                      return (
                        <div
                          key={qr.id}
                          onClick={() => handleOpenEditModal(qr)}
                          className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-pos-hover/50 transition cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <QRThumb url={qrUrl} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-pos-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                                โต๊ะ: {qr.tableName}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                แตะเพื่อดู / พิมพ์ QR
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggleStatus(e, qr.id, qr.isActive, qr.tableName)}
                              title={qr.isActive ? 'กดเพื่อปิดรับออเดอร์' : 'กดเพื่อเปิดรับออเดอร์'}
                              className={`py-1.5 px-3 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer ${qr.isActive
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 hover:bg-rose-100'
                                }`}
                            >
                              {qr.isActive ? 'เปิดรับออเดอร์' : 'ปิดรับออเดอร์'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. รายการเมนูอื่นๆ ถัดมา 9 รายการ */}
        {scanMenuItems.map((item) => (
          <div
            key={item.id}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-pos-hover/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-slate-400 dark:text-slate-500 shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-pos-text">
                  {item.title}
                </p>
                {item.desc && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                )}
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
          </div>
        ))}
      </div>

      {/* ==================== MODAL 1: เพิ่ม QR Code ==================== */}
      {showAddQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-md border border-pos-border dark:border-slate-500/40 overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-pos-border dark:border-slate-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-pos-text">เพิ่ม QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddQrModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-pos-text hover:bg-pos-hover transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">ประเภท</label>
                <div className="grid grid-cols-2 gap-2 bg-pos-bg p-1 rounded-2xl border border-pos-border dark:border-slate-500/40">
                  <button
                    type="button"
                    onClick={() => setQrType('table')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${qrType === 'table'
                      ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border'
                      : 'text-slate-400 hover:text-pos-text'
                      }`}
                  >
                    <span>🪑</span> โต๊ะ
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrType('counter')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${qrType === 'counter'
                      ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border'
                      : 'text-slate-400 hover:text-pos-text'
                      }`}
                  >
                    <span>🏪</span> หน้าร้าน
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">วิธีใช้ป้าย</label>
                <div className="space-y-2">
                  <div
                    onClick={() => setUsageMethod('permanent')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${usageMethod === 'permanent'
                      ? 'bg-sky-500/10 dark:bg-sky-950/40 border-sky-500/40 shadow-2xs'
                      : 'bg-pos-bg border-pos-border hover:bg-pos-hover'
                      }`}
                  >
                    <p className={`text-xs font-bold ${usageMethod === 'permanent' ? 'text-sky-600 dark:text-sky-400' : 'text-pos-text'}`}>
                      แปะไว้ที่โต๊ะ
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      พิมพ์ครั้งเดียวแล้วติดถาวร ลูกค้าสแกนสั่งได้ทันที
                    </p>
                  </div>

                  <div
                    onClick={() => setUsageMethod('new_each_time')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${usageMethod === 'new_each_time'
                      ? 'bg-sky-500/10 dark:bg-sky-950/40 border-sky-500/40 shadow-2xs'
                      : 'bg-pos-bg border-pos-border hover:bg-pos-hover'
                      }`}
                  >
                    <p className={`text-xs font-bold ${usageMethod === 'new_each_time' ? 'text-sky-600 dark:text-sky-400' : 'text-pos-text'}`}>
                      พิมพ์ใหม่ทุกครั้ง
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      พนักงานกดเปิดโต๊ะเพื่อออก QR ใหม่
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">สร้าง</label>
                <div className="grid grid-cols-2 gap-2 bg-pos-bg p-1 rounded-2xl border border-pos-border dark:border-slate-500/40">
                  <button
                    type="button"
                    onClick={() => setCreationMode('single')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${creationMode === 'single'
                      ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border'
                      : 'text-slate-400 hover:text-pos-text'
                      }`}
                  >
                    ทีละใบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('batch')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${creationMode === 'batch'
                      ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-xs border border-pos-border'
                      : 'text-slate-400 hover:text-pos-text'
                      }`}
                  >
                    เป็นชุด
                  </button>
                </div>
              </div>

              {creationMode === 'single' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">เลขโต๊ะ</label>
                  <input
                    type="text"
                    value={singleTableNum}
                    onChange={(e) => setSingleTableNum(e.target.value)}
                    placeholder="เช่น 5, A1"
                    className="w-full px-4 py-2.5 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">จากเลข</label>
                      <input
                        type="number"
                        min="1"
                        value={fromNum}
                        onChange={(e) => setFromNum(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">ถึงเลข</label>
                      <input
                        type="number"
                        min="1"
                        value={toNum}
                        onChange={(e) => setToNum(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">ตัวนำหน้า</label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="เช่น A (ไม่ใส่ก็ได้)"
                      className="w-full px-4 py-2.5 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div
                    onClick={() => setPadZero(!padZero)}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={padZero}
                      onChange={() => { }}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500/20 border-pos-border cursor-pointer"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      เติมศูนย์หน้าเลข (01, 002)
                    </span>
                  </div>

                  <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/30 text-center">
                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                      {previewSummary}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-pos-border dark:border-slate-500/40">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveAdd}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ดู / แก้ไข QR โต๊ะ ==================== */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-md border border-pos-border dark:border-slate-500/40 overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-pos-border dark:border-slate-500/40 flex items-center justify-between">
              <h3 className="font-bold text-base text-pos-text">
                โต๊ะ: {selectedQR.tableName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedQR(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-pos-text hover:bg-pos-hover transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll">

              {/* Big QR Card Preview */}
              <QRBigCard
                url={getQRUrl(selectedQR.tableName)}
                tableName={selectedQR.tableName}
                shopName={shopName}
              />

              {/* Link Input + Copy Button */}
              <div className="flex items-center gap-2 bg-pos-bg border border-pos-border dark:border-slate-500/40 p-1.5 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={getQRUrl(selectedQR.tableName)}
                  className="w-full bg-transparent px-2.5 py-1 text-xs text-pos-text focus:outline-none truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(getQRUrl(selectedQR.tableName))}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>คัดลอกลิงก์</span>
                </button>
              </div>

              {/* วิธีใช้ป้าย */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">วิธีใช้ป้าย</label>
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    แปะไว้ที่โต๊ะ:
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    พิมพ์ครั้งเดียวแล้วติดถาวร ลูกค้าสแกนสั่งได้ทันที
                  </p>
                </div>
              </div>

              {/* แก้ไขเลขโต๊ะ */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">เลขโต๊ะ</label>
                <input
                  type="text"
                  value={editTableName}
                  onChange={(e) => setEditTableName(e.target.value)}
                  placeholder="เช่น A1"
                  className="w-full px-4 py-2.5 rounded-2xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {/* Footer Buttons: [ ดาวน์โหลด ] [ บันทึก ] */}
            <div className="p-4 sm:p-5 border-t border-pos-border dark:border-slate-500/40 grid grid-cols-2 gap-3">
              <button
                type="button"
                // อัปเดตฟังก์ชันดาวน์โหลด ให้ส่งชื่อร้านเข้าไปด้วยเพื่อวาดรูปลง Canvas
                onClick={() => handleDownloadQR(selectedQR.tableName, getQRUrl(selectedQR.tableName), shopName)}
                className="py-3 rounded-2xl bg-pos-bg hover:bg-pos-hover border border-pos-border dark:border-slate-500/40 text-pos-text font-bold text-sm shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DownloadIcon className="w-4 h-4 text-sky-500" />
                <span>ดาวน์โหลด</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEdit}
                className="py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}