"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { recordOwnerDraw } from "@/app/actions/operational-expense";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

export function OwnerDrawNewClient() {
  const router = useRouter();

  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal prive harus lebih dari Rp 0");
      return;
    }
    if (!notes.trim()) {
      setErrorMsg("Keterangan kebutuhan pribadi wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await recordOwnerDraw({
        amount: Number(amount),
        date: new Date(date),
        notes: notes.trim(),
        proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat prive owner");
      }

      setSuccessMsg("Pengambilan prive pribadi berhasil dicatat! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/finance/expenses");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat prive");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/finance/expenses"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
            <span>Kembali ke Beban &amp; Prive</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)]">
              Catat Prive (Kebutuhan Pribadi Owner)
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Penarikan uang dari rekening BCA showroom untuk kebutuhan dapur/keluarga.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-xs text-xs text-[var(--muted)] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-[var(--ink)]">Prinsip Rekening Campur BCA:</strong>
          <span>
            Uang kas rekening bank akan berkurang secara riil, namun <strong>TIDAK dimasukkan ke biaya unit mobil</strong>. Dengan demikian, laba kotor mobil dan bagian bagi hasil investor tidak akan berkurang secara sepihak.
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-[var(--ok)]" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <ShoppingBag className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
              Form Penarikan Prive
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Nominal Penarikan Pribadi (Rp) *</span>
              </label>
              <input
                required
                type="number"
                min={1}
                placeholder="Contoh: 2000000"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Tanggal Penarikan / Transfer *</span>
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Keterangan Kebutuhan Keluarga / Pribadi *</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Belanja bulanan dapur, bayar SPP anak sekolah, keperluan darurat keluarga..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 resize-none"
            />
          </div>

          {/* Proof Upload */}
          <ProofUploadField
            label="Lampiran Bukti Transfer / Screenshot Penarikan (Opsional)"
            value={proofUrls}
            onChange={setProofUrls}
            uploadType="TRANSFER_PROOF"
            referenceId="owner-draw"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-4">
          <Link
            href="/admin/finance/expenses"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--line)] bg-white text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors shadow-xs"
          >
            Batal &amp; Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Prive...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Penarikan Prive</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
