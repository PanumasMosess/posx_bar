'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMembersAction,
  getMemberStatsAction,
  createMemberAction,
  updateMemberAction,
  adjustMemberWalletAction,
  deleteMemberAction,
  getMemberTiersAction,
  createMemberTierAction,
  updateMemberTierAction,
  deleteMemberTierAction,
  getMemberTransactionsAction,
} from '@/lib/actions/actionsMember';
import { useEmployee } from '@/components/providers/EmployeeContext';
import { Member, MemberTier, MemberTransaction } from '@/lib/types';

/* ==================== SVG Icons ==================== */
function UserGroupIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function StarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function WalletIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
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

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function HistoryIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/* ==================== Main Component ==================== */
export default function MemberSetting({ organizationId: propOrgId }: { organizationId?: number }) {
  const { organizationId: contextOrgId, employeeId } = useEmployee();
  const orgId = propOrgId || contextOrgId || 0;

  // Active sub-tab: 'members' | 'tiers'
  const [activeTab, setActiveTab] = useState<'members' | 'tiers'>('members');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [members, setMembers] = useState<Member[]>([]);
  const [tiers, setTiers] = useState<MemberTier[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalPoints: 0,
    totalCreditBalance: 0,
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState<number | 'ALL'>('ALL');

  // Modal States: Member Add/Edit
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form State for Add/Edit Member
  const [memberForm, setMemberForm] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    points: 0,
    creditBalance: 0,
    tierId: '' as string | number,
    status: 'ACTIVE',
  });

  // Modal States: Adjust Points / Credit
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetMember, setAdjustTargetMember] = useState<Member | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    walletType: 'CREDIT' as 'POINT' | 'CREDIT',
    action: 'ADD' as 'ADD' | 'DEDUCT',
    amount: '',
    note: '',
  });

  // Modal States: Member Tiers
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [tierModalMode, setTierModalMode] = useState<'add' | 'edit'>('add');
  const [editingTier, setEditingTier] = useState<MemberTier | null>(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    minSpending: 0,
    pointMultiplier: 1.0,
    discountPercent: 0.0,
  });

  // Modal States: Delete Confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Modal States: Transaction History
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyMember, setHistoryMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<MemberTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------------------
  // Load Data
  // ----------------------------------------------------
  const loadData = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [membersRes, statsRes, tiersRes] = await Promise.all([
        getMembersAction({
          organizationId: orgId,
          search: searchQuery,
          status: statusFilter,
          tierId: tierFilter === 'ALL' ? undefined : Number(tierFilter),
          page: currentPage,
          limit: pageSize,
        }),
        getMemberStatsAction(orgId),
        getMemberTiersAction(orgId),
      ]);

      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data as Member[]);
        setTotalCount(membersRes.total || 0);
        setTotalPages(membersRes.totalPages || 1);
      }
      if (statsRes) {
        setStats(statsRes);
      }
      if (tiersRes) {
        setTiers(tiersRes as MemberTier[]);
      }
    } catch (error) {
      console.error('Error loading member data:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, searchQuery, statusFilter, tierFilter, currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----------------------------------------------------
  // Handlers: Add / Edit Member
  // ----------------------------------------------------
  const handleOpenAddMember = () => {
    setModalMode('add');
    setEditingMember(null);
    setMemberForm({
      phone: '',
      firstName: '',
      lastName: '',
      points: 0,
      creditBalance: 0,
      tierId: '',
      status: 'ACTIVE',
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: Member) => {
    setModalMode('edit');
    setEditingMember(member);
    setMemberForm({
      phone: member.phone,
      firstName: member.firstName,
      lastName: member.lastName || '',
      points: member.points,
      creditBalance: member.creditBalance,
      tierId: member.tierId || '',
      status: member.status || 'ACTIVE',
    });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      showToast('ไม่พบรหัสร้านค้า', 'error');
      return;
    }

    if (!memberForm.phone.trim()) {
      showToast('กรุณาระบุเบอร์โทรศัพท์', 'error');
      return;
    }
    if (!memberForm.firstName.trim()) {
      showToast('กรุณาระบุชื่อจริง', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await createMemberAction({
          organizationId: orgId,
          phone: memberForm.phone.trim(),
          firstName: memberForm.firstName.trim(),
          lastName: memberForm.lastName.trim() || null,
          points: Number(memberForm.points) || 0,
          creditBalance: Number(memberForm.creditBalance) || 0,
          tierId: memberForm.tierId ? Number(memberForm.tierId) : null,
          status: memberForm.status,
          createdById: employeeId ? Number(employeeId) : null,
        });

        if (res.success) {
          showToast(res.message || 'เพิ่มสมาชิกใหม่สำเร็จ', 'success');
          setIsMemberModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
        }
      } else {
        // Edit mode
        if (!editingMember) return;
        const res = await updateMemberAction({
          id: editingMember.id,
          organizationId: orgId,
          phone: memberForm.phone.trim(),
          firstName: memberForm.firstName.trim(),
          lastName: memberForm.lastName.trim() || null,
          tierId: memberForm.tierId ? Number(memberForm.tierId) : null,
          status: memberForm.status,
          points: Number(memberForm.points) || 0,
          creditBalance: Number(memberForm.creditBalance) || 0,
        });

        if (res.success) {
          showToast(res.message || 'บันทึกการแก้ไขสำเร็จ', 'success');
          setIsMemberModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Delete Member
  // ----------------------------------------------------
  const handleOpenDelete = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete || !orgId) return;
    setIsSubmitting(true);
    try {
      const res = await deleteMemberAction(memberToDelete.id, orgId);
      if (res.success) {
        showToast('ลบสมาชิกเรียบร้อยแล้ว', 'success');
        setIsDeleteModalOpen(false);
        setMemberToDelete(null);
        loadData();
      } else {
        showToast(res.message || 'ไม่สามารถลบสมาชิกได้', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการลบสมาชิก', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Adjust Points / Credit
  // ----------------------------------------------------
  const handleOpenAdjust = (member: Member, walletType: 'POINT' | 'CREDIT') => {
    setAdjustTargetMember(member);
    setAdjustForm({
      walletType,
      action: 'ADD',
      amount: '',
      note: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetMember || !orgId) return;

    const numAmount = Number(adjustForm.amount);
    if (!numAmount || numAmount <= 0) {
      showToast('กรุณาระบุจำนวนที่มากกว่า 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adjustMemberWalletAction({
        memberId: adjustTargetMember.id,
        organizationId: orgId,
        walletType: adjustForm.walletType,
        action: adjustForm.action,
        amount: numAmount,
        note: adjustForm.note.trim() || undefined,
        createdById: employeeId ? Number(employeeId) : null,
      });

      if (res.success) {
        showToast(res.message || 'ปรับปรุงยอดสำเร็จ', 'success');
        setIsAdjustModalOpen(false);
        loadData();
      } else {
        showToast(res.message || 'เกิดข้อผิดพลาดในการปรับยอด', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Handlers: Member Tiers
  // ----------------------------------------------------
  const handleOpenAddTier = () => {
    setTierModalMode('add');
    setEditingTier(null);
    setTierForm({
      name: '',
      minSpending: 0,
      pointMultiplier: 1.0,
      discountPercent: 0.0,
    });
    setIsTierModalOpen(true);
  };

  const handleOpenEditTier = (tier: MemberTier) => {
    setTierModalMode('edit');
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      minSpending: tier.minSpending,
      pointMultiplier: tier.pointMultiplier,
      discountPercent: tier.discountPercent,
    });
    setIsTierModalOpen(true);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    if (!tierForm.name.trim()) {
      showToast('กรุณาระบุชื่อระดับสมาชิก', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tierModalMode === 'add') {
        const res = await createMemberTierAction({
          organizationId: orgId,
          name: tierForm.name.trim(),
          minSpending: Number(tierForm.minSpending) || 0,
          pointMultiplier: Number(tierForm.pointMultiplier) || 1.0,
          discountPercent: Number(tierForm.discountPercent) || 0.0,
        });

        if (res.success) {
          showToast('สร้างระดับสมาชิกสำเร็จ', 'success');
          setIsTierModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
        }
      } else {
        if (!editingTier) return;
        const res = await updateMemberTierAction({
          id: editingTier.id,
          organizationId: orgId,
          name: tierForm.name.trim(),
          minSpending: Number(tierForm.minSpending) || 0,
          pointMultiplier: Number(tierForm.pointMultiplier) || 1.0,
          discountPercent: Number(tierForm.discountPercent) || 0.0,
        });

        if (res.success) {
          showToast('อัปเดตระดับสมาชิกสำเร็จ', 'success');
          setIsTierModalOpen(false);
          loadData();
        } else {
          showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTier = async (tier: MemberTier) => {
    if (!confirm(`คุณต้องการลบระดับ "${tier.name}" ใช่หรือไม่? (สมาชิกในระดับนี้จะถูกปรับเป็นทั่วไป)`)) {
      return;
    }

    try {
      const res = await deleteMemberTierAction(tier.id, orgId);
      if (res.success) {
        showToast('ลบระดับสมาชิกสำเร็จ', 'success');
        loadData();
      } else {
        showToast(res.message || 'ไม่สามารถลบได้', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบระดับสมาชิก', 'error');
    }
  };

  // ----------------------------------------------------
  // Handlers: Member Transaction History
  // ----------------------------------------------------
  const handleOpenHistory = async (member: Member) => {
    setHistoryMember(member);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const txs = await getMemberTransactionsAction(member.id, orgId);
      setTransactions(txs as MemberTransaction[]);
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการโหลดประวัติ', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
              }`}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header Banner & Actions */}
      <div className="p-4 sm:p-5 rounded-3xl bg-pos-surface border border-pos-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 shrink-0">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-pos-text flex items-center gap-2">
              <span>ระบบสมาชิก</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {stats.totalMembers} คน
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              จัดการรายชื่อสมาชิก ยอดแต้มสะสม และเครดิตเงินสดสำหรับซื้อสินค้า
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenAddMember}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>เพิ่มสมาชิกใหม่</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Members */}
        <div className="p-3.5 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">สมาชิกทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UserGroupIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pos-text mt-1">{stats.totalMembers.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            ใช้งานปกติ {stats.activeMembers} คน
          </p>
        </div>

        {/* Total Tiers */}
        <div className="p-3.5 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ระดับสมาชิก</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <StarIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pos-text mt-1">{tiers.length}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">ระดับที่มีในร้าน</p>
        </div>

        {/* Total Points */}
        <div className="p-3.5 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">แต้มสะสมรวม</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="text-xs font-bold">PT</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pos-text mt-1">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">แต้มที่สมาชิกรวมถืออยู่</p>
        </div>

        {/* Total Credit Balance */}
        <div className="p-3.5 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">เครดิตกระเป๋ารวม</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ฿{stats.totalCreditBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">เงินที่เติมไว้ในระบบ</p>
        </div>
      </div>

      {/* 3. Sub-tabs Segmented Switcher */}
      <div className="flex items-center justify-between border-b border-pos-border/70 pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-pos-surface rounded-2xl border border-pos-border shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'members'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-pos-text'
              }`}
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>รายชื่อสมาชิก</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'tiers'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-pos-text'
              }`}
          >
            <StarIcon className="w-4 h-4" />
            <span>ระดับสมาชิก (Tiers)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MEMBERS LIST */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-3.5">
          {/* Filters Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาด้วย เบอร์โทร หรือ ชื่อสมาชิก..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns - Grid 2 cols on mobile, flex on iPad / Desktop */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              {/* Status Filter */}
              <div className="relative min-w-0 sm:min-w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text focus:outline-none focus:border-sky-500 cursor-pointer truncate"
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  <option value="ACTIVE">ใช้งานปกติ (Active)</option>
                  <option value="INACTIVE">ระงับการใช้ (Inactive)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tier Filter */}
              <div className="relative min-w-0 sm:min-w-[140px]">
                <select
                  value={tierFilter}
                  onChange={(e) => {
                    setTierFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text focus:outline-none focus:border-sky-500 cursor-pointer truncate"
                >
                  <option value="ALL">ระดับทั้งหมด</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Members Content Container (Card View on Mobile + Table View on Tablet/Desktop) */}
          <div className="rounded-2xl bg-pos-surface border border-pos-border shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดข้อมูลสมาชิก...</div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-pos-text">ไม่พบข้อมูลสมาชิก</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง' : 'กดปุ่ม "เพิ่มสมาชิกใหม่" ด้านบนเพื่อเริ่มสร้างสมาชิกคนแรก'}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Mobile Cards View (Phones: block md:hidden) */}
                <div className="block md:hidden divide-y divide-pos-border">
                  {members.map((member) => {
                    const initial = member.firstName ? member.firstName.charAt(0) : '?';
                    const isInactive = member.status === 'INACTIVE' || member.status === 'BANNED';

                    return (
                      <div key={member.id} className="p-3.5 space-y-3">
                        {/* Member Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center border border-sky-500/20 shrink-0 text-sm">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-pos-text truncate">
                                {member.firstName} {member.lastName || ''}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                {member.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {member.tier && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {member.tier.name}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isInactive
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                }`}
                            >
                              {member.status || 'ACTIVE'}
                            </span>
                          </div>
                        </div>

                        {/* Points & Credit Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded-xl bg-pos-bg/80 border border-pos-border/70 flex items-center justify-between">
                            <div className="min-w-0 pr-1">
                              <span className="block text-[10px] text-slate-400 font-semibold truncate">แต้มสะสม</span>
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                {member.points.toLocaleString()} PT
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(member, 'POINT')}
                              className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs hover:bg-indigo-500/20 transition cursor-pointer shrink-0"
                              title="ปรับแต้ม"
                            >
                              ＋
                            </button>
                          </div>

                          <div className="p-2 rounded-xl bg-pos-bg/80 border border-pos-border/70 flex items-center justify-between">
                            <div className="min-w-0 pr-1">
                              <span className="block text-[10px] text-slate-400 font-semibold truncate">เครดิตเงินสด</span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                ฿{member.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(member, 'CREDIT')}
                              className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs hover:bg-emerald-500/20 transition cursor-pointer shrink-0"
                              title="เติม/หักเครดิต"
                            >
                              ＋
                            </button>
                          </div>
                        </div>

                        {/* Mobile Actions Footer */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-pos-border/40">
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(member)}
                            className="px-2.5 py-1.5 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <HistoryIcon className="w-3.5 h-3.5" />
                            <span>ประวัติ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditMember(member)}
                            className="px-2.5 py-1.5 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(member)}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Desktop / iPad Table View (Tablet/Desktop: hidden md:block) */}
                <div className="hidden md:block overflow-x-auto custom-scroll">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-pos-border bg-pos-bg/60 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">สมาชิก</th>
                        <th className="py-3 px-3">เบอร์โทรศัพท์</th>
                        <th className="py-3 px-3">ระดับ</th>
                        <th className="py-3 px-3 text-right">แต้มสะสม</th>
                        <th className="py-3 px-3 text-right">เครดิตคงเหลือ</th>
                        <th className="py-3 px-3 text-center">สถานะ</th>
                        <th className="py-3 px-4 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border">
                      {members.map((member) => {
                        const initial = member.firstName ? member.firstName.charAt(0) : '?';
                        const isInactive = member.status === 'INACTIVE' || member.status === 'BANNED';

                        return (
                          <tr
                            key={member.id}
                            className="hover:bg-pos-hover/60 transition group text-pos-text"
                          >
                            {/* Member Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center border border-sky-500/20 shrink-0">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs sm:text-sm text-pos-text truncate">
                                    {member.firstName} {member.lastName || ''}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    ID: #{member.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="py-3 px-3 font-mono font-medium text-xs sm:text-sm">
                              {member.phone}
                            </td>

                            {/* Tier */}
                            <td className="py-3 px-3">
                              {member.tier ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <StarIcon className="w-3 h-3" />
                                  {member.tier.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">ทั่วไป</span>
                              )}
                            </td>

                            {/* Points */}
                            <td className="py-3 px-3 text-right font-mono">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {member.points.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(member, 'POINT')}
                                  title="ปรับแต้ม"
                                  className="w-5 h-5 rounded-md text-indigo-500 hover:bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold cursor-pointer transition"
                                >
                                  ＋
                                </button>
                              </div>
                            </td>

                            {/* Credit Balance */}
                            <td className="py-3 px-3 text-right font-mono">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ฿{member.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(member, 'CREDIT')}
                                  title="เติม/หักเครดิต"
                                  className="w-5 h-5 rounded-md text-emerald-600 hover:bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold cursor-pointer transition"
                                >
                                  ＋
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${isInactive
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  }`}
                              >
                                {member.status || 'ACTIVE'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* History */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenHistory(member)}
                                  title="ประวัติการเคลื่อนไหวแต้ม/เครดิต"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-pos-hover transition cursor-pointer"
                                >
                                  <HistoryIcon className="w-4 h-4" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMember(member)}
                                  title="แก้ไขข้อมูลสมาชิก"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-pos-hover transition cursor-pointer"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(member)}
                                  title="ลบสมาชิก"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* 3. Pagination Bar (ใช้ได้ทุกจอ: โทรศัพท์, ไอแพท, คอม) */}
          {totalCount > 0 && (
            <div className="p-3 sm:p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Left: Summary & Page Size */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-slate-500 dark:text-slate-400">
                <span>
                  แสดง{' '}
                  <strong className="text-pos-text font-bold">
                    {Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)}
                  </strong>{' '}
                  จากทั้งหมด <strong className="text-pos-text font-bold">{totalCount}</strong> คน
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                <div className="flex items-center gap-1.5">
                  <span>ต่อหน้า:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ backgroundImage: 'none' }} // เพิ่มบรรทัดนี้เพื่อตัดรูปศรพื้นหลังของเบราว์เซอร์ทิ้ง
                      className="appearance-none bg-none pl-2.5 pr-6 py-1 rounded-lg bg-pos-bg border border-pos-border font-bold text-pos-text cursor-pointer focus:outline-none focus:border-sky-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400">
                      <ChevronDownIcon className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Page Navigation Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1.5 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition"
                  title="หน้าแรก"
                >
                  «
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition"
                  title="ก่อนหน้า"
                >
                  ‹ ก่อนหน้า
                </button>
                <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap">
                  หน้า {currentPage} / {Math.max(1, totalPages)}
                </div>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition"
                  title="ถัดไป"
                >
                  ถัดไป ›
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 py-1.5 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition"
                  title="หน้าสุดท้าย"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEMBER TIERS */}
      {/* ========================================================================= */}
      {activeTab === 'tiers' && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-pos-text">ระดับสมาชิก (Member Tiers)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                กำหนดระดับสมาชิกเพื่อมอบสิทธิพิเศษ เช่น ส่วนลดค่าอาหาร และตัวคูณแต้มสะสม
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddTier}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <PlusIcon className="w-4 h-4" />
              <span>เพิ่มระดับ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-pos-surface rounded-2xl border border-pos-border">
                <StarIcon className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
                <p className="text-sm font-semibold text-pos-text">ยังไม่มีระดับสมาชิก</p>
                <p className="text-xs text-slate-400 mt-0.5">กดปุ่ม "เพิ่มระดับ" ด้านบนเพื่อสร้างระดับแรก (เช่น Silver, Gold)</p>
              </div>
            ) : (
              tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h4 className="font-bold text-base text-pos-text">{tier.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        สมาชิกในระดับนี้: {tier._count?.members || 0} คน
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTier(tier)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-pos-hover flex items-center justify-center cursor-pointer"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-pos-border/60 text-center">
                    <div className="p-2 rounded-xl bg-pos-bg">
                      <span className="block text-[10px] text-slate-400 font-semibold">ยอดใช้สะสม</span>
                      <span className="text-xs font-black text-pos-text">฿{tier.minSpending.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-pos-bg">
                      <span className="block text-[10px] text-slate-400 font-semibold">ตัวคูณแต้ม</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{tier.pointMultiplier}x</span>
                    </div>
                    <div className="p-2 rounded-xl bg-pos-bg">
                      <span className="block text-[10px] text-slate-400 font-semibold">ส่วนลด</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{tier.discountPercent}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT MEMBER */}
      {/* ========================================================================= */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-pos-surface rounded-3xl shadow-2xl border border-pos-border overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <UserGroupIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-pos-text">
                  {modalMode === 'add' ? 'เพิ่มสมาชิกใหม่' : 'แก้ไขข้อมูลสมาชิก'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-pos-text hover:bg-pos-hover flex items-center justify-center cursor-pointer transition"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMember} className="p-4 sm:p-5 space-y-3.5">
              {/* Phone (เบอร์โทรศัพท์) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="เช่น 0812345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {/* First Name & Last Name (ชื่อจริง - นามสกุล) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    ชื่อจริง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.firstName}
                    onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                    placeholder="เช่น สมชาย"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    value={memberForm.lastName}
                    onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                    placeholder="เช่น ใจดี"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Member Tier (ระดับสมาชิก) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ระดับสมาชิก
                </label>
                <div className="relative">
                  <select
                    value={memberForm.tierId}
                    onChange={(e) => setMemberForm({ ...memberForm, tierId: e.target.value })}
                    className="appearance-none w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">สมาชิกทั่วไป (ไม่มีระดับ)</option>
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (ลด {t.discountPercent}% · คูณแต้ม {t.pointMultiplier}x)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    <ChevronDownIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Initial Points & Credit (Only shown in 'add' mode) */}
              {modalMode === 'add' && (
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-pos-bg/80 border border-pos-border/70">
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      แต้มเริ่มต้น
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={memberForm.points}
                      onChange={(e) => setMemberForm({ ...memberForm, points: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-sm text-pos-text font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      เครดิตเริ่มต้น (฿)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={memberForm.creditBalance}
                      onChange={(e) => setMemberForm({ ...memberForm, creditBalance: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-sm text-pos-text font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Status (สถานะ - แสดงเฉพาะตอนแก้ไขข้อมูล) */}
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    สถานะการใช้งาน
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, status: 'ACTIVE' })}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${memberForm.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-pos-bg border-pos-border text-slate-400'
                        }`}
                    >
                      ใช้งานปกติ (ACTIVE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, status: 'INACTIVE' })}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${memberForm.status === 'INACTIVE'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                          : 'bg-pos-bg border-pos-border text-slate-400'
                        }`}
                    >
                      ระงับการใช้ (INACTIVE)
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-pos-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-pos-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-pos-hover cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : modalMode === 'add' ? 'เพิ่มสมาชิก' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADJUST POINTS / CREDIT */}
      {/* ========================================================================= */}
      {isAdjustModalOpen && adjustTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-pos-surface rounded-3xl shadow-2xl border border-pos-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-pos-text">
                  {adjustForm.walletType === 'POINT' ? 'ปรับแต้มสะสม' : 'ปรับเครดิตเงินสด'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  สมาชิก: {adjustTargetMember.firstName} ({adjustTargetMember.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-pos-text hover:bg-pos-hover flex items-center justify-center cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-4 sm:p-5 space-y-3.5">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, action: 'ADD' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${adjustForm.action === 'ADD'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-pos-bg border-pos-border text-slate-400'
                    }`}
                >
                  ＋ เพิ่ม (Top-up/Earn)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, action: 'DEDUCT' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${adjustForm.action === 'DEDUCT'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                      : 'bg-pos-bg border-pos-border text-slate-400'
                    }`}
                >
                  － ลด (Deduct/Redeem)
                </button>
              </div>

              {/* Current Balance Notice */}
              <div className="p-3 rounded-xl bg-pos-bg text-center">
                <span className="text-[11px] text-slate-400 block font-semibold">ยอดปัจจุบัน</span>
                <span className="text-lg font-black text-pos-text">
                  {adjustForm.walletType === 'POINT'
                    ? `${adjustTargetMember.points.toLocaleString()} แต้ม`
                    : `฿${adjustTargetMember.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  จำนวน {adjustForm.walletType === 'POINT' ? 'แต้ม' : 'เงิน (฿)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-base text-pos-text font-black focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  หมายเหตุ / เหตุผล
                </label>
                <input
                  type="text"
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  placeholder="เช่น เติมเงินสดหน้าร้าน, แลกของรางวัล"
                  className="w-full px-3.5 py-2 rounded-xl bg-pos-bg border border-pos-border text-xs text-pos-text focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-pos-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-pos-hover cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังทำรายการ...' : 'ยืนยันทำรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT TIER */}
      {/* ========================================================================= */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-pos-surface rounded-3xl shadow-2xl border border-pos-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between">
              <h3 className="font-bold text-base text-pos-text">
                {tierModalMode === 'add' ? 'เพิ่มระดับสมาชิกใหม่' : 'แก้ไขระดับสมาชิก'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTierModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-pos-text hover:bg-pos-hover flex items-center justify-center cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ชื่อระดับ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  placeholder="เช่น Silver, Gold, VIP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ยอดใช้จ่ายสะสมขั้นต่ำ (฿)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tierForm.minSpending}
                  onChange={(e) => setTierForm({ ...tierForm, minSpending: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    ตัวคูณแต้ม
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={tierForm.pointMultiplier}
                    onChange={(e) => setTierForm({ ...tierForm, pointMultiplier: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    ส่วนลด (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tierForm.discountPercent}
                    onChange={(e) => setTierForm({ ...tierForm, discountPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-pos-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-pos-hover cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกระดับ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE MEMBER CONFIRMATION */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-pos-surface rounded-3xl shadow-2xl border border-pos-border overflow-hidden p-5 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrashIcon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-pos-text">ยืนยันการลบสมาชิก?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบ{' '}
                <span className="font-bold text-pos-text">
                  "{memberToDelete.firstName} {memberToDelete.lastName || ''}"
                </span>{' '}
                ({memberToDelete.phone}) ?
              </p>
              <p className="text-[11px] text-rose-500 font-medium mt-1">
                การกระทำนี้จะลบประวัติแต้มและเครดิตของสมาชิกท่านนี้ด้วย และไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMemberToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-pos-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-pos-hover cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TRANSACTION HISTORY */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && historyMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-pos-surface rounded-3xl shadow-2xl border border-pos-border overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <HistoryIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-pos-text">
                    ประวัติธุรกรรมสมาชิก
                  </h3>
                  <p className="text-xs text-slate-400">
                    {historyMember.firstName} {historyMember.lastName || ''} ({historyMember.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-pos-text hover:bg-pos-hover flex items-center justify-center cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scroll flex-1 space-y-2.5">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-slate-400">กำลังโหลดประวัติ...</div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">ยังไม่มีประวัติรายการ</div>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.amount >= 0;
                  const isPoint = tx.walletType === 'POINT';

                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-pos-bg/80 border border-pos-border/70 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${tx.type === 'EARN' || tx.type === 'TOPUP'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-bold text-pos-text truncate">
                            {tx.note || (isPoint ? 'ปรับปรุงแต้ม' : 'ปรับปรุงเครดิต')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(tx.createdAt).toLocaleString('th-TH')} {tx.employee?.name ? `· โดย ${tx.employee.name}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black font-mono text-sm ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {isPositive ? '+' : ''}
                          {isPoint
                            ? `${Math.floor(tx.amount)} แต้ม`
                            : `฿${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          คงเหลือ: {isPoint ? `${Math.floor(tx.balanceAfter)} แต้ม` : `฿${tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

