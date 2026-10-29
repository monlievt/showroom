"use client";

import React, { useState } from "react";
import {
  Gavel,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Save,
  X,
} from "lucide-react";
import {
  AuctionHouseItem,
  saveAuctionHouseAction,
  deleteAuctionHouseAction,
  resetAuctionHousesAction,
} from "@/app/actions/auction-house";
import { cn } from "@/lib/utils";

interface AuctionHousesSettingsClientProps {
  initialAuctionHouses: AuctionHouseItem[];
}

export function AuctionHousesSettingsClient({
  initialAuctionHouses,
}: AuctionHousesSettingsClientProps) {
  const [items, setItems] = useState<AuctionHouseItem[]>(initialAuctionHouses);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  // Form modal/card state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bpkbLeadDays, setBpkbLeadDays] = useState(14);
  const [notes, setNotes] = useState("");

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setBpkbLeadDays(14);
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AuctionHouseItem) => {
    setEditingId(item.id);
    setName(item.name);
    setBpkbLeadDays(item.bpkbLeadDays);
    setNotes(item.notes || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName("");
    setBpkbLeadDays(14);
    setNotes("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await saveAuctionHouseAction({
      id: editingId || undefined,
      name: name.trim(),
      bpkbLeadDays: Number(bpkbLeadDays) || 14,
      notes: notes.trim() || undefined,
    });
    setLoading(false);

    if (res.success && res.data) {
      setItems(res.data);
      handleCloseModal();
      showNotification(
        editingId ? "Balai lelang berhasil diperbarui!" : "Balai lelang baru berhasil ditambahkan!",
        "success"
      );
    } else {
      showNotification(res.error || "Gagal menyimpan balai lelang", "error");
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Hapus balai lelang "${itemName}" dari daftar?`)) return;

    setLoading(true);
    const res = await deleteAuctionHouseAction(id);
    setLoading(false);

    if (res.success && res.data) {
      setItems(res.data);
      showNotification(`Balai lelang "${itemName}" berhasil dihapus.`, "success");
    } else {
      showNotification(res.error || "Gagal menghapus balai lelang", "error");
    }
  };

  const handleReset = async () => {
    if (!confirm("Kembalikan daftar balai lelang ke bawaan standar (JBA, AUKSI, IBID, dll)?"))
      return;

    setLoading(true);
    const res = await resetAuctionHousesAction();
    setLoading(false);

    if (res.success && res.data) {
      setItems(res.data);
      showNotification("Daftar balai lelang berhasil direset ke standar.", "success");
    } else {
      showNotification(res.error || "Gagal mereset balai lelang", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all",
            feedback.type === "success"
              ? "bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]"
              : "bg-red-50 border border-red-200 text-red-700"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info & Actions */}
      <div className="bg-white border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--ink)]">
              Master Data Balai Lelang &amp; Estimasi BPKB
            </h2>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Atur nama resmi balai lelang dan estimasi hari kerja tiba BPKB. Data ini otomatis menjadi pilihan di formulir pengadaan unit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--muted)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Kembalikan ke daftar default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>
          <button
            onClick={handleOpenAdd}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Balai Lelang</span>
          </button>
        </div>
      </div>

      {/* Grid of Balai Lelang Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[var(--muted)]/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[var(--ink)] tracking-tight">
                  {item.name}
                </span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--accent)]" />
                  {item.bpkbLeadDays} Hari Kerja
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                {item.notes || `Estimasi BPKB tiba rata-rata ~${item.bpkbLeadDays} hari kerja.`}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(item.id, item.name)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {editingId ? "Edit Balai Lelang" : "Tambah Balai Lelang Baru"}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-[var(--muted)] hover:text-[var(--ink)] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Nama Resmi Balai Lelang *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: AUKSI, JBA, IBID, Caready, Legoas..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                />
                <span className="text-[10px] text-[var(--muted)] mt-1 block">
                  Cukup tulis nama resmi tanpa tambahan keterangan panjang
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Standar Estimasi BPKB Tiba (Hari Kerja) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="number"
                    min={1}
                    max={90}
                    value={bpkbLeadDays}
                    onChange={(e) => setBpkbLeadDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                  />
                  <span className="text-xs text-[var(--muted)] font-semibold whitespace-nowrap">
                    Hari Kerja
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Catatan / Lokasi Cabang (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Cabang Surabaya / Estimasi BPKB cepat 7 hari"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                />
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--bg)] border border-[var(--line)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? "Menyimpan..." : "Simpan Balai Lelang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
