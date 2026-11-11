"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
} from "lucide-react";
import { VehicleExpensesManager } from "./VehicleExpensesManager";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
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
  notes?: string | null;
}

interface InventoryClientProps {
  initialVehicles: VehicleItem[];
  userRole?: string;
  whatsappPhone?: string;
}

const STATUS_FILTERS = [
  { label: "Semua Unit", value: "ALL" },
  { label: "Intake Baru", value: "INTAKE" },
  { label: "Pengerjaan / Bengkel", value: "IN_REPAIR" },
  { label: "Ready Jual", value: "READY_FOR_SALE" },
  { label: "Booked (DP Masuk)", value: "BOOKED" },
  { label: "Titip Showroom", value: "AT_SHOWROOM_PENDING" },
  { label: "Terjual Lunas", value: "SOLD_SETTLED" },
];

export function InventoryClient({
  initialVehicles,
  userRole = "ADMIN",
  whatsappPhone = "081234567890",
}: InventoryClientProps) {
  const isSalesRole = userRole === "SALES";
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Kelola Biaya
  const [selectedVehicleForExpense, setSelectedVehicleForExpense] = useState<VehicleItem | null>(null);
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

  // Filter calculation
  const filteredVehicles = vehicles.filter((v) => {
    const matchStatus = selectedStatus === "ALL" || v.status === selectedStatus;
    const matchSearch =
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  // KPI Calculations
  const activeUnits = vehicles.filter((v) => v.status !== "SOLD_SETTLED");
  const totalModalTerikat = activeUnits.reduce((acc, curr) => acc + curr.totalHpp, 0);
  const stagnantUnits = activeUnits.filter((v) => v.daysInInventory > 45);
  const readyUnits = activeUnits.filter((v) => v.status === "READY_FOR_SALE");

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
            {/* Action Button: Gudang Bahan Habis Pakai & Servis Mandiri */}
            <Link
              href="/admin/workshop"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] rounded-lg text-sm font-semibold shadow-xs transition-colors"
              title="Kelola persediaan oli, filter, bohlam, salon & alokasikan servis mandiri"
            >
              <Droplet className="w-4 h-4 text-[var(--accent)]" />
              <span>Gudang Bahan &amp; Servis Mandiri</span>
            </Link>

            {/* Action Button: Import Spreadsheet */}
            <Link
              href="/admin/inventory/import"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] rounded-lg text-sm font-semibold shadow-xs transition-colors"
              title="Import data mobil lama dari file spreadsheet / Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[var(--muted)]" />
              <span>Import Spreadsheet</span>
            </Link>

            {/* Action Button: Intake Unit Baru */}
            <Link
              href="/admin/inventory/new"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Intake Unit Baru</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── STATUS TABS ───────────────────────────────────────── */}
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

      {/* ── VEHICLES TABLE ────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] overflow-hidden shadow-xs">
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
                    <tr key={vehicle.id} className="hover:bg-[var(--bg)] transition-colors">
                      {/* Plat & Brand */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-base text-[var(--ink)] tracking-tight">
                          {vehicle.plateNumber}
                        </div>
                        <div className="text-xs font-medium text-[var(--muted)]">
                          {vehicle.brand} {vehicle.model}
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
                          {!isSalesRole && vehicle.status === "INTAKE" && (
                            <Link
                              href={`/admin/inspections/${vehicle.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Mulai Cek Fisik & Inspeksi"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Cek Fisik</span>
                            </Link>
                          )}

                          {!isSalesRole && vehicle.status === "IN_REPAIR" && (
                            <button
                              type="button"
                              onClick={() => setSelectedVehicleForExpense(vehicle)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
                              title="Lihat, edit, atau catat biaya servis / sparepart"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Biaya / Servis</span>
                            </button>
                          )}

                          {vehicle.status === "READY_FOR_SALE" && (
                            <a
                              href={`/api/pdf/spec-tag/${vehicle.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Cetak Tag Gantung Spion Ber-QR Code"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Tag Spion</span>
                            </a>
                          )}

                          {!isSalesRole && (vehicle.status === "BOOKED" || vehicle.status === "AT_SHOWROOM_PENDING") && (
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
          </div>
        </div>,
        document.body
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
