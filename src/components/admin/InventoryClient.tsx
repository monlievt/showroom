"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  ArrowRight,
  Receipt,
  MessageCircle,
  CarFront,
  Sparkles,
  HelpCircle,
  Camera,
  UploadCloud,
  FileText,
  ClipboardCheck,
  FileSpreadsheet,
  Wrench,
  Tag,
  Droplet,
  MoreVertical,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { ImportSpreadsheetPanel } from "./ImportSpreadsheetPanel";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { generateVehicleSlug } from "@/lib/utils/slug";
import { createVehicleAction, updateVehicleStatusAction, updateVehicleAction } from "@/app/actions/vehicle";
import { createExpenseAction } from "@/app/actions/expense";
import { canTransition, type VehicleStatus } from "@/lib/calculations/vehicle-state";
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

export function InventoryClient({ initialVehicles }: InventoryClientProps) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<VehicleItem | null>(null);
  const [selectedVehicleForExpense, setSelectedVehicleForExpense] = useState<VehicleItem | null>(null);
  const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState<VehicleItem | null>(null);
  const [selectedVehicleForMedia, setSelectedVehicleForMedia] = useState<VehicleItem | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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
    <div className="p-8 space-y-8">
      {/* ── KPI SUMMARY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-semibold uppercase tracking-wider">Unit Aktif di Garasi</span>
            <CarFront className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#1C1917]">{activeUnits.length}</span>
            <span className="text-xs text-[#6B6560]">unit berjalan</span>
          </div>
        </div>

        <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Modal Terikat (HPP)</span>
            <DollarSign className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1C1917]">
              {formatRupiah(totalModalTerikat)}
            </span>
            <div className="text-[11px] text-[#6B6560] mt-0.5">Harga Beli + Total Biaya Unit</div>
          </div>
        </div>

        <div className={cn(
          "border rounded-xl p-5 shadow-sm transition-all",
          stagnantUnits.length > 0 
            ? "bg-[#FEE2E2] border-[#DC2626]/30 text-[#DC2626]" 
            : "bg-[#EFECE8] border-[#D9D4CB]"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Unit Macet (&gt; 45 Hari)</span>
            <AlertTriangle className={cn("w-5 h-5", stagnantUnits.length > 0 ? "text-[#DC2626] animate-bounce" : "text-[#6B6560]")} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold", stagnantUnits.length > 0 ? "text-[#DC2626]" : "text-[#1C1917]")}>
              {stagnantUnits.length}
            </span>
            <span className="text-xs text-[#6B6560]">perlu evaluasi harga</span>
          </div>
        </div>

        <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-semibold uppercase tracking-wider">Ready Siap Jual</span>
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#16A34A]">{readyUnits.length}</span>
            <span className="text-xs text-[#6B6560]">siap tayang katalog</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & ACTIONS ─────────────────────────────────── */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B6560] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari plat nomor, merk, atau tipe mobil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Button: Gudang Bahan Habis Pakai & Servis Mandiri */}
          <Link
            href="/admin/workshop"
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#D97706]/40 text-[#92400E] rounded-lg text-sm font-semibold shadow-xs transition-colors"
            title="Kelola persediaan oli, filter, bohlam, salon & alokasikan servis mandiri"
          >
            <Droplet className="w-4 h-4 text-[#D97706]" />
            <span>Gudang Bahan &amp; Servis Mandiri</span>
          </Link>

          {/* Action Button: Import Spreadsheet */}
          <Link
            href="/admin/inventory/import"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] rounded-lg text-sm font-semibold shadow-xs transition-colors"
            title="Import data mobil lama dari file spreadsheet / Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Spreadsheet</span>
          </Link>

          {/* Action Button: Intake Unit Baru */}
          <Link
            href="/admin/inventory/new"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Intake Unit Baru</span>
          </Link>
        </div>
      </div>

      {/* ── STATUS TABS ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#D9D4CB]">
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
                  ? "bg-[#1C1917] text-white shadow-sm"
                  : "bg-[#EFECE8] text-[#6B6560] hover:text-[#1C1917] border border-[#D9D4CB]"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                isSelected ? "bg-white/20 text-white" : "bg-[#D9D4CB] text-[#1C1917]"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── VEHICLES TABLE ────────────────────────────────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#D9D4CB] bg-[#EFECE8] text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                <th className="py-3.5 px-4">Plat & Unit</th>
                <th className="py-3.5 px-4">Spesifikasi</th>
                <th className="py-3.5 px-4">Status & Alur</th>
                <th className="py-3.5 px-4">Umur di Garasi</th>
                <th className="py-3.5 px-4">HPP & Biaya</th>
                <th className="py-3.5 px-4">Target / Batas Bawah</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D4CB]">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B6560]">
                    Tidak ada unit yang cocok dengan filter atau pencarian saat ini.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  return (
                    <tr key={vehicle.id} className="hover:bg-[#EFECE8]/50 transition-colors">
                      {/* Plat & Brand */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-base text-[#1C1917] tracking-tight">
                          {vehicle.plateNumber}
                        </div>
                        <div className="text-xs font-medium text-[#6B6560]">
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div className="text-[11px] text-[#6B6560]/80 mt-1">
                          Sumber: <span className="font-semibold text-[#1C1917]">{vehicle.sourceType}</span>
                          {vehicle.auctionHouse && ` (${vehicle.auctionHouse})`}
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/katalog/${generateVehicleSlug(vehicle)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706] hover:text-[#92400E] hover:underline"
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
                      <td className="py-4 px-4 align-top text-xs text-[#1C1917]">
                        <div>{vehicle.year} • {vehicle.color}</div>
                        <div className="text-[#6B6560]">
                          {vehicle.transmission} • {vehicle.engineCapacity} cc
                        </div>
                        <div className="text-[11px] text-[#6B6560] mt-1">
                          Odo: {vehicle.odometer.toLocaleString("id-ID")} km
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        <StatusBadge status={vehicle.status} />
                        <div className="text-[11px] text-[#6B6560] mt-1.5">
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
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200"
                                  title={`Jatuh tempo: ${new Date(vehicle.taxExpiryDate).toLocaleDateString("id-ID")}`}
                                >
                                  🟡 Pajak Kritis (sisa {diffDays}h)
                                </span>
                              );
                            } else {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  title={`Jatuh tempo: ${new Date(vehicle.taxExpiryDate).toLocaleDateString("id-ID")}`}
                                >
                                  🟢 Pajak Hidup
                                </span>
                              );
                            }
                          })() : (
                            <span className="text-[10px] text-stone-400 italic">Pajak: -</span>
                          )}
                        </div>
                      </td>

                      {/* Umur Garasi */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <AgingBadge days={vehicle.daysInInventory} category={vehicle.agingCategory} />
                        </div>
                        <div className="text-[11px] text-[#6B6560] mt-1">
                          Masuk: {formatDate(vehicle.purchaseDate)}
                        </div>
                      </td>

                      {/* HPP & Biaya */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-sm text-[#1C1917]">
                          {formatRupiah(vehicle.totalHpp)}
                        </div>
                        <div className="text-[11px] text-[#6B6560] mt-0.5">
                          Beli: {formatRupiah(vehicle.purchasePrice)}
                        </div>
                        <div className="text-[11px] text-[#D97706] font-medium mt-0.5">
                          Biaya: +{formatRupiah(vehicle.totalExpenses)}
                        </div>
                      </td>

                      {/* Target & Min Price */}
                      <td className="py-4 px-4 align-top text-xs">
                        {vehicle.targetSellingPrice ? (
                          <div className="font-bold text-[#16A34A]">
                            {formatRupiah(vehicle.targetSellingPrice)}
                          </div>
                        ) : (
                          <span className="text-[#6B6560] italic text-[11px]">Belum diisi</span>
                        )}
                        {vehicle.minSellingPrice && (
                          <div className="text-[11px] text-[#92400E] font-medium mt-0.5" title="Batas Bawah Nego">
                            Bawah: {formatRupiah(vehicle.minSellingPrice)}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          {/* 1. Tombol Aksi Utama Kontekstual Sesuai Status Mobil */}
                          {vehicle.status === "INTAKE" && (
                            <Link
                              href={`/admin/inspections/${vehicle.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#92400E] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Mulai Cek Fisik & Inspeksi 11 Panel"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Cek Fisik</span>
                            </Link>
                          )}

                          {vehicle.status === "IN_REPAIR" && (
                            <Link
                              href={`/admin/inventory/${vehicle.id}/expenses/new`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#92400E] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Catat Biaya Servis / Sparepart"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Catat Servis</span>
                            </Link>
                          )}

                          {vehicle.status === "READY_FOR_SALE" && (
                            <a
                              href={`/api/pdf/spec-tag/${vehicle.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Cetak Tag Gantung Spion Ber-QR Code"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Tag Spion</span>
                            </a>
                          )}

                          {(vehicle.status === "BOOKED" || vehicle.status === "AT_SHOWROOM_PENDING") && (
                            <Link
                              href={`/admin/inventory/${vehicle.id}/status`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs transition-all shrink-0"
                              title="Ubah Status Kendaraan"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Update Status</span>
                            </Link>
                          )}

                          {vehicle.status === "SOLD_SETTLED" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#DCFCE7] text-[#15803D] text-xs font-bold border border-[#16A34A]/30">
                              Terjual Lunas
                            </span>
                          )}

                          {/* Quick Edit Unit & Katalog Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedVehicleForEdit(vehicle)}
                            className="p-1.5 rounded-lg border border-[#D9D4CB] bg-[#EFECE8] hover:bg-[#D9D4CB] text-[#1C1917] transition-colors cursor-pointer shrink-0"
                            title="Edit Data Unit & Informasi Katalog"
                          >
                            <Pencil className="w-4 h-4 text-[#D97706]" />
                          </button>

                          {/* 2. Menu Dropdown [Titik Tiga ...] */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === vehicle.id ? null : vehicle.id);
                              }}
                              className={cn(
                                "p-1.5 rounded-lg border border-[#D9D4CB] transition-colors cursor-pointer",
                                openDropdownId === vehicle.id
                                  ? "bg-[#1C1917] text-white"
                                  : "bg-[#EFECE8] hover:bg-[#D9D4CB] text-[#1C1917]"
                              )}
                              title="Menu Opsi Aksi Lengkap"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Popover Dropdown Menu */}
                            {openDropdownId === vehicle.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#D9D4CB] rounded-xl shadow-xl z-30 py-1.5 text-left text-xs divide-y divide-[#EFECE8]"
                              >
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVehicleForEdit(vehicle);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4 text-[#D97706]" />
                                    <span>Edit Data Unit (Katalog)</span>
                                  </button>

                                  <Link
                                    href={`/admin/inspections/${vehicle.id}`}
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <ClipboardCheck className="w-4 h-4 text-[#D97706]" />
                                    <span>Cek Fisik &amp; Inspeksi</span>
                                  </Link>

                                  <Link
                                    href={`/admin/inventory/${vehicle.id}/expenses/new`}
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <Receipt className="w-4 h-4 text-[#16A34A]" />
                                    <span>Catat Biaya / Servis</span>
                                  </Link>

                                  <Link
                                    href={`/admin/inventory/${vehicle.id}/media`}
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <Camera className="w-4 h-4 text-[#2563EB]" />
                                    <span>Upload Foto &amp; Dokumen</span>
                                  </Link>
                                </div>

                                <div className="py-1">
                                  <a
                                    href={`/api/pdf/workshop-dispatch/${vehicle.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <Wrench className="w-4 h-4 text-[#D97706]" />
                                    <span>Surat Jalan Bengkel (SPK)</span>
                                  </a>

                                  <a
                                    href={`/api/pdf/spec-tag/${vehicle.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <Tag className="w-4 h-4 text-[#7C3AED]" />
                                    <span>Cetak Tag Spion (QR)</span>
                                  </a>
                                </div>

                                <div className="py-1">
                                  <Link
                                    href={`/katalog/${generateVehicleSlug(vehicle)}`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#D97706] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4 text-[#D97706]" />
                                    <span>
                                      {vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR"
                                        ? "Lihat Tampilan Segera Hadir"
                                        : "Lihat di Katalog Publik"}
                                    </span>
                                  </Link>

                                  <Link
                                    href={`/admin/inventory/${vehicle.id}/status`}
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#1C1917] hover:bg-[#F7F5F2] font-semibold transition-colors"
                                  >
                                    <ArrowRight className="w-4 h-4 text-[#6B6560]" />
                                    <span>Ubah Status Kendaraan</span>
                                  </Link>

                                  <a
                                    href={generateCatalogWhatsAppLink("081234567890", {
                                      brand: vehicle.brand,
                                      model: vehicle.model,
                                      year: vehicle.year,
                                      plateNumber: vehicle.plateNumber,
                                      targetSellingPrice: vehicle.targetSellingPrice,
                                      status: vehicle.status,
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#15803D] hover:bg-[#DCFCE7]/60 font-semibold transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                                    <span>Share via WhatsApp</span>
                                  </a>
                                </div>
                              </div>
                            )}
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
      {/* 1. Modal Intake Unit Baru */}
      {showAddModal && (
        <AddVehicleModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newUnit) => {
            setVehicles([newUnit, ...vehicles]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* 1.5 Modal Import Spreadsheet */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-[#D9D4CB] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-[#1C1917]">
                  Import Data Mobil Lama dari Spreadsheet (Excel / CSV)
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-[#6B6560] hover:text-[#1C1917] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ImportSpreadsheetPanel />
          </div>
        </div>
      )}

      {/* 2. Modal Catat Biaya */}
      {selectedVehicleForExpense && (
        <AddExpenseModal
          vehicle={selectedVehicleForExpense}
          onClose={() => setSelectedVehicleForExpense(null)}
          onSuccess={(expenseAmount) => {
            // Update lokal
            setVehicles(
              vehicles.map((v) => {
                if (v.id === selectedVehicleForExpense.id) {
                  const newExpenses = v.totalExpenses + expenseAmount;
                  return {
                    ...v,
                    totalExpenses: newExpenses,
                    totalHpp: v.purchasePrice + newExpenses,
                  };
                }
                return v;
              })
            );
            setSelectedVehicleForExpense(null);
          }}
        />
      )}

      {/* 3. Modal Ubah Status */}
      {selectedVehicleForStatus && (
        <UpdateStatusModal
          vehicle={selectedVehicleForStatus}
          onClose={() => setSelectedVehicleForStatus(null)}
          onSuccess={(updatedStatus) => {
            setVehicles(
              vehicles.map((v) =>
                v.id === selectedVehicleForStatus.id ? { ...v, status: updatedStatus } : v
              )
            );
            setSelectedVehicleForStatus(null);
          }}
        />
      )}
      {/* 4. Modal Upload Media & Dokumen */}
      {selectedVehicleForMedia && (
        <MediaUploadModal
          vehicle={selectedVehicleForMedia}
          onClose={() => setSelectedVehicleForMedia(null)}
        />
      )}

      {/* 5. Modal Edit Data Unit / Katalog */}
      {selectedVehicleForEdit && (
        <EditVehicleModal
          vehicle={selectedVehicleForEdit}
          onClose={() => setSelectedVehicleForEdit(null)}
          onSuccess={(updatedFields) => {
            setVehicles((prev) =>
              prev.map((v) => {
                if (v.id === selectedVehicleForEdit.id) {
                  const newPurchasePrice =
                    updatedFields.purchasePrice !== undefined
                      ? (updatedFields.purchasePrice as number)
                      : v.purchasePrice;
                  const newTotalHpp = newPurchasePrice + v.totalExpenses;
                  return {
                    ...v,
                    ...updatedFields,
                    totalHpp: newTotalHpp,
                  };
                }
                return v;
              })
            );
            setSelectedVehicleForEdit(null);
          }}
        />
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFECE8] text-[#6B6560] border border-[#D9D4CB]">
            Intake Baru
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            <span>Katalog: Segera Hadir</span>
          </span>
        </div>
      );
    case "IN_REPAIR":
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/30">
            Bengkel / Salon
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            <span>Katalog: Segera Hadir</span>
          </span>
        </div>
      );
    case "READY_FOR_SALE":
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30">
            Ready Jual
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <span>Katalog: Tayang Lengkap</span>
          </span>
        </div>
      );
    case "BOOKED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#D97706] font-bold animate-pulse">
          Booked (DP)
        </span>
      );
    case "AT_SHOWROOM_PENDING":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#D9D4CB]">
          Titip Showroom
        </span>
      );
    case "SOLD_SETTLED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1C1917] text-white">
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30 animate-pulse">
        <Clock className="w-3 h-3" />
        {days} hari (Macet)
      </span>
    );
  }

  if (category === "FRESH") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30">
        <Sparkles className="w-3 h-3" />
        {days} hari (Fresh)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFECE8] text-[#6B6560]">
      <Clock className="w-3 h-3" />
      {days} hari
    </span>
  );
}

// ── AUCTION HOUSE PRESETS — estimasi hari kerja BPKB per balai lelang ──────
const AUCTION_HOUSE_PRESETS: Record<string, { label: string; bpkbLeadDays: number; notes: string }> = {
  "JBA":          { label: "JBA (Japan Best Auto)", bpkbLeadDays: 14, notes: "BPKB ~14 hari kerja" },
  "AUKSI":        { label: "AUKSI (Mobil88/Garansindo)", bpkbLeadDays: 7,  notes: "BPKB ~7 hari kerja" },
  "IBID":         { label: "IBID (Graha Buana)", bpkbLeadDays: 10, notes: "BPKB ~10 hari kerja" },
  "SMARTBID":     { label: "SmartBid", bpkbLeadDays: 30, notes: "BPKB ~30 hari kerja" },
  "ADIRA":        { label: "Adira Auction", bpkbLeadDays: 21, notes: "BPKB ~21 hari kerja" },
  "BCA FINANCE":  { label: "BCA Finance Auction", bpkbLeadDays: 14, notes: "BPKB ~14 hari kerja" },
  "STAR AUCTION": { label: "Star Auction", bpkbLeadDays: 14, notes: "BPKB ~14 hari kerja" },
  "LAINNYA":      { label: "Balai Lelang Lainnya", bpkbLeadDays: 14, notes: "Isi estimasi manual" },
};

// ── MODAL INTAKE UNIT BARU ─────────────────────────────────────
function AddVehicleModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (unit: any) => void;
}) {
  const [formData, setFormData] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    odometer: 0,
    transmission: "AUTOMATIC",
    engineCapacity: 1500,
    sourceType: "AUCTION",
    auctionHouse: "JBA",
    auctionLotType: "EKS_PERUSAHAAN",
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    targetSellingPrice: 0,
    minSellingPrice: 0,
    currentLocation: "Garasi Utama",
    bpkbStatus: "PROCESS_1_2_WEEKS",
    bpkbLeadDays: 14,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isAuction = formData.sourceType === "AUCTION";
  const currentPreset = AUCTION_HOUSE_PRESETS[formData.auctionHouse];

  const handleAuctionHouseChange = (house: string) => {
    const preset = AUCTION_HOUSE_PRESETS[house];
    setFormData((prev) => ({
      ...prev,
      auctionHouse: house,
      bpkbLeadDays: preset?.bpkbLeadDays ?? 14,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createVehicleAction({
        ...formData,
        year: Number(formData.year),
        odometer: Number(formData.odometer),
        engineCapacity: Number(formData.engineCapacity),
        purchasePrice: Number(formData.purchasePrice),
        purchaseDate: new Date(formData.purchaseDate),
        targetSellingPrice: formData.targetSellingPrice ? Number(formData.targetSellingPrice) : undefined,
        minSellingPrice: formData.minSellingPrice ? Number(formData.minSellingPrice) : undefined,
        transmission: formData.transmission as any,
        sourceType: formData.sourceType as any,
        auctionLotType: isAuction ? (formData.auctionLotType as any) : undefined,
        bpkbStatus: formData.bpkbStatus as any,
        bpkbLeadDays: Number(formData.bpkbLeadDays),
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Gagal menyimpan unit");
      }

      onSuccess({
        ...res.data,
        purchasePrice: Number(res.data.purchasePrice),
        targetSellingPrice: res.data.targetSellingPrice ? Number(res.data.targetSellingPrice) : null,
        minSellingPrice: res.data.minSellingPrice ? Number(res.data.minSellingPrice) : null,
        totalExpenses: 0,
        totalHpp: Number(res.data.purchasePrice),
        daysInInventory: 0,
        agingCategory: "FRESH",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan unit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#1C1917]">Intake Kendaraan Baru</h2>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Unit baru masuk status <strong>INTAKE</strong>. Setelah siap, ubah ke{" "}
              <strong>Ready Jual</strong> agar tampil di katalog publik.
            </p>
          </div>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {/* FLOW GUIDE */}
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <strong className="block mb-1.5 text-amber-800">📋 Alur Siklus & Tampilan Publik:</strong>
          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            <span className="bg-[#EFECE8] text-[#6B6560] px-2 py-0.5 rounded-full border border-[#D9D4CB]">INTAKE (baru masuk)</span>
            <span className="text-amber-600">→</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">IN_REPAIR (salon/bengkel)</span>
            <span className="text-amber-600">→</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">READY JUAL ✅ (siap tayang 100%)</span>
          </div>
          <p className="mt-1.5 text-amber-800 leading-relaxed">
            💡 <strong>Stok Segera Hadir (Upcoming):</strong> Unit berstatus <em>INTAKE</em> & <em>IN_REPAIR</em> otomatis tayang di katalog publik dengan 1 foto depan & estimasi harga psikologis. Setelah salon & inspeksi selesai, ubah status ke <strong>Ready Jual</strong> untuk membuka galeri 11 foto lengkap & sertifikat inspeksi digital.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plat & Sumber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nomor Plat *</label>
              <input
                required
                type="text"
                placeholder="Contoh: B 1234 CD"
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Sumber Pembelian *</label>
              <select
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              >
                <option value="AUCTION">Balai Lelang</option>
                <option value="BROKER">Makelar / Mediator</option>
                <option value="DIRECT_BUY">Beli Langsung dari Pemakai</option>
              </select>
            </div>
          </div>

          {/* SECTION LELANG */}
          {isAuction && (
            <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-[#1C1917] border-b border-[#EBE7E1] pb-2">
                🏛️ Informasi Balai Lelang & Estimasi BPKB
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Balai Lelang</label>
                  <select
                    value={formData.auctionHouse}
                    onChange={(e) => handleAuctionHouseChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                  >
                    {Object.entries(AUCTION_HOUSE_PRESETS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                  {currentPreset && (
                    <p className="text-[10px] text-[#6B6560] mt-1">📋 {currentPreset.notes}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tipe Lot Lelang</label>
                  <select
                    value={formData.auctionLotType}
                    onChange={(e) => setFormData({ ...formData, auctionLotType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                  >
                    <option value="EKS_PERUSAHAAN">Eks Perusahaan ✅ (BPKB bersih, 7-14 hari)</option>
                    <option value="EKS_TARIKAN_LEASING">Eks Tarikan Leasing ⚠️ (BPKB 14-28 hari)</option>
                    <option value="UNKNOWN">Tidak Diketahui / Belum Konfirmasi</option>
                  </select>
                  {formData.auctionLotType === "EKS_TARIKAN_LEASING" && (
                    <p className="text-[10px] text-orange-700 mt-1 font-semibold">
                      ⚠️ Cek dulu: pajak mati, STNK hilang, tunggakan leasing sebelum ambil!
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Status BPKB Saat Ini</label>
                  <select
                    value={formData.bpkbStatus}
                    onChange={(e) => setFormData({ ...formData, bpkbStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                  >
                    <option value="PROCESS_1_2_WEEKS">Masih Diproses Balai Lelang</option>
                    <option value="READY">BPKB Sudah di Tangan</option>
                    <option value="MUTATION_REQUIRED">Perlu Mutasi / Balik Nama</option>
                    <option value="LOST_NEED_REPLACEMENT">Hilang / Perlu Penggantian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Estimasi BPKB Tiba{" "}
                    <span className="font-normal text-[#6B6560]">(hari kerja — auto dari balai)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={formData.bpkbLeadDays}
                      onChange={(e) => setFormData({ ...formData, bpkbLeadDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-amber-900"
                    />
                    <span className="text-xs text-[#6B6560] whitespace-nowrap">hari kerja</span>
                  </div>
                  <p className="text-[10px] text-[#6B6560] mt-1">
                    Dashboard hitung countdown BPKB dari tanggal beli.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal Beli */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tanggal Pembelian / Menang Lelang *</label>
            <input
              required
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
            />
          </div>

          {/* Merk Model Tahun */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Merk *</label>
              <input
                required
                type="text"
                placeholder="Toyota, Honda, dll"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tipe / Model *</label>
              <input
                required
                type="text"
                placeholder="Avanza Veloz 1.5, dll"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tahun *</label>
              <input
                required
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Spesifikasi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Transmisi</label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              >
                <option value="AUTOMATIC">Automatic (AT)</option>
                <option value="MANUAL">Manual (MT)</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Warna *</label>
              <input
                required
                type="text"
                placeholder="Hitam Metalik, Putih..."
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Odometer (km)</label>
              <input
                type="number"
                min={0}
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">CC Mesin</label>
              <input
                type="number"
                min={500}
                value={formData.engineCapacity}
                onChange={(e) => setFormData({ ...formData, engineCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Harga */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#D9D4CB] pt-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Harga Beli (Rp) *</label>
              <input
                required
                type="number"
                placeholder="150000000"
                value={formData.purchasePrice || ""}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Target Banderol Jual</label>
              <input
                type="number"
                placeholder="165000000"
                value={formData.targetSellingPrice || ""}
                onChange={(e) => setFormData({ ...formData, targetSellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm text-[#16A34A] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Batas Bawah Nego (Net)</label>
              <input
                type="number"
                placeholder="158000000"
                value={formData.minSellingPrice || ""}
                onChange={(e) => setFormData({ ...formData, minSellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm text-[#92400E] font-medium"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Kondisi Unit</label>
            <textarea
              rows={2}
              placeholder="Kondisi fisik, kelengkapan, hal penting lain saat ambil dari lelang..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9D4CB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6B6560] hover:text-[#1C1917] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan & Masukkan ke Garasi (INTAKE)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL CATAT BIAYA ──────────────────────────────────────────
function AddExpenseModal({
  vehicle,
  onClose,
  onSuccess,
}: {
  vehicle: VehicleItem;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) {
  const [category, setCategory] = useState("OIL_AND_SERVICE");
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicleId", vehicle.id);
      formData.append("uploadType", "RECEIPT");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        setReceiptUrl(data.fileUrl);
      }
    } catch (err) {
      console.error("Error uploading receipt:", err);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setLoading(true);

    try {
      const res = await createExpenseAction({
        vehicleId: vehicle.id,
        category: category as any,
        vendorName: vendorName || undefined,
        amount: Number(amount),
        date: new Date(),
        notes: notes || undefined,
        receiptUrl: receiptUrl || undefined,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      onSuccess(Number(amount));
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat biaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">Catat Biaya Unit & HPP</h2>
            <div className="text-xs text-[#6B6560] font-semibold">
              {vehicle.brand} {vehicle.model} ({vehicle.plateNumber})
            </div>
          </div>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Kategori Biaya</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
            >
              <option value="AUCTION_ADMIN_FEE">Biaya Admin Lelang Resmi</option>
              <option value="BROKER_COMMISSION">Komisi Makelar / Mediator</option>
              <option value="OIL_AND_SERVICE">Servis Mesin & Ganti Oli</option>
              <option value="BODY_PAINT">Cat Bodi & Ketok Spet</option>
              <option value="DETAILING_SALON">Salon, Poles, Cuci Kolong</option>
              <option value="SPAREPARTS">Penggantian Sparepart</option>
              <option value="DOCUMENT_TAX_MUTATION">Pajak, STNK & Cabut Berkas Mutasi</option>
              <option value="TRANSPORT_PICKUP">Ongkos Angkut / Towing</option>
              <option value="OTHER">Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nominal Biaya (Rp)</label>
            <input
              required
              type="number"
              placeholder="Contoh: 1500000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold text-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nama Bengkel / Toko / Penerima</label>
            <input
              type="text"
              placeholder="Contoh: Bengkel Cat Barokah / Toko Sparepart Jaya"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Keterangan / Rincian Pengerjaan</label>
            <textarea
              rows={2}
              placeholder="Contoh: Poles bodi + ganti oli transmisi matik"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
            />
          </div>

          {/* Upload Bukti Nota / Kuitansi Fisik */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#1C1917]">
                Bukti Dukung / Foto Nota Fisik (Dianjurkan)
              </label>
              <span className="text-[10px] text-[#6B6560]">Struk / Kuitansi / Bon</span>
            </div>
            <div className="border border-dashed border-[#D9D4CB] rounded-lg p-3 bg-white text-center hover:bg-[#FAF9F6] transition-colors">
              <input
                type="file"
                accept="image/*,application/pdf"
                id="receiptUpload"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadingReceipt ? (
                <div className="text-xs text-[#D97706] font-semibold py-1">
                  Mengunggah bukti nota ke server...
                </div>
              ) : receiptUrl ? (
                <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>✓</span>
                    <span className="truncate">{receiptFileName || "Foto struk terunggah"}</span>
                  </span>
                  <label
                    htmlFor="receiptUpload"
                    className="text-[11px] text-[#D97706] underline cursor-pointer shrink-0 ml-2"
                  >
                    Ganti
                  </label>
                </div>
              ) : (
                <label htmlFor="receiptUpload" className="cursor-pointer block py-1">
                  <div className="text-xs text-[#6B6560]">
                    <span className="font-bold text-[#D97706] underline">Pilih foto/scan nota</span> atau seret file ke sini
                  </div>
                  <div className="text-[10px] text-[#A8A29E] mt-0.5">JPG, PNG, atau PDF max 10MB</div>
                </label>
              )}
            </div>
            <div className="mt-1 flex items-start gap-1 text-[11px] text-[#78716C]">
              <span>ℹ️</span>
              <span>
                Bukti dukung memperkuat transparansi HPP & melindungi hak bagi hasil pemodal.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9D4CB]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6B6560]">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Catat Biaya & Update HPP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL UBAH STATUS ──────────────────────────────────────────
function UpdateStatusModal({
  vehicle,
  onClose,
  onSuccess,
}: {
  vehicle: VehicleItem;
  onClose: () => void;
  onSuccess: (newStatus: string) => void;
}) {
  const currentStatus = vehicle.status as VehicleStatus;
  const allStatuses: VehicleStatus[] = [
    "INTAKE",
    "IN_REPAIR",
    "READY_FOR_SALE",
    "BOOKED",
    "AT_SHOWROOM_PENDING",
    "SOLD_SETTLED",
  ];

  // Filter status yang sah menurut canTransition
  const validTransitions = allStatuses.filter((s) => s !== currentStatus && canTransition(currentStatus, s));

  const [targetStatus, setTargetStatus] = useState<VehicleStatus>(
    validTransitions[0] || currentStatus
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdate = async () => {
    if (!targetStatus || targetStatus === currentStatus) return;
    setLoading(true);

    try {
      const res = await updateVehicleStatusAction(vehicle.id, targetStatus);
      if (!res.success) {
        throw new Error(res.error);
      }
      onSuccess(targetStatus);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengubah status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-4">
          <h2 className="text-base font-bold text-[#1C1917]">Ubah Status Unit</h2>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="text-xs text-[#6B6560]">Unit:</div>
            <div className="font-bold text-sm text-[#1C1917]">
              {vehicle.brand} {vehicle.model} ({vehicle.plateNumber})
            </div>
            <div className="text-xs mt-1">
              Status saat ini: <StatusBadge status={currentStatus} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Pilih Status Baru (Sesuai Aturan Sistem):
            </label>
            {validTransitions.length === 0 ? (
              <div className="p-3 bg-[#EFECE8] rounded-lg text-xs text-[#6B6560]">
                Unit berstatus <strong>{currentStatus}</strong> dan tidak memiliki rute transisi langsung berikutnya.
              </div>
            ) : (
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as VehicleStatus)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-semibold"
              >
                {validTransitions.map((s) => (
                  <option key={s} value={s}>
                    {s === "IN_REPAIR" && "Masuk Pengerjaan (Bengkel/Salon) — Tayang Segera Hadir"}
                    {s === "READY_FOR_SALE" && "Siap Dipasarkan (Ready For Sale) — Tayang Lengkap"}
                    {s === "BOOKED" && "Terima Uang Tanda Jadi (Booked / DP)"}
                    {s === "AT_SHOWROOM_PENDING" && "Titip Jual Showroom (Pending Pelunasan)"}
                    {s === "SOLD_SETTLED" && "Terjual Lunas (Selesai)"}
                  </option>
                ))}
              </select>
            )}

            {targetStatus === "READY_FOR_SALE" && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 mt-2 leading-relaxed">
                ✅ <strong>Ready Jual:</strong> Membuka 11 foto lengkap, skor inspeksi, dan dokumen resmi di katalog publik untuk calon pembeli.
              </p>
            )}
            {(targetStatus === "INTAKE" || targetStatus === "IN_REPAIR") && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2 leading-relaxed">
                ✨ <strong>Segera Hadir:</strong> Unit akan tampil di katalog publik dengan 1 foto depan dan perkiraan harga estimasi.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9D4CB]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6B6560]">
              Batal
            </button>
            <button
              type="button"
              disabled={loading || validTransitions.length === 0}
              onClick={handleUpdate}
              className="px-5 py-2 bg-[#1C1917] hover:bg-[#D97706] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Update Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODAL UPLOAD MEDIA & DOKUMEN ──────────────────────────────
function MediaUploadModal({
  vehicle,
  onClose,
}: {
  vehicle: VehicleItem;
  onClose: () => void;
}) {
  const [uploadType, setUploadType] = useState<"PHOTO" | "DOCUMENT">("PHOTO");
  const [photoCategory, setPhotoCategory] = useState("CONDITION_INTAKE");
  const [docType, setDocType] = useState("STNK_SCAN");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicleId", vehicle.id);
      formData.append("uploadType", uploadType);
      if (uploadType === "PHOTO") {
        formData.append("category", photoCategory);
      } else {
        formData.append("docType", docType);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah file");
      }

      setMsg({ type: "success", text: "File berhasil disimpan ke server!" });
      setFile(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal mengunggah file" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">Upload Media & Dokumen</h2>
            <div className="text-xs text-[#6B6560] font-semibold">
              {vehicle.brand} {vehicle.model} ({vehicle.plateNumber})
            </div>
          </div>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {msg && (
          <div
            className={cn(
              "mb-4 p-3 rounded-lg text-xs font-semibold border",
              msg.type === "success"
                ? "bg-[#DCFCE7] border-[#16A34A]/30 text-[#16A34A]"
                : "bg-[#FEE2E2] border-[#DC2626]/30 text-[#DC2626]"
            )}
          >
            {msg.text}
          </div>
        )}

        {/* Tipe Upload Tab */}
        <div className="flex gap-2 p-1 bg-[#EFECE8] rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setUploadType("PHOTO")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
              uploadType === "PHOTO" ? "bg-white text-[#1C1917] shadow-sm" : "text-[#6B6560]"
            )}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto Fisik</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadType("DOCUMENT")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
              uploadType === "DOCUMENT" ? "bg-white text-[#1C1917] shadow-sm" : "text-[#6B6560]"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scan Dokumen</span>
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {uploadType === "PHOTO" ? (
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Kategori Foto</label>
              <select
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              >
                <option value="CONDITION_INTAKE">Kondisi Saat Intake (Baru Datang)</option>
                <option value="CONDITION_BEFORE_REPAIR">Sebelum Perbaikan / Baret</option>
                <option value="CONDITION_AFTER_REPAIR">Setelah Selesai Pengerjaan</option>
                <option value="FINAL_LISTING">Foto Siap Tayang Katalog</option>
                <option value="DOCUMENT_PROOF">Bukti Fisik / Nota Fisik</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Jenis Dokumen</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              >
                <option value="STNK_SCAN">Scan STNK (Pajak)</option>
                <option value="BPKB_SCAN">Scan BPKB</option>
                <option value="FAKTUR">Faktur Pembelian Asli</option>
                <option value="KUITANSI">Kuitansi / Kwitansi Gesek</option>
                <option value="KTP_PEMILIK">Fotokopi/Scan KTP Pemilik Asal</option>
                <option value="OTHER">Dokumen Lainnya</option>
              </select>
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Pilih File</label>
            <input
              required
              type="file"
              accept={uploadType === "PHOTO" ? "image/*" : "image/*,application/pdf"}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-[#6B6560] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1C1917] file:text-white hover:file:bg-[#D97706] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9D4CB]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6B6560]">
              Tutup
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? "Mengunggah..." : "Upload Sekarang"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL EDIT DATA UNIT (KATALOG) ──────────────────────────────
function EditVehicleModal({
  vehicle,
  onClose,
  onSuccess,
}: {
  vehicle: VehicleItem;
  onClose: () => void;
  onSuccess: (updated: Partial<VehicleItem>) => void;
}) {
  const [formData, setFormData] = useState({
    plateNumber: vehicle.plateNumber || "",
    brand: vehicle.brand || "",
    model: vehicle.model || "",
    year: vehicle.year || new Date().getFullYear(),
    color: vehicle.color || "",
    transmission: vehicle.transmission || "AUTOMATIC",
    engineCapacity: vehicle.engineCapacity || 1500,
    odometer: vehicle.odometer || 0,
    purchasePrice: vehicle.purchasePrice || 0,
    purchaseDate: vehicle.purchaseDate
      ? new Date(vehicle.purchaseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    targetSellingPrice: vehicle.targetSellingPrice ?? "",
    minSellingPrice: vehicle.minSellingPrice ?? "",
    currentLocation: vehicle.currentLocation || "Garasi Utama",
    notes: vehicle.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await updateVehicleAction(vehicle.id, {
        plateNumber: formData.plateNumber,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        color: formData.color,
        transmission: formData.transmission as any,
        engineCapacity: Number(formData.engineCapacity),
        odometer: Number(formData.odometer),
        purchasePrice: Number(formData.purchasePrice),
        purchaseDate: new Date(formData.purchaseDate),
        targetSellingPrice:
          formData.targetSellingPrice !== "" ? Number(formData.targetSellingPrice) : null,
        minSellingPrice:
          formData.minSellingPrice !== "" ? Number(formData.minSellingPrice) : null,
        currentLocation: formData.currentLocation,
        notes: formData.notes,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui data kendaraan");
      }

      onSuccess({
        plateNumber: formData.plateNumber.toUpperCase().trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: Number(formData.year),
        color: formData.color.trim(),
        transmission: formData.transmission,
        engineCapacity: Number(formData.engineCapacity),
        odometer: Number(formData.odometer),
        purchasePrice: Number(formData.purchasePrice),
        purchaseDate: formData.purchaseDate,
        targetSellingPrice:
          formData.targetSellingPrice !== "" ? Number(formData.targetSellingPrice) : null,
        minSellingPrice:
          formData.minSellingPrice !== "" ? Number(formData.minSellingPrice) : null,
        currentLocation: formData.currentLocation.trim(),
        notes: formData.notes,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui data unit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-300">
              <Pencil className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C1917]">Edit Data Unit &amp; Informasi Katalog</h2>
              <p className="text-xs text-[#6B6560]">
                {vehicle.plateNumber} • {vehicle.brand} {vehicle.model} ({vehicle.year})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bagian 1: Identitas Pokok */}
          <div className="bg-white border border-[#D9D4CB] rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#1C1917] border-b border-[#EBE7E1] pb-2 flex items-center gap-2">
              <CarFront className="w-4 h-4 text-[#D97706]" />
              <span>Identitas &amp; Dokumen Pokok Unit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Nomor Plat Kendaraan *
                </label>
                <input
                  required
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Tanggal Beli / Intake *
                </label>
                <input
                  required
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Merk *</label>
                <input
                  required
                  type="text"
                  placeholder="Toyota, Honda, dll"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Tipe / Model *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Innova Reborn, Brio RS, dll"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tahun *</label>
                <input
                  required
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Spesifikasi & Posisi */}
          <div className="bg-white border border-[#D9D4CB] rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#1C1917] border-b border-[#EBE7E1] pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <span>Spesifikasi Mesin, Transmisi &amp; Lokasi</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Transmisi</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                >
                  <option value="AUTOMATIC">Automatic (AT)</option>
                  <option value="MANUAL">Manual (MT)</option>
                  <option value="CVT">CVT</option>
                  <option value="DCT">DCT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Warna *</label>
                <input
                  required
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Odometer (km)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.odometer}
                  onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">CC Mesin</label>
                <input
                  type="number"
                  min={500}
                  value={formData.engineCapacity}
                  onChange={(e) =>
                    setFormData({ ...formData, engineCapacity: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Lokasi Parkir / Garasi
              </label>
              <input
                type="text"
                placeholder="Garasi Utama, Salon AutoClean, dll"
                value={formData.currentLocation}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Bagian 3: Harga Beli & Listing Katalog */}
          <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#1C1917] border-b border-[#EBE7E1] pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#16A34A]" />
                <span>Modal Beli &amp; Harga Jual Katalog</span>
              </span>
              <span className="text-[11px] font-normal text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Otomatis update tampilan website publik
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Harga Beli / Modal (Rp) *
                </label>
                <input
                  required
                  type="number"
                  value={formData.purchasePrice || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Target Listing Katalog (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Harga pasang di website"
                  value={formData.targetSellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, targetSellingPrice: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Batas Bawah Nego (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Acuan negosiasi sales"
                  value={formData.minSellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, minSellingPrice: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-[#92400E]"
                />
              </div>
            </div>
          </div>

          {/* Bagian 4: Catatan Unit */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Catatan Unit / Kondisi Tambahan
            </label>
            <textarea
              rows={3}
              placeholder="Catatan kondisi, kelengkapan, riwayat servis, atau instruksi khusus..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm resize-none focus:outline-none focus:border-[#D97706]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9D4CB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6B6560] hover:text-[#1C1917] font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  <span>Simpan Perubahan Unit &amp; Katalog</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
