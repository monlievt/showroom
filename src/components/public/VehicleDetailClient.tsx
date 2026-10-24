"use client";

import React from "react";
import Link from "next/link";
import {
  Car,
  Gauge,
  Phone,
  FileDown,
  Play,
  FileCheck,
  MapPin,
  Fuel,
  Eye,
  FileText,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah, formatDate, formatUpcomingPrice, cn } from "@/lib/utils";
import { generateCatalogWhatsAppLink } from "@/lib/utils/whatsapp";
import {
  PANEL_LABELS,
  getPaintMicronCategory,
  getBrandPaintStandard,
  calculateOverallVehiclePaint,
  calculateMultiPointAnalysis,
} from "@/lib/calculations/inspection";
import { VehicleSpecsTable } from "@/components/inspection/VehicleSpecsTable";
import { InspectionChecklistTabs } from "@/components/inspection/InspectionChecklistTabs";
import { VehicleGallery } from "@/components/public/VehicleGallery";
import { InspectionBar } from "@/components/public/InspectionBar";

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
      tag?: string | null;
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
  const isSold = vehicle.status === "SOLD_SETTLED" || vehicle.status === "SOLD";
  const isUpcoming = vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR";
  const isReady = vehicle.status === "READY_FOR_SALE" || vehicle.status === "READY";

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
      {/* 1. Breadcrumb (§6.3: 13px --muted) */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--ink)] transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/katalog" className="hover:text-[var(--ink)] transition-colors">
          Katalog Unit
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-medium">
          {vehicle.brand} {vehicle.model}
        </span>
      </nav>

      {/* 2. Dua Kolom di Desktop (≥960px): Kiri Galeri, Kanan Kartu Ringkasan Sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Galeri Foto & Walkaround (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <VehicleGallery
            photos={vehicle.photos}
            brand={vehicle.brand}
            model={vehicle.model}
            isBooked={isBooked}
            isSold={isSold}
            status={vehicle.status}
            youtubeVideoId={vehicle.youtubeVideoId}
          />

          {/* Video Walkaround YouTube jika ada */}
          {vehicle.youtubeVideoId && (
            <div className="bg-[var(--surface)] rounded-[var(--r-card)] border border-[var(--line)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-red-600 fill-current" />
                <h3 className="font-bold text-[14px] text-[var(--ink)]">
                  Video Walkaround &amp; Review Unit
                </h3>
              </div>
              <div className="relative aspect-video rounded-[8px] overflow-hidden bg-black">
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

        {/* Kolom Kanan: Kartu Ringkasan Sticky (5 cols) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-[80px]">
          <div className="bg-[var(--surface)] rounded-[var(--r-card)] border border-[var(--line)] p-6 space-y-4 shadow-xs">
            {/* Status Badge & Nama Unit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[var(--muted)]">
                  {vehicle.year} · {vehicle.transmission === "AUTOMATIC" ? "Otomatis" : vehicle.transmission === "MANUAL" ? "Manual" : vehicle.transmission} · {vehicle.odometer.toLocaleString("id-ID")} km
                </span>
                {isSold ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[var(--muted)] border border-[var(--line)]">
                    TERJUAL
                  </span>
                ) : isUpcoming ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[var(--warn)] border border-[var(--line)]">
                    SEGERA HADIR
                  </span>
                ) : isBooked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[var(--warn)] border border-[var(--line)]">
                    BOOKED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[var(--ok)] border border-[var(--line)]">
                    READY
                  </span>
                )}
              </div>

              <h1 className="text-[26px] font-bold text-[var(--ink)] leading-tight tracking-[-0.015em]">
                {vehicle.brand} {vehicle.model}
              </h1>

              <div className="text-[13px] text-[var(--muted)]">
                Plat {vehicle.plateNumber} · Warna {vehicle.color}
              </div>
            </div>

            {/* Harga 28px/700 */}
            <div className="py-2 border-y border-[var(--line)] space-y-0.5">
              <div className="text-[12px] text-[var(--muted)]">
                {isSold ? "Harga realisasi transaksi:" : "Harga cash / tunai:"}
              </div>
              <div className="text-[28px] font-bold text-[var(--ink)] tracking-tight">
                {vehicle.price ? formatRupiah(vehicle.price) : "Hubungi Kami"}
              </div>
            </div>

            {/* Quick Inspection Summary Bar */}
            <div className="space-y-1">
              <div className="text-[12px] font-medium text-[var(--muted)]">
                Ringkasan uji mikron 8 zona:
              </div>
              <InspectionBar
                panels={vehicle.inspection?.panels || null}
                plateNumber={vehicle.plateNumber}
              />
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-[13px] pt-1">
              <div className="p-2.5 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block">Transmisi</span>
                <span className="font-semibold text-[var(--ink)]">{vehicle.transmission}</span>
              </div>
              <div className="p-2.5 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block">Kapasitas Mesin</span>
                <span className="font-semibold text-[var(--ink)]">{vehicle.engineCapacity.toLocaleString("id-ID")} cc</span>
              </div>
              <div className="p-2.5 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block">Dokumen BPKB</span>
                <span className="font-semibold text-[var(--ok)]">
                  {vehicle.bpkbStatus === "READY" ? "Ready & Sah" : "Dalam Proses"}
                </span>
              </div>
              <div className="p-2.5 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block">Lokasi Garasi</span>
                <span className="font-semibold text-[var(--ink)]">{vehicle.location || "Jawa Timur"}</span>
              </div>
            </div>

            {/* Tombol Aksi Utama: WhatsApp & Sertifikat */}
            <div className="space-y-2 pt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 rounded-[var(--r-btn)] text-[14px] font-semibold transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {isSold
                    ? "Tanya Unit Serupa via WhatsApp"
                    : "Tanya via WhatsApp"}
                </span>
              </a>

              {vehicle.inspection && (
                <a
                  href={`/api/pdf/inspection/${vehicle.inspection.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white hover:border-[var(--ink)] border border-[var(--line-input)] text-[var(--ink)] py-2.5 rounded-[var(--r-btn)] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-[var(--muted)]" />
                  <span>Unduh Sertifikat Inspeksi (PDF)</span>
                </a>
              )}
            </div>
          </div>

          {/* Kartu Garansi 3 Poin (§6.3) */}
          <div className="bg-[var(--surface)] rounded-[var(--r-card)] border border-[var(--line)] p-5 space-y-3">
            <h3 className="text-[14px] font-bold text-[var(--ink)]">
              Jaminan &amp; Garansi Nur Mobil
            </h3>
            <ul className="space-y-2 text-[13px] text-[var(--muted)] leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                <span><strong>Buyback tertulis bermaterai</strong> jika keabsahan dokumen bermasalah.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                <span><strong>Bebas tabrak &amp; banjir</strong> garansi pada struktur sasis dan pilar.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                <span><strong>Dokumen 100% sah</strong> hasil cek fisik Samsat siap balik nama.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. HASIL INSPEKSI 34 TITIK & UJI MIKRON (§6.3) */}
      <div className="bg-[var(--surface)] rounded-[var(--r-card)] border border-[var(--line)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-[var(--line)]">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--ink)] tracking-[-0.01em]">
              Hasil inspeksi 34 titik &amp; uji mikron cat
            </h2>
            <p className="text-[13px] text-[var(--muted)] mt-0.5">
              {vehicle.inspection
                ? `Tanggal inspeksi: ${formatDate(vehicle.inspection.inspectedAt)}. Apa adanya: rusak dibilang rusak.`
                : "Inspeksi digital mandiri dapat dijadwalkan saat cek fisik langsung di garasi."}
            </p>
          </div>

          {vehicle.inspection && (
            <div className="flex items-center gap-2">
              <Link
                href={`/inspeksi/${vehicle.inspection.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-btn)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Sertifikat Digital</span>
              </Link>
            </div>
          )}
        </div>

        {/* Bar Ringkasan 8 Zona di Bagian Atas */}
        <div className="space-y-2">
          <div className="text-[13px] font-medium text-[var(--muted)]">
            Distribusi ketebalan cat 8 zona bodi:
          </div>
          <InspectionBar
            panels={vehicle.inspection?.panels || null}
            plateNumber={vehicle.plateNumber}
          />
        </div>

        {/* Tabel / Breakdown Panel Uji Mikron */}
        {vehicle.inspection && vehicle.inspection.panels && vehicle.inspection.panels.length > 0 ? (
          <div className="space-y-4 pt-2">
            {/* Checklist Tab Interaktif */}
            <InspectionChecklistTabs
              panels={vehicle.inspection.panels}
              inspection={vehicle.inspection}
              brand={vehicle.brand}
              model={vehicle.model}
            />

            {/* Rincian Panel per Panel dengan Titik Berwarna dan Teks Status */}
            <div className="pt-4 border-t border-[var(--line)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-[15px] font-bold text-[var(--ink)]">
                  Rincian ketebalan cat per panel
                </h3>
                {/* Legenda */}
                <div className="flex items-center gap-4 text-[12px] text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)]" />
                    <span>Original (&le; {brandCalibration.originalMax} &micro;m)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--warn)]" />
                    <span>Repaint</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--bad)]" />
                    <span>Dempul</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vehicle.inspection.panels.map((p) => {
                  const label = PANEL_LABELS[p.panelType as keyof typeof PANEL_LABELS] || p.panelType;
                  const points = [p.pointRight, p.pointCenter, p.pointLeft, p.pointExtra].filter(
                    (val): val is number => typeof val === "number" && !isNaN(val)
                  );
                  const effectiveMicron = points.length > 0
                    ? Math.round(points.reduce((a, b) => a + b, 0) / points.length)
                    : p.paintThickness;

                  const cat = effectiveMicron !== undefined && effectiveMicron !== null
                    ? getPaintMicronCategory(effectiveMicron, vehicle.brand)
                    : null;

                  return (
                    <div
                      key={p.panelType}
                      className="p-3 bg-white border border-[var(--line)] rounded-[8px] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[13px] font-semibold text-[var(--ink)] block">
                          {label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              cat === "ORIGINAL"
                                ? "bg-[var(--ok)]"
                                : cat === "REPAINT"
                                ? "bg-[var(--warn)]"
                                : "bg-[var(--bad)]"
                            )}
                          />
                          <span className="text-[12px] text-[var(--muted)]">
                            {cat === "ORIGINAL" ? "Original" : cat === "REPAINT" ? "Repaint" : "Dempul"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[14px] font-bold text-[var(--ink)] block">
                          {effectiveMicron ? `${effectiveMicron} µm` : "-"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-[var(--bg)] border border-[var(--line)] rounded-[8px] text-center text-[var(--muted)] text-[14px]">
            Data lembar uji mikron digital belum terbit untuk unit ini. Anda dipersilakan menguji langsung menggunakan alat ukur kami di garasi.
          </div>
        )}
      </div>

      {/* 4. DETAIL SPESIFIKASI & DOKUMEN */}
      <VehicleSpecsTable vehicle={vehicle} inspection={vehicle.inspection} />
    </div>
  );
}
