'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/language/LanguageContext';
import {
  getShopAndEmployees,
  createEmployeeAction,
  toggleEmployeeStatusAction,
  updateEmployeePermissionAction,
  updateEmployeeInfoAction
} from '@/lib/actions/actionsEmployee';
import { useEmployee } from '@/components/providers/EmployeeContext';

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
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isSm ? 'h-5 w-9' : 'h-6 w-11'} ${checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${isSm ? 'h-3.5 w-3.5 mt-[3px]' : 'h-4 w-4 mt-[4px]'} ${checked ? (isSm ? 'translate-x-[19px]' : 'translate-x-[23px]') : 'translate-x-[3px]'}`} />
    </button>
  );
}

/* ==================== Main View ==================== */
export default function EmployeeSetting({ organizationId: propOrgId }: { organizationId?: number } = {}) {
  const { t, isThai } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const { organizationId: contextOrgId } = useEmployee();
  const orgId = propOrgId || contextOrgId || 0;

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);

  const [editingPermissionsEmp, setEditingPermissionsEmp] = useState<Employee | null>(null);

  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const [newEmployeePin, setNewEmployeePin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [currentShop, setCurrentShop] = useState<ShopInfo>({
    id: propOrgId || contextOrgId || 0,
    name: '',
    plan: 'trial',
    planExpiry: '',
    employees: [],
  });

  const fetchShopData = useCallback(async (targetOrgId: number) => {
    if (!targetOrgId) return;
    try {
      const data = await getShopAndEmployees(targetOrgId);
      if (data) {
        setCurrentShop(prev => ({
          ...prev,
          id: targetOrgId,
          name: data.name,
          employees: data.employees as unknown as Employee[]
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast(isThai ? 'ไม่สามารถดึงข้อมูลร้านได้' : 'Failed to fetch store details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const id = propOrgId || contextOrgId;
    const timer = setTimeout(() => {
      if (id) {
        fetchShopData(id);
      } else {
        setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [propOrgId, contextOrgId, fetchShopData]);

  const activeEmployeesCount = currentShop.employees.filter((e) => e.isActive).length;

  const handleToggleEmployeeActive = async (empId: number, active: boolean) => {
    setCurrentShop((prev) => ({
      ...prev,
      employees: prev.employees.map((emp) =>
        emp.id === empId ? { ...emp, isActive: active } : emp
      ),
    }));

    try {
      await toggleEmployeeStatusAction(empId, active);
      showToast(active ? (isThai ? 'เปิดใช้งานพนักงานสำเร็จ' : 'Employee activated') : (isThai ? 'ปิดใช้งานพนักงานสำเร็จ' : 'Employee deactivated'), 'success');
      if (orgId) fetchShopData(orgId);
    } catch (error) {
      console.error("Failed to update status");
      showToast(isThai ? 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' : 'Error updating status', 'error');
      if (orgId) fetchShopData(orgId);
    }
  };

  const handleTogglePermission = async (empId: number, permKey: keyof Permissions, value: boolean) => {
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
      showToast(isThai ? 'อัปเดตสิทธิ์การใช้งานสำเร็จ' : 'Permissions updated successfully', 'success');
      if (orgId) fetchShopData(orgId);
    } catch (error) {
      console.error("Failed to update permission");
      showToast(isThai ? 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์' : 'Error updating permissions', 'error');
      if (orgId) fetchShopData(orgId);
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
    setNewEmployeeRole(isThai ? 'พนักงาน' : 'Staff');
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
    if (!newEmployeeName.trim() || !orgId) {
      if (!orgId) showToast(isThai ? 'ไม่พบข้อมูลร้านค้า กรุณาเข้าสู่ระบบใหม่' : 'Store not found. Please log in again', 'error');
      return;
    }

    // บังคับ PIN ต้อง 4 หลักเป๊ะ
    if (newEmployeePin.length !== 4) {
      setPinError(isThai ? 'กรุณากรอก PIN 4 หลักเท่านั้น' : 'PIN must be exactly 4 digits');
      return;
    }

    // ตรวจสอบ PIN ซ้ำ ภายในร้านเดียวกัน (ยกเว้น PIN ของตัวเองกรณีแก้ไข)
    const isPinDuplicate = currentShop.employees.some((e) => e.pin === newEmployeePin && e.id !== editingEmpId);
    if (isPinDuplicate) {
      setPinError(isThai ? 'PIN นี้มีคนใช้งานแล้วในร้าน กรุณากำหนดใหม่' : 'PIN is already in use in this store');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        await createEmployeeAction({
          name: newEmployeeName.trim(),
          role: newEmployeeRole.trim() || (isThai ? 'พนักงาน' : 'Staff'),
          pin: newEmployeePin,
          organizationId: orgId
        });
        showToast(isThai ? 'เพิ่มพนักงานเรียบร้อยแล้ว' : 'Employee added successfully', 'success');
      } else {
        if (editingEmpId) {
          await updateEmployeeInfoAction(editingEmpId, {
            name: newEmployeeName.trim(),
            role: newEmployeeRole.trim() || (isThai ? 'พนักงาน' : 'Staff'),
            pin: newEmployeePin,
            organizationId: orgId
          });
          showToast(isThai ? 'แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว' : 'Employee updated successfully', 'success');
        }
      }

      setIsEmpModalOpen(false);
      if (orgId) await fetchShopData(orgId);
    } catch (error: any) {
      console.error("Failed to save employee:", error);
      if (error.message === 'DUPLICATE_PIN') {
        setPinError(isThai ? 'PIN นี้มีคนใช้งานแล้วในร้าน กรุณากำหนดใหม่' : 'PIN is already in use in this store');
      } else {
        setPinError(isThai ? 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่' : 'Error saving. Please try again');
        showToast(isThai ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving employee', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn pb-6 relative">
      {/* Toast Notification */}
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

      {/* 1. การ์ดข้อมูลร้านค้า (เพิ่ม dark:border-slate-500/40) */}
      <div className="w-full rounded-2xl border border-pos-border dark:border-slate-500/40 p-5 bg-pos-surface shadow-2xs space-y-3 transition-colors duration-300">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pos-bg flex items-center justify-center shrink-0 text-slate-500 border border-pos-border dark:border-slate-500/40 shadow-2xs">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-pos-text leading-snug">
              {currentShop.name}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              {isThai ? `พนักงานทั้งหมด ${currentShop.employees.length} คน (เปิดใช้งาน ${activeEmployeesCount})` : `Total Employees: ${currentShop.employees.length} (Active: ${activeEmployeesCount})`}
            </p>
          </div>
        </div>
      </div>

      {/* 2. การ์ดรายละเอียดพนักงาน */}
      <div className="w-full rounded-2xl border border-pos-border dark:border-slate-500/40 p-5 bg-pos-surface shadow-2xs space-y-4 transition-colors duration-300">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-pos-text tracking-wide">{isThai ? "รายชื่อพนักงาน" : "Employee List"}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-2xs">
              {currentShop.employees.length}
            </span>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 transition cursor-pointer active:scale-95"
          >
            <span>{isThai ? "+ เพิ่มพนักงาน" : "+ Add Employee"}</span>
          </button>
        </div>

        <div className="w-full max-h-[360px] overflow-y-auto custom-scroll pr-1.5 space-y-2.5">
          {isLoading ? (
            <div className="w-full py-8 text-center text-slate-400 dark:text-slate-500 bg-pos-bg rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40">
              <p className="text-sm font-medium animate-pulse">{isThai ? "กำลังโหลดข้อมูลพนักงาน..." : "Loading employees..."}</p>
            </div>
          ) : currentShop.employees.length === 0 ? (
            <div className="w-full py-8 text-center text-slate-400 dark:text-slate-500 bg-pos-bg rounded-2xl border border-dashed border-pos-border dark:border-slate-500/40">
              <p className="text-sm font-medium">{isThai ? "ยังไม่มีพนักงานในร้านนี้" : "No employees in this store"}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{isThai ? "กดปุ่มเพิ่มพนักงานเพื่อเริ่มใช้งาน" : "Click add employee to get started"}</p>
            </div>
          ) : (
            currentShop.employees.map((emp) => {
              const activePermCount = emp.permission ? Object.values(emp.permission).filter((val) => typeof val === 'boolean' && val).length : 0;

              return (
                <div
                  key={emp.id}
                  className={`w-full rounded-2xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs ${emp.isActive
                    ? 'bg-pos-bg border-pos-border dark:border-slate-500/40'
                    : 'bg-pos-bg border-pos-border dark:border-slate-500/40 opacity-65'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {emp.img ? (
                        <img
                          src={emp.img}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover shadow-xs border border-pos-border dark:border-slate-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shadow-xs border border-pos-border dark:border-slate-500/40">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-pos-bg ${emp.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm truncate leading-snug ${emp.isActive ? 'text-pos-text' : 'text-slate-500 dark:text-slate-400 line-through decoration-slate-400/50'}`}>
                          {emp.name}
                        </p>
                        {!emp.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-pos-surface border border-pos-border dark:border-slate-500/40 text-slate-500 dark:text-slate-400">{isThai ? "ปิดใช้งาน" : "Deactivated"}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {emp.role}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          · PIN: {emp.pin}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      title={isThai ? "แก้ไขข้อมูลพนักงาน" : "Edit employee"}
                      className="w-8 h-8 rounded-full bg-pos-surface hover:bg-sky-500/10 hover:text-sky-600 border border-pos-border dark:border-slate-500/40 text-slate-400 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingPermissionsEmp(emp)}
                      title={isThai ? "คลิกเพื่อตั้งค่าสิทธิ์พนักงาน" : "Configure permissions"}
                      className="px-3 py-1.5 rounded-xl bg-pos-surface hover:bg-sky-500/10 hover:text-sky-600 border border-pos-border dark:border-slate-500/40 text-pos-text text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <KeyIcon className="w-3.5 h-3.5 text-sky-500" />
                      <span>{isThai ? `สิทธิ์ (${activePermCount})` : `Perms (${activePermCount})`}</span>
                    </button>

                    <div className="flex items-center gap-2 pl-2 border-l border-pos-border dark:border-slate-500/40">
                      <span className={`text-[11px] font-semibold hidden sm:inline ${emp.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {emp.isActive ? (isThai ? 'ใช้งาน' : 'Active') : (isThai ? 'ปิด' : 'Inactive')}
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
          className="w-full py-3 rounded-2xl bg-pos-bg hover:bg-pos-hover border border-pos-border dark:border-slate-500/40 text-pos-text font-semibold text-sm transition active:scale-[0.99] cursor-pointer shadow-2xs"
        >{isThai ? "+ เพิ่มพนักงาน" : "+ Add Employee"}</button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm(isThai ? 'คุณแน่ใจหรือไม่ว่าต้องการลบร้านนี้?' : 'Are you sure you want to delete this store?')) {
            alert(isThai ? 'ส่งคำขอลบร้านเรียบร้อย' : 'Store deletion request sent');
          }
        }}
        className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-xs transition active:scale-[0.98] cursor-pointer"
      >{isThai ? "ลบร้าน" : "Delete Store"}</button>

      {/* ==================== MODAL 1: PERMISSIONS ==================== */}
      {editingPermissionsEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-xl border border-pos-border dark:border-slate-500/40 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-pos-border dark:border-slate-500/40 flex items-center justify-between bg-pos-bg">
              <div className="flex items-center gap-3">
                {editingPermissionsEmp.img ? (
                  <img
                    src={editingPermissionsEmp.img}
                    alt={editingPermissionsEmp.name}
                    className="w-11 h-11 rounded-full object-cover shadow-xs border border-pos-border dark:border-slate-500/40"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shadow-xs border border-pos-border dark:border-slate-500/40">
                    {editingPermissionsEmp.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-pos-text flex items-center gap-2">
                    <span>{isThai ? `สิทธิ์การใช้งาน: ${editingPermissionsEmp.name}` : `Permissions: ${editingPermissionsEmp.name}`}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingPermissionsEmp.role} · PIN: <span className="font-mono font-semibold text-pos-text">{editingPermissionsEmp.pin}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPermissionsEmp(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-pos-hover transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isThai ? "กำหนดสิทธิ์การเข้าถึงและการทำงาน" : "Configure access and operation permissions"}
                </p>
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  {isThai ? `เปิดใช้งาน ${editingPermissionsEmp.permission ? Object.values(editingPermissionsEmp.permission).filter((val) => typeof val === "boolean" && val).length : 0} / 5 รายการ` : `Enabled ${editingPermissionsEmp.permission ? Object.values(editingPermissionsEmp.permission).filter((val) => typeof val === "boolean" && val).length : 0} / 5 items`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERMISSION_CONFIG.map(({ key, label, labelEn, desc, descEn }) => {
                  const isChecked = editingPermissionsEmp.permission ? editingPermissionsEmp.permission[key] : false;
                  return (
                    <div
                      key={key}
                      onClick={() => handleTogglePermission(editingPermissionsEmp.id, key, !isChecked)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${isChecked
                        ? 'bg-sky-500/10 border-sky-500/30 shadow-2xs'
                        : 'bg-pos-bg hover:bg-pos-hover border-pos-border dark:border-slate-500/40'
                        }`}
                    >
                      <div className="min-w-0 pr-1">
                        <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-sky-600 dark:text-sky-400' : 'text-pos-text'}`}>
                          {isThai ? label : (labelEn || label)}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {isThai ? desc : (descEn || desc)}
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

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>{isThai ? "การเปลี่ยนแปลงสิทธิ์จะมีผลทันทีเมื่อพนักงานเข้าสู่ระบบหรือเปิดแอปครั้งถัดไป" : "Permission changes take effect immediately on next login"}</span>
              </div>
            </div>

            <div className="p-4 bg-pos-bg border-t border-pos-border dark:border-slate-500/40 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingPermissionsEmp(null)}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
              >{isThai ? "เสร็จสิ้น" : "Done"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD / EDIT EMPLOYEE ==================== */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-pos-surface rounded-3xl shadow-2xl w-full max-w-sm p-5 border border-pos-border dark:border-slate-500/40 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-pos-text">
                {modalMode === 'add' ? (isThai ? 'เพิ่มพนักงาน' : 'Add Employee') : (isThai ? 'แก้ไขข้อมูลพนักงาน' : 'Edit Employee')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEmpModalOpen(false);
                  setPinError('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-pos-hover transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  {isThai ? "ชื่อพนักงาน" : "Employee Name"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder={isThai ? "เช่น สมชาย ใจดี" : "e.g. John Doe"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  {isThai ? "ตำแหน่ง / หน้าที่" : "Role / Position"}
                </label>
                <input
                  type="text"
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                  placeholder={isThai ? "เช่น พนักงานแคชเชียร์, บาริสต้า" : "e.g. Cashier, Barista"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {isThai ? "PIN เข้าใช้งาน (4 หลัก)" : "Access PIN (4 digits)"} <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                  {isThai ? "พนักงานใช้ PIN นี้เพื่อระบุตัวตนขณะใช้งาน POS" : "Staff uses this PIN to authenticate on POS"}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={newEmployeePin}
                    onChange={(e) => {
                      setNewEmployeePin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setPinError('');
                    }}
                    placeholder={isThai ? "กรอก PIN 4 หลัก" : "Enter 4-digit PIN"}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border dark:border-slate-500/40 text-sm font-mono tracking-widest text-pos-text placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    title={isThai ? "สุ่ม PIN" : "Randomize PIN"}
                    className="w-11 h-11 shrink-0 rounded-xl bg-pos-surface border border-pos-border dark:border-slate-500/40 text-slate-500 hover:text-sky-500 hover:border-sky-500 flex items-center justify-center transition active:scale-95 cursor-pointer"
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
                className="flex-1 py-2.5 rounded-xl bg-pos-bg text-sm font-semibold text-slate-500 hover:bg-pos-hover transition cursor-pointer"
              >{t("common.cancel")}</button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                disabled={!newEmployeeName.trim() || !newEmployeePin || isSaving}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-xs"
              >
                {isSaving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}