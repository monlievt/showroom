"use client";

import React from "react";
import {
  getInteriorComponentEvaluation,
  EvaluatedComponent,
} from "@/lib/calculations/inspection";
import { formatDate } from "@/lib/utils";

interface InteriorInspectionSheetProps {
  inspection: {
    inspectedAt: Date | string;
    interiorGrade: string;
    interiorNotes?: string | null;
    milAirbagOk?: boolean;
    checklistData?: any;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
  };
}

export function InteriorInspectionSheet({
  inspection,
  vehicle,
}: InteriorInspectionSheetProps) {
  const evaluatedComponents: EvaluatedComponent[] = getInteriorComponentEvaluation(
    inspection.interiorGrade,
    inspection.checklistData
  );

  const inspDate = formatDate(inspection.inspectedAt);

  return (
    <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 text-[#1C1917]">
      {/* ── HEADER HALAMAN INTERIOR ── */}
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

        {/* Badge Grade Interior */}
        <div className="self-end sm:self-auto border-2 border-[#D97706] bg-[#FEF3C7] rounded-lg px-5 py-2 text-center min-w-[90px]">
          <span className="text-[10px] uppercase font-bold text-[#B45309] tracking-wider block">
            Interior
          </span>
          <span className="text-3xl font-black text-[#B45309] leading-tight block">
            {inspection.interiorGrade || "B"}
          </span>
        </div>
      </div>

      {/* ── SECTION BAR: INTERIOR & KABIN ── */}
      <div className="bg-[#D97706] text-white px-4 py-1.5 rounded-md font-bold text-sm tracking-wide">
        Interior & Kabin Penumpang
      </div>

      {/* ── CARD CATATAN INSPECTOR & INDIKATOR ── */}
      <div className="border border-[#D9D4CB] rounded-xl p-4 sm:p-5 bg-[#FCFAF8] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="font-bold text-[#1C1917] mb-1.5 pb-1 border-b border-[#EBE7E1]">
            Catatan Inspector Interior:
          </h4>
          <p className="text-[#44403C] bg-white p-3 rounded-lg border border-[#EBE7E1] leading-relaxed">
            {inspection.interiorNotes || "Kabin dalam kondisi bersih terawat, aroma segar non-perokok, plafon utuh, serta busa jok kencang."}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-[#1C1917] pb-1 border-b border-[#EBE7E1]">
            Ringkasan Sistem Kelistrikan Kabin:
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EBE7E1]">
              <span className="text-[#6B6560]">Indikator Speedometer & Airbag (MIL)</span>
              <span className="font-bold text-emerald-600">
                {inspection.milAirbagOk !== false ? "Normal (Padam)" : "Periksa Indikator"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EBE7E1]">
              <span className="text-[#6B6560]">Sistem Pendingin AC & Kisi Blower</span>
              <span className="font-bold text-emerald-600">Dingin & Menghembus Rata</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EBE7E1]">
              <span className="text-[#6B6560]">Indikasi Rendaman Air / Lumpur Kabin</span>
              <span className="font-bold text-emerald-600">Nihil (Bebas Banjir)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DAFTAR TABEL KOMPONEN INTERIOR ── */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-[#1C1917]">
          Berikut daftar komponen interior yang ditemukan pada kendaraan Anda :
        </h4>

        <div className="border border-[#D9D4CB] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#D9D4CB] text-[#6B6560] font-bold text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No.</th>
                <th className="py-2.5 px-3">Komponen</th>
                <th className="py-2.5 px-3 text-center">Kondisi</th>
                <th className="py-2.5 px-3 text-center w-28">Level Kerusakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE7E1]">
              {evaluatedComponents.map((comp) => (
                <tr
                  key={comp.no}
                  className={comp.isDefect ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-[#FAF8F5]"}
                >
                  <td className="py-2 px-3 text-center font-bold text-[#6B6560]">{comp.no}.</td>
                  <td className="py-2 px-3 font-semibold text-[#1C1917]">{comp.name}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={
                        comp.isDefect
                          ? "text-red-600 font-extrabold"
                          : "text-emerald-600 font-bold"
                      }
                    >
                      {comp.condition}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-[#6B6560]">
                    {comp.level}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
