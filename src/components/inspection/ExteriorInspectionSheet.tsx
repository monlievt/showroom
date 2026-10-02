"use client";

import React from "react";
import {
  IBID_DEFECT_CODES_LEGEND,
  IBID_DAMAGE_LEVELS_LEGEND,
  getExteriorComponentEvaluation,
  EvaluatedComponent,
} from "@/lib/calculations/inspection";
import { formatDate } from "@/lib/utils";

interface ExteriorInspectionSheetProps {
  inspection: {
    inspectedAt: Date | string;
    exteriorGrade: string;
    exteriorNotes?: string | null;
    panels: Array<{
      panelType: string;
      condition: string;
      defectCode?: string | null;
      damageLevel?: number | null;
      paintThickness?: number | null;
      notes?: string | null;
    }>;
    checklistData?: any;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
  };
}

export function ExteriorInspectionSheet({
  inspection,
  vehicle,
}: ExteriorInspectionSheetProps) {
  const evaluatedComponents: EvaluatedComponent[] = getExteriorComponentEvaluation(
    inspection.panels,
    inspection.checklistData
  );

  const panelMap = new Map(inspection.panels.map((p) => [p.panelType, p]));

  // Helper untuk mendapatkan pin kode pada panel
  const getPanelPin = (panelType: string) => {
    const p = panelMap.get(panelType);
    if (!p) return null;
    const code = (p.defectCode || "").trim().toUpperCase();
    if (code && code !== "OK" && code !== "✓") {
      return code;
    }
    if (p.condition === "REPAINTED") return "0";
    if (p.condition === "DENTED_SCRATCHED") return "U2";
    if (p.condition === "PLASTIC_DAMAGED") return "Y3";
    return null;
  };

  const inspDate = formatDate(inspection.inspectedAt);

  return (
    <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 text-[#1C1917]">
      {/* ── HEADER HALAMAN EKSTERIOR (MODEL RESMI BALAI LELANG) ── */}
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

        {/* Badge Grade Eksterior Pojok Kanan Atas */}
        <div className="self-end sm:self-auto border-2 border-[#7E22CE] bg-[#FAF5FF] rounded-lg px-5 py-2 text-center min-w-[90px]">
          <span className="text-[10px] uppercase font-bold text-[#7E22CE] tracking-wider block">
            Eksterior
          </span>
          <span className="text-3xl font-black text-[#7E22CE] leading-tight block">
            {inspection.exteriorGrade || "B"}
          </span>
        </div>
      </div>

      {/* ── SECTION BAR: EKSTERIOR ── */}
      <div className="bg-[#7E22CE] text-white px-4 py-1.5 rounded-md font-bold text-sm tracking-wide">
        Eksterior
      </div>

      {/* ── CARD UTAMA: ILUSTRASI KERUSAKAN + KETERANGAN KODE & CATATAN ── */}
      <div className="border border-[#D9D4CB] rounded-xl p-4 sm:p-5 bg-[#FCFAF8] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Ilustrasi Kerusakan Eksterior Mobil */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <h4 className="text-xs font-bold text-[#1C1917] text-center mb-3">
            Ilustrasi Kerusakan Eksterior Mobil
          </h4>

          {/* SVG Diagram Mobil Tampak Atas dengan Pin Kerusakan */}
          <div className="relative w-full max-w-[280px] aspect-[260/420]">
            <svg
              viewBox="0 0 260 420"
              className="w-full h-full drop-shadow-xs select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ban Kendaraan (4 Roda) */}
              <rect x="22" y="65" width="20" height="48" rx="5" fill="#1C1917" />
              <rect x="218" y="65" width="20" height="48" rx="5" fill="#1C1917" />
              <rect x="22" y="275" width="20" height="48" rx="5" fill="#1C1917" />
              <rect x="218" y="275" width="20" height="48" rx="5" fill="#1C1917" />

              {/* Spion Samping */}
              <ellipse cx="28" cy="135" rx="10" ry="6" fill="#71717A" />
              <ellipse cx="232" cy="135" rx="10" ry="6" fill="#71717A" />

              {/* Garis Dasar Bodi Mobil */}
              <path
                d="M 52 48 Q 130 24 208 48 L 220 120 L 224 290 L 210 380 Q 130 400 50 380 L 36 290 L 40 120 Z"
                fill="#FDE8E8"
                stroke="#E02424"
                strokeWidth="1.8"
              />

              {/* Bumper Depan */}
              <path
                d="M 52 48 Q 130 26 208 48 L 212 60 Q 130 38 48 60 Z"
                fill="#FBCFE8"
                stroke="#DB2777"
                strokeWidth="1.2"
              />

              {/* Kap Mesin (Hood) */}
              <path
                d="M 68 56 Q 130 40 192 56 L 198 122 Q 130 130 62 122 Z"
                fill="#F472B6"
                stroke="#BE185D"
                strokeWidth="1.2"
              />

              {/* Kaca Depan */}
              <path
                d="M 66 128 Q 130 120 194 128 L 188 165 L 72 165 Z"
                fill="#BAE6FD"
                stroke="#0284C7"
                strokeWidth="1.2"
                opacity="0.85"
              />

              {/* Atap Kendaraan (Roof) */}
              <path
                d="M 72 170 L 188 170 L 184 275 L 76 275 Z"
                fill="#E879F9"
                stroke="#A21CAF"
                strokeWidth="1.2"
              />

              {/* Kaca Belakang */}
              <path
                d="M 77 280 L 183 280 L 178 312 Q 130 305 82 312 Z"
                fill="#BAE6FD"
                stroke="#0284C7"
                strokeWidth="1.2"
                opacity="0.85"
              />

              {/* Pintu Bagasi (Trunk) */}
              <path
                d="M 82 316 Q 130 310 178 316 L 172 368 Q 130 378 88 368 Z"
                fill="#F472B6"
                stroke="#BE185D"
                strokeWidth="1.2"
              />

              {/* Bumper Belakang */}
              <path
                d="M 50 380 Q 130 400 210 380 L 206 392 Q 130 410 54 392 Z"
                fill="#FBCFE8"
                stroke="#DB2777"
                strokeWidth="1.2"
              />

              {/* Fender Kiri Depan */}
              <path
                d="M 44 56 L 68 56 L 62 122 L 40 120 Z"
                fill="#F9A8D4"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Fender Kanan Depan */}
              <path
                d="M 192 56 L 216 56 L 220 120 L 198 122 Z"
                fill="#F9A8D4"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Pintu Kiri Depan */}
              <path
                d="M 40 126 L 70 128 L 72 200 L 38 200 Z"
                fill="#F472B6"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Pintu Kanan Depan */}
              <path
                d="M 190 128 L 220 126 L 222 200 L 188 200 Z"
                fill="#F472B6"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Pintu Kiri Belakang */}
              <path
                d="M 38 206 L 72 206 L 74 275 L 38 275 Z"
                fill="#F472B6"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Pintu Kanan Belakang */}
              <path
                d="M 188 206 L 222 206 L 222 275 L 186 275 Z"
                fill="#F472B6"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Quarter Panel Kiri Belakang */}
              <path
                d="M 38 280 L 78 280 L 82 368 L 50 380 Z"
                fill="#F9A8D4"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* Quarter Panel Kanan Belakang */}
              <path
                d="M 182 280 L 222 280 L 210 380 L 178 368 Z"
                fill="#F9A8D4"
                stroke="#BE185D"
                strokeWidth="1"
              />

              {/* ── RENDER PIN KERUSAKAN PADA PANEL ── */}
              {[
                { type: "BUMPER_FRONT", cx: 130, cy: 45, defaultPin: "Y3" },
                { type: "HOOD", cx: 130, cy: 90, defaultPin: null },
                { type: "FENDER_FRONT_LEFT", cx: 54, cy: 88, defaultPin: "A2" },
                { type: "FENDER_FRONT_RIGHT", cx: 206, cy: 88, defaultPin: "A2" },
                { type: "FRONT_DOOR_LEFT", cx: 54, cy: 162, defaultPin: "A1" },
                { type: "FRONT_DOOR_RIGHT", cx: 206, cy: 162, defaultPin: "AU1" },
                { type: "ROOF", cx: 130, cy: 220, defaultPin: "0" },
                { type: "REAR_DOOR_LEFT", cx: 54, cy: 240, defaultPin: "A2" },
                { type: "REAR_DOOR_RIGHT", cx: 206, cy: 240, defaultPin: "A2" },
                { type: "QUARTER_PANEL_LEFT", cx: 58, cy: 330, defaultPin: "A2" },
                { type: "QUARTER_PANEL_RIGHT", cx: 202, cy: 330, defaultPin: "A2" },
                { type: "TRUNK_LID", cx: 130, cy: 340, defaultPin: "A2" },
                { type: "BUMPER_REAR", cx: 130, cy: 390, defaultPin: "A3" },
              ].map((pin) => {
                const livePin = getPanelPin(pin.type);
                const displayPin = livePin || pin.defaultPin;
                if (!displayPin) return null;

                return (
                  <g key={pin.type} transform={`translate(${pin.cx}, ${pin.cy})`}>
                    <circle
                      r="12"
                      fill="#16A34A"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      className="shadow-sm"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#FFFFFF"
                    >
                      {displayPin}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-[10px] text-[#6B6560] text-center mt-3 italic max-w-xs leading-tight">
            *Ilustrasi diatas merupakan gambaran area inspeksi, namun tiap mobil memiliki komponen yang berbeda dari ilustrasi yang ada di atas
          </p>
        </div>

        {/* Kolom Kanan: Keterangan Kode, Level Kerusakan, Catatan Inspector */}
        <div className="lg:col-span-6 space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-[#1C1917] mb-2 pb-1 border-b border-[#EBE7E1]">
              Keterangan Kode:
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {IBID_DEFECT_CODES_LEGEND.map((item) => (
                <div key={item.code} className="flex items-start gap-1">
                  <span className="font-bold text-[#1C1917] w-6 shrink-0">{item.code}:</span>
                  <span className="text-[#6B6560] leading-tight">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#1C1917] mb-1.5 pb-1 border-b border-[#EBE7E1]">
              Level Kerusakan:
            </h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              {IBID_DAMAGE_LEVELS_LEGEND.map((lvl) => (
                <span key={lvl.level} className="text-[#1C1917]">
                  <strong className="font-bold">{lvl.level}:</strong>{" "}
                  <span className="text-[#6B6560]">{lvl.desc}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#1C1917] mb-1 pb-1 border-b border-[#EBE7E1]">
              Catatan Inspector :
            </h4>
            <p className="text-xs text-[#44403C] bg-white p-2.5 rounded-lg border border-[#EBE7E1] min-h-[50px] leading-relaxed">
              {inspection.exteriorNotes || "Tidak ada temuan kerusakan berat pada bodi eksterior kendaraan."}
            </p>
          </div>
        </div>
      </div>

      {/* ── DAFTAR TABEL KOMPONEN EKSTERIOR ── */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-[#1C1917]">
          Berikut daftar eksterior mobil yang ditemukan pada kendaraan Anda :
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
