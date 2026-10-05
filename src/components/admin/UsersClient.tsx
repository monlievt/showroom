"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  User,
  Lock,
  X,
  Check,
  RefreshCw,
  Crown,
  Wrench,
  Target,
  Handshake,
} from "lucide-react";
import { UserItem, createUserAction, updateUserAction, deleteUserAction } from "@/app/actions/user";
import { cn } from "@/lib/utils";

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
  investors?: Array<{ id: string; name: string; phone: string | null }>;
}

export function UsersClient({ initialUsers, currentUserId, investors = [] }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // State Feedback & Loading
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  // State Modal Tambah
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    authUserId: "",
    fullName: "",
    phone: "",
    role: "STAFF_ADMIN" as "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR",
    password: "",
    investorId: "",
  });
  const [showAddPassword, setShowAddPassword] = useState(false);

  // State Modal Edit
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    role: "STAFF_ADMIN" as "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR",
    isActive: true,
    newPassword: "",
    investorId: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // State Modal Hapus
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Filter daftar pengguna
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.authUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "INACTIVE" && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      ownerAdmin: users.filter((u) => u.role === "OWNER" || u.role === "ADMIN").length,
      staff: users.filter((u) => u.role === "STAFF_ADMIN").length,
      sales: users.filter((u) => u.role === "SALES").length,
      investor: users.filter((u) => u.role === "INVESTOR").length,
    };
  }, [users]);

  // Handle Tambah User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await createUserAction(addForm);
    setLoading(false);

    if (res.success) {
      showNotification(res.message || "Pengguna berhasil ditambahkan!", "success");
      setIsAddModalOpen(false);
      setAddForm({
        authUserId: "",
        fullName: "",
        phone: "",
        role: "STAFF_ADMIN",
        password: "",
        investorId: "",
      });
      // Update local state
      window.location.reload();
    } else {
      showNotification(res.error || "Gagal menambahkan pengguna.", "error");
    }
  };

  // Buka Modal Edit
  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      phone: user.phone || "",
      role: (user.role === "ADMIN" ? "OWNER" : user.role) as any,
      isActive: user.isActive,
      newPassword: "",
      investorId: user.investorId || "",
    });
    setShowEditPassword(false);
  };

  // Handle Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    const res = await updateUserAction({
      id: editingUser.id,
      fullName: editForm.fullName,
      phone: editForm.phone,
      role: editForm.role,
      isActive: editForm.isActive,
      newPassword: editForm.newPassword || undefined,
      investorId: editForm.investorId || undefined,
    });
    setLoading(false);

    if (res.success) {
      showNotification(res.message || "Data pengguna berhasil diperbarui!", "success");
      setEditingUser(null);
      // Perbarui di state lokal
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                fullName: editForm.fullName,
                phone: editForm.phone || null,
                role: editForm.role,
                isActive: editForm.isActive,
                hasPassword: editForm.newPassword ? true : u.hasPassword,
                updatedAt: new Date(),
              }
            : u
        )
      );
    } else {
      showNotification(res.error || "Gagal memperbarui pengguna.", "error");
    }
  };

  // Handle Hapus User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setLoading(true);
    const res = await deleteUserAction(deletingUser.id);
    setLoading(false);

    if (res.success) {
      showNotification(res.message || "Pengguna berhasil dihapus.", "success");
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } else {
      showNotification(res.error || "Gagal menghapus pengguna.", "error");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Crown className="w-3.5 h-3.5 text-amber-700" />
            Owner / Direksi
          </span>
        );
      case "STAFF_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Wrench className="w-3.5 h-3.5 text-blue-700" />
            Staff Garasi & Kasir
          </span>
        );
      case "SALES":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Target className="w-3.5 h-3.5 text-emerald-700" />
            Tim Sales / Marketing
          </span>
        );
      case "INVESTOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Handshake className="w-3.5 h-3.5 text-purple-700" />
            Mitra Investor
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md border animate-in fade-in slide-in-from-top-2",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          )}
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer text-stone-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#D9D4CB] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[#D97706]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1917] tracking-tight">
                Kelola Pengguna & Hak Akses
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6560]">
                Manajemen akun staf showroom, pengaturan peran RBAC, dan pengelolaan kata sandi aman.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all hover:shadow cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <span className="text-xs font-semibold text-[#6B6560] block">Total Pengguna</span>
          <span className="text-xl sm:text-2xl font-black text-[#1C1917] mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
            {stats.active} akun aktif
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <span className="text-xs font-semibold text-[#6B6560] block">Direksi & Owner</span>
          <span className="text-xl sm:text-2xl font-black text-amber-700 mt-1 block">{stats.ownerAdmin}</span>
          <span className="text-[11px] text-[#6B6560] mt-1 block">Akses penuh</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <span className="text-xs font-semibold text-[#6B6560] block">Staff Garasi</span>
          <span className="text-xl sm:text-2xl font-black text-blue-700 mt-1 block">{stats.staff}</span>
          <span className="text-[11px] text-[#6B6560] mt-1 block">Unit & kasir SPK</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <span className="text-xs font-semibold text-[#6B6560] block">Tim Sales</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">{stats.sales}</span>
          <span className="text-[11px] text-[#6B6560] mt-1 block">Katalog siap jual</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D9D4CB] shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-[#6B6560] block">Mitra Investor</span>
          <span className="text-xl sm:text-2xl font-black text-purple-700 mt-1 block">{stats.investor}</span>
          <span className="text-[11px] text-[#6B6560] mt-1 block">Portal bagi hasil</span>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
          <input
            type="text"
            placeholder="Cari nama, username, HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#D97706]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-xs font-bold text-[#1C1917] focus:outline-none cursor-pointer flex-1 sm:flex-none"
          >
            <option value="ALL">Semua Peran</option>
            <option value="OWNER">👑 Owner / Direksi</option>
            <option value="STAFF_ADMIN">🔧 Staff Garasi</option>
            <option value="SALES">🎯 Tim Sales</option>
            <option value="INVESTOR">🤝 Mitra Investor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-xs font-bold text-[#1C1917] focus:outline-none cursor-pointer flex-1 sm:flex-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-3xl border border-[#D9D4CB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D9D4CB] bg-[#FAF9F6] text-[#6B6560] font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Pengguna</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Kontak Telepon</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Kata Sandi</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE7E1]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B6560]">
                    <Users className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                    <p className="font-bold text-sm">Tidak ada pengguna yang cocok</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Coba ubah kata kunci pencarian atau filter peran.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUserId || user.authUserId === "owner";
                  const isPrimaryOwner = user.authUserId === "admin-owner-001" || user.authUserId === "owner";

                  return (
                    <tr key={user.id} className="hover:bg-[#FAF9F6] transition-colors">
                      {/* Identitas Pengguna */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#D97706] font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                            {user.fullName.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-[#1C1917] block text-sm">
                              {user.fullName}
                              {isCurrent && (
                                <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                  Anda
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] font-mono text-[#6B6560]">
                              @{user.authUserId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Peran */}
                      <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                      {/* Kontak */}
                      <td className="py-3.5 px-4">
                        {user.phone ? (
                          <span className="font-medium text-[#1C1917]">{user.phone}</span>
                        ) : (
                          <span className="text-[#6B6560] italic text-xs">Tidak ada nomor</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Kata Sandi Status */}
                      <td className="py-3.5 px-4 text-center">
                        {user.hasPassword ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                            Tersimpan (Hash)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Default (.env)
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Edit */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg border border-[#D9D4CB] bg-white hover:bg-stone-50 text-[#1C1917] transition-colors cursor-pointer"
                            title="Edit data / ganti password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Hapus */}
                          {!isPrimaryOwner && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              disabled={isCurrent}
                              className={cn(
                                "p-1.5 rounded-lg border transition-colors",
                                isCurrent
                                  ? "border-stone-200 text-stone-300 cursor-not-allowed"
                                  : "border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                              )}
                              title={
                                isCurrent
                                  ? "Tidak dapat menghapus akun sendiri"
                                  : "Hapus akun pengguna"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL TAMBAH PENGGUNA ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#D9D4CB] shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-[#D97706] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#1C1917]">Tambah Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Nama Lengkap Staf / Pengguna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Username Login <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="budi_garasi"
                    value={addForm.authUserId}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        authUserId: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold font-mono focus:outline-none focus:border-[#D97706]"
                  />
                </div>
                <span className="text-[10px] text-[#6B6560] mt-1 block">
                  Digunakan untuk masuk di form login. Huruf kecil tanpa spasi.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Peran & Hak Akses (RBAC) <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none cursor-pointer"
                >
                  <option value="STAFF_ADMIN">🔧 Staff Garasi (Unit, Inspeksi, Gudang, SPK Kasir)</option>
                  <option value="SALES">🎯 Tim Sales (Katalog Siap Jual & Harga Saja)</option>
                  <option value="INVESTOR">🤝 Mitra Investor / Pemodal (Portal Transparansi & Bagi Hasil)</option>
                  <option value="OWNER">👑 Owner / Direksi (Akses Penuh Semua Menu)</option>
                </select>
              </div>

              {addForm.role === "INVESTOR" && (
                <div>
                  <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                    Tautkan ke Data Investor Terdaftar
                  </label>
                  <select
                    value={addForm.investorId}
                    onChange={(e) => {
                      const invId = e.target.value;
                      const selected = investors.find((i) => i.id === invId);
                      setAddForm({
                        ...addForm,
                        investorId: invId,
                        ...(selected && !addForm.fullName ? { fullName: selected.name } : {}),
                        ...(selected && !addForm.phone ? { phone: selected.phone || "" } : {}),
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Buat Profil Investor Baru Otomatis --</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.phone})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-[#6B6560] mt-1 block">
                    Pilih nama investor yang sudah terdaftar untuk menautkan portal transparansi bagi hasilnya.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Kata Sandi Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showAddPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter..."
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-[#6B6560] mt-1 block">
                  Password akan dienkripsi aman menggunakan algoritma bcrypt di database lokal.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D9D4CB] text-xs font-bold text-[#1C1917] hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT PENGGUNA ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#D9D4CB] shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-[#D97706] flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">Edit Data Pengguna</h3>
                  <span className="text-xs font-mono text-[#6B6560]">@{editingUser.authUserId}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Peran & Hak Akses (RBAC) <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.role}
                  disabled={editingUser.authUserId === "admin-owner-001" || editingUser.authUserId === "owner"}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none cursor-pointer disabled:opacity-60"
                >
                  <option value="STAFF_ADMIN">🔧 Staff Garasi (Unit, Inspeksi, Gudang, SPK Kasir)</option>
                  <option value="SALES">🎯 Tim Sales (Katalog Siap Jual & Harga Saja)</option>
                  <option value="INVESTOR">🤝 Mitra Investor / Pemodal (Portal Transparansi & Bagi Hasil)</option>
                  <option value="OWNER">👑 Owner / Direksi (Akses Penuh Semua Menu)</option>
                </select>
                {editingUser.authUserId === "owner" && (
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    Peran akun Owner Utama tidak dapat diubah demi keamanan sistem.
                  </span>
                )}
              </div>

              {editForm.role === "INVESTOR" && (
                <div>
                  <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                    Tautkan ke Data Investor
                  </label>
                  <select
                    value={editForm.investorId}
                    onChange={(e) => setEditForm({ ...editForm, investorId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Tidak Tertaut --</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Akun Aktif / Nonaktif */}
              <div>
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Status Akun
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1C1917]">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editForm.isActive}
                      onChange={() => setEditForm({ ...editForm, isActive: true })}
                      className="accent-[#D97706]"
                    />
                    <span>Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-500">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!editForm.isActive}
                      disabled={editingUser.authUserId === "admin-owner-001" || editingUser.authUserId === "owner"}
                      onChange={() => setEditForm({ ...editForm, isActive: false })}
                      className="accent-[#D97706]"
                    />
                    <span>Nonaktif (Blokir Akses)</span>
                  </label>
                </div>
              </div>

              {/* Reset Password */}
              <div className="pt-2 border-t border-[#EBE7E1]">
                <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                  Reset Kata Sandi Baru (Opsional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Kosongkan jika sandi tidak diubah"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-[#6B6560] mt-1 block">
                  Jika diisi, kata sandi baru akan langsung menggantikan sandi lama pengguna.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D9D4CB] text-xs font-bold text-[#1C1917] hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL KONFIRMASI HAPUS ── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9D4CB] shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#1C1917]">Hapus Pengguna Ini?</h3>
              <p className="text-xs text-[#6B6560]">
                Anda akan menghapus akun <strong>{deletingUser.fullName}</strong> (@{deletingUser.authUserId}). Pengguna ini tidak akan dapat login lagi ke sistem.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 rounded-xl border border-[#D9D4CB] text-xs font-bold text-[#1C1917] hover:bg-stone-50 cursor-pointer flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex-1 flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
