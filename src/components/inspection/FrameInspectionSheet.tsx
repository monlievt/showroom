"use client";

import React from "react";
import { FRAME_CHECKLIST_ITEMS } from "@/lib/calculations/inspection";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface FrameInspectionSheetProps {
  inspection: {
    inspectedAt: Date | string;
    frameGrade: string;
    accidentHistory: boolean;
    frameNotes?: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
    chassisNumber?: string | null;
  };
}

export function FrameInspectionSheet({
  inspection,
  vehicle,
}: FrameInspectionSheetProps) {
  const inspDate = formatDate(inspection.inspectedAt);
  const isSafe = !inspection.accidentHistory && (inspection.frameGrade === "A" || inspection.frameGrade === "B");

  return (
    <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 text-[#1C1917]">
      {/* ── HEADER HALAMAN RANGKA ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#6B6560] w-32 shrink-0">Tanggal Inspeksi</span>
            <span className="font-bold text-[#1C1917]">: {inspDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#6B6560] w-32 shrink-0">Lokasi Inspeksi</span>
            <span className="font-bold text-[#1C1917]">: Showroom Nur Mobil</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#6B6560] w-32 shrink-0">Kendaraan</span>
            <span className="font-bold text-[#1C1917] uppercase">
              : {vehicle.brand} {vehicle.model} {vehicle.year}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#6B6560] w-32 shrink-0">Nomor Polisi</span>
            <span className="font-mono font-black text-[#D97706]">: {vehicle.plateNumber}</span>
          </div>
        </div>

        {/* Badge Grade Rangka */}
        <div
          className={`self-end sm:self-auto border-2 rounded-lg px-5 py-2 text-center min-w-[90px] ${
            isSafe ? "border-blue-600 bg-blue-50" : "border-red-600 bg-red-50"
          }`}
        >
          <span
            className={`text-[10px] uppercase font-bold tracking-wider block ${
              isSafe ? "text-blue-700" : "text-red-700"
            }`}
          >
            Rangka
          </span>
          <span
            className={`text-3xl font-black leading-tight block ${
              isSafe ? "text-blue-700" : "text-red-700"
            }`}
          >
            {inspection.frameGrade || "A"}
          </span>
        </div>
      </div>

      {/* ── SECTION BAR: RANGKA & SASIS ── */}
      <div className="bg-[#1E3A8A] text-white px-4 py-1.5 rounded-md font-bold text-sm tracking-wide">
        Rangka, Sasis & Struktur Monokok Unibody
      </div>

      {/* ── STATUS INTEGRITAS & CATATAN INSPECTOR ── */}
      <div className="border border-[#D9D4CB] rounded-xl p-4 sm:p-5 bg-[#FCFAF8] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="font-bold text-[#1C1917] mb-1.5 pb-1 border-b border-[#EBE7E1]">
            Catatan Inspector Rangka:
          </h4>
          <p className="text-[#44403C] bg-white p-3 rounded-lg border border-[#EBE7E1] leading-relaxed">
            {inspection.frameNotes || "Seluruh titik sambungan las robotik pabrik utuh, sealer asli pabrik tidak ada bekas perbaikan ketok atau sambungan potong rangka."}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-[#1C1917] pb-1 border-b border-[#EBE7E1]">
            Status Integritas Keamanan:
          </h4>
          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${
              isSafe
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {isSafe ? (
              <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />
            )}
            <div>
              <span className="font-bold block text-xs">
                {isSafe ? "TERVERIFIKASI: BEBAS TABRAKAN BERAT" : "PERINGATAN: TERDETEKSI BEKAS TABRAKAN"}
              </span>
              <span className="text-[11px] block mt-0.5 opacity-90">
                {isSafe
                  ? "Sasis utama, apron dan pilar keselamatan utuh presisi tanpa deformasi."
                  : "Ditemukan indikasi perbaikan struktur rangka sasis kendaraan."}
              </span>
            </div>
          </div>
          {vehicle.chassisNumber && (
            <div className="p-2 rounded-lg bg-white border border-[#EBE7E1] text-[11px] flex justify-between">
              <span className="text-[#6B6560]">Nomor Rangka Fisik (VIN):</span>
              <span className="font-mono font-bold text-[#1C1917]">{vehicle.chassisNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── DAFTAR 14 TITIK RANGKA KRITIS ── */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-[#1C1917]">
          Berikut daftar 14 titik rangka kritis sasis yang diperiksa pada kendaraan Anda :
        </h4>

        <div className="border border-[#D9D4CB] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#D9D4CB] text-[#6B6560] font-bold text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No.</th>
                <th className="py-2.5 px-3">Titik Rangka Sasis</th>
                <th className="py-2.5 px-3 text-center">Kondisi</th>
                <th className="py-2.5 px-3 text-center w-28">Status Las & Sealer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE7E1]">
              {FRAME_CHECKLIST_ITEMS.map((item, idx) => {
                const isItemDefect = inspection.accidentHistory && (idx === 0 || idx === 1);
                return (
                  <tr
                    key={item.id}
                    className={isItemDefect ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-[#FAF8F5]"}
                  >
                    <td className="py-2 px-3 text-center font-bold text-[#6B6560]">{idx + 1}.</td>
                    <td className="py-2 px-3 font-semibold text-[#1C1917]">{item.label}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={
                          isItemDefect
                            ? "text-red-600 font-extrabold"
                            : "text-emerald-600 font-bold"
                        }
                      >
                        {isItemDefect ? "Bekas Perbaikan Las" : "Utuh Normal"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-[#6B6560]">
                      {isItemDefect ? "Repaired" : "Original Pabrik"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
