"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Car,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  Eye,
  FileText,
  Gauge,
  MessageCircle,
  Pencil,
  Printer,
  Receipt,
  ShieldCheck,
  Tag,
  Users,
  Wrench,
  X,
  ArrowRight,
  Calendar,
  MapPin,
} from "lucide-react";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import { generateVehicleSlug } from "@/lib/utils/slug";
import { generateCatalogWhatsAppLink } from "@/lib/utils/whatsapp";
import {
  VehicleExpensesManager,
  type ExpenseRecord,
} from "@/components/admin/VehicleExpensesManager";

interface VehiclePhotoItem {
  id: string;
  fileUrl: string;
  category: string;
  tag?: string | null;
  title?: string | null;
  uploadedAt: string | Date;
}

interface VehicleDocumentItem {
  id: string;
  type: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string | Date;
}

interface VehicleInspectionItem {
  id: string;
  version: number;
  isCurrent: boolean;
  stage: string;
  totalGrade?: string | null;
  engineGrade: string;
  interiorGrade: string;
  exteriorGrade: string;
  frameGrade: string;
  accidentHistory: boolean;
  floodHistory: boolean;
  inspectedAt: string | Date;
  inspectedBy: string;
}

interface VehicleInvestmentItem {
  id: string;
  investorId: string;
  investorName: string;
  investorType?: string;
  capitalShare: number;
  profitSharePercent: number;
}

interface VehicleSaleInfo {
  id: string;
  saleDate: string | Date;
  saleType: string;
  sellingPrice: number;
  dueDate?: string | Date | null;
  buyer?: {
    name: string;
    phone?: string | null;
    isShowroom?: boolean;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string | Date;
    method?: string | null;
    notes?: string | null;
  }>;
}

export interface VehicleDetailAdminData {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  odometer: number;
  transmission: string;
  engineCapacity: number;
  fuelType?: string | null;
  driveType?: string | null;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  sourceType: string;
  auctionHouse?: string | null;
  auctionLotType?: string | null;
  purchasePrice: number;
  purchaseDate: string | Date;
  targetSellingPrice?: number | null;
  minSellingPrice?: number | null;
  status: string;
  currentLocation: string;
  stnkStatus: string;
  bpkbStatus: string;
  bpkbLeadDays: number;
  taxExpiryDate?: string | Date | null;
  platExpiryDate?: string | Date | null;
  taxNominal?: number | null;
  notes?: string | null;
  totalExpenses: number;
  totalHpp: number;
  daysInInventory: number;
  agingCategory: string;
  isExpensesLocked?: boolean;
  expenses: ExpenseRecord[];
  photos: VehiclePhotoItem[];
  documents: VehicleDocumentItem[];
  inspections: VehicleInspectionItem[];
  investments: VehicleInvestmentItem[];
  sale?: VehicleSaleInfo | null;
}

const STATUS_LABELS: Record<string, string> = {
  INTAKE: "Intake Baru",
  IN_REPAIR: "Pengerjaan / Bengkel",
  READY_FOR_SALE: "Ready Jual",
  BOOKED: "Booked (DP Masuk)",
  AT_SHOWROOM_PENDING: "Titip Showroom",
  SOLD_SETTLED: "Terjual Lunas",
};

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  CONDITION_INTAKE: "Saat Intake",
  CONDITION_BEFORE_REPAIR: "Sebelum Perbaikan",
  CONDITION_AFTER_REPAIR: "Setelah Perbaikan",
  FINAL_LISTING: "Siap Tayang Katalog",
  DOCUMENT_PROOF: "Bukti / Nota",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  STNK_SCAN: "Scan STNK",
  BPKB_SCAN: "Scan BPKB",
  FAKTUR: "Faktur Pembelian",
  KUITANSI: "Kuitansi / Pelunasan",
  KTP_PEMILIK: "KTP Pemilik / Pembeli",
  FORM_A: "Formulir A",
  KEUR: "Uji KIR",
  OTHER: "Dokumen / BAST Lainnya",
};

const BPKB_STATUS_LABELS: Record<string, string> = {
  READY: "BPKB di Tangan",
  PROCESS_1_2_WEEKS: "Proses Balai Lelang",
  MUTATION_REQUIRED: "Perlu Mutasi",
  LOST_NEED_REPLACEMENT: "Hilang / Penggantian",
};

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

export function VehicleDetailAdminClient({
  vehicle,
  whatsappPhone = "081234567890",
}: {
  vehicle: VehicleDetailAdminData;
  whatsappPhone?: string;
}) {
  const [activeTab, setActiveTab] = useState<"media" | "expenses" | "overview">("media");
  const [totalExpenses, setTotalExpenses] = useState(vehicle.totalExpenses);
  const [expenseCount, setExpenseCount] = useState(vehicle.expenses.length);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lightbox && !actionsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) setLightbox(null);
        else if (actionsOpen) setActionsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsOpen &&
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(e.target as Node)
      ) {
        setActionsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [lightbox, actionsOpen]);

  const currentTotalHpp = vehicle.purchasePrice + totalExpenses;
  const estGrossProfit =
    vehicle.targetSellingPrice != null
      ? vehicle.targetSellingPrice - currentTotalHpp
      : null;

  const unitPhotos = vehicle.photos.filter((p) => p.tag !== "RECEIPT_EXPENSE");
  const receiptPhotos = vehicle.photos.filter((p) => p.tag === "RECEIPT_EXPENSE");
  const currentInspection =
    vehicle.inspections.find((i) => i.isCurrent) ||
    vehicle.inspections[vehicle.inspections.length - 1] ||
    null;

  const catalogSlug = generateVehicleSlug({
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    plateNumber: vehicle.plateNumber,
  });

  const totalSalePaid = vehicle.sale
    ? vehicle.sale.payments.reduce((acc, p) => acc + p.amount, 0)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--line)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
            <span>Kembali</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] tracking-tight">
                {vehicle.plateNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]">
                {STATUS_LABELS[vehicle.status] || vehicle.status}
              </span>
              <span className="text-xs font-semibold text-[var(--muted)]">
                {vehicle.daysInInventory} hari di garasi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
              {vehicle.brand} {vehicle.model} ({vehicle.year}) • {vehicle.color} •{" "}
              {vehicle.transmission} • {vehicle.odometer.toLocaleString("id-ID")} km
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={generateCatalogWhatsAppLink(whatsappPhone, {
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              plateNumber: vehicle.plateNumber,
              targetSellingPrice: vehicle.targetSellingPrice,
              status: vehicle.status,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--line)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Share WA</span>
          </a>

          <Link
            href={`/admin/inventory/${vehicle.id}/status`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--line)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Ubah Status</span>
          </Link>

          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setActionsOpen((prev) => !prev)}
              aria-expanded={actionsOpen}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--line)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Cetak &amp; Lainnya</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-[var(--muted)] transition-transform",
                  actionsOpen && "rotate-180"
                )}
              />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[var(--line)] rounded-xl shadow-xl py-1.5 text-xs z-40 divide-y divide-[var(--bg)]">
                <div className="py-1">
                  <Link
                    href={`/admin/inventory/${vehicle.id}/media`}
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold"
                  >
                    <Camera className="w-4 h-4 text-[var(--accent)]" />
                    <span>Upload Foto &amp; Dokumen</span>
                  </Link>
                  <Link
                    href={`/admin/inspections/${vehicle.id}`}
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold"
                  >
                    <ClipboardCheck className="w-4 h-4 text-[var(--accent)]" />
                    <span>Cek Fisik &amp; Inspeksi</span>
                  </Link>
                </div>

                <div className="py-1">
                  <a
                    href={`/api/pdf/workshop-dispatch/${vehicle.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold"
                  >
                    <Wrench className="w-4 h-4 text-[var(--accent)]" />
                    <span>Surat Jalan Bengkel (SPK)</span>
                  </a>
                  <a
                    href={`/api/pdf/spec-tag/${vehicle.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold"
                  >
                    <Tag className="w-4 h-4 text-[#7C3AED]" />
                    <span>Cetak Tag Spion (QR)</span>
                  </a>
                </div>

                <div className="py-1">
                  <Link
                    href={`/katalog/${catalogSlug}`}
                    target="_blank"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--accent)] hover:bg-[var(--bg)] font-semibold"
                  >
                    <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
                    <span>
                      {vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR"
                        ? "Lihat Tampilan Segera Hadir"
                        : "Lihat di Katalog Publik"}
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href={`/admin/inventory/${vehicle.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Data Unit</span>
          </Link>
        </div>
      </div>

      {/* Ringkasan Angka Modal & Harga */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[var(--line)] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase">
            Harga Beli
          </div>
          <div className="text-base sm:text-lg font-extrabold text-[var(--ink)] mt-1">
            {formatRupiah(vehicle.purchasePrice)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            Masuk: {formatDate(vehicle.purchaseDate)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className="bg-white border border-[var(--line)] hover:border-[var(--accent)] rounded-xl p-4 text-left transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase">
            Biaya Servis ({expenseCount} item)
          </div>
          <div className="text-base sm:text-lg font-extrabold text-[var(--accent)] mt-1">
            +{formatRupiah(totalExpenses)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            Klik untuk lihat / edit biaya
          </div>
        </button>

        <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase">
            Total HPP Saat Ini
          </div>
          <div className="text-base sm:text-lg font-extrabold text-[var(--ink)] mt-1">
            {formatRupiah(currentTotalHpp)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            Modal Beli + Total Biaya
          </div>
        </div>

        <div className="bg-white border border-[var(--line)] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase">
            Target / Batas Bawah
          </div>
          <div className="text-base sm:text-lg font-extrabold text-[var(--ink)] mt-1">
            {vehicle.targetSellingPrice
              ? formatRupiah(vehicle.targetSellingPrice)
              : "Belum diisi"}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            Bawah:{" "}
            {vehicle.minSellingPrice
              ? formatRupiah(vehicle.minSellingPrice)
              : "-"}
          </div>
        </div>

        <div className="bg-white border border-[var(--line)] rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase">
            Estimasi Margin Kotor
          </div>
          <div
            className={cn(
              "text-base sm:text-lg font-extrabold mt-1",
              estGrossProfit == null
                ? "text-[var(--muted)]"
                : estGrossProfit >= 0
                ? "text-emerald-700"
                : "text-red-700"
            )}
          >
            {estGrossProfit != null ? formatRupiah(estGrossProfit) : "-"}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            Target Jual - Total HPP
          </div>
        </div>
      </div>

      {/* Tabs Navigasi Detail Unit */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap -mb-px cursor-pointer",
            activeTab === "media"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Camera className="w-4 h-4" />
          <span>
            Foto &amp; Dokumen ({vehicle.photos.length + vehicle.documents.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap -mb-px cursor-pointer",
            activeTab === "expenses"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>Biaya &amp; Servis ({expenseCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap -mb-px cursor-pointer",
            activeTab === "overview"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Car className="w-4 h-4" />
          <span>Spesifikasi, Inspeksi &amp; Pemodal</span>
        </button>
      </div>

      {/* TAB 1: FOTO & DOKUMEN */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Galeri Foto Unit */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--accent)]" />
                  <span>Galeri Foto Fisik &amp; Katalog ({unitPhotos.length})</span>
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Klik foto untuk memperbesar pratinjau.
                </p>
              </div>
              <Link
                href={`/admin/inventory/${vehicle.id}/media`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-colors self-start"
              >
                <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Kelola &amp; Upload Foto</span>
              </Link>
            </div>

            {unitPhotos.length === 0 ? (
              <div className="py-10 text-center space-y-2 bg-[var(--bg)] rounded-xl border border-dashed border-[var(--line)]">
                <p className="text-xs font-semibold text-[var(--ink)]">
                  Belum ada foto fisik unit yang diunggah.
                </p>
                <Link
                  href={`/admin/inventory/${vehicle.id}/media`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold"
                >
                  Upload Foto Sekarang
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {unitPhotos.map((photo) => {
                  const label =
                    photo.title ||
                    photo.tag ||
                    PHOTO_CATEGORY_LABELS[photo.category] ||
                    photo.category;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightbox({ url: photo.fileUrl, title: label })}
                      className="group bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl overflow-hidden text-left transition-all cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.fileUrl}
                          alt={label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="text-[11px] font-bold text-[var(--ink)] truncate">
                          {label}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] truncate">
                          {PHOTO_CATEGORY_LABELS[photo.category] || photo.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Arsip Foto Nota Biaya (Jika ada) */}
          {receiptPhotos.length > 0 && (
            <div className="bg-white border border-[var(--line)] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[var(--accent)]" />
                    <span>Arsip Foto Nota &amp; Struk Biaya ({receiptPhotos.length})</span>
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Terarsip otomatis dari input biaya servis/tambahan (tidak tampil di katalog publik).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {receiptPhotos.map((photo) => {
                  const label = photo.title || "Bukti Nota Biaya";
                  return isPdfUrl(photo.fileUrl) ? (
                    <a
                      key={photo.id}
                      href={photo.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl p-3 flex flex-col justify-between gap-2"
                    >
                      <FileText className="w-6 h-6 text-[var(--accent)]" />
                      <div className="text-[11px] font-bold text-[var(--ink)] line-clamp-2">
                        {label}
                      </div>
                    </a>
                  ) : (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightbox({ url: photo.fileUrl, title: label })}
                      className="group bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl overflow-hidden text-left transition-all cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.fileUrl}
                          alt={label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-2">
                        <div className="text-[11px] font-bold text-[var(--ink)] line-clamp-2">
                          {label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dokumen Legalitas (STNK, BPKB, Faktur, dll) */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  <span>Dokumen Legalitas &amp; Pajak ({vehicle.documents.length})</span>
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  STNK: <strong>{vehicle.stnkStatus}</strong> • BPKB:{" "}
                  <strong>{BPKB_STATUS_LABELS[vehicle.bpkbStatus] || vehicle.bpkbStatus}</strong>
                  {vehicle.taxExpiryDate && (
                    <> • Pajak s/d <strong>{formatDate(vehicle.taxExpiryDate)}</strong></>
                  )}
                </p>
              </div>
              <Link
                href={`/admin/inventory/${vehicle.id}/media`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-colors self-start"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Upload Scan Dokumen</span>
              </Link>
            </div>

            {vehicle.documents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted)] bg-[var(--bg)] rounded-xl border border-dashed border-[var(--line)]">
                Belum ada scan STNK, BPKB, faktur, atau dokumen serah terima yang diunggah.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vehicle.documents.map((doc) => {
                  const docTitle = DOC_TYPE_LABELS[doc.type] || doc.type;
                  const pdf = isPdfUrl(doc.fileUrl);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-white border border-[var(--line)] flex items-center justify-center overflow-hidden shrink-0">
                          {pdf ? (
                            <FileText className="w-5 h-5 text-[var(--accent)]" />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={doc.fileUrl}
                              alt={docTitle}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--ink)] truncate">
                            {docTitle}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] truncate">
                            {doc.uploadedBy} • {formatDate(doc.uploadedAt)}
                          </div>
                        </div>
                      </div>

                      {pdf ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[var(--line)] hover:border-[var(--accent)] text-[11px] font-bold text-[var(--ink)] shrink-0"
                        >
                          Buka PDF
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLightbox({ url: doc.fileUrl, title: docTitle })}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[var(--line)] hover:border-[var(--accent)] text-[11px] font-bold text-[var(--ink)] shrink-0 cursor-pointer"
                        >
                          Lihat
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BIAYA & SERVIS */}
      {activeTab === "expenses" && (
        <VehicleExpensesManager
          vehicle={{
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            purchasePrice: vehicle.purchasePrice,
            totalExpenses,
            totalHpp: currentTotalHpp,
            status: vehicle.status,
          }}
          initialExpenses={vehicle.expenses}
          initialLocked={Boolean(vehicle.isExpensesLocked)}
          mode="modal"
          onExpensesChanged={(nextTotal, nextCount) => {
            setTotalExpenses(nextTotal);
            setExpenseCount(nextCount);
          }}
        />
      )}

      {/* TAB 3: SPESIFIKASI, INSPEKSI & INVESTOR */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Spesifikasi Lengkap */}
          <div className="lg:col-span-7 bg-white border border-[var(--line)] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[var(--accent)]" />
                <span>Spesifikasi &amp; Data Perolehan Unit</span>
              </h2>
              <Link
                href={`/admin/inventory/${vehicle.id}/edit`}
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Edit Spesifikasi
              </Link>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-[var(--muted)]">Merk / Model</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.brand} {vehicle.model}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Tahun / Warna</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.year} • {vehicle.color}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Transmisi / CC</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.transmission} • {vehicle.engineCapacity} cc
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Odometer</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.odometer.toLocaleString("id-ID")} km
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Bahan Bakar / Penggerak</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.fuelType || "BENSIN"} • {vehicle.driveType || "4x2"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Lokasi Fisik</span>
                </dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.currentLocation}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Sumber Perolehan</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.sourceType}
                  {vehicle.auctionHouse ? ` (${vehicle.auctionHouse})` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Pajak Tahunan</span>
                </dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.taxExpiryDate ? formatDate(vehicle.taxExpiryDate) : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Plat 5 Tahunan</dt>
                <dd className="font-bold text-[var(--ink)] mt-0.5">
                  {vehicle.platExpiryDate ? formatDate(vehicle.platExpiryDate) : "-"}
                </dd>
              </div>
              {vehicle.chassisNumber && (
                <div>
                  <dt className="text-[var(--muted)]">Nomor Rangka</dt>
                  <dd className="font-mono font-bold text-[var(--ink)] mt-0.5">
                    {vehicle.chassisNumber}
                  </dd>
                </div>
              )}
              {vehicle.engineNumber && (
                <div>
                  <dt className="text-[var(--muted)]">Nomor Mesin</dt>
                  <dd className="font-mono font-bold text-[var(--ink)] mt-0.5">
                    {vehicle.engineNumber}
                  </dd>
                </div>
              )}
            </dl>

            {vehicle.notes && (
              <div className="pt-3 border-t border-[var(--line)]">
                <div className="text-xs font-semibold text-[var(--muted)] mb-1">
                  Catatan Kondisi Unit
                </div>
                <pre className="text-xs text-[var(--ink)] whitespace-pre-wrap font-sans bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3">
                  {vehicle.notes}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-[var(--line)] flex flex-wrap gap-2">
              <a
                href={`/api/pdf/workshop-dispatch/${vehicle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)]"
              >
                <Wrench className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Cetak Surat Jalan Bengkel (SPK)</span>
              </a>
              <a
                href={`/api/pdf/spec-tag/${vehicle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)]"
              >
                <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Cetak Tag Spion QR</span>
              </a>
            </div>
          </div>

          {/* Kolom Kanan: Inspeksi, Investor, Penjualan */}
          <div className="lg:col-span-5 space-y-5">
            {/* Inspeksi */}
            <div className="bg-white border border-[var(--line)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                  <span>Cek Fisik &amp; Inspeksi</span>
                </h2>
                <Link
                  href={`/admin/inspections/${vehicle.id}`}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Buka Lembar Inspeksi
                </Link>
              </div>

              {currentInspection ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ["Mesin", currentInspection.engineGrade],
                      ["Interior", currentInspection.interiorGrade],
                      ["Eksterior", currentInspection.exteriorGrade],
                      ["Rangka", currentInspection.frameGrade],
                    ].map(([label, grade]) => (
                      <div
                        key={label}
                        className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--line)]"
                      >
                        <div className="text-[10px] text-[var(--muted)]">{label}</div>
                        <div className="text-base font-extrabold text-[var(--ink)] mt-0.5">
                          {grade}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Inspeksi v{currentInspection.version} ({currentInspection.stage}) •{" "}
                    {currentInspection.inspectedBy} •{" "}
                    {formatDate(currentInspection.inspectedAt)}
                  </div>
                  <a
                    href={`/api/pdf/inspection/${currentInspection.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)]"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Unduh Sertifikat Inspeksi PDF</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Belum ada data inspeksi panel untuk unit ini.
                </p>
              )}
            </div>

            {/* Investor */}
            <div className="bg-white border border-[var(--line)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--accent)]" />
                  <span>Alokasi Modal Pemodal ({vehicle.investments.length})</span>
                </h2>
                <Link
                  href={`/admin/inventory/${vehicle.id}/edit`}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Atur Pemodal
                </Link>
              </div>

              {vehicle.investments.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  100% modal internal showroom (belum ada alokasi investor eksternal).
                </p>
              ) : (
                <div className="space-y-2">
                  {vehicle.investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs"
                    >
                      <div>
                        <div className="font-bold text-[var(--ink)]">
                          {inv.investorName}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          Porsi Laba: {inv.profitSharePercent}%
                        </div>
                      </div>
                      <div className="font-extrabold text-[var(--ink)]">
                        {formatRupiah(inv.capitalShare)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Penjualan (Jika sudah ada) */}
            {vehicle.sale && (
              <div className="bg-white border border-[var(--line)] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <h2 className="text-sm font-bold text-[var(--ink)]">
                    Ringkasan Penjualan
                  </h2>
                  <Link
                    href="/admin/sales"
                    className="text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    Buka Menu Penjualan
                  </Link>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Pembeli</span>
                    <span className="font-bold text-[var(--ink)]">
                      {vehicle.sale.buyer?.name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Tanggal Jual</span>
                    <span className="font-semibold text-[var(--ink)]">
                      {formatDate(vehicle.sale.saleDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Harga Deal</span>
                    <span className="font-extrabold text-[var(--ink)]">
                      {formatRupiah(vehicle.sale.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Total Terbayar</span>
                    <span className="font-bold text-[var(--accent)]">
                      {formatRupiah(totalSalePaid)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Preview Foto / Dokumen */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
              <div className="text-sm font-bold text-[var(--ink)] truncate pr-4">
                {lightbox.title}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  aria-label="Tutup pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-stone-950 flex items-center justify-center max-h-[80vh] overflow-auto p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.url}
                alt={lightbox.title}
                className="max-w-full max-h-[76vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

