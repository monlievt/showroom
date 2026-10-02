"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  UserCheck,
  Gauge,
  Activity,
  Layers,
  Sparkles,
  Info,
  BookOpen,
  KeyRound,
  FileText,
  Eye,
  X,
  ChevronDown,
  ArrowLeft,
  Fuel,
  Settings2,
  SlidersHorizontal,
  Hash,
} from "lucide-react";
import { CarBlueprintView, PanelData } from "./CarBlueprintView";
import { ExteriorInspectionSheet } from "./ExteriorInspectionSheet";
import { InteriorInspectionSheet } from "./InteriorInspectionSheet";
import { EngineInspectionSheet } from "./EngineInspectionSheet";
import { FrameInspectionSheet } from "./FrameInspectionSheet";
import {
  calculateTotalGrade,
  GRADE_LABELS,
  PANEL_LABELS,
  CONDITION_LABELS,
  getPaintMicronCategory,
  getBrandPaintStandard,
  calculateOverallVehiclePaint,
  calculateMultiPointAnalysis,
  FRAME_CHECKLIST_ITEMS,
  INSPECTION_LEGAL_DISCLAIMER,
  IBID_STANDARD_PHOTO_SLOTS,
  InspectionPhotoSlot,
} from "@/lib/calculations/inspection";
import { formatDate, cn } from "@/lib/utils";

interface InspectionPhoto {
  id: string;
  fileUrl: string;
  category?: string;
  tag?: string | null;
  title?: string | null;
}

interface InspectionWebCertificateProps {
  inspection: {
    id: string;
    version: number;
    stage: string;
    inspectedAt: Date | string;
    inspectedBy: string;
    totalGrade?: string | null;
    engineGrade: string;
    interiorGrade: string;
    exteriorGrade: string;
    frameGrade: string;
    accidentHistory: boolean;
    floodHistory: boolean;
    hasServiceBook?: boolean;
    hasSpareKey?: boolean;
    milAirbagOk?: boolean;
    engineNotes?: string | null;
    interiorNotes?: string | null;
    exteriorNotes?: string | null;
    frameNotes?: string | null;
    checklistData?: any;
    panels: PanelData[];
  };
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    odometer: number;
    transmission: string;
    fuelType?: string | null;
    chassisNumber?: string | null;
    engineNumber?: string | null;
    slug?: string | null;
    photos?: InspectionPhoto[];
  };
  isPublic?: boolean;
}

export function InspectionWebCertificate({
  inspection,
  vehicle,
  isPublic = false,
}: InspectionWebCertificateProps) {
  const [copied, setCopied] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "ringkasan" | "cat" | "eksterior" | "interior" | "mesin" | "rangka" | "foto" | "legal"
  >("ringkasan");
  const [isDossierMode, setIsDossierMode] = useState(false);

  const totalGrade =
    inspection.totalGrade ||
    calculateTotalGrade(
      inspection.engineGrade,
      inspection.interiorGrade,
      inspection.exteriorGrade,
      inspection.frameGrade,
      inspection.accidentHistory
    );

  const brandCalibration = getBrandPaintStandard(vehicle.brand);
  const paintStats = calculateOverallVehiclePaint(inspection.panels, vehicle.brand);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const text = encodeURIComponent(
      `*Laporan Inspeksi Resmi — Nur Mobil*\n` +
      `Unit: ${vehicle.brand} ${vehicle.model} (${vehicle.year})\n` +
      `Plat: ${vehicle.plateNumber} • Odometer: ${vehicle.odometer.toLocaleString("id-ID")} KM\n` +
      `Total Grade: *Grade ${totalGrade}* (${GRADE_LABELS[totalGrade as keyof typeof GRADE_LABELS]?.label || ""})\n` +
      `Lihat sertifikat digital lengkap di: ${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const certificateNumber = `INSP-${new Date(inspection.inspectedAt).getFullYear()}${(new Date(inspection.inspectedAt).getMonth() + 1).toString().padStart(2, "0")}-${vehicle.plateNumber.replace(/\s+/g, "")}-V${inspection.version}`;

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#1C1917] pb-16">
      {/* Top Mobile-Friendly Action Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D9D4CB] shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {vehicle.slug ? (
              <Link
                href={`/katalog/${vehicle.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F5F2] hover:bg-[#EFECE8] border border-[#D9D4CB] text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Katalog Mobil</span>
                <span className="sm:hidden">Kembali</span>
              </Link>
            ) : (
              <Link
                href={`/admin/inspections/${vehicle.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F5F2] hover:bg-[#EFECE8] border border-[#D9D4CB] text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            <div className="hidden md:block">
              <span className="text-[10px] uppercase font-bold text-[#D97706] tracking-wider block">
                Sertifikat Digital Kendaraan
              </span>
              <span className="text-xs font-mono font-bold text-[#6B6560]">
                {certificateNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F5F2] hover:bg-[#EFECE8] border border-[#D9D4CB] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
              title="Salin Tautan"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#6B6560]" />
                  <span className="hidden sm:inline">Salin Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Bagikan ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <a
              href={`/api/pdf/inspection/${inspection.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#D97706] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh / Cetak PDF</span>
              <span className="sm:hidden">PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Certificate Sheet */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Certificate Paper Container */}
        <div className="bg-white border border-[#D9D4CB] rounded-3xl shadow-md overflow-hidden">
          {/* Official Document Header (Ala IBID ACV) */}
          <div className="p-5 sm:p-7 border-b border-[#D9D4CB] bg-gradient-to-b from-[#FAF8F5] to-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#EBE7E1]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#D97706] tracking-tight">
                    NUR MOBIL
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#1C1917] text-white">
                    Certified Inspection
                  </span>
                </div>
                <p className="text-xs text-[#6B6560]">
                  Showroom Mobil Bekas Berkualitas & Sertifikasi Inspeksi Independen
                </p>
              </div>

              <div className="sm:text-right space-y-0.5">
                <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#1C1917]">
                  Lembar Hasil Pemeriksaan Kendaraan
                </h1>
                <p className="text-xs font-mono font-bold text-[#D97706]">
                  {certificateNumber}
                </p>
                <div className="text-[11px] text-[#6B6560] flex sm:justify-end items-center gap-3 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#D97706]" />
                    {formatDate(inspection.inspectedAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#D97706]" />
                    {inspection.inspectedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Specification Box (Header Spek Mobil) */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#F7F5F2] border border-[#D9D4CB] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  Merk / Tipe
                </span>
                <span className="text-sm font-extrabold text-[#1C1917] block mt-0.5 leading-tight">
                  {vehicle.brand} {vehicle.model}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  Tahun / Warna
                </span>
                <span className="text-sm font-bold text-[#1C1917] block mt-0.5">
                  {vehicle.year} • {vehicle.color}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  Nomor Polisi (Plat)
                </span>
                <span className="text-sm font-mono font-black text-[#D97706] block mt-0.5">
                  {vehicle.plateNumber}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  Odometer (KM)
                </span>
                <span className="text-sm font-mono font-bold text-[#1C1917] block mt-0.5">
                  {vehicle.odometer.toLocaleString("id-ID")} KM
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  Transmisi
                </span>
                <span className="text-xs font-semibold text-[#1C1917] block mt-0.5">
                  {vehicle.transmission}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  Bahan Bakar
                </span>
                <span className="text-xs font-semibold text-[#1C1917] block mt-0.5">
                  {vehicle.fuelType || "BENSIN"}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  No. Rangka (VIN)
                </span>
                <span className="text-xs font-mono font-semibold text-[#1C1917] block mt-0.5 truncate">
                  {vehicle.chassisNumber || "TERVERIFIKASI FISIK"}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6560] block tracking-wider">
                  No. Mesin
                </span>
                <span className="text-xs font-mono font-semibold text-[#1C1917] block mt-0.5 truncate">
                  {vehicle.engineNumber || "TERVERIFIKASI FISIK"}
                </span>
              </div>
            </div>

            {/* Total Grade Banner */}
            <div className="mt-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>Hasil Penilaian Keseluruhan (Total Grade)</span>
                </span>
                <span className="text-xs text-[#6B6560]">
                  Berdasarkan gabungan skor Mesin, Interior, Eksterior, dan Rangka
                </span>
              </div>

              {/* 5 Grade Scorecard Boxes */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {(["A", "B", "C", "D", "E"] as const).map((gradeLetter) => {
                  const isSelected = totalGrade === gradeLetter;
                  return (
                    <div
                      key={gradeLetter}
                      className={cn(
                        "rounded-2xl p-2.5 sm:p-4 text-center border transition-all flex flex-col justify-between items-center relative overflow-hidden",
                        isSelected
                          ? gradeLetter === "A"
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300 ring-offset-2"
                            : gradeLetter === "B"
                            ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 ring-offset-2"
                            : gradeLetter === "C"
                            ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300 ring-offset-2"
                            : gradeLetter === "D"
                            ? "bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-300 ring-offset-2"
                            : "bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-300 ring-offset-2"
                          : "bg-[#FAF8F5] border-[#D9D4CB] text-[#6B6560] opacity-60"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1.5 text-[9px] font-black uppercase tracking-widest px-1 rounded bg-white/20">
                          HASIL
                        </div>
                      )}
                      <span className={cn("text-xs sm:text-sm font-bold uppercase", isSelected ? "text-white/90" : "text-[#6B6560]")}>
                        Grade
                      </span>
                      <span className={cn("text-2xl sm:text-4xl font-black my-0.5", isSelected ? "text-white" : "text-[#1C1917]")}>
                        {gradeLetter}
                      </span>
                      <span className={cn("text-[9px] sm:text-[10px] font-semibold leading-tight line-clamp-1", isSelected ? "text-white" : "text-[#6B6560]")}>
                        {GRADE_LABELS[gradeLetter]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Kelayakan & Kelengkapan Ribbons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2",
                    !inspection.accidentHistory
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  )}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold block leading-none">
                      Struktur Rangka
                    </span>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {inspection.accidentHistory ? "Ada Bekas Tabrakan" : "Bebas Tabrakan"}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2",
                    !inspection.floodHistory
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold block leading-none">
                      Uji Rendaman
                    </span>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {inspection.floodHistory ? "Terindikasi Banjir" : "Bebas Banjir"}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2",
                    inspection.milAirbagOk !== false
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  )}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold block leading-none">
                      Airbag & MIL
                    </span>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {inspection.milAirbagOk !== false ? "Indikator Normal" : "Indikator Error"}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2",
                    inspection.hasServiceBook !== false
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-[#F7F5F2] border-[#D9D4CB] text-[#6B6560]"
                  )}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold block leading-none">
                      Buku Servis
                    </span>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {inspection.hasServiceBook !== false ? "Buku Asli Ada" : "Tidak Tersedia"}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2 col-span-2 sm:col-span-1",
                    inspection.hasSpareKey !== false
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-[#F7F5F2] border-[#D9D4CB] text-[#6B6560]"
                  )}
                >
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold block leading-none">
                      Kunci Cadangan
                    </span>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {inspection.hasSpareKey !== false ? "Lengkap Ada" : "Hanya 1 Kunci"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs inside Certificate */}
          <div className="bg-[#FAF8F5] border-b border-[#D9D4CB] px-4 sm:px-7 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => { setActiveTab("ringkasan"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "ringkasan"
                    ? "border-[#D97706] text-[#D97706]"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ringkasan</span>
              </button>

              <button
                onClick={() => { setActiveTab("cat"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "cat"
                    ? "border-[#D97706] text-[#D97706]"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Ketebalan Cat</span>
              </button>

              <button
                onClick={() => { setActiveTab("eksterior"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "eksterior"
                    ? "border-[#7E22CE] text-[#7E22CE]"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Eksterior (Standar Lelang)</span>
              </button>

              <button
                onClick={() => { setActiveTab("interior"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "interior"
                    ? "border-[#D97706] text-[#D97706]"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Interior</span>
              </button>

              <button
                onClick={() => { setActiveTab("mesin"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "mesin"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Mesin</span>
              </button>

              <button
                onClick={() => { setActiveTab("rangka"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "rangka"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>14 Rangka</span>
              </button>

              <button
                onClick={() => { setActiveTab("foto"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "foto"
                    ? "border-[#D97706] text-[#D97706]"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>11 Foto</span>
              </button>

              <button
                onClick={() => { setActiveTab("legal"); setIsDossierMode(false); }}
                className={cn(
                  "py-3 px-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer",
                  !isDossierMode && activeTab === "legal"
                    ? "border-[#D97706] text-[#D97706]"
                    : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
                )}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Legalitas</span>
              </button>
            </div>

            {/* Toggle Mode Dossier Multi-Halaman */}
            <button
              onClick={() => setIsDossierMode(!isDossierMode)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border",
                isDossierMode
                  ? "bg-[#1C1917] text-white border-[#1C1917] shadow-xs"
                  : "bg-white text-[#1C1917] border-[#D9D4CB] hover:bg-[#F7F5F2]"
              )}
              title="Tampilkan semua halaman laporan berurutan ala dokumen resmi"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="hidden sm:inline">
                {isDossierMode ? "Mode Dossier (Semua Halaman)" : "Mode Dokumen Lengkap (8 Hal)"}
              </span>
              <span className="sm:hidden">{isDossierMode ? "Dossier" : "8 Hal"}</span>
            </button>
          </div>

          {/* TAB 1: 4 PILAR & RINCIAN TABEL CAT */}
          {(isDossierMode || activeTab === "ringkasan") && (
            <div className="p-5 sm:p-7 space-y-6">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#1C1917] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 1 dari 8: Cover & Ringkasan Eksekutif Hasil Inspeksi</span>
                  <span className="text-[#D97706] font-mono">Nur Mobil Certified</span>
                </div>
              )}
              {/* 4 Pilar Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-[#D9D4CB] bg-[#FAF8F5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-[#6B6560]">
                        Mesin & Transmisi
                      </span>
                      <span className="text-xl font-black text-[#D97706]">
                        Grade {inspection.engineGrade}
                      </span>
                    </div>
                    <p className="text-xs text-[#1C1917] mt-2 leading-relaxed">
                      {inspection.engineNotes || "Kondisi mesin kering, suara halus, getaran normal, dan transmisi responsif."}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#6B6560] mt-3 pt-2 border-t border-[#EBE7E1] block">
                    Uji Rembesan & Oli Silinder
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-[#D9D4CB] bg-[#FAF8F5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-[#6B6560]">
                        Interior & Dasbor
                      </span>
                      <span className="text-xl font-black text-[#D97706]">
                        Grade {inspection.interiorGrade}
                      </span>
                    </div>
                    <p className="text-xs text-[#1C1917] mt-2 leading-relaxed">
                      {inspection.interiorNotes || "Kabin bersih, aroma segar, plafon rapi, dan sistem AC berfungsi dingin optimal."}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#6B6560] mt-3 pt-2 border-t border-[#EBE7E1] block">
                    Uji Kelistrikan & Plafon
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-[#D9D4CB] bg-[#FAF8F5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-[#6B6560]">
                        Eksterior & Bodi
                      </span>
                      <span className="text-xl font-black text-[#D97706]">
                        Grade {inspection.exteriorGrade}
                      </span>
                    </div>
                    <p className="text-xs text-[#1C1917] mt-2 leading-relaxed">
                      {inspection.exteriorNotes || "Permukaan cat teruji coating gauge, kerapian celah bumper & lampu presisi."}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#6B6560] mt-3 pt-2 border-t border-[#EBE7E1] block">
                    Uji Mikron 15 Titik Panel
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-[#D9D4CB] bg-[#FAF8F5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-[#6B6560]">
                        Rangka & Sasis
                      </span>
                      <span className="text-xl font-black text-[#D97706]">
                        Grade {inspection.frameGrade}
                      </span>
                    </div>
                    <p className="text-xs text-[#1C1917] mt-2 leading-relaxed">
                      {inspection.frameNotes || "Pilar A/B/C/D, apron depan, dan lantai bagasi utuh pabrik bebas potong/las sambungan."}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#6B6560] mt-3 pt-2 border-t border-[#EBE7E1] block">
                    Uji 14 Pilar Sasis Vital
                  </span>
                </div>
              </div>

              {/* Rata-Rata Ketebalan Cat Bodi Total */}
              {paintStats && paintStats.totalPoints > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl border border-[#D9D4CB] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
                        Rata-Rata Ketebalan Cat Total
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F7F5F2] border border-[#D9D4CB] text-[#6B6560]">
                        Standar OEM: {brandCalibration.brandGroupName} ({brandCalibration.typicalRange})
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6560] mt-1">
                      Diukur di {paintStats.totalPoints} titik presisi bodi logam (tidak termasuk bumper plastik polimer).
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 bg-[#F7F5F2] px-4 py-2 rounded-xl border border-[#D9D4CB] self-start sm:self-auto">
                    <span className="text-2xl font-black text-[#1C1917]">
                      {paintStats.overallAverage} µm
                    </span>
                    <span className="text-xs font-bold text-emerald-700 uppercase">
                      ({paintStats.overallConditionLabel})
                    </span>
                  </div>
                </div>
              )}

              {/* Tabel Lengkap 15 Titik Panel Bodi */}
              <div className="border border-[#D9D4CB] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-[#F7F5F2] border-b border-[#D9D4CB] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                    Rincian Hasil Uji 15 Titik Panel Bodi & Bumper (Standar Inspeksi)
                  </span>
                  <span className="text-[11px] text-[#6B6560] hidden sm:inline">
                    Disparitas belang toleransi maks 30 µm
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#D9D4CB] text-[#6B6560] font-semibold">
                        <th className="py-3 px-4">Titik Panel</th>
                        <th className="py-3 px-4">Tipe Material</th>
                        <th className="py-3 px-4">Uji Mikron Cat</th>
                        <th className="py-3 px-4">Disparitas Belang</th>
                        <th className="py-3 px-4">Kode Cacat & Level</th>
                        <th className="py-3 px-4">Status Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE7E1]">
                      {inspection.panels.map((p) => {
                        const isPlasticBumper = p.panelType === "BUMPER_FRONT" || p.panelType === "BUMPER_REAR";
                        const points = [p.pointRight, p.pointCenter, p.pointLeft, p.pointExtra].filter(
                          (v): v is number => typeof v === "number" && !isNaN(v)
                        );
                        const multiStats = points.length > 0 ? calculateMultiPointAnalysis(points, 30) : null;
                        const effectiveMicron = multiStats?.average ?? p.paintThickness;
                        const cat =
                          !isPlasticBumper && effectiveMicron != null
                            ? getPaintMicronCategory(effectiveMicron, vehicle.brand)
                            : null;

                        return (
                          <tr key={p.panelType} className="hover:bg-[#FAF8F5]">
                            <td className="py-3 px-4 font-bold text-[#1C1917]">
                              {PANEL_LABELS[p.panelType as keyof typeof PANEL_LABELS] || p.panelType}
                            </td>
                            <td className="py-3 px-4">
                              {isPlasticBumper ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  Plastik ABS/PP
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-300">
                                  Logam Bodi (Steel)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isPlasticBumper ? (
                                <span className="text-[#6B6560] italic text-[11px]">
                                  Non-Micron (Plastik)
                                </span>
                              ) : effectiveMicron != null ? (
                                <div>
                                  <span className="font-bold text-[#1C1917]">
                                    {effectiveMicron} µm
                                  </span>
                                  {points.length > 1 && (
                                    <span className="text-[10px] text-[#6B6560] block">
                                      ({points.join(", ")} µm)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#6B6560]">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {multiStats ? (
                                multiStats.isBelang ? (
                                  <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Δ {multiStats.delta} µm (Belang)
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold text-[11px]">
                                    Δ {multiStats.delta} µm (Rata)
                                  </span>
                                )
                              ) : (
                                <span className="text-[#6B6560]">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {p.defectCode ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[11px]">
                                    {p.defectCode}
                                  </span>
                                  {p.damageLevel !== null && p.damageLevel !== undefined && (
                                    <span className="text-[10px] text-[#6B6560]">
                                      (Lvl {p.damageLevel})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-emerald-700 text-[11px] font-semibold">
                                  0 (Mulus)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  "font-bold text-[11px] px-2 py-0.5 rounded",
                                  p.condition === "ORIGINAL" || p.condition === "PLASTIC_NORMAL"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : p.condition === "REPAINT"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                                )}
                              >
                                {CONDITION_LABELS[p.condition] || p.condition}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DENAH BLUEPRINT & UJI KETEBALAN CAT 15 TITIK */}
          {(isDossierMode || activeTab === "cat") && (
            <div className="p-5 sm:p-7 space-y-4">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#1C1917] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 2 dari 8: Uji Ketebalan Cat Bodi Digital (Multi-Point 15 Panel)</span>
                  <span className="text-[#D97706] font-mono">Coating Gauge OEM</span>
                </div>
              )}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#D9D4CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#D97706]" />
                    <span>Visualisasi Denah Mobil Tampak Atas (Top-Down Silhouette)</span>
                  </h3>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Klik atau sentuh setiap panel pada siluet mobil untuk melihat hasil mikron cat, titik baret, dan catatan fisik.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-[#6B6560]">
                  15 Titik Panel (Termasuk Bumper & Rocker Panel)
                </div>
              </div>

              <CarBlueprintView
                panels={inspection.panels}
                brand={vehicle.brand}
                model={vehicle.model}
              />
            </div>
          )}

          {/* TAB 3: HASIL PEMERIKSAAN EKSTERIOR (MODEL RESMI BALAI LELANG) */}
          {(isDossierMode || activeTab === "eksterior") && (
            <div className="p-5 sm:p-7 space-y-4">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#7E22CE] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 3 dari 8: Hasil Pemeriksaan Eksterior</span>
                  <span className="font-mono text-purple-200">Standar Balai Lelang Resmi</span>
                </div>
              )}
              <ExteriorInspectionSheet
                inspection={inspection}
                vehicle={vehicle}
              />
            </div>
          )}

          {/* TAB 4: HASIL PEMERIKSAAN INTERIOR */}
          {(isDossierMode || activeTab === "interior") && (
            <div className="p-5 sm:p-7 space-y-4">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#D97706] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 4 dari 8: Hasil Pemeriksaan Interior & Kabin</span>
                  <span className="font-mono text-amber-200">Nur Mobil Certified</span>
                </div>
              )}
              <InteriorInspectionSheet
                inspection={inspection}
                vehicle={vehicle}
              />
            </div>
          )}

          {/* TAB 5: HASIL PEMERIKSAAN MESIN & TRANSMISI */}
          {(isDossierMode || activeTab === "mesin") && (
            <div className="p-5 sm:p-7 space-y-4">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 5 dari 8: Hasil Pemeriksaan Mesin, Transmisi & Mekanikal</span>
                  <span className="font-mono text-emerald-200">Nur Mobil Certified</span>
                </div>
              )}
              <EngineInspectionSheet
                inspection={inspection}
                vehicle={vehicle}
              />
            </div>
          )}

          {/* TAB 6: 14 TITIK RANGKA SASIS */}
          {(isDossierMode || activeTab === "rangka") && (
            <div className="p-5 sm:p-7 space-y-5">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#1E3A8A] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 6 dari 8: 14 Titik Rangka Kritis Sasis Unibody</span>
                  <span className="font-mono text-blue-200">Nur Mobil Certified</span>
                </div>
              )}
              <FrameInspectionSheet
                inspection={inspection}
                vehicle={vehicle}
              />
            </div>
          )}

          {/* TAB 7: 11 FOTO STANDAR WAJIB */}
          {(isDossierMode || activeTab === "foto") && (
            <div className="p-5 sm:p-7 space-y-6">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#1C1917] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 7 dari 8: Dokumentasi 11 Foto Standar Wajib</span>
                  <span className="text-[#D97706] font-mono">Nur Mobil Certified</span>
                </div>
              )}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#D9D4CB]">
                <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#D97706]" />
                  <span>Dokumentasi 11 Titik Foto Wajib Standar Inspeksi</span>
                </h3>
                <p className="text-xs text-[#6B6560] mt-1">
                  Arsip visual transparan: 4 sudut serong eksterior, 2 kompartemen utama, 1 fisik nomor rangka & STNK, serta 4 kelengkapan instrumen kritis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {IBID_STANDARD_PHOTO_SLOTS.map((slot: InspectionPhotoSlot) => {
                  const photo = vehicle.photos?.find(
                    (p) => p.tag === slot.tag || p.title === slot.title
                  );

                  return (
                    <div
                      key={slot.id}
                      className="rounded-2xl border border-[#D9D4CB] overflow-hidden bg-white flex flex-col justify-between"
                    >
                      <div className="p-3 bg-[#FAF8F5] border-b border-[#EBE7E1] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1917]">
                          {slot.badge}
                        </span>
                        {photo ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            Arsip Digital
                          </span>
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-center">
                        {photo ? (
                          <div
                            onClick={() =>
                              setLightboxImg({
                                url: photo.fileUrl,
                                title: slot.title,
                              })
                            }
                            className="relative aspect-4/3 w-full rounded-xl overflow-hidden border border-[#D9D4CB] bg-black/5 cursor-pointer group"
                          >
                            <Image
                              src={photo.fileUrl}
                              alt={slot.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-5 h-5" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-4/3 w-full rounded-xl bg-[#F7F5F2] border border-dashed border-[#D9D4CB] flex flex-col items-center justify-center p-4 text-center">
                            <Car className="w-8 h-8 text-stone-400 mb-2 opacity-60" />
                            <span className="text-[11px] font-semibold text-[#6B6560]">
                              Foto Belum Diunggah
                            </span>
                            <span className="text-[10px] text-[#6B6560] mt-1 line-clamp-2">
                              {slot.description}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-[#FAF8F5] border-t border-[#EBE7E1] text-[10px] text-[#6B6560]">
                        {slot.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: KLAUSUL LEGALITAS & BATAS KOMPLAIN */}
          {(isDossierMode || activeTab === "legal") && (
            <div className="p-5 sm:p-7 space-y-5">
              {isDossierMode && (
                <div className="flex items-center justify-between bg-[#1C1917] text-white px-4 py-2.5 rounded-xl text-xs font-bold mb-2">
                  <span>📄 Halaman 8 dari 8: Syarat, Ketentuan & Batasan Tanggung Jawab Hukum (BAST)</span>
                  <span className="text-[#D97706] font-mono">Nur Mobil Legal</span>
                </div>
              )}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#D9D4CB] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
                  <ShieldCheck className="w-5 h-5 text-[#D97706]" />
                  <h3 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                    Ketentuan Layanan, Pelepasan Hak & Garansi Hukum Dokumen
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs text-[#1C1917] leading-relaxed">
                  {INSPECTION_LEGAL_DISCLAIMER.points.map((p) => (
                    <div key={p.num} className="p-3.5 bg-white rounded-xl border border-[#D9D4CB]">
                      <strong className="block text-[#D97706] mb-1">
                        {p.num}. {p.title}
                      </strong>
                      <p className="text-[#1C1917] leading-relaxed">{p.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Certificate Footer / Signature Section */}
          <div className="p-5 sm:p-7 border-t border-[#D9D4CB] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#1C1917] block">
                Verifikasi Integritas Data Digital
              </span>
              <p className="text-[11px] text-[#6B6560] max-w-md">
                Laporan ini diarsipkan secara permanen pada basis data cloud Showroom Nur Mobil. Setiap perubahan data tercatat dalam audit log transaksi.
              </p>
            </div>

            <div className="flex items-center gap-6 self-end sm:self-auto text-center">
              <div>
                <span className="text-[10px] text-[#6B6560] uppercase block">
                  Petugas Inspeksi
                </span>
                <div className="w-28 h-10 border-b border-[#1C1917] my-1 flex items-center justify-center font-serif italic text-xs text-[#D97706]">
                  {inspection.inspectedBy}
                </div>
                <span className="text-[10px] font-bold text-[#1C1917] block">
                  Certified Vehicle Inspector
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#6B6560] uppercase block">
                  Kepala Showroom
                </span>
                <div className="w-28 h-10 border-b border-[#1C1917] my-1 flex items-center justify-center font-serif italic text-xs text-[#1C1917]">
                  Nur Mobil Official
                </div>
                <span className="text-[10px] font-bold text-[#1C1917] block">
                  Authorized Verification
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#1C1917] text-white flex items-center justify-between">
              <span className="text-xs font-bold truncate pr-4">
                {lightboxImg.title}
              </span>
              <button
                onClick={() => setLightboxImg(null)}
                className="text-stone-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[400px] w-full bg-black/90">
              <Image
                src={lightboxImg.url}
                alt={lightboxImg.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
