'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getShopAndEmployees,
  createEmployeeAction,
  toggleEmployeeStatusAction,
  updateEmployeePermissionAction,
  updateEmployeeInfoAction // <-- เพิ่ม Action ใหม่สำหรับแก้ไขข้อมูล
} from '@/lib/actions/actionsEmployee';

import { 
  Permissions, 
  Employee, 
  ShopInfo, 
  PERMISSION_CONFIG 
} from '@/lib/types';

/* ==================== Icons & Components ==================== */
function StoreIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.651V9.35m0 0a3.001 3.001 0 003.75-.614A2.993 2.993 0 009 9.35c.983-.055 1.9-.533 2.45-1.314a3 3 0 004.9 0 2.993 2.993 0 002.45 1.314 3 3 0 003.75-.614 3.001 3.001 0 00.45 1.814z" />
    </svg>
  );
}

function KeyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function EditIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function DiceIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="18" height="18" x="3" y="3" rx="4" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ToggleSwitch({ checked, onChange, size = 'md' }: { checked: boolean; onChange: (checked: boolean) => void; size?: 'sm' | 'md' }) {
  const isSm = size === 'sm';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isSm ? 'h-5 w-9' : 'h-6 w-11'} ${checked ? 'bg-[#1694a4]' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${isSm ? 'h-3.5 w-3.5 mt-[3px]' : 'h-4 w-4 mt-[4px]'} ${checked ? (isSm ? 'translate-x-[19px]' : 'translate-x-[23px]') : 'translate-x-[3px]'}`} />
    </button>
  );
}

/* ==================== Main View ==================== */
export default function EmployeeSetting() {
  const [isLoading, setIsLoading] = useState(true);

  // States สำหรับ Modal จัดการพนักงาน
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);

  const [editingPermissionsEmp, setEditingPermissionsEmp] = useState<Employee | null>(null);

  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('พนักงาน');
  const [newEmployeePin, setNewEmployeePin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ระบบแจ้งเตือน (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // กำหนด ID ร้านเริ่มต้น (ในระบบจริงควรดึงจาก Auth Session / Context)
  const ORGANIZATION_ID = 1;

  const [currentShop, setCurrentShop] = useState<ShopInfo>({
    id: ORGANIZATION_ID,
    name: 'กำลังโหลด...',
    plan: 'trial',
    planExpiry: 'หมดอายุ 30 ก.ย. 69 เหลือ 9 วัน',
    employees: [],
  });

  const fetchShopData = useCallback(async () => {
    try {
      const data = await getShopAndEmployees(ORGANIZATION_ID);
      if (data) {
        setCurrentShop(prev => ({
          ...prev,
          name: data.name,
          employees: data.employees as unknown as Employee[]
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast('ไม่สามารถดึงข้อมูลร้านได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const loadData = async () => {
      await fetchShopData();
    };

    loadData();
  }, [fetchShopData]);

  const activeEmployeesCount = currentShop.employees.filter((e) => e.isActive).length;

  const handleToggleEmployeeActive = async (empId: number, active: boolean) => {
    // Optimistic Update
    setCurrentShop((prev) => ({
      ...prev,
      employees: prev.employees.map((emp) =>
        emp.id === empId ? { ...emp, isActive: active } : emp
      ),
    }));

    try {
      await toggleEmployeeStatusAction(empId, active);
      showToast(active ? 'เปิดใช้งานพนักงานสำเร็จ' : 'ปิดใช้งานพนักงานสำเร็จ', 'success');
    } catch (error) {
      console.error("Failed to update status");
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'error');
      fetchShopData();
    }
  };

  const handleTogglePermission = async (empId: number, permKey: keyof Permissions, value: boolean) => {
    // Optimistic Update
    setCurrentShop((prev) => ({
      ...prev,
      employees: prev.employees.map((emp) => {
        if (emp.id === empId) {
          const updatedPerms = { ...emp.permission, [permKey]: value };
          if (editingPermissionsEmp && editingPermissionsEmp.id === empId) {
            setEditingPermissionsEmp({ ...editingPermissionsEmp, permission: updatedPerms });
          }
          return { ...emp, permission: updatedPerms };
        }
        return emp;
      }),
    }));

    try {
      await updateEmployeePermissionAction(empId, permKey, value);
      showToast('อัปเดตสิทธิ์การใช้งานสำเร็จ', 'success');
    } catch (error) {
      console.error("Failed to update permission");
      showToast('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์', 'error');
      fetchShopData();
    }
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewEmployeePin(randomPin);
    setPinError('');
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingEmpId(null);
    setNewEmployeeName('');
    setNewEmployeeRole('พนักงาน');
    setNewEmployeePin('');
    setPinError('');
    setIsEmpModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setModalMode('edit');
    setEditingEmpId(emp.id);
    setNewEmployeeName(emp.name);
    setNewEmployeeRole(emp.role);
    setNewEmployeePin(emp.pin);
    setPinError('');
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    // บังคับ PIN ต้อง 4 หลักเป๊ะ
    if (newEmployeePin.length !== 4) {
      setPinError('กรุณากรอก PIN 4 หลักเท่านั้น');
      return;
    }

    // ตรวจสอบ PIN ซ้ำ ภายในร้านเดียวกัน (ยกเว้น PIN ของตัวเองกรณีแก้ไข)
    const isPinDuplicate = currentShop.employees.some((e) => e.pin === newEmployeePin && e.id !== editingEmpId);
    if (isPinDuplicate) {
      setPinError('PIN นี้มีคนใช้งานแล้วในร้าน กรุณากำหนดใหม่');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        const newEmpFromDB = await createEmployeeAction({
          name: newEmployeeName.trim(),
          role: newEmployeeRole.trim() || 'พนักงาน',
          pin: newEmployeePin,
          organizationId: ORGANIZATION_ID
        });
        setCurrentShop((prev) => ({
          ...prev,
          employees: [...prev.employees, newEmpFromDB as unknown as Employee],
        }));
        showToast('เพิ่มพนักงานเรียบร้อยแล้ว');
      } else {
        // Edit Mode
        if (editingEmpId) {
          const updatedEmp = await updateEmployeeInfoAction(editingEmpId, {
            name: newEmployeeName.trim(),
            role: newEmployeeRole.trim() || 'พนักงาน',
            pin: newEmployeePin,
            organizationId: ORGANIZATION_ID // ส่งไปเช็คซ้ำที่ Backend ด้วย
          });
          setCurrentShop((prev) => ({
            ...prev,
            employees: prev.employees.map(emp => emp.id === editingEmpId ? { ...emp, ...updatedEmp } : emp),
          }));
          showToast('แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว');
        }
      }

      setIsEmpModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save employee:", error);
      // เช็ค Message จาก Backend ว่าซ้ำไหม
      if (error.message === 'DUPLICATE_PIN') {
        setPinError('PIN นี้มีคนใช้งานแล้วในร้าน กรุณากำหนดใหม่');
      } else {
        setPinError('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
        showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6 relative">
      {/* Toast Notification (ย้ายมาไว้ข้างล่างแล้ว) */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${toast.type === 'success'
            ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/80 dark:border-teal-700 dark:text-teal-100'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'
            }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. การ์ดข้อมูลร้านค้า */}
      <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-300 border border-slate-200/70 dark:border-slate-600 shadow-2xs">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-snug">
              {currentShop.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              พนักงานทั้งหมด {currentShop.employees.length} คน (เปิดใช้งาน {activeEmployeesCount})
            </p>
          </div>
        </div>
      </div>

      {/* 2. การ์ดรายละเอียดพนักงาน */}
      <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 bg-white dark:bg-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">
              รายชื่อพนักงาน
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#d7f3f5] text-[#0f828e] dark:bg-teal-950/60 dark:text-teal-300 shadow-2xs">
              {currentShop.employees.length}
            </span>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="text-xs font-bold text-[#1694a4] hover:text-[#0f766e] dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1 transition cursor-pointer active:scale-95"
          >
            <span>+ เพิ่มพนักงาน</span>
          </button>
        </div>

        <div className="w-full max-h-[360px] overflow-y-auto custom-scroll pr-1.5 space-y-2.5">
          {isLoading ? (
            <div className="w-full py-8 text-center text-slate-400 bg-[#f8fafc] dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium animate-pulse">กำลังโหลดข้อมูลพนักงาน...</p>
            </div>
          ) : currentShop.employees.length === 0 ? (
            <div className="w-full py-8 text-center text-slate-400 bg-[#f8fafc] dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium">ยังไม่มีพนักงานในร้านนี้</p>
              <p className="text-xs text-slate-400 mt-1">กดปุ่มเพิ่มพนักงานเพื่อเริ่มใช้งาน</p>
            </div>
          ) : (
            currentShop.employees.map((emp) => {
              const activePermCount = emp.permission ? Object.values(emp.permission).filter((val) => typeof val === 'boolean' && val).length : 0;

              return (
                <div
                  key={emp.id}
                  className={`w-full rounded-2xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs ${emp.isActive
                    ? 'bg-[#f8fafc] dark:bg-slate-700/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/40 opacity-65'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {emp.img ? (
                        <img
                          src={emp.img}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shadow-xs">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${emp.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm truncate leading-snug ${emp.isActive ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300'}`}>
                          {emp.name}
                        </p>
                        {!emp.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            ปิดใช้งาน
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400 truncate">
                          {emp.role}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">
                          · PIN: {emp.pin}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ปุ่ม Action ขวา: แก้ไข / สิทธิ์ / เปิด-ปิด */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    {/* ปุ่มแก้ไขข้อมูล */}
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      title="แก้ไขข้อมูลพนักงาน"
                      className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 hover:bg-[#e8f6f7] hover:text-[#0f766e] dark:hover:bg-teal-950/60 border border-slate-200/80 dark:border-slate-600 text-slate-400 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>

                    {/* ปุ่มจัดการสิทธิ์ */}
                    <button
                      type="button"
                      onClick={() => setEditingPermissionsEmp(emp)}
                      title="คลิกเพื่อตั้งค่าสิทธิ์พนักงาน"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-[#e8f6f7] hover:text-[#0f766e] dark:hover:bg-teal-950/60 border border-slate-200/80 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <KeyIcon className="w-3.5 h-3.5 text-[#1694a4]" />
                      <span>สิทธิ์ ({activePermCount})</span>
                    </button>

                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-600">
                      <span className={`text-[11px] font-semibold hidden sm:inline ${emp.isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                        {emp.isActive ? 'ใช้งาน' : 'ปิด'}
                      </span>
                      <ToggleSwitch
                        checked={emp.isActive}
                        onChange={(val) => handleToggleEmployeeActive(emp.id, val)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="w-full py-3 rounded-2xl bg-[#edf2f6] hover:bg-slate-200/80 dark:bg-slate-700/70 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition active:scale-[0.99] cursor-pointer shadow-2xs"
        >
          เพิ่มพนักงาน
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบร้านนี้?')) {
            alert('ส่งคำขอลบร้านเรียบร้อย');
          }
        }}
        className="w-full py-3.5 rounded-2xl bg-[#e5252a] hover:bg-[#d01d22] text-white font-bold text-sm shadow-xs transition active:scale-[0.98] cursor-pointer"
      >
        ลบร้าน
      </button>

      {/* ==================== MODAL 1: PERMISSIONS ==================== */}
      {editingPermissionsEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-[#f8fafc] dark:bg-slate-750">
              <div className="flex items-center gap-3">
                {editingPermissionsEmp.img ? (
                  <img
                    src={editingPermissionsEmp.img}
                    alt={editingPermissionsEmp.name}
                    className="w-11 h-11 rounded-full object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shadow-xs">
                    {editingPermissionsEmp.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                    <span>สิทธิ์การใช้งาน: {editingPermissionsEmp.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingPermissionsEmp.role} · PIN: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{editingPermissionsEmp.pin}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPermissionsEmp(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  กำหนดสิทธิ์การเข้าถึงและการทำงาน
                </p>
                <span className="text-[11px] font-semibold text-[#0f828e] dark:text-teal-300 bg-[#d7f3f5] dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
                  เปิดใช้งาน {editingPermissionsEmp.permission ? Object.values(editingPermissionsEmp.permission).filter((val) => typeof val === 'boolean' && val).length : 0} / 5 รายการ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERMISSION_CONFIG.map(({ key, label, desc }) => {
                  const isChecked = editingPermissionsEmp.permission ? editingPermissionsEmp.permission[key] : false;
                  return (
                    <div
                      key={key}
                      onClick={() => handleTogglePermission(editingPermissionsEmp.id, key, !isChecked)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${isChecked
                        ? 'bg-[#f0f9fa] dark:bg-teal-950/30 border-[#1694a4]/40 dark:border-teal-700/50 shadow-2xs'
                        : 'bg-slate-50/80 dark:bg-slate-700/30 border-slate-200/70 dark:border-slate-700/50 hover:bg-slate-100/70'
                        }`}
                    >
                      <div className="min-w-0 pr-1">
                        <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-[#0f766e] dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {label}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {desc}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={isChecked}
                        onChange={(val) => handleTogglePermission(editingPermissionsEmp.id, key, val)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>การเปลี่ยนแปลงสิทธิ์จะมีผลทันทีเมื่อพนักงานเข้าสู่ระบบหรือเปิดแอปครั้งถัดไป</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-750 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingPermissionsEmp(null)}
                className="px-6 py-2.5 rounded-xl bg-[#1694a4] hover:bg-[#138290] text-white text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD / EDIT EMPLOYEE ==================== */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-5 border border-slate-100 dark:border-slate-700 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {modalMode === 'add' ? 'เพิ่มพนักงาน' : 'แก้ไขข้อมูลพนักงาน'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEmpModalOpen(false);
                  setPinError('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  ชื่อพนักงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1694a4] focus:ring-2 focus:ring-[#1694a4]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  ตำแหน่ง / หน้าที่
                </label>
                <input
                  type="text"
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                  placeholder="เช่น พนักงานแคชเชียร์, บาริสต้า"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1694a4] focus:ring-2 focus:ring-[#1694a4]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  PIN เข้าใช้งาน (4 หลัก) <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  พนักงานใช้ PIN นี้เพื่อระบุตัวตนขณะใช้งาน POS
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4} // บังคับกรอกสูงสุด 4 หลัก
                    value={newEmployeePin}
                    onChange={(e) => {
                      // บังคับพิมพ์ได้เฉพาะตัวเลข และตัดให้เหลือ 4 หลัก
                      setNewEmployeePin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setPinError('');
                    }}
                    placeholder="กรอก PIN 4 หลัก"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-widest text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1694a4] focus:ring-2 focus:ring-[#1694a4]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    title="สุ่ม PIN"
                    className="w-11 h-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-[#1694a4] hover:border-[#1694a4] flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    <DiceIcon />
                  </button>
                </div>
                {pinError && <p className="text-xs text-rose-500 mt-1">{pinError}</p>}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEmpModalOpen(false);
                  setPinError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                disabled={!newEmployeeName.trim() || !newEmployeePin || isSaving}
                className="flex-1 py-2.5 rounded-xl bg-[#1694a4] hover:bg-[#138290] text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-xs"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}