"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Store,
  Trash2,
  AlertTriangle,
  ExternalLink,
  X,
  Lock,
} from "lucide-react";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  getExpensesByVehicleIdAction,
} from "@/app/actions/expense";
import type { CreateExpenseInput } from "@/lib/validations/expense";
import {
  EXPENSE_CATEGORIES,
  getExpenseCategoryShortLabel,
} from "@/lib/constants/expense-categories";
import {
  cn,
  formatDate,
  formatRupiah,
  formatThousands,
  parseProofUrls,
  parseThousands,
} from "@/lib/utils";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  category: string;
  vendorName?: string | null;
  amount: number;
  date: string | Date;
  notes?: string | null;
  receiptUrl?: string | null;
  createdAt?: string | Date;
  createdBy?: string | null;
}

export interface ExpenseVehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  purchasePrice: number;
  totalExpenses: number;
  totalHpp: number;
  status: string;
}

interface VehicleExpensesManagerProps {
  vehicle: ExpenseVehicleSummary;
  initialExpenses?: ExpenseRecord[];
  initialLocked?: boolean;
  mode?: "modal" | "page";
  onExpensesChanged?: (newTotalExpenses: number, newExpenseCount: number) => void;
  onClose?: () => void;
}

function toDateInputValue(input?: string | Date | null): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

function formatDateTimeWib(input?: string | Date | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d)} WIB`;
}

type ExpenseCategoryValue = CreateExpenseInput["category"];

const QUICK_PICK_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.quickPick);
const OTHER_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => !c.quickPick);

export function VehicleExpensesManager({
  vehicle,
  initialExpenses,
  initialLocked = false,
  mode = "page",
  onExpensesChanged,
  onClose,
}: VehicleExpensesManagerProps) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses ?? []);
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [fetching, setFetching] = useState(initialExpenses === undefined);
  const [fetchError, setFetchError] = useState("");

  // Form states (Add / Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<ExpenseCategoryValue>("OIL_AND_SERVICE");
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [notes, setNotes] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [showProofUpload, setShowProofUpload] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [previewProof, setPreviewProof] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const onExpensesChangedRef = useRef(onExpensesChanged);

  useEffect(() => {
    onExpensesChangedRef.current = onExpensesChanged;
  }, [onExpensesChanged]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setCategory("OIL_AND_SERVICE");
    setVendorName("");
    setAmount("");
    setDate(toDateInputValue(new Date()));
    setNotes("");
    setProofUrls([]);
    setShowProofUpload(false);
    setErrorMsg("");
  }, []);

  const loadExpenses = useCallback(async () => {
    setFetching(true);
    setFetchError("");
    const res = await getExpensesByVehicleIdAction(vehicle.id);
    if (res.success && res.data) {
      setExpenses(res.data);
      setIsLocked(Boolean(res.isLocked));
      const sum = res.data.reduce((acc, item) => acc + Number(item.amount), 0);
      onExpensesChangedRef.current?.(sum, res.data.length);
    } else {
      setFetchError(res.error || "Gagal memuat daftar biaya unit.");
    }
    setFetching(false);
  }, [vehicle.id]);

  useEffect(() => {
    if (initialExpenses !== undefined) return;
    let cancelled = false;
    getExpensesByVehicleIdAction(vehicle.id).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setExpenses(res.data);
        setIsLocked(Boolean(res.isLocked));
        const sum = res.data.reduce((acc, item) => acc + Number(item.amount), 0);
        onExpensesChangedRef.current?.(sum, res.data.length);
      } else {
        setFetchError(res.error || "Gagal memuat daftar biaya unit.");
      }
      setFetching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialExpenses, vehicle.id]);

  // Escape to close proof preview, delete confirm, cancel edit, or close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewProof) {
          setPreviewProof(null);
        } else if (confirmDeleteId) {
          setConfirmDeleteId(null);
        } else if (editingId) {
          resetForm();
        } else if (mode === "modal" && onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewProof, confirmDeleteId, editingId, mode, onClose, resetForm]);

  const startEdit = (item: ExpenseRecord) => {
    setEditingId(item.id);
    setCategory(item.category as ExpenseCategoryValue);
    setVendorName(item.vendorName || "");
    setAmount(Number(item.amount));
    setDate(toDateInputValue(item.date));
    setNotes(item.notes || "");
    const parsedProofs = parseProofUrls(item.receiptUrl);
    setProofUrls(parsedProofs);
    setShowProofUpload(parsedProofs.length > 0);
    setConfirmDeleteId(null);
    setErrorMsg("");
    setSuccessMsg("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const syncExpensesState = (nextList: ExpenseRecord[]) => {
    const sorted = [...nextList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setExpenses(sorted);
    const totalExp = sorted.reduce((acc, item) => acc + Number(item.amount), 0);
    onExpensesChangedRef.current?.(totalExp, sorted.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal biaya harus lebih dari Rp 0.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const serializedProof =
      proofUrls.length > 0 ? JSON.stringify(proofUrls) : null;

    try {
      if (editingId) {
        const res = await updateExpenseAction({
          expenseId: editingId,
          category,
          vendorName: vendorName.trim() || null,
          amount: Number(amount),
          date: new Date(date),
          notes: notes.trim() || null,
          receiptUrl: serializedProof,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || "Gagal memperbarui biaya");
        }

        const updatedItem: ExpenseRecord = {
          ...res.data,
          amount: Number(res.data.amount),
        };

        syncExpensesState(
          expenses.map((item) => (item.id === editingId ? updatedItem : item))
        );
        resetForm();
        setSuccessMsg("Perubahan biaya berhasil disimpan & HPP diperbarui.");
      } else {
        const res = await createExpenseAction({
          vehicleId: vehicle.id,
          category,
          vendorName: vendorName.trim() || undefined,
          amount: Number(amount),
          date: new Date(date),
          notes: notes.trim() || undefined,
          receiptUrl: serializedProof || undefined,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || "Gagal mencatat biaya");
        }

        const createdItem: ExpenseRecord = {
          ...res.data,
          amount: Number(res.data.amount),
        };

        syncExpensesState([createdItem, ...expenses]);
        resetForm();
        setSuccessMsg("Biaya berhasil dicatat & HPP unit diperbarui.");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan biaya."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await deleteExpenseAction(expenseId);
      if (!res.success) {
        throw new Error(res.error || "Gagal menghapus biaya");
      }

      if (editingId === expenseId) {
        resetForm();
      }
      setConfirmDeleteId(null);
      syncExpensesState(expenses.filter((item) => item.id !== expenseId));
      setSuccessMsg("Item biaya dihapus & saldo kas serta HPP telah disesuaikan.");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus item biaya."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const currentTotalExpenses = fetching
    ? vehicle.totalExpenses
    : expenses.reduce((acc, item) => acc + Number(item.amount), 0);
  const currentTotalHpp = vehicle.purchasePrice + currentTotalExpenses;

  const editingItem = editingId
    ? expenses.find((item) => item.id === editingId)
    : null;
  const typedAmount = Number(amount) || 0;
  const simulatedTotalHpp = editingItem
    ? currentTotalHpp - Number(editingItem.amount) + typedAmount
    : currentTotalHpp + typedAmount;

  const isOtherCategorySelected = OTHER_CATEGORIES.some(
    (c) => c.value === category
  );

  return (
    <div
      className={cn(
        mode === "page" ? "p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6" : "space-y-5"
      )}
    >
      {/* Top Navigation (Page Mode Only) */}
      {mode === "page" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/inventory"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)] font-semibold text-xs transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
              <span>Kembali ke Inventori</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--ink)]">
                Kelola Biaya &amp; Servis Unit (HPP)
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Lihat riwayat biaya, edit nominal/nota yang salah, atau catat pengeluaran baru.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan Unit & HPP */}
      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl border border-[var(--line)] text-[var(--accent)] shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-base sm:text-lg text-[var(--ink)] tracking-tight truncate">
                {vehicle.brand} {vehicle.model}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-[var(--line)] font-bold text-[var(--ink)]">
                {vehicle.year}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-[var(--accent)] mt-0.5">
              {vehicle.plateNumber}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-5 border-t md:border-t-0 md:border-l border-[var(--line)] pt-3 md:pt-0 md:pl-5">
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">
              Harga Beli
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--ink)]">
              {formatRupiah(vehicle.purchasePrice)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">
              Total Biaya ({fetching ? "..." : `${expenses.length} item`})
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--accent)]">
              +{formatRupiah(currentTotalExpenses)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-bold">
              HPP Terkini
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[var(--ink)]">
              {formatRupiah(currentTotalHpp)}
            </span>
          </div>
        </div>
      </div>

      {/* Lock Notice */}
      {isLocked && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <div className="font-bold">Biaya Unit Terkunci (Sudah Bagi Hasil)</div>
            <p className="text-amber-800 mt-0.5">
              Unit ini sudah tercatat pada distribusi laba penjualan. Untuk menambah, mengubah, atau menghapus biaya, lakukan reversal distribusi terlebih dahulu di menu Keuangan.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-red-700 hover:opacity-75 p-1 cursor-pointer"
            aria-label="Tutup pesan error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-800 hover:opacity-75 p-1 cursor-pointer"
            aria-label="Tutup pesan sukses"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split Layout: Form Cepat (kiri) + Daftar Riwayat Biaya (kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI: FORM TAMBAH / EDIT BIAYA */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={cn(
            "lg:col-span-5 bg-white border rounded-2xl p-4 sm:p-5 space-y-4 transition-colors",
            editingId
              ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15"
              : "border-[var(--line)]"
          )}
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              {editingId ? (
                <Pencil className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <Plus className="w-4 h-4 text-[var(--accent)]" />
              )}
              <h2 className="text-sm font-bold text-[var(--ink)]">
                {editingId ? "Edit Biaya Terpilih" : "Catat Biaya Baru"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          {editingItem && (
            <div className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[11px] text-[var(--ink)]">
              Sedang mengedit:{" "}
              <span className="font-bold">
                {getExpenseCategoryShortLabel(editingItem.category)}
              </span>{" "}
              ({formatRupiah(editingItem.amount)})
            </div>
          )}

          {/* Quick-Pick Kategori */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--ink)]">
              Kategori Biaya *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PICK_CATEGORIES.map((opt) => {
                const active = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setCategory(opt.value)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                      active
                        ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                        : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--accent)]"
                    )}
                  >
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>

            <select
              disabled={isLocked}
              value={isOtherCategorySelected ? category : ""}
              onChange={(e) => {
                if (e.target.value) setCategory(e.target.value as ExpenseCategoryValue);
              }}
              aria-label="Pilih kategori biaya lainnya"
              className={cn(
                "w-full px-3 py-2 rounded-xl border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50",
                isOtherCategorySelected
                  ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                  : "bg-white text-[var(--muted)] border-[var(--line)]"
              )}
            >
              <option value="" disabled>
                Kategori lainnya (Admin Lelang, Makelar, Kelistrikan, Lain-lain)...
              </option>
              {OTHER_CATEGORIES.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white text-[var(--ink)]"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Nominal (Rp) *</span>
              </label>
              <input
                required
                disabled={isLocked}
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 350.000"
                value={amount !== "" && amount !== 0 ? formatThousands(amount) : ""}
                onChange={(e) => setAmount(parseThousands(e.target.value) || "")}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Tanggal *</span>
              </label>
              <input
                required
                disabled={isLocked}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Bengkel / Toko */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Bengkel / Toko / Penerima</span>
            </label>
            <input
              disabled={isLocked}
              type="text"
              placeholder="Contoh: Bengkel Jaya / Mas Budi (Opsional)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Rincian Pekerjaan</span>
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              placeholder="Contoh: Ganti oli mesin + filter oli, spet bumper depan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 resize-none disabled:opacity-50"
            />
          </div>

          {/* Lampiran Nota Opsional (Ringkas) */}
          <div className="pt-1">
            {showProofUpload || proofUrls.length > 0 ? (
              <div className="space-y-2 border-t border-[var(--line)] pt-3">
                <ProofUploadField
                  label="Foto Nota / Struk (Opsional)"
                  value={proofUrls}
                  onChange={setProofUrls}
                  uploadType="RECEIPT"
                  vehicleId={vehicle.id}
                />
                {proofUrls.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowProofUpload(false)}
                    className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                  >
                    Sembunyikan lampiran
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setShowProofUpload(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer disabled:opacity-50"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>+ Lampirkan Foto Nota / Struk (Opsional)</span>
              </button>
            )}
          </div>

          {/* Live Simulasi HPP */}
          {typedAmount > 0 && (
            <div className="px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs flex items-center justify-between gap-2">
              <span className="text-[var(--muted)] font-medium">
                {editingId ? "HPP setelah edit:" : "HPP setelah simpan:"}
              </span>
              <span className="font-extrabold text-[var(--ink)]">
                {formatRupiah(simulatedTotalHpp)}
              </span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-white text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || isLocked}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : editingId ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan Biaya &amp; Update HPP</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* KOLOM KANAN: DAFTAR RIWAYAT BIAYA */}
        <div className="lg:col-span-7 bg-white border border-[var(--line)] rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--line)] bg-[var(--bg)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--ink)]">
                Daftar Biaya Terinput
              </h2>
              {!fetching && (
                <span className="px-2 py-0.5 rounded-full bg-white border border-[var(--line)] text-[11px] font-bold text-[var(--ink)]">
                  {expenses.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={loadExpenses}
              disabled={fetching}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer disabled:opacity-50"
              title="Muat ulang daftar biaya"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", fetching && "animate-spin")} />
              <span className="hidden sm:inline">Muat ulang</span>
            </button>
          </div>

          {fetching ? (
            <div className="py-12 px-4 text-center text-xs text-[var(--muted)] flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              <span>Memuat rincian biaya unit...</span>
            </div>
          ) : fetchError ? (
            <div className="py-10 px-4 text-center space-y-3">
              <div className="text-xs font-semibold text-red-600">{fetchError}</div>
              <button
                type="button"
                onClick={loadExpenses}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg)] cursor-pointer"
              >
                Coba Muat Ulang
              </button>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-1.5">
              <div className="text-sm font-bold text-[var(--ink)]">
                Belum ada biaya servis atau tambahan
              </div>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                Pilih kategori cepat di formulir samping, masukkan nominal, lalu simpan. Semua riwayat biaya akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)] max-h-[540px] overflow-y-auto">
              {expenses.map((item) => {
                const proofs = parseProofUrls(item.receiptUrl);
                const isEditingThis = editingId === item.id;
                const isConfirmingDelete = confirmDeleteId === item.id;
                const isDeletingThis = deletingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 transition-colors",
                      isEditingThis ? "bg-amber-50/60" : "hover:bg-[var(--bg)]/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--line)] text-[11px] font-bold text-[var(--ink)]">
                            {getExpenseCategoryShortLabel(item.category)}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            {formatDate(item.date)}
                          </span>
                          {isEditingThis && (
                            <span className="text-[10px] font-bold text-[var(--accent)]">
                              Sedang diedit
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-[var(--ink)]">
                          {item.vendorName || "Bengkel / Vendor tidak diisi"}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-[var(--muted)] leading-relaxed">
                            {item.notes}
                          </p>
                        )}

                        {proofs.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {proofs.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setPreviewProof({
                                    url,
                                    title:
                                      proofs.length > 1
                                        ? `${getExpenseCategoryShortLabel(item.category)} • Nota #${idx + 1}`
                                        : `${getExpenseCategoryShortLabel(item.category)} • Bukti Nota`,
                                    subtitle: `${item.vendorName || "Biaya Unit"} • ${formatRupiah(item.amount)} • ${formatDate(item.date)}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[var(--line)] hover:border-[var(--accent)] text-[11px] font-semibold text-[var(--ink)] transition-colors cursor-pointer"
                              >
                                <Paperclip className="w-3 h-3 text-[var(--accent)]" />
                                <span>
                                  {proofs.length > 1 ? `Nota #${idx + 1}` : "Lihat Nota"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {item.createdAt && (
                          <p className="text-[11px] text-[var(--muted)] pt-0.5">
                            Diinput {formatDateTimeWib(item.createdAt)}
                            {item.createdBy ? ` • ${item.createdBy}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 space-y-2">
                        <div className="text-sm font-extrabold text-[var(--ink)]">
                          {formatRupiah(item.amount)}
                        </div>

                        {!isLocked && (
                          <div className="flex items-center justify-end gap-1.5">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                <span className="text-[11px] font-semibold text-red-700 mr-1">
                                  Hapus?
                                </span>
                                <button
                                  type="button"
                                  disabled={isDeletingThis}
                                  onClick={() => handleDelete(item.id)}
                                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {isDeletingThis ? "..." : "Ya"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeletingThis}
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-0.5 rounded bg-white border border-[var(--line)] text-[11px] font-semibold text-[var(--ink)] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[11px] font-semibold text-[var(--ink)] transition-colors cursor-pointer"
                                  title="Edit biaya ini"
                                >
                                  <Pencil className="w-3 h-3 text-[var(--accent)]" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--line)] bg-white hover:bg-red-50 hover:border-red-200 text-[11px] font-semibold text-[var(--muted)] hover:text-red-700 transition-colors cursor-pointer"
                                  title="Hapus biaya ini"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* In-App Receipt / Proof Popup Modal */}
      {previewProof && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewProof(null);
          }}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between gap-3 bg-[var(--bg)]/60 shrink-0">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[var(--ink)] truncate">
                  {previewProof.title}
                </h4>
                {previewProof.subtitle && (
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                    {previewProof.subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewProof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewProof(null);
                  }}
                  aria-label="Tutup lampiran"
                  className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[var(--ink)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-neutral-950/95 flex items-center justify-center p-4 min-h-[300px]">
              {isPdfUrl(previewProof.url) ? (
                <iframe
                  src={previewProof.url}
                  title={previewProof.title}
                  className="w-full h-[70vh] rounded-lg bg-white"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewProof.url}
                  alt={previewProof.title}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
