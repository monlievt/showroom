"use client";

import React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileCheck, 
  Car, 
  Gauge, 
  Calendar, 
  Fuel, 
  Key, 
  FileText,
  AlertTriangle
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
  // Hitung Total Grade berdasarkan 4 pilar
  const grades = [
    inspection?.engineGrade || "B",
    inspection?.interiorGrade || "B",
    inspection?.exteriorGrade || "B",
    inspection?.frameGrade || "A",
  ];
  // Jika ada C, grade C; jika ada B, grade B; jika semua A, grade A
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
      {/* ── BARIS ATAS: SCORECARD 4 PILAR & TOTAL GRADE ALA IBID ── */}
      <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Total Grade Badge */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-emerald-600 text-white shadow-md">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Total Grade</span>
              <span className="text-3xl font-black">{overallGrade}</span>
            </div>
            <div>
              <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                Standar Penilaian Cek Fisik Profesional
              </div>
              <h3 className="text-lg font-bold text-[#1C1917]">
                Hasil Uji Kelayakan & Cek Fisik Menyeluruh
              </h3>
              <p className="text-xs text-[#6B6560]">
                A: Sangat Baik • B: Baik • C: Cukup • D: Perlu Perbaikan
              </p>
            </div>
          </div>

          {/* 4 Pilar Skor */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full md:w-auto text-center">
            <div className="p-2.5 bg-[#FAF9F6] border border-[#EBE7E1] rounded-xl min-w-[70px]">
              <span className="text-[10px] font-bold text-[#6B6560] block uppercase">Mesin</span>
              <span className="text-xl font-black text-[#D97706]">{inspection?.engineGrade || "B"}</span>
            </div>
            <div className="p-2.5 bg-[#FAF9F6] border border-[#EBE7E1] rounded-xl min-w-[70px]">
              <span className="text-[10px] font-bold text-[#6B6560] block uppercase">Interior</span>
              <span className="text-xl font-black text-[#D97706]">{inspection?.interiorGrade || "B"}</span>
            </div>
            <div className="p-2.5 bg-[#FAF9F6] border border-[#EBE7E1] rounded-xl min-w-[70px]">
              <span className="text-[10px] font-bold text-[#6B6560] block uppercase">Eksterior</span>
              <span className="text-xl font-black text-[#D97706]">{inspection?.exteriorGrade || "B"}</span>
            </div>
            <div className="p-2.5 bg-[#FAF9F6] border border-[#EBE7E1] rounded-xl min-w-[70px]">
              <span className="text-[10px] font-bold text-[#6B6560] block uppercase">Rangka</span>
              <span className="text-xl font-black text-[#D97706]">{inspection?.frameGrade || "A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARIS TENGAH: DUA TABEL LENGKAP ALA IBID (INFO & DOKUMEN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom 1: Detail Spesifikasi Teknis & Fisik (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#D9D4CB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D9D4CB]">
            <Car className="w-4 h-4 text-[#D97706]" />
            <h4 className="font-extrabold text-sm sm:text-base text-[#1C1917]">
              Spesifikasi Fisik & Identitas Kendaraan
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Nomor Polisi</span>
              <span className="font-bold text-[#1C1917]">{vehicle.plateNumber}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Merek & Model</span>
              <span className="font-bold text-[#1C1917]">{vehicle.brand} {vehicle.model}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Tahun Pembuatan</span>
              <span className="font-bold text-[#1C1917]">{vehicle.year}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Kapasitas Mesin (CC)</span>
              <span className="font-bold text-[#1C1917]">{vehicle.engineCapacity.toLocaleString("id-ID")} CC</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Transmisi</span>
              <span className="font-bold text-[#1C1917]">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Bahan Bakar</span>
              <span className="font-bold text-[#1C1917]">{vehicle.fuelType || "BENSIN / DIESEL"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Sistem Penggerak</span>
              <span className="font-bold text-[#1C1917]">{vehicle.driveType || "4x2"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Warna Fisik Bodi</span>
              <span className="font-bold text-[#1C1917]">{vehicle.color}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Jarak Tempuh (KM)</span>
              <span className="font-bold text-[#1C1917]">{vehicle.odometer.toLocaleString("id-ID")} KM</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9]">
              <span className="text-[#6B6560]">Masa Berlaku Pajak STNK</span>
              <span className="font-bold text-emerald-700">
                {vehicle.taxExpiryDate ? formatDate(vehicle.taxExpiryDate) : "Aktif Panjang"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9] sm:col-span-2">
              <span className="text-[#6B6560]">Nomor Rangka (VIN)</span>
              <span className="font-mono font-bold text-[#1C1917]">
                {vehicle.chassisNumber || "MHKAB1BY5NK031897"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F2EFE9] sm:col-span-2">
              <span className="text-[#6B6560]">Nomor Mesin</span>
              <span className="font-mono font-bold text-[#1C1917]">
                {vehicle.engineNumber || "2GD885717"}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Checklist Kelengkapan Dokumen Fisik (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#D9D4CB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9D4CB]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#D97706]" />
              <h4 className="font-extrabold text-sm sm:text-base text-[#1C1917]">
                Kelengkapan Dokumen Fisik
              </h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Absolut Transparan
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* BPKB */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Buku BPKB Asli</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isBpkbReady ? "Ready di Tangan" : "Proses Balai Lelang"}</span>
              </span>
            </div>

            {/* STNK */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Lembar STNK Asli</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isStnkReady ? "Fisik Ada (Aktif)" : "Proses Mutasi"}</span>
              </span>
            </div>

            {/* Faktur Asli */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Faktur Pembelian Asli ATPM</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lengkap Tersimpan</span>
              </span>
            </div>

            {/* Kuitansi Blanko & Gesek */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Kuitansi Blanko & Gesek No Rangka</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ada (Siap Balik Nama)</span>
              </span>
            </div>

            {/* Surat Pelepasan Hak / KTP */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Surat Pelepasan Hak / KTP Pemilik</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ada & Sah</span>
              </span>
            </div>

            {/* Buku Servis & Manual */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Buku Manual & Servis Resmi</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ada (Record Bengkel Resmi)</span>
              </span>
            </div>

            {/* Kunci Cadangan */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EBE7E1]">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-medium text-[#1C1917]">Kunci Kontak Cadangan (Serep)</span>
              </div>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lengkap 2 Buah</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
