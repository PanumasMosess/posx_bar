'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '@/lib/language/LanguageContext';
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
import { getShopProfileSettings } from '@/lib/actions/actionsSettings';
import { ALL_CURRENCIES } from './CurrencySetting';

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

function PhoneIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function CardViewIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function TableViewIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>
  );
}

/* ==================== Main Component ==================== */
export default function MemberSetting({ organizationId: propOrgId }: { organizationId?: number }) {
  const { t, isThai } = useTranslation();
  const { organizationId: contextOrgId, employeeId } = useEmployee();
  const orgId = propOrgId || contextOrgId || 0;

  // Active sub-tab: 'members' | 'tiers'
  const [activeTab, setActiveTab] = useState<'members' | 'tiers'>('members');

  // View Mode: 'card' | 'table' (Auto-detected on desktop, or toggled by user)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Currency symbol from organizations_settings (defaults to '฿' if THB or not found)
  const [currencySymbol, setCurrencySymbol] = useState('฿');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setViewMode('table');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!orgId) return;
    const loadCurrency = async () => {
      try {
        const profile = await getShopProfileSettings(orgId);
        if (profile?.currencyCode) {
          const found = ALL_CURRENCIES.find((c) => c.code === profile.currencyCode);
          setCurrencySymbol(found ? found.symbol : profile.currencyCode);
        }
      } catch (err) {
        console.error('Error fetching currency setting:', err);
      }
    };
    loadCurrency();
  }, [orgId]);

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
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const historyOffsetRef = useRef(0);
  const historyScrollContainerRef = useRef<HTMLDivElement>(null);
  const historySentinelRef = useRef<HTMLDivElement>(null);

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
      showToast(isThai ? 'เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก' : 'Failed to load member data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, searchQuery, statusFilter, tierFilter, currentPage, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
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
      showToast(isThai ? 'ไม่พบรหัสร้านค้า' : 'Shop ID not found', 'error');
      return;
    }

    if (!memberForm.phone.trim()) {
      showToast(isThai ? 'กรุณาระบุเบอร์โทรศัพท์' : 'Please enter phone number', 'error');
      return;
    }
    if (!memberForm.firstName.trim()) {
      showToast(isThai ? 'กรุณาระบุชื่อจริง' : 'Please enter first name', 'error');
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
          showToast(res.message || (isThai ? 'เพิ่มสมาชิกใหม่สำเร็จ' : 'Member created successfully'), 'success');
          setIsMemberModalOpen(false);
          loadData();
        } else {
          showToast(res.message || (isThai ? 'เกิดข้อผิดพลาด' : 'An error occurred'), 'error');
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
          showToast(res.message || (isThai ? 'บันทึกการแก้ไขสำเร็จ' : 'Member updated successfully'), 'success');
          setIsMemberModalOpen(false);
          loadData();
        } else {
          showToast(res.message || (isThai ? 'เกิดข้อผิดพลาด' : 'An error occurred'), 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(isThai ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' : 'Failed to save data', 'error');
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
        showToast(isThai ? 'ลบสมาชิกเรียบร้อยแล้ว' : 'Member deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setMemberToDelete(null);
        loadData();
      } else {
        showToast(res.message || (isThai ? 'ไม่สามารถลบสมาชิกได้' : 'Failed to delete member'), 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(isThai ? 'เกิดข้อผิดพลาดในการลบสมาชิก' : 'Error deleting member', 'error');
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
      showToast(isThai ? 'กรุณาระบุจำนวนที่มากกว่า 0' : 'Please enter amount greater than 0', 'error');
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
        showToast(res.message || (isThai ? 'ปรับปรุงยอดสำเร็จ' : 'Balance adjusted successfully'), 'success');
        setIsAdjustModalOpen(false);
        loadData();
      } else {
        showToast(res.message || (isThai ? 'เกิดข้อผิดพลาดในการปรับยอด' : 'Failed to adjust balance'), 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(isThai ? 'เกิดข้อผิดพลาด' : 'An error occurred', 'error');
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
      showToast(isThai ? 'กรุณาระบุชื่อระดับสมาชิก' : 'Please enter tier name', 'error');
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
          showToast(isThai ? 'สร้างระดับสมาชิกสำเร็จ' : 'Tier created successfully', 'success');
          setIsTierModalOpen(false);
          loadData();
        } else {
          showToast(res.message || (isThai ? 'เกิดข้อผิดพลาด' : 'An error occurred'), 'error');
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
          showToast(isThai ? 'อัปเดตระดับสมาชิกสำเร็จ' : 'Tier updated successfully', 'success');
          setIsTierModalOpen(false);
          loadData();
        } else {
          showToast(res.message || (isThai ? 'เกิดข้อผิดพลาด' : 'An error occurred'), 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(isThai ? 'เกิดข้อผิดพลาด' : 'An error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTier = async (tier: MemberTier) => {
    if (!confirm(isThai ? `คุณต้องการลบระดับ "${tier.name}" ใช่หรือไม่? (สมาชิกในระดับนี้จะถูกปรับเป็นทั่วไป)` : `Are you sure you want to delete tier "${tier.name}"? (Members in this tier will be reset to General)`)) {
      return;
    }

    try {
      const res = await deleteMemberTierAction(tier.id, orgId);
      if (res.success) {
        showToast(isThai ? 'ลบระดับสมาชิกสำเร็จ' : 'Tier deleted successfully', 'success');
        loadData();
      } else {
        showToast(res.message || (isThai ? 'ไม่สามารถลบได้' : 'Failed to delete'), 'error');
      }
    } catch (err) {
      showToast(isThai ? 'เกิดข้อผิดพลาดในการลบระดับสมาชิก' : 'Error deleting tier', 'error');
    }
  };

  // ----------------------------------------------------
  // Handlers: Member Transaction History (Infinite Scroll - 10 per batch)
  // ----------------------------------------------------
  const HISTORY_PAGE_SIZE = 10;

  const handleOpenHistory = async (member: Member) => {
    // Reset everything before opening
    setHistoryMember(member);
    setTransactions([]);
    setTotalHistoryCount(0);
    setIsLoadingHistory(true);
    setIsLoadingMoreHistory(false);
    setHasMoreHistory(false);
    historyOffsetRef.current = 0;
    setIsHistoryModalOpen(true);

    try {
      const res = await getMemberTransactionsAction(member.id, orgId, HISTORY_PAGE_SIZE, 0);
      const list = (res.transactions as MemberTransaction[]) ?? [];
      setTransactions(list);
      setTotalHistoryCount(res.total ?? 0);
      historyOffsetRef.current = list.length;
      setHasMoreHistory(res.hasMore ?? false);
    } catch (err) {
      console.error(err);
      showToast(isThai ? 'เกิดข้อผิดพลาดในการโหลดประวัติ' : 'Failed to load history', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLoadMoreHistory = useCallback(async () => {
    if (!historyMember || isLoadingHistory || isLoadingMoreHistory || !hasMoreHistory) return;
    setIsLoadingMoreHistory(true);
    try {
      const offset = historyOffsetRef.current;
      const res = await getMemberTransactionsAction(historyMember.id, orgId, HISTORY_PAGE_SIZE, offset);
      const list = (res.transactions as MemberTransaction[]) ?? [];
      if (list.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newUnique = list.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newUnique];
        });
        historyOffsetRef.current = offset + list.length;
      }
      setTotalHistoryCount(res.total ?? 0);
      setHasMoreHistory(res.hasMore ?? false);
    } catch (err) {
      console.error('Error loading more history:', err);
    } finally {
      setIsLoadingMoreHistory(false);
    }
  }, [historyMember, isLoadingHistory, isLoadingMoreHistory, hasMoreHistory, orgId]);

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // เมื่อเลื่อนลงมาใกล้ท้าย (เหลือ 120px) ให้โหลดเพิ่มอัตโนมัติ
    if (scrollHeight - scrollTop - clientHeight < 120) {
      handleLoadMoreHistory();
    }
  };

  // IntersectionObserver ช่วยตรวจจับเมื่อเลื่อนลงมาถึงจุดสิ้นสุดของรายการ (ทำงานลื่นไหลทุกอุปกรณ์ทั้ง iOS, iPadOS, Android, PC)
  useEffect(() => {
    if (!isHistoryModalOpen || !hasMoreHistory || isLoadingHistory || isLoadingMoreHistory) {
      return;
    }

    const target = historySentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMoreHistory();
        }
      },
      {
        root: historyScrollContainerRef.current,
        rootMargin: '120px',
        threshold: 0.05,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isHistoryModalOpen, hasMoreHistory, isLoadingHistory, isLoadingMoreHistory, handleLoadMoreHistory]);


  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn pointer-events-none">
          <div
            className={`pointer-events-auto px-4 py-2.5 rounded-full shadow-xl border text-xs sm:text-sm font-bold flex items-center gap-2 backdrop-blur-md ${toast.type === 'success'
              ? 'bg-emerald-500/95 text-white border-emerald-400'
              : 'bg-rose-500/95 text-white border-rose-400'
              }`}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header Banner & Actions */}
      <div className="p-3 sm:p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 shrink-0">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-pos-text flex items-center gap-2 truncate">
              <span>{isThai ? 'ระบบสมาชิก' : 'Member System'}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
                {stats.totalMembers} {isThai ? 'คน' : 'members'}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              {isThai ? 'จัดการสมาชิก แต้มสะสม และเครดิตเงินสด' : 'Manage members, reward points, and store credits'}
            </p>
          </div>
        </div>

        {/* Buttons: Add Member + View Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle (on Tablet/Desktop) */}
          <div className="hidden md:flex items-center p-0.5 rounded-xl bg-pos-bg border border-pos-border">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${viewMode === 'card'
                ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-2xs font-bold'
                : 'text-slate-400 hover:text-pos-text'
                }`}
              title={isThai ? 'มุมมองการ์ด (เหมาะกับแท็บเล็ต/มือถือ)' : 'Card view (suited for tablet/mobile)'}
            >
              <CardViewIcon className="w-3.5 h-3.5" />
              <span>{isThai ? 'การ์ด' : 'Card'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${viewMode === 'table'
                ? 'bg-pos-surface text-sky-600 dark:text-sky-400 shadow-2xs font-bold'
                : 'text-slate-400 hover:text-pos-text'
                }`}
              title={isThai ? 'มุมมองตาราง (เหมาะกับหน้าจอคอม)' : 'Table view (suited for desktop)'}
            >
              <TableViewIcon className="w-3.5 h-3.5" />
              <span>{isThai ? 'ตาราง' : 'Table'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMember}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{isThai ? 'เพิ่มสมาชิกใหม่' : 'Add New Member'}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Total Members */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{isThai ? 'สมาชิกทั้งหมด' : 'Total Members'}</span>
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <UserGroupIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-pos-text mt-0.5">{stats.totalMembers.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
            {isThai ? `ใช้งานปกติ ${stats.activeMembers} คน` : `Active ${stats.activeMembers}`}
          </p>
        </div>

        {/* Total Tiers */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{isThai ? 'ระดับสมาชิก' : 'Member Tiers'}</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <StarIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-pos-text mt-0.5">{tiers.length} {isThai ? 'ระดับ' : 'Tiers'}</p>
          <p className="text-[10px] text-slate-400 font-medium truncate">{isThai ? 'สิทธิประโยชน์สมาชิก' : 'Member benefits'}</p>
        </div>

        {/* Total Points */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{isThai ? 'แต้มสะสมรวม' : 'Total Points'}</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold">PT</span>
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-medium truncate">{isThai ? 'แต้มที่ถืออยู่' : 'Current held points'}</p>
        </div>

        {/* Total Credit Balance */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-pos-surface border border-pos-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{isThai ? 'เครดิตกระเป๋ารวม' : 'Total Wallet Credits'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <WalletIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {currencySymbol}{stats.totalCreditBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium truncate">{isThai ? 'เงินที่เติมไว้ในระบบ' : 'Total deposited balance'}</p>
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
            <span>{isThai ? `รายชื่อสมาชิก (${stats.totalMembers})` : `Members (${stats.totalMembers})`}</span>
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
            <span>{isThai ? `ระดับสมาชิก (${tiers.length})` : `Tiers (${tiers.length})`}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MEMBERS LIST */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-3.5">
          {/* Filters Bar */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={isThai ? 'ค้นหาเบอร์โทร หรือ ชื่อสมาชิก...' : 'Search by phone or name...'}
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
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

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
              {/* Status Filter */}
              <div className="relative min-w-0 sm:min-w-[130px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ backgroundImage: 'none' }}
                  className="appearance-none bg-none w-full pl-2.5 pr-7 py-2 rounded-xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text focus:outline-none focus:border-sky-500 cursor-pointer truncate"
                >
                  <option value="ALL">{isThai ? 'สถานะทั้งหมด' : 'All Status'}</option>
                  <option value="ACTIVE">{isThai ? 'ใช้งานปกติ' : 'Active'}</option>
                  <option value="INACTIVE">{isThai ? 'ระงับการใช้' : 'Inactive'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tier Filter */}
              <div className="relative min-w-0 sm:min-w-[130px]">
                <select
                  value={tierFilter}
                  onChange={(e) => {
                    setTierFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ backgroundImage: 'none' }}
                  className="appearance-none bg-none w-full pl-2.5 pr-7 py-2 rounded-xl bg-pos-bg border border-pos-border text-xs sm:text-sm text-pos-text focus:outline-none focus:border-sky-500 cursor-pointer truncate"
                >
                  <option value="ALL">{isThai ? 'ระดับทั้งหมด' : 'All Tiers'}</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Members Content Container */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm rounded-2xl bg-pos-surface border border-pos-border">
              {isThai ? 'กำลังโหลดข้อมูลสมาชิก...' : 'Loading members...'}
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center px-4 rounded-2xl bg-pos-surface border border-pos-border">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-pos-text">{isThai ? 'ไม่พบข้อมูลสมาชิก' : 'No members found'}</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? (isThai ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง' : 'Try changing search query or clear filters') : (isThai ? 'กดปุ่ม "เพิ่มสมาชิกใหม่" ด้านบนเพื่อเริ่มสร้างสมาชิกคนแรก' : 'Click "Add New Member" above to get started')}
              </p>
            </div>
          ) : (
            <>
              {/* Card View: Always shown on mobile (<768px), or on tablet/PC when viewMode === 'card' */}
              <div className={`${viewMode === 'card' ? 'block' : 'block md:hidden'} space-y-2.5`}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                  {members.map((member) => {
                    const initial = member.firstName ? member.firstName.charAt(0) : '?';
                    const isInactive = member.status === 'INACTIVE' || member.status === 'BANNED';

                    return (
                      <div
                        key={member.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs hover:border-sky-500/30 transition space-y-3"
                      >
                        {/* Member Header */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 via-blue-500/15 to-indigo-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center border border-sky-500/20 shrink-0 text-base shadow-2xs">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-pos-text truncate">
                                {member.firstName} {member.lastName || ''}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                                <PhoneIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span className="font-semibold text-pos-text tracking-wide">{member.phone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Badges: Tier & Status */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {member.tier ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <StarIcon className="w-3 h-3" />
                                <span>{member.tier.name}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">{isThai ? 'ทั่วไป' : 'General'}</span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${isInactive
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              <span>{isInactive ? (isThai ? 'ระงับการใช้' : 'Inactive') : (isThai ? 'ใช้งานปกติ' : 'Active')}</span>
                            </span>
                          </div>
                        </div>

                        {/* Points & Credit Grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                          {/* Points */}
                          <div className="p-2.5 rounded-xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/15 flex items-center justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-semibold block truncate">{isThai ? 'แต้มสะสม' : 'Points'}</span>
                              <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                {member.points.toLocaleString()} <span className="text-[10px] font-bold">PT</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(member, 'POINT')}
                              className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 active:scale-95 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center gap-0.5 cursor-pointer transition shrink-0"
                              title={isThai ? 'ปรับแต้มสะสม' : 'Adjust points'}
                            >
                              <span>＋</span>
                              <span>{isThai ? 'ปรับ' : 'Adjust'}</span>
                            </button>
                          </div>

                          {/* Credit */}
                          <div className="p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15 flex items-center justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold block truncate">{isThai ? 'เครดิตร้านค้า' : 'Store Credit'}</span>
                              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {currencySymbol}{member.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(member, 'CREDIT')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-0.5 cursor-pointer transition shrink-0"
                              title={isThai ? 'เติม/หักเครดิต' : 'Top-up/Deduct credit'}
                            >
                              <span>＋</span>
                              <span>{isThai ? 'เติม' : 'Top-up'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-pos-border/50 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(member)}
                            className="px-3 py-1.5 rounded-xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-98"
                          >
                            <HistoryIcon className="w-3.5 h-3.5 text-sky-500" />
                            <span>{isThai ? 'ประวัติ' : 'History'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMember(member)}
                              className="px-3 py-1.5 rounded-xl bg-pos-bg hover:bg-amber-500/10 border border-pos-border hover:border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-98"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                              <span>{isThai ? 'แก้ไข' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(member)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-98"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span>{isThai ? 'ลบ' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table View: Shown when viewMode === 'table' on desktop/tablet */}
              <div className={`${viewMode === 'table' ? 'hidden md:block' : 'hidden'} rounded-2xl bg-pos-surface border border-pos-border shadow-xs overflow-hidden`}>
                <div className="overflow-x-auto custom-scroll">
                  <table className="min-w-[760px] w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-pos-border bg-pos-bg/70 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 whitespace-nowrap">{isThai ? 'สมาชิก' : 'Member'}</th>
                        <th className="py-3 px-3 whitespace-nowrap">{isThai ? 'เบอร์โทรศัพท์' : 'Phone Number'}</th>
                        <th className="py-3 px-3 whitespace-nowrap">{isThai ? 'ระดับ' : 'Tier'}</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">{isThai ? 'แต้มสะสม' : 'Points'}</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">{isThai ? 'เครดิตคงเหลือ' : 'Wallet Credit'}</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">{isThai ? 'สถานะ' : 'Status'}</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">{isThai ? 'จัดการ' : 'Actions'}</th>
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
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center border border-sky-500/20 shrink-0 text-sm">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs sm:text-sm text-pos-text truncate">
                                    {member.firstName} {member.lastName || ''}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 font-mono font-medium text-xs sm:text-sm whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <PhoneIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span>{member.phone}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              {member.tier ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <StarIcon className="w-3 h-3" />
                                  {member.tier.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20">{isThai ? 'ทั่วไป' : 'General'}</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {member.points.toLocaleString()} PT
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(member, 'POINT')}
                                  title={isThai ? 'ปรับแต้มสะสม' : 'Adjust points'}
                                  className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 flex items-center justify-center text-[11px] font-bold cursor-pointer transition"
                                >
                                  ＋
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {currencySymbol}{member.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(member, 'CREDIT')}
                                  title={isThai ? 'เติม/หักเครดิต' : 'Top-up/Deduct credit'}
                                  className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center text-[11px] font-bold cursor-pointer transition"
                                >
                                  ＋
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isInactive
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                <span>{isInactive ? (isThai ? 'ระงับการใช้' : 'Inactive') : (isThai ? 'ใช้งานปกติ' : 'Active')}</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenHistory(member)}
                                  title={isThai ? 'ประวัติการเคลื่อนไหวแต้ม/เครดิต' : 'Points/Credits History'}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-pos-hover transition cursor-pointer"
                                >
                                  <HistoryIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMember(member)}
                                  title={isThai ? 'แก้ไขข้อมูลสมาชิก' : 'Edit Member Info'}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-pos-hover transition cursor-pointer"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(member)}
                                  title={isThai ? 'ลบสมาชิก' : 'Delete Member'}
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
              </div>
            </>
          )}

          {/* 3. Pagination Bar */}
          {totalCount > 0 && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-pos-surface border border-pos-border shadow-2xs flex flex-col xl:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs">
              {/* Left: Summary & Page Size */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400">
                <span className="whitespace-nowrap">
                  {isThai ? <>แสดง <strong className="text-pos-text font-bold">{Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)}</strong> จาก <strong className="text-pos-text font-bold">{totalCount}</strong> คน</> : <>Showing <strong className="text-pos-text font-bold">{Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)}</strong> of <strong className="text-pos-text font-bold">{totalCount}</strong></>}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span>{isThai ? 'ต่อหน้า:' : 'Per page:'}</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ backgroundImage: 'none' }}
                      className="appearance-none bg-none pl-2 pr-6 py-1 rounded-lg bg-pos-bg border border-pos-border font-bold text-pos-text cursor-pointer focus:outline-none focus:border-sky-500 text-xs"
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
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage(1)}
                  className="w-8 h-8 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition flex items-center justify-center shrink-0"
                  title={isThai ? 'หน้าแรก' : 'First page'}
                >
                  «
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 h-8 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
                  title={isThai ? 'ก่อนหน้า' : 'Previous page'}
                >
                  <span>‹</span>
                  <span className="hidden sm:inline">{isThai ? 'ก่อนหน้า' : 'Previous'}</span>
                </button>
                <div className="px-2.5 sm:px-3 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap flex items-center justify-center text-xs">
                  {isThai ? `หน้า ${currentPage} / ${Math.max(1, totalPages)}` : `Page ${currentPage} of ${Math.max(1, totalPages)}`}
                </div>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 h-8 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
                  title={isThai ? 'ถัดไป' : 'Next page'}
                >
                  <span className="hidden sm:inline">{isThai ? 'ถัดไป' : 'Next'}</span>
                  <span>›</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 rounded-lg border border-pos-border bg-pos-bg hover:bg-pos-hover disabled:opacity-40 disabled:cursor-not-allowed text-pos-text font-bold cursor-pointer transition flex items-center justify-center shrink-0"
                  title={isThai ? 'หน้าสุดท้าย' : 'Last page'}
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
              <h3 className="font-bold text-sm sm:text-base text-pos-text">{isThai ? 'ระดับสมาชิก (Member Tiers)' : 'Member Tiers'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isThai ? 'กำหนดระดับสมาชิกเพื่อมอบสิทธิพิเศษ เช่น ส่วนลดค่าอาหาร และตัวคูณแต้มสะสม' : 'Define member tiers to grant special perks like discounts and point multipliers'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddTier}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{isThai ? 'เพิ่มระดับ' : 'Add Tier'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-pos-surface rounded-2xl border border-pos-border">
                <StarIcon className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
                <p className="text-sm font-semibold text-pos-text">{isThai ? 'ยังไม่มีระดับสมาชิก' : 'No tiers defined yet'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{isThai ? 'กดปุ่ม "เพิ่มระดับ" ด้านบนเพื่อสร้างระดับแรก (เช่น Silver, Gold)' : 'Click "Add Tier" above to create your first tier (e.g. Silver, Gold)'}</p>
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
                        {isThai ? `สมาชิกในระดับนี้: ${tier._count?.members || 0} คน` : `Members in this tier: ${tier._count?.members || 0}`}
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
                      <span className="block text-[10px] text-slate-400 font-semibold">{isThai ? 'ยอดใช้สะสม' : 'Min Spend'}</span>
                      <span className="text-xs font-black text-pos-text">{currencySymbol}{tier.minSpending.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-pos-bg">
                      <span className="block text-[10px] text-slate-400 font-semibold">{isThai ? 'ตัวคูณแต้ม' : 'Multiplier'}</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{tier.pointMultiplier}x</span>
                    </div>
                    <div className="p-2 rounded-xl bg-pos-bg">
                      <span className="block text-[10px] text-slate-400 font-semibold">{isThai ? 'ส่วนลด' : 'Discount'}</span>
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
                  {modalMode === 'add' ? (isThai ? 'เพิ่มสมาชิกใหม่' : 'Add New Member') : (isThai ? 'แก้ไขข้อมูลสมาชิก' : 'Edit Member')}
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
                  {isThai ? 'เบอร์โทรศัพท์' : 'Phone Number'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder={isThai ? 'เช่น 0812345678' : 'e.g. 0812345678'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {/* First Name & Last Name (ชื่อจริง - นามสกุล) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isThai ? 'ชื่อจริง' : 'First Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.firstName}
                    onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                    placeholder={isThai ? 'เช่น สมชาย' : 'e.g. Somchai'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isThai ? "นามสกุล" : "Last Name"}
                  </label>
                  <input
                    type="text"
                    value={memberForm.lastName}
                    onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                    placeholder={isThai ? 'เช่น ใจดี' : 'e.g. Jaidee'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Member Tier (ระดับสมาชิก) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isThai ? "ระดับสมาชิก" : "Member Tier"}
                </label>
                <div className="relative">
                  <select
                    value={memberForm.tierId}
                    onChange={(e) => setMemberForm({ ...memberForm, tierId: e.target.value })}
                    style={{ backgroundImage: 'none' }}
                    className="appearance-none bg-none w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">{isThai ? 'สมาชิกทั่วไป (ไม่มีระดับ)' : 'General Member (No Tier)'}</option>
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({isThai ? `ลด ${t.discountPercent}% · คูณแต้ม ${t.pointMultiplier}x` : `Discount ${t.discountPercent}% · ${t.pointMultiplier}x Points`})
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
                      {isThai ? "แต้มเริ่มต้น" : "Initial Points"}
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
                      {isThai ? `เครดิตเริ่มต้น (${currencySymbol})` : `Initial Credit (${currencySymbol})`}
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
                    {isThai ? "สถานะการใช้งาน" : "Status"}
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
                      {isThai ? 'ใช้งานปกติ (ACTIVE)' : 'Active'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, status: 'INACTIVE' })}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${memberForm.status === 'INACTIVE'
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                        : 'bg-pos-bg border-pos-border text-slate-400'
                        }`}
                    >
                      {isThai ? 'ระงับการใช้ (INACTIVE)' : 'Inactive'}
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
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (isThai ? 'กำลังบันทึก...' : 'Saving...') : modalMode === 'add' ? (isThai ? 'เพิ่มสมาชิก' : 'Add Member') : (isThai ? 'บันทึกการแก้ไข' : 'Save Changes')}
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
                  {adjustForm.walletType === 'POINT' ? (isThai ? 'ปรับแต้มสะสม' : 'Adjust Points') : (isThai ? 'ปรับเครดิตเงินสด' : 'Adjust Cash Credit')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isThai ? `สมาชิก: ${adjustTargetMember.firstName} (${adjustTargetMember.phone})` : `Member: ${adjustTargetMember.firstName} (${adjustTargetMember.phone})`}
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
                  {isThai ? '＋ เพิ่ม (Top-up/Earn)' : '＋ Add (Top-up/Earn)'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, action: 'DEDUCT' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${adjustForm.action === 'DEDUCT'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                    : 'bg-pos-bg border-pos-border text-slate-400'
                    }`}
                >
                  {isThai ? '－ ลด (Deduct/Redeem)' : '－ Deduct (Deduct/Redeem)'}
                </button>
              </div>

              {/* Current Balance Notice */}
              <div className="p-3 rounded-xl bg-pos-bg text-center">
                <span className="text-[11px] text-slate-400 block font-semibold">{isThai ? 'ยอดปัจจุบัน' : 'Current Balance'}</span>
                <span className="text-lg font-black text-pos-text">
                  {adjustForm.walletType === 'POINT'
                    ? `${adjustTargetMember.points.toLocaleString()} ${isThai ? 'แต้ม' : 'pts'}`
                    : `${currencySymbol}${adjustTargetMember.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isThai ? `จำนวน ${adjustForm.walletType === 'POINT' ? 'แต้ม' : `เงิน (${currencySymbol})`}` : `Amount of ${adjustForm.walletType === 'POINT' ? 'Points' : `Credit (${currencySymbol})`}`} <span className="text-rose-500">*</span>
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
                {/* Quick Amount Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  {(adjustForm.walletType === 'POINT' ? [10, 50, 100, 500] : [50, 100, 500, 1000]).map((quickVal) => (
                    <button
                      key={quickVal}
                      type="button"
                      onClick={() => setAdjustForm({ ...adjustForm, amount: String(quickVal) })}
                      className="px-2.5 py-1 rounded-lg bg-pos-bg hover:bg-pos-hover border border-pos-border text-xs font-semibold text-pos-text cursor-pointer transition active:scale-95"
                    >
                      +{quickVal.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isThai ? "หมายเหตุ / เหตุผล" : "Note / Reason"}
                </label>
                <input
                  type="text"
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  placeholder={isThai ? 'เช่น เติมเงินสดหน้าร้าน, แลกของรางวัล' : 'e.g. In-store top-up, reward redemption'}
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
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (isThai ? 'กำลังทำรายการ...' : 'Processing...') : (isThai ? 'ยืนยันทำรายการ' : 'Confirm Transaction')}
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
                {tierModalMode === 'add' ? (isThai ? 'เพิ่มระดับสมาชิกใหม่' : 'Add New Tier') : (isThai ? 'แก้ไขระดับสมาชิก' : 'Edit Tier')}
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
                  {isThai ? 'ชื่อระดับ' : 'Tier Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  placeholder={isThai ? 'เช่น Silver, Gold, VIP' : 'e.g. Silver, Gold, VIP'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-sm text-pos-text focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isThai ? `ยอดใช้จ่ายสะสมขั้นต่ำ (${currencySymbol})` : `Min Accumulated Spending (${currencySymbol})`}
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
                    {isThai ? "ตัวคูณแต้ม" : "Point Multiplier"}
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
                    {isThai ? "ส่วนลด (%)" : "Discount (%)"}
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
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (isThai ? 'กำลังบันทึก...' : 'Saving...') : (isThai ? 'บันทึกระดับ' : 'Save Tier')}
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
              <h3 className="text-base font-bold text-pos-text">{isThai ? 'ยืนยันการลบสมาชิก?' : 'Confirm Member Deletion?'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isThai ? 'คุณแน่ใจหรือไม่ว่าต้องการลบ ' : 'Are you sure you want to delete '}
                <span className="font-bold text-pos-text">
                  &quot;{memberToDelete.firstName} {memberToDelete.lastName || ''}&quot;
                </span>{' '}
                ({memberToDelete.phone}) ?
              </p>
              <p className="text-[11px] text-rose-500 font-medium mt-1">
                {isThai ? 'การกระทำนี้จะลบประวัติแต้มและเครดิตของสมาชิกท่านนี้ด้วย และไม่สามารถกู้คืนได้' : 'This will also delete the points and credits history for this member and cannot be undone.'}
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
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (isThai ? 'กำลังลบ...' : 'Deleting...') : (isThai ? 'ยืนยันลบ' : 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TRANSACTION HISTORY */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && historyMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-pos-surface rounded-3xl shadow-2xl border border-pos-border overflow-hidden flex flex-col h-[88vh] sm:h-[650px] max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 border-b border-pos-border flex items-center justify-between shrink-0 bg-pos-surface">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <HistoryIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-pos-text truncate">
                      {isThai ? "ประวัติธุรกรรมสมาชิก" : "Member Transaction History"}
                    </h3>
                    {totalHistoryCount > 0 && (
                      <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
                        {isThai ? `ทั้งหมด ${totalHistoryCount} รายการ` : `Total ${totalHistoryCount} transactions`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <span className="font-semibold text-pos-text">{historyMember.firstName} {historyMember.lastName || ''}</span>
                    <span className="mx-1.5 opacity-40">|</span>
                    <span className="font-mono">{historyMember.phone}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-pos-text hover:bg-pos-hover flex items-center justify-center cursor-pointer transition shrink-0 ml-2"
                title={isThai ? 'ปิดหน้าต่าง' : 'Close window'}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Bar */}
            <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-pos-bg/60 border-b border-pos-border/70 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">{isThai ? 'แต้มปัจจุบัน:' : 'Current Points:'}</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs sm:text-sm">
                    {historyMember.points.toLocaleString()} {isThai ? 'แต้ม' : 'pts'}
                  </strong>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">{isThai ? 'เครดิตคงเหลือ:' : 'Credit Balance:'}</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs sm:text-sm">
                    {currencySymbol}{historyMember.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {transactions.length > 0 && (
                  <span>{isThai ? <>แสดง <strong className="text-pos-text">{transactions.length}</strong> / {totalHistoryCount} รายการ</> : <>Showing <strong className="text-pos-text">{transactions.length}</strong> / {totalHistoryCount} transactions</>}</span>
                )}
              </div>
            </div>

            {/* Scrollable Transactions List (Scroll to reload 10 items per batch) */}
            <div
              ref={historyScrollContainerRef}
              onScroll={handleHistoryScroll}
              className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5 custom-scroll"
            >
              {isLoadingHistory ? (
                <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium text-slate-500 dark:text-slate-400">{isThai ? 'กำลังโหลด 10 รายการแรก...' : 'Loading first 10 transactions...'}</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
                    <HistoryIcon className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-pos-text">{isThai ? 'ยังไม่มีประวัติการทำรายการ' : 'No transaction history yet'}</p>
                  <p className="text-[11px] text-slate-400">{isThai ? 'เมื่อมีการให้แต้ม ตัดแต้ม หรือเติมเครดิต ประวัติจะแสดงที่นี่' : 'History will appear here when points are earned, redeemed, or credit is added'}</p>
                </div>
              ) : (
                <>
                  {transactions.map((tx) => {
                    const isPositive = tx.amount >= 0;
                    const isPoint = tx.walletType === 'POINT';

                    // กำหนดป้ายสถานะภาษาไทยตามประเภทรายการ
                    // กำหนดป้ายสถานะภาษาไทยตามประเภทรายการ
                    let typeLabel: string = tx.type;
                    let typeBg = 'bg-slate-500/15 text-slate-600 dark:text-slate-400';
                    if (tx.type === 'EARN') {
                      typeLabel = isThai ? 'ได้รับแต้ม' : 'Points Earned';
                      typeBg = 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400';
                    } else if (tx.type === 'REDEEM') {
                      typeLabel = isThai ? 'แลกแต้ม' : 'Points Redeemed';
                      typeBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
                    } else if (tx.type === 'TOPUP') {
                      typeLabel = isThai ? 'เติมเครดิต' : 'Credit Top-up';
                      typeBg = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
                    } else if (tx.type === 'SPEND') {
                      typeLabel = isPoint ? (isThai ? 'ใช้แต้ม' : 'Points Used') : (isThai ? 'ชำระเงิน' : 'Payment');
                      typeBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
                    } else if (tx.type === 'REFUND') {
                      typeLabel = isThai ? 'คืนเงิน/คืนแต้ม' : 'Refund/Points Restored';
                      typeBg = 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
                    }

                    return (
                      <div
                        key={tx.id}
                        className="p-3 sm:p-3.5 rounded-2xl bg-pos-bg/80 hover:bg-pos-bg border border-pos-border/70 flex items-center justify-between text-xs transition gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${typeBg}`}>
                              {typeLabel}
                            </span>
                            <span className="font-bold text-pos-text truncate">
                              {tx.note || (isPoint ? (isThai ? 'ปรับปรุงแต้ม' : 'Adjusted points') : (isThai ? 'ปรับปรุงเครดิต' : 'Adjusted credit'))}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span>{new Date(tx.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            {tx.employee?.name && (
                              <>
                                <span>·</span>
                                <span>{isThai ? `โดย ${tx.employee.name}` : `by ${tx.employee.name}`}</span>
                              </>
                            )}
                            {tx.orderId && (
                              <>
                                <span>·</span>
                                <span className="font-mono">{isThai ? `บิล #${tx.orderId}` : `Bill #${tx.orderId}`}</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black font-mono text-sm sm:text-base ${isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            {isPositive ? '+' : ''}
                            {isPoint
                              ? `${Math.floor(tx.amount)} ${isThai ? 'แต้ม' : 'pts'}`
                              : `${currencySymbol}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            {isThai ? 'คงเหลือ: ' : 'Balance: '}{isPoint ? `${Math.floor(tx.balanceAfter)} ${isThai ? 'แต้ม' : 'pts'}` : `${currencySymbol}${tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Sentinel element for IntersectionObserver to trigger auto-load */}
                  <div ref={historySentinelRef} className="h-2 w-full pointer-events-none" />

                  {/* Loading More Spinner */}
                  {isLoadingMoreHistory && (
                    <div className="py-3.5 px-4 rounded-2xl bg-sky-500/5 border border-sky-500/15 flex items-center justify-center gap-2.5 text-xs text-sky-600 dark:text-sky-400 font-semibold animate-fadeIn">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>{isThai ? `กำลังโหลดเพิ่มอีก 10 รายการ... (${transactions.length}/${totalHistoryCount})` : `Loading 10 more... (${transactions.length}/${totalHistoryCount})`}</span>
                    </div>
                  )}

                  {/* Clickable Load More Button (acts as fallback if scroll hasn't triggered or user wants to tap) */}
                  {!isLoadingMoreHistory && hasMoreHistory && (
                    <div className="pt-1 pb-1">
                      <button
                        type="button"
                        onClick={handleLoadMoreHistory}
                        className="w-full py-3 px-4 rounded-2xl bg-pos-bg hover:bg-pos-hover border border-pos-border text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-2xs"
                      >
                        <span>{isThai ? '⬇ เลื่อนลง หรือแตะที่นี่เพื่อโหลดเพิ่มอีก 10 รายการ' : '⬇ Scroll down or tap here to load 10 more'}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          ({transactions.length}/{totalHistoryCount})
                        </span>
                      </button>
                    </div>
                  )}

                  {/* End of List */}
                  {!hasMoreHistory && transactions.length > 0 && !isLoadingMoreHistory && (
                    <div className="py-3 text-center text-xs text-slate-400 font-medium border-t border-pos-border/40 mt-2">
                      ✓ แสดงครบทุกรายการแล้ว ({transactions.length} จาก{isThai ? `ทั้งหมด ${totalHistoryCount} รายการ` : `Total ${totalHistoryCount} transactions`})
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

