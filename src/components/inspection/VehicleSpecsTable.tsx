"use client";

import React from "react";
import { 
  CheckCircle2, 
  Car, 
  FileCheck, 
  Key, 
  FileText,
  Info
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface VehicleSpecsProps {
  vehicle: {
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
    stnkStatus?: string | null;
    bpkbStatus?: string | null;
    currentLocation?: string | null;
  };
  inspection?: {
    engineGrade: string;
    interiorGrade: string;
    exteriorGrade: string;
    frameGrade: string;
    accidentHistory: boolean;
    floodHistory: boolean;
  } | null;
}

export function VehicleSpecsTable({ vehicle, inspection }: VehicleSpecsProps) {
  const hasInspection = !!inspection;
  const grades = hasInspection
    ? [
        inspection.engineGrade,
        inspection.interiorGrade,
        inspection.exteriorGrade,
        inspection.frameGrade,
      ]
    : [];

  const overallGrade = grades.includes("D")
    ? "D"
    : grades.includes("C")
    ? "C"
    : grades.includes("B")
    ? "B"
    : "A";

  const isBpkbReady = vehicle.bpkbStatus === "READY";
  const isStnkReady = vehicle.stnkStatus === "READY";

  return (
    <div className="space-y-6">
      {/* ── BARIS ATAS: SCORECARD 4 PILAR & TOTAL GRADE ── */}
      {hasInspection ? (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Total Grade Badge */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-[var(--r-btn)] bg-[var(--ok)] text-white shadow-xs">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">Grade</span>
                <span className="text-2xl font-bold">{overallGrade}</span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Hasil Uji Kelayakan &amp; Cek Fisik
                </h3>
                <p className="text-[12px] text-[var(--muted)]">
                  A: Sangat Baik &middot; B: Baik &middot; C: Cukup &middot; D: Perlu Perbaikan
                </p>
              </div>
            </div>

            {/* 4 Pilar Skor */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full md:w-auto text-center">
              <div className="p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-btn)] min-w-[70px]">
                <span className="text-[10px] font-medium text-[var(--muted)] block uppercase">Mesin</span>
                <span className="text-lg font-bold text-[var(--ink)]">{inspection!.engineGrade}</span>
              </div>
              <div className="p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-btn)] min-w-[70px]">
                <span className="text-[10px] font-medium text-[var(--muted)] block uppercase">Interior</span>
                <span className="text-lg font-bold text-[var(--ink)]">{inspection!.interiorGrade}</span>
              </div>
              <div className="p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-btn)] min-w-[70px]">
                <span className="text-[10px] font-medium text-[var(--muted)] block uppercase">Eksterior</span>
                <span className="text-lg font-bold text-[var(--ink)]">{inspection!.exteriorGrade}</span>
              </div>
              <div className="p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-btn)] min-w-[70px]">
                <span className="text-[10px] font-medium text-[var(--muted)] block uppercase">Rangka</span>
                <span className="text-lg font-bold text-[var(--ink)]">{inspection!.frameGrade}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[var(--muted)] shrink-0" />
            <p className="text-[13px] text-[var(--muted)]">
              Unit ini belum memiliki skor inspeksi digital 4 pilar. Calon pembeli dipersilakan melakukan cek fisik langsung, test drive, atau membawa mekanik rekanan ke showroom kami.
            </p>
          </div>
        </div>
      )}

      {/* ── BARIS TENGAH: SPESIFIKASI & DOKUMEN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom 1: Spesifikasi Fisik (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--line)]">
            <Car className="w-4 h-4 text-[var(--accent)]" />
            <h4 className="font-bold text-[15px] text-[var(--ink)]">
              Spesifikasi Fisik &amp; Identitas Kendaraan
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Nomor Polisi</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.plateNumber}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Merek &amp; Model</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.brand} {vehicle.model}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Tahun Pembuatan</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.year}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Kapasitas Mesin</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.engineCapacity.toLocaleString("id-ID")} cc</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Transmisi</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Bahan Bakar</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.fuelType || "Bensin"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Sistem Penggerak</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.driveType || "4x2"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Warna Bodi</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.color}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Jarak Tempuh</span>
              <span className="font-semibold text-[var(--ink)]">{vehicle.odometer.toLocaleString("id-ID")} km</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Pajak STNK</span>
              <span className="font-semibold text-[var(--ok)]">
                {vehicle.taxExpiryDate ? formatDate(vehicle.taxExpiryDate) : "Aktif Panjang"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)] sm:col-span-2">
              <span className="text-[var(--muted)]">Nomor Rangka (VIN)</span>
              <span className="font-mono font-medium text-[var(--ink)]">
                {vehicle.chassisNumber || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)] sm:col-span-2">
              <span className="text-[var(--muted)]">Nomor Mesin</span>
              <span className="font-mono font-medium text-[var(--ink)]">
                {vehicle.engineNumber || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Kelengkapan Dokumen (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="font-bold text-[15px] text-[var(--ink)]">
                Kelengkapan Dokumen Fisik
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-[var(--ok)] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Terverifikasi
            </span>
          </div>

          <div className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[var(--ink)]">Buku BPKB Asli</span>
              </div>
              <span className="font-semibold text-[var(--ok)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isBpkbReady ? "Ready di Tangan" : "Proses Balai Lelang"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[var(--ink)]">Lembar STNK Asli</span>
              </div>
              <span className="font-semibold text-[var(--ok)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isStnkReady ? "Fisik Ada (Aktif)" : "Proses Mutasi"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[var(--ink)]">Faktur Pembelian Asli</span>
              </div>
              <span className="font-semibold text-[var(--ok)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lengkap Tersimpan</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[var(--ink)]">Kuitansi Blanko &amp; Gesek</span>
              </div>
              <span className="font-semibold text-[var(--ok)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ada (Siap Balik Nama)</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[var(--ink)]">Buku Manual &amp; Servis</span>
              </div>
              <span className="font-semibold text-[var(--ok)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ada</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[var(--ink)]">Kunci Kontak Cadangan</span>
              </div>
              <span className="font-semibold text-[var(--ok)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lengkap</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
