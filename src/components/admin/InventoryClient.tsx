"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  ArrowRight,
  Receipt,
  MessageCircle,
  CarFront,
  Sparkles,
  Camera,
  ClipboardCheck,
  FileSpreadsheet,
  Wrench,
  Tag,
  Droplet,
  MoreVertical,
  ExternalLink,
  Pencil,
  Eye,
  Users,
  Trash2,
  Loader2,
  RotateCcw,
  Globe,
} from "lucide-react";
import { deleteVehicleAction, updateVehicleStatusAction } from "@/app/actions/vehicle";
import { resetVehicleSaleAction } from "@/app/actions/sale";
import { VehicleExpensesManager } from "./VehicleExpensesManager";
import {
  formatRupiah,
  formatDate,
  cn,
  normalizePlateNumber,
  stripPlateSpaces,
  formatVehicleTitle,
} from "@/lib/utils";
import { generateVehicleSlug } from "@/lib/utils/slug";
import { generateCatalogWhatsAppLink } from "@/lib/utils/whatsapp";

interface VehicleItem {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  odometer: number;
  transmission: string;
  engineCapacity: number;
  sourceType: string;
  auctionHouse?: string | null;
  purchasePrice: number;
  purchaseDate: string | Date;
  targetSellingPrice?: number | null;
  minSellingPrice?: number | null;
  status: string;
  currentLocation: string;
  totalExpenses: number;
  totalHpp: number;
  expenseCount?: number;
  expenses?: Array<{ id: string }>;
  daysInInventory: number;
  agingCategory: "FRESH" | "NORMAL" | "WARNING_STAGNANT";
  taxExpiryDate?: string | Date | null;
  platExpiryDate?: string | Date | null;
  taxNominal?: number | null;
  stnkStatus?: string | null;
  bpkbStatus?: string | null;
  bpkbLeadDays?: number | null;
  notes?: string | null;
  photos?: Array<{
    id: string;
    fileUrl: string;
    category: string;
  }>;
  sale?: {
    id: string;
    sellingPrice: number;
    saleDate: string | Date;
    payments?: Array<{ amount: number }>;
  } | null;
  investments?: Array<{
    id: string;
    investorId: string;
    investorName: string;
    investorType: string;
    capitalShare: number;
    profitSharePercent: number;
  }>;
}

interface InventoryClientProps {
  initialVehicles: VehicleItem[];
  initialStatus?: string;
  userRole?: string;
  whatsappPhone?: string;
}

const STATUS_FILTERS = [
  { label: "Semua", value: "ALL" },
  { label: "Siap Jual (Web)", value: "READY_FOR_SALE" },
  { label: "Baru Masuk", value: "INTAKE" },
  { label: "Bengkel", value: "IN_REPAIR" },
  { label: "DP / Booked", value: "BOOKED" },
  { label: "Tempo Showroom", value: "AT_SHOWROOM_PENDING" },
  { label: "Terjual Lunas", value: "SOLD_SETTLED" },
];

export function InventoryClient({
  initialVehicles,
  initialStatus = "ALL",
  userRole = "ADMIN",
  whatsappPhone = "081234567890",
}: InventoryClientProps) {
  const router = useRouter();
  const isSalesRole = userRole === "SALES";
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);
  const [selectedStatus, setSelectedStatus] = useState(
    STATUS_FILTERS.some((f) => f.value === initialStatus) ? initialStatus : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Modal Kelola Biaya & Hapus Unit
  const [selectedVehicleForExpense, setSelectedVehicleForExpense] = useState<VehicleItem | null>(null);
  const [deleteTargetVehicle, setDeleteTargetVehicle] = useState<VehicleItem | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  const [resetTargetVehicle, setResetTargetVehicle] = useState<VehicleItem | null>(null);
  const [resettingVehicle, setResettingVehicle] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{
    vehicle: VehicleItem;
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeDropdown) return;

    const handleClose = () => setActiveDropdown(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDropdown(null);
    };

    window.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDropdown]);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, v: VehicleItem) => {
    e.stopPropagation();
    if (activeDropdown?.vehicle.id === v.id) {
      setActiveDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const dropdownHeight = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setActiveDropdown({
        vehicle: v,
        top: openUpwards ? undefined : rect.bottom + 6,
        bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  // Filter calculation (pencarian plat fleksibel pakai/tanpa spasi)
  const filteredVehicles = vehicles.filter((v) => {
    const matchStatus = selectedStatus === "ALL" || v.status === selectedStatus;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchStatus;
    const compactQ = stripPlateSpaces(searchQuery);
    const matchSearch =
      v.plateNumber.toLowerCase().includes(q) ||
      (compactQ && stripPlateSpaces(v.plateNumber).includes(compactQ)) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleQuickPublish = async (vehicle: VehicleItem) => {
    setPublishingId(vehicle.id);
    setInventoryNotice(null);
    const res = await updateVehicleStatusAction(vehicle.id, "READY_FOR_SALE");
    setPublishingId(null);

    if (!res.success) {
      setInventoryNotice({
        type: "error",
        text: res.error || "Gagal menayangkan unit ke katalog web.",
      });
      return;
    }

    setVehicles((prev) =>
      prev.map((item) =>
        item.id === vehicle.id ? { ...item, status: "READY_FOR_SALE" } : item
      )
    );
    setInventoryNotice({
      type: "success",
      text: `${normalizePlateNumber(vehicle.plateNumber)} sekarang berstatus Siap Jual & tayang di web katalog.`,
    });
    router.refresh();
  };

  // KPI Calculations
  const activeUnits = vehicles.filter((v) => v.status !== "SOLD_SETTLED");
  const totalModalTerikat = activeUnits.reduce((acc, curr) => acc + curr.totalHpp, 0);
  const stagnantUnits = activeUnits.filter((v) => v.daysInInventory > 45);
  const readyUnits = activeUnits.filter((v) => v.status === "READY_FOR_SALE");

  const handleConfirmDeleteVehicle = async () => {
    if (!deleteTargetVehicle) return;
    setDeletingVehicle(true);
    setInventoryNotice(null);
    const res = await deleteVehicleAction(deleteTargetVehicle.id);
    setDeletingVehicle(false);

    if (!res.success) {
      setInventoryNotice({
        type: "error",
        text: res.error || "Gagal menghapus unit kendaraan.",
      });
      setDeleteTargetVehicle(null);
      return;
    }

    setVehicles((prev) => prev.filter((item) => item.id !== deleteTargetVehicle.id));
    setInventoryNotice({
      type: "success",
      text: res.message || `Unit ${deleteTargetVehicle.plateNumber} berhasil dihapus.`,
    });
    setDeleteTargetVehicle(null);
    router.refresh();
  };

  const handleConfirmResetSale = async () => {
    if (!resetTargetVehicle) return;
    setResettingVehicle(true);
    setInventoryNotice(null);
    const res = await resetVehicleSaleAction(resetTargetVehicle.id);
    setResettingVehicle(false);

    if (!res.success) {
      setInventoryNotice({
        type: "error",
        text: res.error || "Gagal me-reset penjualan unit kendaraan.",
      });
      setResetTargetVehicle(null);
      return;
    }

    setVehicles((prev) =>
      prev.map((item) =>
        item.id === resetTargetVehicle.id
          ? { ...item, status: "READY_FOR_SALE", sale: null }
          : item
      )
    );
    setInventoryNotice({
      type: "success",
      text: res.message || `Status unit ${resetTargetVehicle.plateNumber} berhasil di-reset ke Ready Jual.`,
    });
    setResetTargetVehicle(null);
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* ── KPI SUMMARY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Unit Aktif di Garasi</span>
            <CarFront className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--ink)]">{activeUnits.length}</span>
            <span className="text-xs text-[var(--muted)]">unit berjalan</span>
          </div>
        </div>

        {!isSalesRole && (
          <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Modal Terikat (HPP)</span>
              <DollarSign className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[var(--ink)]">
                {formatRupiah(totalModalTerikat)}
              </span>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">Harga Beli + Total Biaya Unit</div>
            </div>
          </div>
        )}

        <div className={cn(
          "border rounded-xl p-5 shadow-xs transition-all",
          stagnantUnits.length > 0 
            ? "bg-rose-50/40 border-rose-200 text-rose-700" 
            : "bg-white border-[var(--line)]"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Unit Macet (&gt; 45 Hari)</span>
            <AlertTriangle className={cn("w-5 h-5", stagnantUnits.length > 0 ? "text-rose-600 animate-bounce" : "text-[var(--muted)]")} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold", stagnantUnits.length > 0 ? "text-rose-600" : "text-[var(--ink)]")}>
              {stagnantUnits.length}
            </span>
            <span className="text-xs text-[var(--muted)]">perlu evaluasi harga</span>
          </div>
        </div>

        <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Ready Siap Jual</span>
            <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--ink)]">{readyUnits.length}</span>
            <span className="text-xs text-[var(--muted)]">siap tayang katalog</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & ACTIONS ─────────────────────────────────── */}
      <div className="bg-white border border-[var(--line)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari plat nomor, merk, atau tipe mobil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>

        {!isSalesRole && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/inventory/import"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-white hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] rounded-xl text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[var(--muted)]" />
              <span>Import Excel</span>
            </Link>

            <Link
              href="/admin/inventory/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[46px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Unit Masuk</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── STATUS TABS ───────────────────────────────────────── */}
      {inventoryNotice && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3",
            inventoryNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          )}
        >
          <span className="font-semibold">{inventoryNotice.text}</span>
          <button
            type="button"
            onClick={() => setInventoryNotice(null)}
            className="font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--line)]">
        {STATUS_FILTERS.map((tab) => {
          const isSelected = selectedStatus === tab.value;
          const count = tab.value === "ALL" 
            ? vehicles.length 
            : vehicles.filter((v) => v.status === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                isSelected
                  ? "bg-[var(--ink)] text-white shadow-sm"
                  : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                isSelected ? "bg-white/20 text-white" : "bg-[var(--line)] text-[var(--ink)]"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TAMPILAN KARTU DI HP (< md) ───────────────────────── */}
      <div className="md:hidden space-y-3">
        {filteredVehicles.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-8 text-center text-sm text-[var(--muted)]">
            Tidak ada unit yang cocok dengan pencarian saat ini.
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const plate = normalizePlateNumber(vehicle.plateNumber);
            const title = formatVehicleTitle(vehicle.brand, vehicle.model, vehicle.year);
            const thumb = vehicle.photos?.[0]?.fileUrl;
            const slug = generateVehicleSlug(vehicle);

            return (
              <div
                key={vehicle.id}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={isSalesRole ? `/katalog/${slug}` : `/admin/inventory/${vehicle.id}`}
                    className="w-18 h-18 rounded-xl overflow-hidden bg-[var(--bg)] border border-[var(--line)] shrink-0 flex items-center justify-center"
                  >
                    {thumb ? (
                      <img src={thumb} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <CarFront className="w-7 h-7 text-[var(--muted)]" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={isSalesRole ? `/katalog/${slug}` : `/admin/inventory/${vehicle.id}`}
                        className="font-extrabold text-base text-[var(--ink)] tracking-tight leading-snug"
                      >
                        {plate}
                      </Link>
                      <StatusBadge status={vehicle.status} />
                    </div>
                    <div className="text-xs font-medium text-[var(--muted)] mt-0.5 truncate">
                      {title}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-1 flex items-center gap-2 flex-wrap">
                      <span>{vehicle.color}</span>
                      <span>• {vehicle.daysInInventory} hari</span>
                      {vehicle.bpkbStatus === "READY" ? (
                        <span className="text-[var(--ok)] font-semibold">• BPKB Ada</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">• BPKB Proses</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Harga Modal & Target Web */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs">
                  {!isSalesRole && (
                    <div>
                      <div className="text-[11px] text-[var(--muted)]">Total Modal</div>
                      <div className="font-bold text-[var(--ink)] mt-0.5">
                        {formatRupiah(vehicle.totalHpp)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">Harga di Web</div>
                    <div className="font-bold text-[var(--ink)] mt-0.5">
                      {vehicle.targetSellingPrice
                        ? formatRupiah(vehicle.targetSellingPrice)
                        : "Belum diisi"}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Besar Sesuai Kondisi Unit */}
                {!isSalesRole ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR") && (
                      <button
                        type="button"
                        disabled={publishingId === vehicle.id}
                        onClick={() => handleQuickPublish(vehicle)}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--ok)] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {publishingId === vehicle.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                        <span>Tayangkan di Web (Siap Jual)</span>
                      </button>
                    )}

                    {vehicle.status === "READY_FOR_SALE" && !vehicle.sale && (
                      <Link
                        href={`/admin/sales/new?vehicleId=${vehicle.id}`}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--ok)] text-white text-xs font-bold"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Catat Jual Unit Ini</span>
                      </Link>
                    )}

                    {vehicle.sale && vehicle.status !== "SOLD_SETTLED" && (
                      <Link
                        href={`/admin/sales/${vehicle.sale.id}/payment`}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Terima Bayar / Pelunasan</span>
                      </Link>
                    )}

                    {vehicle.status === "SOLD_SETTLED" && vehicle.sale && (
                      <a
                        href={`/api/pdf/invoice/${vehicle.sale.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Cetak Kuitansi PDF</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedVehicleForExpense(vehicle)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-semibold cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Biaya ({vehicle.expenseCount ?? vehicle.expenses?.length ?? 0})</span>
                    </button>

                    <Link
                      href={`/admin/inventory/${vehicle.id}/media`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-semibold"
                    >
                      <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Foto Web</span>
                    </Link>

                    <Link
                      href={`/admin/inventory/${vehicle.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>Detail</span>
                    </Link>

                    <Link
                      href={`/katalog/${slug}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-[var(--line)] text-[var(--accent)] text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Web</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/katalog/${slug}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Katalog</span>
                    </Link>
                    <a
                      href={generateCatalogWhatsAppLink(whatsappPhone, {
                        brand: vehicle.brand,
                        model: vehicle.model,
                        year: vehicle.year,
                        plateNumber: plate,
                        targetSellingPrice: vehicle.targetSellingPrice,
                        status: vehicle.status,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--ok-light)] border border-[var(--ok)]/30 text-[var(--ok)] text-xs font-bold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Share WA</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── VEHICLES TABLE (DESKTOP >= md) ────────────────────── */}
      <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-[13px] font-semibold text-[var(--muted)]">
                <th className="py-3.5 px-4">Plat &amp; Unit</th>
                <th className="py-3.5 px-4">Spesifikasi</th>
                <th className="py-3.5 px-4">Status &amp; Alur</th>
                <th className="py-3.5 px-4">Umur di Garasi</th>
                {!isSalesRole && <th className="py-3.5 px-4">HPP &amp; Biaya</th>}
                <th className="py-3.5 px-4">{isSalesRole ? "Harga Jual" : "Target / Batas Bawah"}</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={isSalesRole ? 6 : 7} className="py-12 text-center text-[var(--muted)]">
                    Tidak ada unit yang cocok dengan filter atau pencarian saat ini.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  return (
                    <tr
                      key={vehicle.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("a, button")) return;
                        if (isSalesRole) {
                          window.open(
                            `/katalog/${generateVehicleSlug(vehicle)}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        } else {
                          router.push(`/admin/inventory/${vehicle.id}`);
                        }
                      }}
                      className="hover:bg-[var(--bg)] transition-colors cursor-pointer"
                      title={
                        isSalesRole
                          ? "Klik untuk lihat tampilan katalog unit"
                          : "Klik baris untuk membuka detail unit, foto & dokumen"
                      }
                    >
                      {/* Plat & Brand */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-base text-[var(--ink)] tracking-tight">
                          {normalizePlateNumber(vehicle.plateNumber)}
                        </div>
                        <div className="text-xs font-medium text-[var(--muted)]">
                          {formatVehicleTitle(vehicle.brand, vehicle.model, vehicle.year)}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]/80 mt-1">
                          Sumber: <span className="font-semibold text-[var(--ink)]">{vehicle.sourceType}</span>
                          {vehicle.auctionHouse && ` (${vehicle.auctionHouse})`}
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/katalog/${generateVehicleSlug(vehicle)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[#92400E] hover:underline"
                            title="Buka tampilan publik unit ini di tab baru"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span>
                              {vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR"
                                ? "Tampilan Segera Hadir"
                                : vehicle.status === "SOLD_SETTLED"
                                ? "Tampilan Arsip Terjual"
                                : "Tampilan Katalog"}
                            </span>
                          </Link>
                        </div>
                      </td>

                      {/* Spesifikasi */}
                      <td className="py-4 px-4 align-top text-xs text-[var(--ink)]">
                        <div>{vehicle.year} • {vehicle.color}</div>
                        <div className="text-[var(--muted)]">
                          {vehicle.transmission} • {vehicle.engineCapacity} cc
                        </div>
                        <div className="text-[11px] text-[var(--muted)] mt-1">
                          Odo: {vehicle.odometer.toLocaleString("id-ID")} km
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        <StatusBadge status={vehicle.status} />
                        <div className="text-[11px] text-[var(--muted)] mt-1.5">
                          Lokasi: {vehicle.currentLocation}
                        </div>
                        {/* Status Pajak STNK */}
                        <div className="mt-1.5">
                          {vehicle.taxExpiryDate ? (() => {
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            const expiry = new Date(vehicle.taxExpiryDate);
                            expiry.setHours(0, 0, 0, 0);
                            const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays < 0) {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200"
                                  title={`Pajak mati sejak ${new Date(vehicle.taxExpiryDate).toLocaleDateString("id-ID")}`}
                                >
                                  🔴 Pajak Mati ({Math.abs(diffDays)}h)
                                </span>
                              );
                            } else if (diffDays <= 30) {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]"
                                  title={`Jatuh tempo: ${new Date(vehicle.taxExpiryDate).toLocaleDateString("id-ID")}`}
                                >
                                  🟡 Pajak Kritis (sisa {diffDays}h)
                                </span>
                              );
                            } else {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]"
                                  title={`Jatuh tempo: ${new Date(vehicle.taxExpiryDate).toLocaleDateString("id-ID")}`}
                                >
                                  🟢 Pajak Hidup
                                </span>
                              );
                            }
                          })() : (
                            <span className="text-[10px] text-[var(--muted)] italic">Pajak: -</span>
                          )}
                        </div>

                        {/* Status BPKB */}
                        <div className="mt-1">
                          {vehicle.bpkbStatus === "READY" ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title="BPKB On-Hand / Ready di Garasi Showroom"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              BPKB On-Hand
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                              title={
                                vehicle.bpkbLeadDays
                                  ? `Estimasi BPKB balai lelang: ${vehicle.bpkbLeadDays} hari kerja`
                                  : "BPKB dalam proses / menunggu balai lelang"
                              }
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              BPKB Menunggu {vehicle.bpkbLeadDays ? `(${vehicle.bpkbLeadDays}h)` : "Lelang"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Umur Garasi */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <AgingBadge days={vehicle.daysInInventory} category={vehicle.agingCategory} />
                        </div>
                        <div className="text-[11px] text-[var(--muted)] mt-1">
                          Masuk: {formatDate(vehicle.purchaseDate)}
                        </div>
                      </td>

                      {/* HPP & Biaya */}
                      {!isSalesRole && (
                        <td className="py-4 px-4 align-top text-xs">
                          <div className="font-bold text-sm text-[var(--ink)]">
                            {formatRupiah(vehicle.totalHpp)}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] mt-0.5">
                            Beli: {formatRupiah(vehicle.purchasePrice)}
                          </div>
                          {(() => {
                            const count = vehicle.expenseCount ?? vehicle.expenses?.length ?? 0;
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedVehicleForExpense(vehicle)}
                                className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] text-[11px] font-semibold text-[var(--accent)] transition-colors cursor-pointer"
                                title="Klik untuk lihat daftar biaya, edit, atau tambah biaya baru"
                              >
                                <span>
                                  {count > 0 || vehicle.totalExpenses > 0
                                    ? `Biaya: +${formatRupiah(vehicle.totalExpenses)}`
                                    : "+ Catat Biaya"}
                                </span>
                                {count > 0 && (
                                  <span className="text-[10px] px-1 rounded bg-white text-[var(--ink)] border border-[var(--line)] font-bold">
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                          <div className="mt-1.5">
                            {vehicle.investments && vehicle.investments.length > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900"
                                title={vehicle.investments
                                  .map(
                                    (inv) =>
                                      `${inv.investorName}: ${formatRupiah(inv.capitalShare)} (${inv.profitSharePercent}%)`
                                  )
                                  .join(" • ")}
                              >
                                <Users className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                <span>
                                  {vehicle.investments.length === 1
                                    ? vehicle.investments[0].investorName
                                    : `${vehicle.investments[0].investorName} +${vehicle.investments.length - 1}`}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--line)] text-[10px] font-medium text-[var(--muted)]">
                                Modal: Kas Showroom
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Target & Min Price */}
                      <td className="py-4 px-4 align-top text-xs">
                        {vehicle.targetSellingPrice ? (
                          <div className="font-bold text-[var(--ink)]">
                            {formatRupiah(vehicle.targetSellingPrice)}
                          </div>
                        ) : (
                          <span className="text-[var(--muted)] italic text-[11px]">Belum diisi</span>
                        )}
                        {!isSalesRole && vehicle.minSellingPrice && (
                          <div className="text-[11px] text-[var(--muted)] font-medium mt-0.5" title="Batas Bawah Nego">
                            Bawah: {formatRupiah(vehicle.minSellingPrice)}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          {/* 1. Tombol Aksi Utama Kontekstual Sesuai Status Mobil */}
                          {!isSalesRole && (vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR") && (
                            <button
                              type="button"
                              disabled={publishingId === vehicle.id}
                              onClick={() => handleQuickPublish(vehicle)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ok)] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-opacity shrink-0 cursor-pointer disabled:opacity-50"
                              title="Ubah ke Siap Jual agar langsung tayang di katalog web"
                            >
                              {publishingId === vehicle.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Globe className="w-3.5 h-3.5" />
                              )}
                              <span>Tayang Web</span>
                            </button>
                          )}

                          {!isSalesRole && vehicle.status === "READY_FOR_SALE" && !vehicle.sale && (
                            <Link
                              href={`/admin/sales/new?vehicleId=${vehicle.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ok)] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-opacity shrink-0"
                              title="Catat penjualan unit ini"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Jual Unit</span>
                            </Link>
                          )}

                          {isSalesRole && vehicle.status === "READY_FOR_SALE" && (
                            <a
                              href={`/api/pdf/spec-tag/${vehicle.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Tag Spion</span>
                            </a>
                          )}

                          {!isSalesRole && vehicle.sale && vehicle.status !== "SOLD_SETTLED" && (
                            <Link
                              href={`/admin/sales/${vehicle.sale.id}/payment`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Catat pelunasan atau cicilan masuk"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Terima Bayar</span>
                            </Link>
                          )}

                          {!isSalesRole && !vehicle.sale && (vehicle.status === "BOOKED" || vehicle.status === "AT_SHOWROOM_PENDING") && (
                            <Link
                              href={`/admin/inventory/${vehicle.id}/status`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ink)] hover:bg-[#2c3746] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Ubah Status Kendaraan"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Update Status</span>
                            </Link>
                          )}

                          {vehicle.status === "SOLD_SETTLED" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--bg)] text-[var(--ink)] text-xs font-bold border border-[var(--line)]">
                              Terjual Lunas
                            </span>
                          )}

                          {/* Quick Edit Unit & Katalog Button */}
                          {!isSalesRole && (
                            <Link
                              href={`/admin/inventory/${vehicle.id}/edit`}
                              className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--ink)] transition-colors cursor-pointer shrink-0"
                              title="Edit Semua Data Unit (Form Lengkap Intake)"
                            >
                              <Pencil className="w-4 h-4 text-[var(--accent)]" />
                            </Link>
                          )}

                          {/* 2. Menu Dropdown [Titik Tiga ...] */}
                          <div>
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, vehicle)}
                              className={cn(
                                "p-1.5 rounded-lg border border-[var(--line)] transition-colors cursor-pointer",
                                activeDropdown?.vehicle.id === vehicle.id
                                  ? "bg-[var(--ink)] text-white shadow-xs"
                                  : "bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--ink)]"
                              )}
                              title="Menu Opsi Aksi Lengkap"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* ── MODALS ────────────────────────────────────────────── */}
      {/* Modal Kelola Biaya & Servis Unit */}
      {selectedVehicleForExpense && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedVehicleForExpense(null)}
        >
          <div
            className="bg-white border border-[var(--line)] rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                  Biaya &amp; Servis Unit (HPP)
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Lihat riwayat biaya, edit nominal atau nota, dan catat biaya baru tanpa pindah halaman.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/inventory/${selectedVehicleForExpense.id}/expenses/new`}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)]/40 text-[11px] font-semibold text-[var(--ink)] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Halaman Penuh</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForExpense(null)}
                  className="px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] font-bold text-sm cursor-pointer"
                  aria-label="Tutup modal biaya"
                >
                  ✕
                </button>
              </div>
            </div>

            <VehicleExpensesManager
              vehicle={selectedVehicleForExpense}
              mode="modal"
              onClose={() => setSelectedVehicleForExpense(null)}
              onExpensesChanged={(newTotalExpenses, newExpenseCount) => {
                const targetId = selectedVehicleForExpense.id;
                setVehicles((prev) =>
                  prev.map((v) => {
                    if (v.id === targetId) {
                      return {
                        ...v,
                        totalExpenses: newTotalExpenses,
                        totalHpp: v.purchasePrice + newTotalExpenses,
                        expenseCount: newExpenseCount,
                      };
                    }
                    return v;
                  })
                );
              }}
            />
          </div>
        </div>
      )}

      {/* ── PORTAL DROPDOWN MENU (Prevent table overflow clipping) ── */}
      {mounted && activeDropdown && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: activeDropdown.top !== undefined ? `${activeDropdown.top}px` : undefined,
            bottom: activeDropdown.bottom !== undefined ? `${activeDropdown.bottom}px` : undefined,
            right: `${activeDropdown.right}px`,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-56 bg-white border border-[var(--line)] rounded-xl shadow-2xl py-1.5 text-left text-xs divide-y divide-[var(--bg)] animate-in fade-in zoom-in-95 duration-100"
        >
          {!isSalesRole && (
            <div className="py-1">
              <Link
                href={`/admin/inventory/${activeDropdown.vehicle.id}`}
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
              >
                <Eye className="w-4 h-4 text-[var(--accent)]" />
                <span>Lihat Detail &amp; Foto Unit</span>
              </Link>

              <Link
                href={`/admin/inventory/${activeDropdown.vehicle.id}/edit`}
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
              >
                <Pencil className="w-4 h-4 text-[var(--accent)]" />
                <span>Edit Semua Data Unit</span>
              </Link>

              <Link
                href={`/admin/inspections/${activeDropdown.vehicle.id}`}
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 text-[var(--accent)]" />
                <span>Cek Fisik &amp; Inspeksi</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  const v = activeDropdown.vehicle;
                  setActiveDropdown(null);
                  setSelectedVehicleForExpense(v);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors cursor-pointer text-left"
              >
                <Receipt className="w-4 h-4 text-[var(--accent)]" />
                <span>Kelola Biaya / Servis</span>
              </button>

              <Link
                href={`/admin/inventory/${activeDropdown.vehicle.id}/media`}
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
              >
                <Camera className="w-4 h-4 text-[var(--accent)]" />
                <span>Upload Foto &amp; Dokumen</span>
              </Link>
            </div>
          )}

          <div className="py-1">
            {!isSalesRole && (
              <a
                href={`/api/pdf/workshop-dispatch/${activeDropdown.vehicle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
              >
                <Wrench className="w-4 h-4 text-[var(--accent)]" />
                <span>Surat Jalan Bengkel (SPK)</span>
              </a>
            )}

            <a
              href={`/api/pdf/spec-tag/${activeDropdown.vehicle.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setActiveDropdown(null)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
            >
              <Tag className="w-4 h-4 text-[#7C3AED]" />
              <span>Cetak Tag Spion (QR)</span>
            </a>
          </div>

          <div className="py-1">
            <Link
              href={`/katalog/${generateVehicleSlug(activeDropdown.vehicle)}`}
              target="_blank"
              onClick={() => setActiveDropdown(null)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--accent)] hover:bg-[var(--bg)] font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
              <span>
                {activeDropdown.vehicle.status === "INTAKE" || activeDropdown.vehicle.status === "IN_REPAIR"
                  ? "Lihat Tampilan Segera Hadir"
                  : "Lihat di Katalog Publik"}
              </span>
            </Link>

            {!isSalesRole && !activeDropdown.vehicle.sale && activeDropdown.vehicle.status !== "SOLD_SETTLED" && (
              <Link
                href={`/admin/sales/new?vehicleId=${activeDropdown.vehicle.id}`}
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 font-bold transition-colors"
              >
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Catat Penjualan (Jual Unit)</span>
              </Link>
            )}

            {!isSalesRole && activeDropdown.vehicle.sale && (
              <Link
                href={
                  activeDropdown.vehicle.status === "SOLD_SETTLED"
                    ? `/admin/sales/${activeDropdown.vehicle.sale.id}`
                    : `/admin/sales/${activeDropdown.vehicle.sale.id}/payment`
                }
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--accent)] hover:bg-[var(--bg)] font-bold transition-colors"
              >
                <DollarSign className="w-4 h-4 text-[var(--accent)]" />
                <span>
                  {activeDropdown.vehicle.status === "SOLD_SETTLED"
                    ? "Lihat / Edit Penjualan"
                    : "Terima Bayar / Pelunasan"}
                </span>
              </Link>
            )}

            {/* Dokumen Penjualan jika unit memiliki data penjualan */}
            {activeDropdown.vehicle.sale && (
              <div className="pt-1 mt-1 border-t border-[var(--bg)]">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Cetak Dokumen Jual
                </div>
                <a
                  href={`/api/pdf/invoice/${activeDropdown.vehicle.sale.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Kwitansi / Faktur Jual (PDF)</span>
                </a>
                <a
                  href={`/api/pdf/bast/${activeDropdown.vehicle.sale.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>BAST Serah Terima (PDF)</span>
                </a>
                <a
                  href={`/api/pdf/agreement/${activeDropdown.vehicle.sale.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>Surat Perjanjian Jual Beli (PDF)</span>
                </a>
              </div>
            )}

            {!isSalesRole && (
              <Link
                href={`/admin/inventory/${activeDropdown.vehicle.id}/status`}
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-[var(--muted)]" />
                <span>Ubah Status Kendaraan</span>
              </Link>
            )}

            <a
              href={generateCatalogWhatsAppLink(whatsappPhone, {
                brand: activeDropdown.vehicle.brand,
                model: activeDropdown.vehicle.model,
                year: activeDropdown.vehicle.year,
                plateNumber: activeDropdown.vehicle.plateNumber,
                targetSellingPrice: activeDropdown.vehicle.targetSellingPrice,
                status: activeDropdown.vehicle.status,
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setActiveDropdown(null)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--bg)] font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[var(--accent)]" />
              <span>Share via WhatsApp</span>
            </a>

            {(userRole === "OWNER" || userRole === "ADMIN") &&
              (activeDropdown.vehicle.status === "SOLD_SETTLED" || activeDropdown.vehicle.sale) && (
                <button
                  type="button"
                  onClick={() => {
                    const target = activeDropdown.vehicle;
                    setActiveDropdown(null);
                    setResetTargetVehicle(target);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-700 hover:bg-rose-50 font-semibold transition-colors cursor-pointer text-left border-t border-[var(--line)] mt-1 pt-2"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Reset Penjualan ke Ready</span>
                </button>
              )}

            {(userRole === "OWNER" || userRole === "ADMIN") &&
              activeDropdown.vehicle.status !== "SOLD_SETTLED" && (
                <button
                  type="button"
                  onClick={() => {
                    const target = activeDropdown.vehicle;
                    setActiveDropdown(null);
                    setDeleteTargetVehicle(target);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-700 hover:bg-red-50 font-semibold transition-colors cursor-pointer text-left border-t border-[var(--line)] mt-1 pt-2"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Hapus Unit dari Inventori</span>
                </button>
              )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal Konfirmasi Hapus Unit */}
      {deleteTargetVehicle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !deletingVehicle && setDeleteTargetVehicle(null)}
        >
          <div
            className="bg-white border border-[var(--line)] rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--ink)]">
                  Hapus Unit dari Inventori?
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Anda akan menghapus{" "}
                  <strong className="text-[var(--ink)]">
                    {deleteTargetVehicle.brand} {deleteTargetVehicle.model} (
                    {deleteTargetVehicle.plateNumber})
                  </strong>
                  . Foto, dokumen, dan catatan biaya terkait unit ini juga akan ikut terhapus.
                </p>
                <p className="text-[11px] text-[var(--ink)] bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--line)] mt-2">
                  Jika unit ini sebelumnya memotong saldo kas showroom atau mengikat modal pemodal, saldonya akan dikembalikan otomatis ke kas / saldo bebas pemodal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                disabled={deletingVehicle}
                onClick={() => setDeleteTargetVehicle(null)}
                className="px-4 py-2 rounded-xl border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingVehicle}
                onClick={handleConfirmDeleteVehicle}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletingVehicle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Unit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Penjualan Unit */}
      {resetTargetVehicle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !resettingVehicle && setResetTargetVehicle(null)}
        >
          <div
            className="bg-white border border-[var(--line)] rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink)]">
                  Reset Penjualan &amp; Kembali ke Ready?
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Unit:{" "}
                  <strong className="text-[var(--ink)]">
                    {resetTargetVehicle.plateNumber}
                  </strong>{" "}
                  ({resetTargetVehicle.brand} {resetTargetVehicle.model})
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-1.5">
              <p className="font-bold text-rose-950">Aksi ini akan:</p>
              <ul className="list-disc list-inside text-[11px] text-rose-900 space-y-1 leading-relaxed">
                <li>Menghapus data transaksi penjualan dummy / belum lengkap.</li>
                <li>Mengembalikan status unit menjadi <strong>Ready Jual (READY_FOR_SALE)</strong>.</li>
                <li>Data unit, biaya servis/HPP, dokumen &amp; foto tetap tersimpan aman.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                disabled={resettingVehicle}
                onClick={() => setResetTargetVehicle(null)}
                className="px-4 py-2 rounded-xl border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resettingVehicle}
                onClick={handleConfirmResetSale}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {resettingVehicle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Reset ke Ready Jual</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BADGE STATUS KOMPONEN ─────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "INTAKE":
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]">
            Intake Baru
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--ink)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--line)]">
            <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
            <span>Katalog: Segera Hadir</span>
          </span>
        </div>
      );
    case "IN_REPAIR":
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
            Bengkel / Salon
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--ink)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--line)]">
            <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
            <span>Katalog: Segera Hadir</span>
          </span>
        </div>
      );
    case "READY_FOR_SALE":
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg)] text-[var(--ok)] border border-[var(--line)] font-bold">
            Ready Jual
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--line)]">
            <span>Katalog: Tayang Lengkap</span>
          </span>
        </div>
      );
    case "BOOKED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg)] text-[var(--accent)] border border-[var(--accent)] font-bold animate-pulse">
          Booked (DP)
        </span>
      );
    case "AT_SHOWROOM_PENDING":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]">
          Titip Showroom
        </span>
      );
    case "SOLD_SETTLED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--ink)] text-white">
          Terjual Lunas
        </span>
      );
    default:
      return <span className="text-xs">{status}</span>;
  }
}

// ── AGING BADGE KOMPONEN ──────────────────────────────────────
function AgingBadge({ days, category }: { days: number; category: string }) {
  if (category === "WARNING_STAGNANT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--bg)] text-[var(--bad)] border border-[var(--bad)]/30 animate-pulse">
        <Clock className="w-3 h-3" />
        {days} hari (Macet)
      </span>
    );
  }

  if (category === "FRESH") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg)] text-[var(--ok)] border border-[var(--ok)]/30">
        <Sparkles className="w-3 h-3 text-[var(--ok)]" />
        {days} hari (Fresh)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]">
      <Clock className="w-3 h-3" />
      {days} hari
    </span>
  );
}
