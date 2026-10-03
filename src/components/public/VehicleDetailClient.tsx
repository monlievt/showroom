"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  Gauge,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Phone,
  FileDown,
  Play,
  FileCheck,
  MapPin,
  Palette,
  Wrench,
  Fuel,
  Eye,
  FileText,
  Archive,
  Sparkles,
  Clock,
} from "lucide-react";
import { formatRupiah, formatDate, formatUpcomingPrice, cn } from "@/lib/utils";
import { generateCatalogWhatsAppLink } from "@/lib/utils/whatsapp";
import { 
  PANEL_LABELS, 
  getPaintMicronCategory, 
  getBrandPaintStandard,
  calculateOverallVehiclePaint,
  calculateMultiPointAnalysis 
} from "@/lib/calculations/inspection";
import { VehicleSpecsTable } from "@/components/inspection/VehicleSpecsTable";
import { InspectionChecklistTabs } from "@/components/inspection/InspectionChecklistTabs";
import { VehicleGallery } from "@/components/public/VehicleGallery";

interface VehicleDetailProps {
  vehicle: {
    id: string;
    slug: string;
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
    taxExpiryDate?: string | Date | null;
    price: number | null;
    status: string;
    soldDate?: string | Date | null;
    location: string;
    stnkStatus: string;
    bpkbStatus: string;
    youtubeVideoId?: string | null;
    notes?: string | null;
    photos: Array<{
      id: string;
      fileUrl: string;
      category: string;
    }>;
    inspection?: {
      id: string;
      engineGrade: string;
      interiorGrade: string;
      exteriorGrade: string;
      frameGrade: string;
      accidentHistory: boolean;
      floodHistory: boolean;
      engineNotes?: string | null;
      interiorNotes?: string | null;
      exteriorNotes?: string | null;
      inspectedAt: string | Date;
      panels: Array<{
        panelType: string;
        paintThickness?: number | null;
        pointRight?: number | null;
        pointCenter?: number | null;
        pointLeft?: number | null;
        pointExtra?: number | null;
        condition: string;
        defectCode?: string | null;
        notes?: string | null;
      }>;
    } | null;
  };
}

export function VehicleDetailClient({ vehicle }: VehicleDetailProps) {
  const isBooked = vehicle.status === "BOOKED";
  const isSold = vehicle.status === "SOLD_SETTLED";
  const isUpcoming = vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR";
  const brandCalibration = getBrandPaintStandard(vehicle.brand);
  const overallPaintStats = vehicle.inspection?.panels
    ? calculateOverallVehiclePaint(vehicle.inspection.panels, vehicle.brand)
    : null;

  const waLink = generateCatalogWhatsAppLink("081234567890", {
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    plateNumber: vehicle.plateNumber,
    targetSellingPrice: vehicle.price,
    status: vehicle.status,
  });

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6560]">
        <Link href="/" className="hover:text-[#D97706]">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/katalog" className="hover:text-[#D97706]">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-[#1C1917]">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </span>
      </div>

      {/* Main Grid: Gallery on Left, Specs & CTA on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Galeri Foto & Video YouTube (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Komponen Galeri Foto Terkategori dengan Tag Sektor & Lightbox */}
          <VehicleGallery
            photos={vehicle.photos}
            brand={vehicle.brand}
            model={vehicle.model}
            isBooked={isBooked}
            isSold={isSold}
            status={vehicle.status}
            youtubeVideoId={vehicle.youtubeVideoId}
          />

          {/* Video Walkaround YouTube (ARCHITECTURE.md §14.3) */}
          {vehicle.youtubeVideoId && (
            <div className="bg-white rounded-2xl border border-[#D9D4CB] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-red-600 fill-current" />
                <h3 className="font-bold text-sm text-[#1C1917]">
                  Video Walkaround & Review Kondisi Unit
                </h3>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${vehicle.youtubeVideoId}`}
                  title={`Walkaround ${vehicle.brand} ${vehicle.model}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Rincian Unit, Harga & WhatsApp CTA (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                  {vehicle.brand} • {vehicle.year}
                </span>
                {isSold ? (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-stone-900 text-amber-400 border border-amber-500/40 shadow-sm flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>TERJUAL</span>
                  </span>
                ) : isUpcoming ? (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SEGERA HADIR</span>
                  </span>
                ) : isBooked ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                    Sudah Dibooking (DP)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                    Tersedia di Showroom
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                {vehicle.model}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B6560] font-medium">
                <span>Plat: <strong>{vehicle.plateNumber}</strong></span>
                <span>•</span>
                <span>Warna: {vehicle.color}</span>
              </div>
            </div>

            {/* Banner Persiapan Unit Segera Hadir (Upcoming) */}
            {isUpcoming && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#1C1917] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tahap Persiapan & Detailing Salon</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Unit ini baru saja tiba di garasi kami dan sedang dalam proses inspeksi fisik menyeluruh, perbaikan minor, dan salon detailing. Foto resmi dan hasil inspeksi lengkap akan ditayangkan setelah unit siap. Anda dapat memesan (booking) lebih awal agar tidak didahului pembeli lain.
                </p>
              </div>
            )}

            {/* Banner Arsip Transaksi Unit Terjual */}
            {isSold && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#1C1917] space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Resmi Terjual & Diserahterimakan</span>
                  </div>
                  {vehicle.soldDate && (
                    <span className="text-[11px] font-bold text-stone-700 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                      Terjual: {formatDate(vehicle.soldDate)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Unit telah diserahterimakan kepada pembeli (BAST). Halaman ini disimpan sebagai arsip rekam jejak kondisi fisik dan sertifikat inspeksi digital terverifikasi.
                </p>
              </div>
            )}

            {/* Harga */}
            <div
              className={cn(
                "p-4 rounded-xl border space-y-1.5",
                isSold
                  ? "bg-stone-100/80 border-stone-300"
                  : isUpcoming
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-[#FAF9F6] border-[#EBE7E1]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6560] font-medium block">
                  {isSold
                    ? "Harga Penawaran Terakhir:"
                    : isUpcoming
                    ? "Estimasi Kisaran Harga:"
                    : "Harga Tunai (Cash / Tukar Tambah):"}
                </span>
              </div>

              {isSold ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-bold text-stone-400 line-through tracking-tight">
                      {vehicle.price ? formatRupiah(vehicle.price) : "Hubungi Kami"}
                    </span>
                    <span className="text-xs font-medium text-stone-500">
                      (Harga listing saat aktif)
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    *Unit telah lunas dan diserahterimakan. Harga di atas adalah harga acuan penawaran sebelum unit laku.
                  </span>
                </div>
              ) : isUpcoming ? (
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">
                    {formatUpcomingPrice(vehicle.price)}
                  </div>
                  <span className="text-[11px] text-amber-800/80 block">
                    *Harga final akan ditetapkan setelah proses rekondisi & detailing selesai. Booking prioritas tanpa komitmen tersedia.
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-[#1C1917] tracking-tight">
                    {vehicle.price ? formatRupiah(vehicle.price) : "Hubungi Kami"}
                  </div>
                  <span className="text-[11px] text-[#6B6560] block">
                    *Negosiasi langsung di tempat setelah cek fisik & test drive.
                  </span>
                </>
              )}
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6]">
                <div className="flex items-center gap-1.5 text-[#6B6560] mb-1">
                  <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Kilometer (Odo)</span>
                </div>
                <div className="font-bold text-[#1C1917] text-sm">
                  {vehicle.odometer.toLocaleString("id-ID")} KM
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6]">
                <div className="flex items-center gap-1.5 text-[#6B6560] mb-1">
                  <Car className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Transmisi</span>
                </div>
                <div className="font-bold text-[#1C1917] text-sm">
                  {vehicle.transmission}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6]">
                <div className="flex items-center gap-1.5 text-[#6B6560] mb-1">
                  <Fuel className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Kapasitas Mesin</span>
                </div>
                <div className="font-bold text-[#1C1917] text-sm">
                  {vehicle.engineCapacity.toLocaleString("id-ID")} CC
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6]">
                <div className="flex items-center gap-1.5 text-[#6B6560] mb-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Dokumen (BPKB/STNK)</span>
                </div>
                <div className="font-bold text-emerald-700 text-sm">
                  {vehicle.bpkbStatus === "READY" ? "Lengkap & Ready" : "Dalam Proses"}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Utama: WhatsApp & PDF Download */}
            <div className="space-y-3 pt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow cursor-pointer ${
                  isSold
                    ? "bg-stone-800 hover:bg-stone-900 text-white"
                    : isUpcoming
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-[#D97706] hover:bg-[#B45309] text-white"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>
                  {isSold
                    ? "Unit Sudah Terjual — Tanya Unit Serupa"
                    : isUpcoming
                    ? "Minat Unit Ini? Booking Duluan / Tanya via WA"
                    : "Tanya Admin / Booking Unit Cepat"}
                </span>
              </a>

              {vehicle.inspection && (
                <a
                  href={`/api/pdf/inspection/${vehicle.inspection.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] py-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-[#D97706]" />
                  <span>Unduh Sertifikat Inspeksi Resmi (PDF)</span>
                </a>
              )}
            </div>

            {/* Lokasi Garasi (Hanya tampil untuk unit yang belum terjual) */}
            {!isSold && vehicle.location && (
              <div className="flex items-center gap-2 text-xs text-[#6B6560] pt-2 border-t border-[#EBE7E1]">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Lokasi unit saat ini: <strong>{vehicle.location}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 1. DETAIL SPESIFIKASI KENDARAAN & DOKUMEN (STANDAR IBID ACV) ── */}
      <VehicleSpecsTable vehicle={vehicle} inspection={vehicle.inspection} />

      {/* ── 2. LEMBAR INSPEKSI MENYELURUH & PETA BODI INTERAKTIF (CHECKLIST 5 TAB) ── */}
      {vehicle.inspection ? (
        <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-8 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                <span>Transparansi Standar Cek Fisik & Balai Lelang</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                Lembar Hasil Inspeksi Fisik & Uji 15 Titik Panel Cat
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6560] mt-1">
                Tanggal inspeksi: {formatDate(vehicle.inspection.inspectedAt)}. Tidak ada yang ditutupi — apa adanya, rusak dibilang rusak.
              </p>
            </div>

            {/* Quick Action Buttons for Certificate */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/inspeksi/${vehicle.inspection.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Sertifikat Digital</span>
              </Link>
              <a
                href={`/api/pdf/inspection/${vehicle.inspection.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] hover:bg-[#F7F5F2] text-[#1C1917] text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                title="Unduh File PDF"
              >
                <FileText className="w-4 h-4 text-[#6B6560]" />
                <span className="hidden sm:inline">PDF</span>
              </a>
            </div>
          </div>

          {/* Checklist 5 Tab Interaktif dengan Siluet Mobil Blueprint & 14 Titik Rangka */}
          <InspectionChecklistTabs
            panels={vehicle.inspection.panels}
            inspection={vehicle.inspection}
            brand={vehicle.brand}
            model={vehicle.model}
          />

          {/* Tabel Uji Mikron 15 Panel Body & Rata-rata Keseluruhan */}
          <div className="space-y-4">
            {overallPaintStats && overallPaintStats.totalPoints > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl border border-[#EBE7E1] bg-gradient-to-br from-white via-[#FAF9F6] to-[#F5F2EC] shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EBE7E1]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1C1917] text-white tracking-wider uppercase">
                        Standar Uji Coating Gauge
                      </span>
                      <span className="text-xs text-[#6B6560]">
                        Multi-Point Digital Coating Gauge
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1C1917]">
                      Hasil Rata-rata Ketebalan Cat Bodi Keseluruhan
                    </h3>
                    <p className="text-xs text-[#6B6560]">
                      Diukur di {overallPaintStats.totalPoints} titik uji presisi (3 titik per panel, 4 titik panel atap). Toleransi disparitas belang: maks. 30 µm per panel.
                    </p>
                  </div>

                  <div className="flex items-baseline md:items-end flex-col bg-white p-3.5 rounded-xl border border-[#EBE7E1] shadow-xs shrink-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6560]">
                      Rata-Rata Total Bodi
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          "text-3xl font-black tracking-tight",
                          overallPaintStats.overallCondition === "ORIGINAL_FACTORY"
                            ? "text-emerald-700"
                            : overallPaintStats.overallCondition === "PARTIAL_REPAINT"
                              ? "text-amber-700"
                              : "text-red-600"
                        )}
                      >
                        {overallPaintStats.overallAverage}
                      </span>
                      <span className="text-sm font-bold text-[#6B6560]">µm (mikron)</span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded mt-1",
                        overallPaintStats.overallCondition === "ORIGINAL_FACTORY"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : overallPaintStats.overallCondition === "PARTIAL_REPAINT"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                      )}
                    >
                      {overallPaintStats.overallConditionLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#EBE7E1]">
                    <span className="text-[#6B6560] block text-[11px]">Titik Terukur</span>
                    <strong className="text-[#1C1917] text-sm font-bold">
                      {overallPaintStats.totalPoints} Titik Sensor
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#EBE7E1]">
                    <span className="text-[#6B6560] block text-[11px]">Rentang Bacaan (Min - Max)</span>
                    <strong className="text-[#1C1917] text-sm font-bold">
                      {overallPaintStats.minMicron} – {overallPaintStats.maxMicron} µm
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#EBE7E1]">
                    <span className="text-[#6B6560] block text-[11px]">Status Belang (Δ &gt; 30 µm)</span>
                    <strong
                      className={cn(
                        "text-sm font-bold",
                        overallPaintStats.belangPanelsCount === 0 ? "text-emerald-700" : "text-amber-700"
                      )}
                    >
                      {overallPaintStats.belangPanelsCount === 0 ? "0 Panel (Presisi Merata)" : `${overallPaintStats.belangPanelsCount} Panel Belang/Spet`}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/70 border border-[#EBE7E1]">
                    <span className="text-[#6B6560] block text-[11px]">Acuan OEM {vehicle.brand}</span>
                    <strong className="text-[#1C1917] text-sm font-bold">
                      {brandCalibration.typicalRange} (Maks. {brandCalibration.originalMax} µm)
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
              <div>
                <h3 className="font-bold text-[#1C1917] text-base">
                  Rincian Uji Mikron Tiap Titik Panel Bodi (Standar 3 Titik & Atap 4 Titik)
                </h3>
                <p className="text-xs text-[#6B6560]">
                  Terkalibrasi Standar OEM: <strong className="text-[#1C1917]">{brandCalibration.brandGroupName}</strong> ({brandCalibration.typicalRange})
                </p>
              </div>
              {/* Legend Ketebalan Cat Dinamis Berdasarkan Merk */}
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[#6B6560]">≤{brandCalibration.originalMax} µm (Original)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[#6B6560]">{brandCalibration.originalMax + 1}–{brandCalibration.repaintMax} µm (Repaint)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[#6B6560]">&gt;{brandCalibration.repaintMax} µm (Dempul)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vehicle.inspection.panels.map((p) => {
                const label = PANEL_LABELS[p.panelType as keyof typeof PANEL_LABELS] || p.panelType;

                // Multi-point analysis
                const points = [p.pointRight, p.pointCenter, p.pointLeft, p.pointExtra].filter(
                  (val): val is number => typeof val === "number" && !isNaN(val)
                );
                const hasPoints = points.length > 0;
                const pointStats = hasPoints ? calculateMultiPointAnalysis(points, 30) : null;
                const effectiveMicron = pointStats?.average ?? p.paintThickness;
                const cat =
                  effectiveMicron !== undefined && effectiveMicron !== null
                    ? getPaintMicronCategory(effectiveMicron, vehicle.brand)
                    : null;

                const isRoof = p.panelType === "ROOF";

                return (
                  <div
                    key={p.panelType}
                    className={cn(
                      "p-3.5 rounded-xl border flex flex-col justify-between transition-all",
                      pointStats?.isBelang
                        ? "border-amber-300 bg-amber-50/40"
                        : "border-[#EBE7E1] bg-[#FAF9F6]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-xs text-[#1C1917] block">{label}</span>
                        <span className="text-[11px] text-[#6B6560]">
                          Kondisi: {p.condition} {p.defectCode ? `(${p.defectCode})` : ""}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        {effectiveMicron !== null && effectiveMicron !== undefined ? (
                          <>
                            <span
                              className={cn(
                                "font-extrabold text-sm block",
                                cat === "ORIGINAL"
                                  ? "text-emerald-700"
                                  : cat === "REPAINT"
                                    ? "text-amber-700"
                                    : "text-red-600"
                              )}
                            >
                              {effectiveMicron} µm
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#6B6560]">
                              {hasPoints ? `Rata-rata • ${cat}` : cat}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#6B6560]">-</span>
                        )}
                      </div>
                    </div>

                    {/* Titik-titik Pengukuran Detail jika ada */}
                    {hasPoints && (
                      <div className="mt-3 pt-2.5 border-t border-[#EBE7E1]/70">
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="p-1.5 rounded bg-white border border-[#EBE7E1] text-[10px]">
                            <span className="text-[#6B6560] block text-[9px]">
                              {isRoof ? "Kanan Dpn" : "Kanan"}
                            </span>
                            <strong className="text-[#1C1917] font-semibold">{p.pointRight ?? "-"} µm</strong>
                          </div>
                          <div className="p-1.5 rounded bg-white border border-[#EBE7E1] text-[10px]">
                            <span className="text-[#6B6560] block text-[9px]">
                              {isRoof ? "Kanan Blk" : "Tengah"}
                            </span>
                            <strong className="text-[#1C1917] font-semibold">{p.pointCenter ?? "-"} µm</strong>
                          </div>
                          <div className="p-1.5 rounded bg-white border border-[#EBE7E1] text-[10px]">
                            <span className="text-[#6B6560] block text-[9px]">
                              {isRoof ? "Kiri Dpn" : "Kiri"}
                            </span>
                            <strong className="text-[#1C1917] font-semibold">{p.pointLeft ?? "-"} µm</strong>
                          </div>
                        </div>
                        {isRoof && p.pointExtra !== null && p.pointExtra !== undefined && (
                          <div className="mt-1 text-center p-1 rounded bg-white border border-[#EBE7E1] text-[10px]">
                            <span className="text-[#6B6560] text-[9px]">Kiri Blk: </span>
                            <strong className="text-[#1C1917] font-semibold">{p.pointExtra} µm</strong>
                          </div>
                        )}

                        {/* Disparitas / Belang Alert */}
                        {pointStats && (
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-[#6B6560]">
                              Disparitas: <strong>Δ {pointStats.delta} µm</strong>
                            </span>
                            {pointStats.isBelang ? (
                              <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">
                                ⚠️ Belang / Spet Sebagian
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                ✓ Rata Presisi
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-[#D97706]" />
                <span>Tahap Pengecekan 160 Titik Sedang Berjalan</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                Lembar Hasil Inspeksi Fisik &amp; Uji 15 Titik Panel Cat
              </h2>
              <p className="text-xs text-[#6B6560] mt-1 max-w-2xl">
                Unit ini baru tiba di garasi showroom kami dan sedang dalam antrean inspeksi menyeluruh oleh teknisi. Hasil uji ketebalan cat bodi (mikron), uji fungsi mesin, indikator MIL/airbag, dan deteksi bebas banjir akan dipublikasikan secara lengkap begitu unit siap tayang (*Ready for Sale*).
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Sertifikat Digital Dalam Proses</span>
            </div>
          </div>

          {/* Preview Tab Checklist Transparan yang Akan Diuji */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                <span>1. Ketebalan Cat 15 Titik Bodi</span>
              </div>
              <p className="text-[11px] text-[#6B6560] leading-relaxed">
                Sensor mikron digital untuk membedakan cat asli pabrik (ori kaleng), repaint tipis, atau bekas dempul benturan.
              </p>
              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                Menunggu Uji Alat
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <Wrench className="w-4 h-4 text-[#D97706]" />
                <span>2. Ruang Mesin &amp; Kompresi</span>
              </div>
              <p className="text-[11px] text-[#6B6560] leading-relaxed">
                Cek rembesan oli, suara klep/timing chain, getaran engine mounting, dan kepekatan gas buang knalpot.
              </p>
              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                Menunggu Uji Mesin
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
                <span>3. Uji Rangka Bebas Laka</span>
              </div>
              <p className="text-[11px] text-[#6B6560] leading-relaxed">
                Inspeksi apron depan, tulang sasis utama, pilar A/B/C, sealer pintu, dan lantai bagasi untuk garansi bebas tabrak.
              </p>
              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                Menunggu Uji Sasis
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <FileCheck className="w-4 h-4 text-[#D97706]" />
                <span>4. Deteksi Rendaman Banjir</span>
              </div>
              <p className="text-[11px] text-[#6B6560] leading-relaxed">
                Pemeriksaan kolong dasbor, rel jok, soket sekring, dan modul ECU untuk menjamin 0% residu lumpur banjir.
              </p>
              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                Menunggu Uji Banjir
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
