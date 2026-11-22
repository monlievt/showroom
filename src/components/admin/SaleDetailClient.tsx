"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  User,
  Printer,
  FileText,
  ClipboardCheck,
  Plus,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  MessageCircle,
  Save,
} from "lucide-react";
import { updateSaleAction, cancelSaleAction } from "@/app/actions/sale";
import {
  formatRupiah,
  formatDate,
  formatThousands,
  parseThousands,
  normalizePlateNumber,
  formatVehicleTitle,
  cn,
} from "@/lib/utils";
import { generateReceivableReminderLink } from "@/lib/utils/whatsapp";

interface SaleDetailProps {
  sale: {
    id: string;
    saleDate: string | Date;
    saleType: string;
    sellingPrice: number;
    dueDate?: string | Date | null;
    paidAmount: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    percentagePaid: number;
    hpp: number;
    grossProfit: number;
    profitDistributionStatus?: string;
    vehicle: {
      id: string;
      brand: string;
      model: string;
      year: number;
      plateNumber: string;
      color: string;
      status: string;
    };
    buyer: {
      id: string;
      name: string;
      phone?: string | null;
      isShowroom: boolean;
      address?: string | null;
    };
    payments: Array<{
      id: string;
      amount: number;
      paidAt: string | Date;
      method?: string | null;
      notes?: string | null;
    }>;
  };
}

function toDateInputValue(d?: string | Date | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SaleDetailClient({ sale }: SaleDetailProps) {
  const router = useRouter();
  const plate = normalizePlateNumber(sale.vehicle.plateNumber);
  const title = formatVehicleTitle(sale.vehicle.brand, sale.vehicle.model, sale.vehicle.year);
  const isDistributed = sale.profitDistributionStatus === "DISTRIBUTED";

  // State Edit
  const [sellingPrice, setSellingPrice] = useState<number>(sale.sellingPrice);
  const [saleDate, setSaleDate] = useState<string>(() => toDateInputValue(sale.saleDate));
  const [dueDate, setDueDate] = useState<string>(() => toDateInputValue(sale.dueDate));
  const [saleType, setSaleType] = useState<"SHOWROOM" | "DIRECT_CUSTOMER">(
    sale.saleType === "SHOWROOM" ? "SHOWROOM" : "DIRECT_CUSTOMER"
  );
  const [buyerName, setBuyerName] = useState(sale.buyer.name);
  const [buyerPhone, setBuyerPhone] = useState(sale.buyer.phone || "");
  const [buyerAddress, setBuyerAddress] = useState(sale.buyer.address || "");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // State Batalkan Penjualan
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelMode, setCancelMode] = useState<"VOID_MISTAKE" | "REFUND_CASH" | "FORFEIT_DP">(
    "VOID_MISTAKE"
  );
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await updateSaleAction({
      saleId: sale.id,
      sellingPrice,
      saleDate: new Date(`${saleDate}T12:00:00+07:00`),
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00+07:00`) : null,
      saleType,
      buyerName,
      buyerPhone: buyerPhone || null,
      buyerAddress: buyerAddress || null,
      buyerIsShowroom: saleType === "SHOWROOM",
    });

    setSaving(false);
    if (!res.success) {
      setFeedback({ type: "error", text: res.error || "Gagal menyimpan perubahan." });
      return;
    }

    setFeedback({ type: "success", text: "Perubahan transaksi berhasil disimpan." });
    router.refresh();
  };

  const handleCancelSale = async () => {
    setCancelling(true);
    setFeedback(null);
    const res = await cancelSaleAction(sale.id, {
      mode: cancelMode,
      reason: cancelReason.trim() || undefined,
    });
    setCancelling(false);

    if (!res.success) {
      setFeedback({ type: "error", text: res.error || "Gagal membatalkan penjualan." });
      setShowCancelModal(false);
      return;
    }

    router.push("/admin/sales");
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          href="/admin/sales"
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-[var(--line)] text-xs font-semibold text-[var(--ink)]"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
          <span>Kembali ke Penjualan</span>
        </Link>

        {!sale.isFullyPaid && (
          <Link
            href={`/admin/sales/${sale.id}/payment`}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Terima Bayar / Lunasi</span>
          </Link>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-start gap-2",
            feedback.type === "success"
              ? "bg-[var(--ok-light)] border-[var(--ok)]/30 text-[var(--ok)]"
              : "bg-[var(--bad-light)] border-[var(--bad)]/30 text-[var(--bad)]"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Ringkasan Unit & Status Pembayaran */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-base text-[var(--ink)]">{plate}</div>
              <div className="text-xs text-[var(--muted)] truncate">{title}</div>
            </div>
          </div>

          <span
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0",
              sale.isFullyPaid
                ? "bg-[var(--ok-light)] text-[var(--ok)]"
                : "bg-[var(--warn-light)] text-amber-800"
            )}
          >
            {sale.isFullyPaid ? "Lunas 100%" : "Belum Lunas"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
            <div className="text-[11px] text-[var(--muted)]">Harga Jual</div>
            <div className="font-bold text-[var(--ink)] mt-0.5">
              {formatRupiah(sale.sellingPrice)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
            <div className="text-[11px] text-[var(--muted)]">Sudah Masuk</div>
            <div className="font-bold text-[var(--ok)] mt-0.5">
              {formatRupiah(sale.paidAmount)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
            <div className="text-[11px] text-[var(--muted)]">Sisa Tagihan</div>
            <div className="font-bold text-[var(--bad)] mt-0.5">
              {formatRupiah(sale.remainingAmount)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
            <div className="text-[11px] text-[var(--muted)]">Laba Kotor</div>
            <div className="font-bold text-[var(--ink)] mt-0.5">
              {formatRupiah(sale.grossProfit)}
            </div>
          </div>
        </div>

        {/* Cetak Dokumen & WA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <a
            href={`/api/pdf/invoice/${sale.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-bold text-[var(--ink)]"
          >
            <Printer className="w-4 h-4 text-[var(--accent)]" />
            <span>Kuitansi</span>
          </a>
          <a
            href={`/api/pdf/agreement/${sale.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-bold text-[var(--ink)]"
          >
            <FileText className="w-4 h-4 text-[var(--accent)]" />
            <span>SPK / Akad</span>
          </a>
          <a
            href={`/api/pdf/bast/${sale.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-bold text-[var(--ink)]"
          >
            <ClipboardCheck className="w-4 h-4 text-[var(--accent)]" />
            <span>BAST</span>
          </a>
          {!sale.isFullyPaid && sale.buyer.phone ? (
            <a
              href={generateReceivableReminderLink(sale.buyer.phone, {
                buyerName: sale.buyer.name,
                brand: sale.vehicle.brand,
                model: sale.vehicle.model,
                plateNumber: plate,
                remainingAmount: sale.remainingAmount,
                dueDate: sale.dueDate ? formatDate(sale.dueDate) : null,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--ok-light)] border border-[var(--ok)]/30 text-xs font-bold text-[var(--ok)]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tagih WA</span>
            </a>
          ) : (
            <Link
              href={`/admin/inventory/${sale.vehicle.id}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-bold text-[var(--ink)]"
            >
              <span>Detail Unit</span>
            </Link>
          )}
        </div>
      </section>

      {/* Riwayat Pembayaran */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            Riwayat Pembayaran ({sale.payments.length})
          </h2>
          {!sale.isFullyPaid && (
            <Link
              href={`/admin/sales/${sale.id}/payment`}
              className="text-xs font-bold text-[var(--accent)] hover:underline"
            >
              + Tambah Pembayaran
            </Link>
          )}
        </div>

        {sale.payments.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">Belum ada pembayaran masuk.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {sale.payments.map((p, i) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-[var(--ink)]">
                    #{i + 1} • {formatRupiah(p.amount)}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    {formatDate(p.paidAt)} • {p.method || "TRANSFER"}
                    {p.notes ? ` • ${p.notes}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form Edit Transaksi */}
      <form
        onSubmit={handleSaveEdit}
        className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-sm font-bold text-[var(--ink)]">Edit Data Penjualan</h2>
        </div>

        {isDistributed && (
          <div className="p-3 rounded-xl bg-[var(--warn-light)] border border-[var(--warn)]/40 text-xs text-amber-900">
            Transaksi ini sudah selesai bagi hasil investor sehingga tidak bisa diedit.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Harga Jual (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              disabled={isDistributed}
              value={sellingPrice > 0 ? formatThousands(sellingPrice) : ""}
              onChange={(e) => setSellingPrice(parseThousands(e.target.value))}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-bold text-[var(--ink)] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Jalur Pembeli
            </label>
            <select
              disabled={isDistributed}
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)] disabled:opacity-60"
            >
              <option value="SHOWROOM">Showroom / Rekanan</option>
              <option value="DIRECT_CUSTOMER">Pembeli Langsung</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Tanggal Jual
            </label>
            <input
              type="date"
              disabled={isDistributed}
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Jatuh Tempo (Jika Tempo)
            </label>
            <input
              type="date"
              disabled={isDistributed}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Nama Pembeli / Showroom
            </label>
            <input
              type="text"
              disabled={isDistributed}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              disabled={isDistributed}
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)] disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
            Alamat / Kota
          </label>
          <input
            type="text"
            disabled={isDistributed}
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)] disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
          {!isDistributed && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[46px] rounded-xl border border-[var(--bad)]/30 bg-[var(--bad-light)] text-[var(--bad)] text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Batalkan Penjualan</span>
            </button>
          )}

          <button
            type="submit"
            disabled={saving || isDistributed}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[46px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold disabled:opacity-50 cursor-pointer sm:ml-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal Konfirmasi Pembatalan Penjualan */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          onClick={() => !cancelling && setShowCancelModal(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-extrabold text-[var(--ink)]">
                Batalkan Penjualan {plate}?
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                Unit akan kembali ke status <strong>Siap Jual</strong>. Pilih perlakuan uang yang sudah masuk ({formatRupiah(sale.paidAmount)}):
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  id: "VOID_MISTAKE" as const,
                  title: "Salah Input / Koreksi",
                  desc: "Saldo kas dikembalikan seperti semula (mencatat jurnal koreksi).",
                },
                {
                  id: "REFUND_CASH" as const,
                  title: "Pembeli Batal & Uang Dikembalikan",
                  desc: "Catat pengeluaran kas pengembalian DP ke pembeli.",
                },
                {
                  id: "FORFEIT_DP" as const,
                  title: "Pembeli Batal & DP Hangus",
                  desc: "Uang DP yang sudah masuk tetap berada di kas showroom.",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer",
                    cancelMode === opt.id
                      ? "border-[var(--accent)] bg-[var(--bg)]"
                      : "border-[var(--line)] bg-white"
                  )}
                >
                  <input
                    type="radio"
                    name="cancelMode"
                    checked={cancelMode === opt.id}
                    onChange={() => setCancelMode(opt.id)}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <div>
                    <div className="font-bold text-[var(--ink)]">{opt.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Alasan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Pembeli ganti unit lain"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 min-h-[44px] rounded-xl border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSale}
                className="py-2.5 min-h-[44px] rounded-xl bg-[var(--bad)] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Ya, Batalkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
