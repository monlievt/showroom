"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  PANEL_LABELS,
  getPaintMicronCategory,
  getBrandPaintStandard,
  detectBodyType,
  calculateMultiPointAnalysis,
  BodyType,
} from "@/lib/calculations/inspection";
import { ShieldCheck, AlertCircle, CheckCircle2, Info, Eye, Gauge, SlidersHorizontal } from "lucide-react";

export interface PanelData {
  id?: string;
  panelType: string;
  paintThickness?: number | null;
  pointRight?: number | null;
  pointCenter?: number | null;
  pointLeft?: number | null;
  pointExtra?: number | null;
  condition: string;
  defectCode?: string | null;
  notes?: string | null;
}

interface CarBlueprintViewProps {
  panels: PanelData[];
  onSelectPanel?: (panel: PanelData) => void;
  selectedPanelType?: string | null;
  brand?: string | null;
  model?: string | null;
  bodyType?: BodyType | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// KOORDINAT SVG BLUEPRINT SESUAI BODY TYPE (MPV/SUV, HATCHBACK, SEDAN, PICKUP)
// ViewBox: 0 0 360 620
// ─────────────────────────────────────────────────────────────────────────────

type PanelConfigMap = Record<
  string,
  {
    label: string;
    path: string;
    center: { x: number; y: number };
    defaultCode: string;
  }
>;

const BLUEPRINT_CONFIGS: Record<BodyType, PanelConfigMap> = {
  // 1. MPV & SUV (Innova, Avanza, Fortuner, Pajero, Almaz, Confero, dll) — Kabin 3 Baris Panjang
  MPV_SUV: {
    HOOD: {
      label: "Kap Mesin Depan",
      path: "M 105 75 Q 180 50 255 75 L 265 175 Q 180 185 95 175 Z",
      center: { x: 180, y: 125 },
      defaultCode: "✓",
    },
    ROOF: {
      label: "Atap Kendaraan",
      path: "M 95 240 L 265 240 L 260 415 L 100 415 Z",
      center: { x: 180, y: 325 },
      defaultCode: "✓",
    },
    TRUNK_LID: {
      label: "Pintu Bagasi Belakang",
      path: "M 102 475 Q 180 465 258 475 L 250 550 Q 180 565 110 550 Z",
      center: { x: 180, y: 515 },
      defaultCode: "✓",
    },
    FENDER_FRONT_LEFT: {
      label: "Spakbor Kiri Depan",
      path: "M 55 80 L 102 76 L 93 175 L 50 170 Q 42 125 55 80 Z",
      center: { x: 74, y: 125 },
      defaultCode: "✓",
    },
    FENDER_FRONT_RIGHT: {
      label: "Spakbor Kanan Depan",
      path: "M 258 76 L 305 80 Q 318 125 310 170 L 267 175 Z",
      center: { x: 286, y: 125 },
      defaultCode: "✓",
    },
    FRONT_DOOR_LEFT: {
      label: "Pintu Kiri Depan (Penumpang)",
      path: "M 48 235 L 94 238 L 97 325 L 46 325 Z",
      center: { x: 68, y: 280 },
      defaultCode: "✓",
    },
    FRONT_DOOR_RIGHT: {
      label: "Pintu Kanan Depan (Driver)",
      path: "M 266 238 L 312 235 L 314 325 L 263 325 Z",
      center: { x: 290, y: 280 },
      defaultCode: "✓",
    },
    REAR_DOOR_LEFT: {
      label: "Pintu Kiri Belakang",
      path: "M 46 332 L 97 332 L 100 420 L 48 420 Z",
      center: { x: 70, y: 375 },
      defaultCode: "✓",
    },
    REAR_DOOR_RIGHT: {
      label: "Pintu Kanan Belakang",
      path: "M 263 332 L 314 332 L 312 420 L 260 420 Z",
      center: { x: 288, y: 375 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_LEFT: {
      label: "Spakbor Kiri Belakang",
      path: "M 48 425 L 100 425 L 108 550 L 60 550 Q 42 490 48 425 Z",
      center: { x: 75, y: 485 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_RIGHT: {
      label: "Spakbor Kanan Belakang",
      path: "M 260 425 L 312 425 Q 318 490 300 550 L 252 550 Z",
      center: { x: 285, y: 485 },
      defaultCode: "✓",
    },
  },

  // 2. HATCHBACK & CITY CAR (Honda Brio, Toyota Yaris, Jazz, Agya, Ayla) — Buritan Pendek & Sporty
  HATCHBACK: {
    HOOD: {
      label: "Kap Mesin Depan",
      path: "M 102 82 Q 180 58 258 82 L 264 172 Q 180 182 96 172 Z",
      center: { x: 180, y: 125 },
      defaultCode: "✓",
    },
    ROOF: {
      label: "Atap Kabin Compact",
      path: "M 95 235 L 265 235 L 262 375 L 98 375 Z",
      center: { x: 180, y: 305 },
      defaultCode: "✓",
    },
    TRUNK_LID: {
      label: "Pintu Bagasi Pendek (Hatch)",
      path: "M 104 430 Q 180 420 256 430 L 250 495 Q 180 510 110 495 Z",
      center: { x: 180, y: 462 },
      defaultCode: "✓",
    },
    FENDER_FRONT_LEFT: {
      label: "Spakbor Kiri Depan",
      path: "M 56 86 L 100 82 L 94 172 L 52 168 Q 46 125 56 86 Z",
      center: { x: 75, y: 125 },
      defaultCode: "✓",
    },
    FENDER_FRONT_RIGHT: {
      label: "Spakbor Kanan Depan",
      path: "M 260 82 L 304 86 Q 314 125 308 168 L 266 172 Z",
      center: { x: 285, y: 125 },
      defaultCode: "✓",
    },
    FRONT_DOOR_LEFT: {
      label: "Pintu Kiri Depan (Penumpang)",
      path: "M 52 232 L 94 235 L 96 308 L 50 308 Z",
      center: { x: 73, y: 270 },
      defaultCode: "✓",
    },
    FRONT_DOOR_RIGHT: {
      label: "Pintu Kanan Depan (Driver)",
      path: "M 266 235 L 308 232 L 310 308 L 264 308 Z",
      center: { x: 287, y: 270 },
      defaultCode: "✓",
    },
    REAR_DOOR_LEFT: {
      label: "Pintu Kiri Belakang",
      path: "M 50 314 L 96 314 L 98 380 L 52 380 Z",
      center: { x: 74, y: 347 },
      defaultCode: "✓",
    },
    REAR_DOOR_RIGHT: {
      label: "Pintu Kanan Belakang",
      path: "M 264 314 L 310 314 L 308 380 L 262 380 Z",
      center: { x: 286, y: 347 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_LEFT: {
      label: "Spakbor Kiri Belakang",
      path: "M 52 385 L 98 385 L 104 495 L 60 495 Q 46 440 52 385 Z",
      center: { x: 76, y: 440 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_RIGHT: {
      label: "Spakbor Kanan Belakang",
      path: "M 262 385 L 308 385 Q 314 440 300 495 L 256 495 Z",
      center: { x: 284, y: 440 },
      defaultCode: "✓",
    },
  },

  // 3. SEDAN (Vios, Civic, Corolla, Camry, BMW 3/5 Series) — Three-Box Design (Moncong & Bagasi Dek Terpisah)
  SEDAN: {
    HOOD: {
      label: "Kap Mesin Depan Panjang",
      path: "M 104 65 Q 180 35 256 65 L 265 180 Q 180 190 95 180 Z",
      center: { x: 180, y: 120 },
      defaultCode: "✓",
    },
    ROOF: {
      label: "Atap Kabin Penumpang",
      path: "M 96 250 L 264 250 L 260 380 L 100 380 Z",
      center: { x: 180, y: 315 },
      defaultCode: "✓",
    },
    TRUNK_LID: {
      label: "Dek Bagasi Belakang Sedan",
      path: "M 104 450 Q 180 440 256 450 L 246 545 Q 180 558 114 545 Z",
      center: { x: 180, y: 495 },
      defaultCode: "✓",
    },
    FENDER_FRONT_LEFT: {
      label: "Spakbor Kiri Depan",
      path: "M 52 70 L 101 66 L 93 178 L 48 172 Q 40 120 52 70 Z",
      center: { x: 72, y: 120 },
      defaultCode: "✓",
    },
    FENDER_FRONT_RIGHT: {
      label: "Spakbor Kanan Depan",
      path: "M 259 66 L 308 70 Q 320 120 312 172 L 267 178 Z",
      center: { x: 288, y: 120 },
      defaultCode: "✓",
    },
    FRONT_DOOR_LEFT: {
      label: "Pintu Kiri Depan",
      path: "M 46 242 L 94 246 L 98 322 L 44 322 Z",
      center: { x: 68, y: 282 },
      defaultCode: "✓",
    },
    FRONT_DOOR_RIGHT: {
      label: "Pintu Kanan Depan (Driver)",
      path: "M 266 246 L 314 242 L 316 322 L 262 322 Z",
      center: { x: 292, y: 282 },
      defaultCode: "✓",
    },
    REAR_DOOR_LEFT: {
      label: "Pintu Kiri Belakang",
      path: "M 44 328 L 98 328 L 100 395 L 46 395 Z",
      center: { x: 71, y: 360 },
      defaultCode: "✓",
    },
    REAR_DOOR_RIGHT: {
      label: "Pintu Kanan Belakang",
      path: "M 262 328 L 316 328 L 314 395 L 260 395 Z",
      center: { x: 289, y: 360 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_LEFT: {
      label: "Spakbor Kiri Belakang",
      path: "M 46 400 L 102 400 L 112 550 L 62 550 Q 42 480 46 400 Z",
      center: { x: 78, y: 480 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_RIGHT: {
      label: "Spakbor Kanan Belakang",
      path: "M 258 400 L 314 400 Q 318 480 298 550 L 248 550 Z",
      center: { x: 282, y: 480 },
      defaultCode: "✓",
    },
  },

  // 4. PICKUP & NIAGA (GranMax PU, Carry, L300) — Kabin Depan + Bak Kargo Terbuka
  PICKUP: {
    HOOD: {
      label: "Hidung / Moncong Depan",
      path: "M 95 65 Q 180 52 265 65 L 270 140 Q 180 148 90 140 Z",
      center: { x: 180, y: 102 },
      defaultCode: "✓",
    },
    ROOF: {
      label: "Atap Kabin Depan",
      path: "M 88 198 L 272 198 L 268 280 L 92 280 Z",
      center: { x: 180, y: 238 },
      defaultCode: "✓",
    },
    TRUNK_LID: {
      label: "Pintu Bak Belakang (Tailgate)",
      path: "M 88 545 L 272 545 L 272 575 L 88 575 Z",
      center: { x: 180, y: 560 },
      defaultCode: "✓",
    },
    FENDER_FRONT_LEFT: {
      label: "Spakbor Kiri Depan",
      path: "M 52 70 L 93 67 L 88 140 L 46 138 Q 40 100 52 70 Z",
      center: { x: 68, y: 102 },
      defaultCode: "✓",
    },
    FENDER_FRONT_RIGHT: {
      label: "Spakbor Kanan Depan",
      path: "M 267 67 L 308 70 Q 320 100 314 138 L 272 140 Z",
      center: { x: 292, y: 102 },
      defaultCode: "✓",
    },
    FRONT_DOOR_LEFT: {
      label: "Pintu Kiri Kabin",
      path: "M 44 195 L 86 195 L 90 280 L 44 280 Z",
      center: { x: 66, y: 238 },
      defaultCode: "✓",
    },
    FRONT_DOOR_RIGHT: {
      label: "Pintu Kanan Kabin (Driver)",
      path: "M 274 195 L 316 195 L 316 280 L 270 280 Z",
      center: { x: 294, y: 238 },
      defaultCode: "✓",
    },
    REAR_DOOR_LEFT: {
      label: "Dinding Bak Depan Kiri",
      path: "M 42 295 L 86 295 L 86 360 L 42 360 Z",
      center: { x: 64, y: 328 },
      defaultCode: "✓",
    },
    REAR_DOOR_RIGHT: {
      label: "Dinding Bak Depan Kanan",
      path: "M 274 295 L 318 295 L 318 360 L 274 360 Z",
      center: { x: 296, y: 328 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_LEFT: {
      label: "Dinding Bak Kiri",
      path: "M 42 365 L 86 365 L 88 540 L 42 540 Z",
      center: { x: 65, y: 450 },
      defaultCode: "✓",
    },
    QUARTER_PANEL_RIGHT: {
      label: "Dinding Bak Kanan",
      path: "M 274 365 L 318 365 L 318 540 L 272 540 Z",
      center: { x: 295, y: 450 },
      defaultCode: "✓",
    },
  },
};

export function CarBlueprintView({
  panels,
  onSelectPanel,
  selectedPanelType: externalSelected,
  brand,
  model,
  bodyType: forcedBodyType,
}: CarBlueprintViewProps) {
  // Kalibrasi Merk & Body Type Otomatis
  const autoBodyType = detectBodyType(model, brand);
  const [selectedBodyType, setSelectedBodyType] = useState<BodyType>(
    forcedBodyType || autoBodyType
  );

  const calibration = getBrandPaintStandard(brand);

  const [internalSelected, setInternalSelected] = useState<string>("HOOD");
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);

  const activePanelType = externalSelected || internalSelected;

  const panelMap = new Map<string, PanelData>();
  panels.forEach((p) => panelMap.set(p.panelType, p));

  const activeConfigs = BLUEPRINT_CONFIGS[selectedBodyType] || BLUEPRINT_CONFIGS.MPV_SUV;

  const activeData = panelMap.get(activePanelType) || {
    panelType: activePanelType,
    condition: "ORIGINAL",
    paintThickness: Math.min(105, calibration.originalMax),
    pointRight: Math.min(105, calibration.originalMax),
    pointCenter: Math.min(105, calibration.originalMax),
    pointLeft: Math.min(105, calibration.originalMax),
    notes: "Cat original pabrik, segel baut utuh tanpa tanda bekas bongkar.",
  };

  const handlePanelClick = (type: string) => {
    setInternalSelected(type);
    const data = panelMap.get(type);
    if (data && onSelectPanel) {
      onSelectPanel(data);
    }
  };

  // Pewarnaan dinamis berdasarkan Kalibrasi Brand
  const getPanelColorStyle = (panelType: string) => {
    const data = panelMap.get(panelType);
    const thickness = data?.paintThickness;
    const condition = data?.condition;

    if (!thickness && !condition) {
      return {
        fill: "#F3F4F6",
        stroke: "#9CA3AF",
        badgeBg: "#9CA3AF",
        textBadge: "bg-gray-100 text-gray-700 border-gray-300",
        statusName: "BELUM DIUKUR",
      };
    }

    if (thickness) {
      if (thickness > calibration.repaintMax || condition === "DENTED_SCRATCHED") {
        return {
          fill: "rgba(239, 68, 68, 0.45)",
          stroke: "#DC2626",
          badgeBg: "#EF4444",
          badgeText: "text-white",
          dotColor: "bg-red-500",
          statusName: `DEMPOL / TEBAL (> ${calibration.repaintMax} µm)`,
        };
      }
      if (thickness > calibration.originalMax || condition === "REPAINTED") {
        return {
          fill: "rgba(245, 158, 11, 0.40)",
          stroke: "#D97706",
          badgeBg: "#F59E0B",
          badgeText: "text-white",
          dotColor: "bg-amber-500",
          statusName: `CAT ULANG / SPET (${calibration.originalMax + 1}–${calibration.repaintMax} µm)`,
        };
      }
      return {
        fill: "rgba(16, 185, 129, 0.35)",
        stroke: "#059669",
        badgeBg: "#10B981",
        badgeText: "text-white",
        dotColor: "bg-emerald-500",
        statusName: `ORIGINAL PABRIK (≤ ${calibration.originalMax} µm)`,
      };
    }

    return {
      fill: "rgba(16, 185, 129, 0.35)",
      stroke: "#059669",
      badgeBg: "#10B981",
      badgeText: "text-white",
      dotColor: "bg-emerald-500",
      statusName: `ORIGINAL PABRIK (≤ ${calibration.originalMax} µm)`,
    };
  };

  return (
    <div className="bg-[#FAF9F6] border border-[#D9D4CB] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header Interaktif */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-[#D9D4CB] mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#FEF3C7] text-[#92400E] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1">
            <Eye className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Peta Bodi Interaktif (Blueprint 11 Panel)</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#1C1917] tracking-tight">
            Visual Sebaran Titik Baret & Ketebalan Mikron Cat
          </h3>
          <p className="text-xs text-[#6B6560]">
            Sentuh atau klik panel mobil di bawah untuk melihat rincian uji fisik per bagian.
          </p>
        </div>

        {/* Selector Tipe Bodi Adaptif */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#D9D4CB] shadow-xs text-xs">
          <span className="text-[11px] font-semibold text-[#6B6560] px-2 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-[#D97706]" />
            <span>Siluet Bodi:</span>
          </span>
          {(
            [
              { id: "MPV_SUV", label: "MPV / SUV" },
              { id: "HATCHBACK", label: "Hatchback" },
              { id: "SEDAN", label: "Sedan" },
              { id: "PICKUP", label: "Pick-up" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedBodyType(t.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-xs transition-all",
                selectedBodyType === t.id
                  ? "bg-[#1C1917] text-white shadow-xs"
                  : "text-[#6B6560] hover:bg-[#F7F5F2]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand-Aware Paint Calibration Engine Badge */}
      <div className="mb-6 p-3 bg-white rounded-xl border border-[#EBE7E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-[#D97706]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#1C1917]">
                Kalibrasi Standar OEM: {calibration.brandGroupName}
              </span>
              <span className="text-[10px] bg-[#EFECE8] text-[#57534E] font-extrabold px-2 py-0.5 rounded-full">
                Rentang Asli: {calibration.typicalRange}
              </span>
            </div>
            <p className="text-[11px] text-[#6B6560] mt-0.5">
              {calibration.notes}
            </p>
          </div>
        </div>

        {/* Dynamic Legend Berdasarkan Brand */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] shrink-0">
          <span className="flex items-center gap-1 font-semibold text-[#1C1917]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>≤{calibration.originalMax} µm (Asli)</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#1C1917]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
            <span>{calibration.originalMax + 1}–{calibration.repaintMax} µm (Repaint)</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#1C1917]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
            <span>&gt;{calibration.repaintMax} µm (Dempul)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Kolom Kiri: Diagram SVG Siluet Mobil Sesuai Tipe Bodi (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[360/620] select-none">
            <svg
              viewBox="0 0 360 620"
              className="w-full h-full drop-shadow-md"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ── Kerangka Luar / Ban & Bodi Siluet Mobil Sesuai Bodi ── */}
              {selectedBodyType === "HATCHBACK" ? (
                // ── HATCHBACK (Compact Short Overhang) ──
                <>
                  {/* Ban Kiri Depan */}
                  <rect x="22" y="95" width="24" height="58" rx="6" fill="#1C1917" />
                  {/* Ban Kanan Depan */}
                  <rect x="314" y="95" width="24" height="58" rx="6" fill="#1C1917" />
                  {/* Ban Kiri Belakang (Lebih maju ke depan karena compact) */}
                  <rect x="22" y="390" width="24" height="58" rx="6" fill="#1C1917" />
                  {/* Ban Kanan Belakang */}
                  <rect x="314" y="390" width="24" height="58" rx="6" fill="#1C1917" />

                  {/* Spion Kiri & Kanan */}
                  <ellipse cx="28" cy="200" rx="13" ry="7" fill="#52525B" />
                  <ellipse cx="332" cy="200" rx="13" ry="7" fill="#52525B" />

                  {/* Garis Dasar Bodi Luar Hatchback (Buritan membulat pendek) */}
                  <path
                    d="M 65 75 Q 180 42 295 75 L 310 175 L 314 390 L 300 505 Q 180 535 60 505 L 46 390 L 50 175 Z"
                    fill="#FFFFFF"
                    stroke="#A8A29E"
                    strokeWidth="2.5"
                  />

                  {/* Bemper Depan */}
                  <path
                    d="M 65 75 Q 180 45 295 75 L 300 88 Q 180 58 60 88 Z"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="66" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#57534E">
                    GRILL / BEMPER DEPAN
                  </text>

                  {/* Kaca Depan */}
                  <path
                    d="M 88 180 Q 180 170 272 180 L 265 230 L 95 230 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="206" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Depan
                  </text>

                  {/* Kaca Belakang Hatchback (Curam) */}
                  <path
                    d="M 98 380 L 262 380 L 256 425 Q 180 415 104 425 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="405" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Bagasi Hatchback
                  </text>

                  {/* Bemper Belakang Ringkas */}
                  <path
                    d="M 60 505 Q 180 535 300 505 L 295 522 Q 180 545 65 522 Z"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="534" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#57534E">
                    BEMPER BELAKANG COMPACT
                  </text>
                </>
              ) : selectedBodyType === "SEDAN" ? (
                // ── SEDAN (Three-Box: Long Hood & Distinct Rear Trunk Deck) ──
                <>
                  <rect x="18" y="95" width="24" height="60" rx="6" fill="#1C1917" />
                  <rect x="318" y="95" width="24" height="60" rx="6" fill="#1C1917" />
                  <rect x="18" y="440" width="24" height="60" rx="6" fill="#1C1917" />
                  <rect x="318" y="440" width="24" height="60" rx="6" fill="#1C1917" />

                  <ellipse cx="26" cy="210" rx="14" ry="8" fill="#52525B" />
                  <ellipse cx="334" cy="210" rx="14" ry="8" fill="#52525B" />

                  {/* Garis Dasar Sedan */}
                  <path
                    d="M 65 60 Q 180 20 295 60 L 312 180 L 316 430 L 298 575 Q 180 600 62 575 L 44 430 L 48 180 Z"
                    fill="#FFFFFF"
                    stroke="#A8A29E"
                    strokeWidth="2.5"
                  />

                  {/* Bemper Depan Sedan */}
                  <path
                    d="M 65 60 Q 180 22 295 60 L 300 72 Q 180 38 60 72 Z"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#57534E">
                    BEMPER DEPAN SEDAN
                  </text>

                  {/* Kaca Depan */}
                  <path
                    d="M 88 190 Q 180 180 272 190 L 264 245 L 96 245 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="220" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Depan
                  </text>

                  {/* Kaca Belakang Landai */}
                  <path
                    d="M 98 385 L 262 385 L 256 445 Q 180 435 104 445 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="415" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Belakang Landai
                  </text>

                  {/* Bemper Belakang Sedan */}
                  <path
                    d="M 62 575 Q 180 600 298 575 L 292 590 Q 180 610 68 590 Z"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="602" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#57534E">
                    BEMPER BELAKANG SEDAN
                  </text>
                </>
              ) : selectedBodyType === "PICKUP" ? (
                // ── PICK-UP (Cab-Over Kabin + Bak Terbuka / Open Cargo Bed) ──
                <>
                  <rect x="22" y="80" width="22" height="55" rx="6" fill="#1C1917" />
                  <rect x="316" y="80" width="22" height="55" rx="6" fill="#1C1917" />
                  <rect x="18" y="440" width="24" height="65" rx="6" fill="#1C1917" />
                  <rect x="318" y="440" width="24" height="65" rx="6" fill="#1C1917" />

                  <ellipse cx="28" cy="180" rx="14" ry="8" fill="#52525B" />
                  <ellipse cx="332" cy="180" rx="14" ry="8" fill="#52525B" />

                  {/* Siluet Kabin Depan */}
                  <path
                    d="M 52 65 Q 180 48 308 65 L 316 280 L 44 280 Z"
                    fill="#FFFFFF"
                    stroke="#A8A29E"
                    strokeWidth="2.5"
                  />

                  {/* Kaca Depan Kabin */}
                  <path
                    d="M 80 145 Q 180 138 280 145 L 275 195 L 85 195 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="172" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Depan Kabin
                  </text>

                  {/* Sekat Pemisah Kabin & Bak Kargo */}
                  <rect x="42" y="285" width="276" height="8" fill="#57534E" rx="2" />
                  <text x="180" y="278" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78716C">
                    SEKAT KABIN
                  </text>

                  {/* Garis Dasar Bak Kargo Terbuka */}
                  <rect
                    x="42"
                    y="295"
                    width="276"
                    height="280"
                    fill="#F5F5F4"
                    stroke="#78716C"
                    strokeWidth="2"
                    rx="3"
                  />

                  {/* Garis Rusuk Lantai Bak (Corrugated Bed Floor) */}
                  {[120, 150, 180, 210, 240].map((xPos) => (
                    <line
                      key={xPos}
                      x1={xPos}
                      y1="305"
                      x2={xPos}
                      y2="535"
                      stroke="#D6D3D1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  ))}
                  <text x="180" y="420" textAnchor="middle" fontSize="11" fontWeight="extrabold" fill="#A8A29E" letterSpacing="2">
                    LANTAI BAK KARGO
                  </text>
                </>
              ) : (
                // ── MPV & SUV (Default: Innova, Avanza, Pajero) ──
                <>
                  <rect x="18" y="90" width="24" height="60" rx="6" fill="#1C1917" />
                  <rect x="318" y="90" width="24" height="60" rx="6" fill="#1C1917" />
                  <rect x="18" y="450" width="24" height="60" rx="6" fill="#1C1917" />
                  <rect x="318" y="450" width="24" height="60" rx="6" fill="#1C1917" />

                  <ellipse cx="28" cy="205" rx="14" ry="8" fill="#52525B" />
                  <ellipse cx="332" cy="205" rx="14" ry="8" fill="#52525B" />

                  <path
                    d="M 60 70 Q 180 30 300 70 L 316 180 L 320 440 L 305 565 Q 180 595 55 565 L 40 440 L 44 180 Z"
                    fill="#FFFFFF"
                    stroke="#A8A29E"
                    strokeWidth="2.5"
                  />

                  <path
                    d="M 60 70 Q 180 32 300 70 L 305 82 Q 180 50 55 82 Z"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="55" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#57534E">
                    BEMPER DEPAN (GRILL)
                  </text>

                  <path
                    d="M 88 185 Q 180 175 272 185 L 265 235 L 95 235 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="210" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Depan
                  </text>

                  <path
                    d="M 98 420 L 262 420 L 258 470 Q 180 460 102 470 Z"
                    fill="#BAE6FD"
                    opacity="0.8"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="448" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0369A1">
                    Kaca Belakang
                  </text>

                  <path
                    d="M 55 565 Q 180 595 305 565 L 300 580 Q 180 605 60 580 Z"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="590" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#57534E">
                    BEMPER BELAKANG
                  </text>
                </>
              )}

              {/* ── 11 Panel Logam yang Diuji Mikron ── */}
              {Object.entries(activeConfigs).map(([type, config]) => {
                const style = getPanelColorStyle(type);
                const isSelected = activePanelType === type;
                const isHovered = hoveredPanel === type;
                const panelData = panelMap.get(type);
                const defect = panelData?.defectCode || config.defaultCode;
                const micron = panelData?.paintThickness;

                return (
                  <g
                    key={type}
                    onClick={() => handlePanelClick(type)}
                    onMouseEnter={() => setHoveredPanel(type)}
                    onMouseLeave={() => setHoveredPanel(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    {/* Poligon Panel */}
                    <path
                      d={config.path}
                      fill={isSelected ? "rgba(217, 119, 6, 0.45)" : style.fill}
                      stroke={isSelected ? "#B45309" : isHovered ? "#1C1917" : style.stroke}
                      strokeWidth={isSelected ? "3" : isHovered ? "2.5" : "1.8"}
                      className="transition-colors duration-150"
                    />

                    {/* Hotspot Pin & Label Mikron di Titik Tengah Panel */}
                    <g transform={`translate(${config.center.x}, ${config.center.y})`}>
                      <circle
                        r={isSelected ? "17" : "14"}
                        fill={style.badgeBg || "#10B981"}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-transform duration-200"
                      />
                      <text
                        textAnchor="middle"
                        dy="4"
                        fontSize={isSelected ? "11" : "10"}
                        fontWeight="bold"
                        fill="#FFFFFF"
                      >
                        {defect}
                      </text>

                      {micron !== null && micron !== undefined && (
                        <g transform="translate(0, 20)">
                          <rect
                            x="-22"
                            y="-9"
                            width="44"
                            height="16"
                            rx="4"
                            fill="#1C1917"
                            opacity="0.85"
                          />
                          <text
                            textAnchor="middle"
                            dy="3"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#FFFFFF"
                          >
                            {micron}µm
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
          <span className="text-[11px] text-[#78716C] mt-2 font-medium">
            *Diagram tampak atas bodi mobil. Klik salah satu bagian untuk membaca catatan teknisi.
          </span>
        </div>

        {/* Kolom Kanan: Kartu Detail Panel yang Sedang Dipilih (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-[#D97706] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] block">
                  Panel Terpilih
                </span>
                <h4 className="text-base font-extrabold text-[#1C1917]">
                  {activeConfigs[activePanelType]?.label ||
                    PANEL_LABELS[activePanelType as keyof typeof PANEL_LABELS] ||
                    activePanelType}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#6B6560] block font-semibold">Tebal Cat</span>
                <span className="text-xl font-extrabold text-[#1C1917]">
                  {activeData.paintThickness ? `${activeData.paintThickness} µm` : "-"}
                </span>
              </div>
            </div>

            {/* Status & Klasifikasi Berdasarkan Brand Calibration */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                  (activeData.paintThickness || 0) > calibration.repaintMax ||
                    activeData.condition === "DENTED_SCRATCHED"
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : (activeData.paintThickness || 0) > calibration.originalMax ||
                      activeData.condition === "REPAINTED"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                )}
              >
                {(activeData.paintThickness || 0) > calibration.repaintMax
                  ? "Indikasi Dempol / Tebal"
                  : (activeData.paintThickness || 0) > calibration.originalMax
                  ? "Repaint / Cat Ulang Spet"
                  : "Cat Original Pabrik"}
              </span>
              <span className="text-xs font-semibold text-[#6B6560]">
                Kondisi: {activeData.condition}
              </span>
            </div>

            {/* Rincian 3 Titik Pengukuran & Uji Disparitas (Standar IBID ACV Astra) */}
            {(() => {
              const rawPoints = [
                activeData.pointRight,
                activeData.pointCenter,
                activeData.pointLeft,
                activeData.pointExtra,
              ].filter((pt): pt is number => pt != null && !isNaN(pt) && pt > 0);

              const analysis = calculateMultiPointAnalysis(
                rawPoints.length > 0 ? rawPoints : [activeData.paintThickness || 0]
              );

              return (
                <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#EBE7E1] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#1C1917] flex items-center gap-1.5">
                      <span>📐</span>
                      <span>Uji 3 Titik Pengukuran (IBID ACV)</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#6B6560]">
                      Rata2: <strong className="text-[#1C1917]">{analysis.average} µm</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-lg border border-[#D9D4CB] shadow-2xs">
                      <span className="text-[10px] text-[#6B6560] block font-semibold">Kanan</span>
                      <span className="font-extrabold text-xs text-[#1C1917]">
                        {activeData.pointRight
                          ? `${activeData.pointRight} µm`
                          : activeData.paintThickness
                            ? `${activeData.paintThickness} µm`
                            : "-"}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-[#D9D4CB] shadow-2xs">
                      <span className="text-[10px] text-[#6B6560] block font-semibold">Tengah</span>
                      <span className="font-extrabold text-xs text-[#1C1917]">
                        {activeData.pointCenter
                          ? `${activeData.pointCenter} µm`
                          : activeData.paintThickness
                            ? `${activeData.paintThickness} µm`
                            : "-"}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-[#D9D4CB] shadow-2xs">
                      <span className="text-[10px] text-[#6B6560] block font-semibold">Kiri</span>
                      <span className="font-extrabold text-xs text-[#1C1917]">
                        {activeData.pointLeft
                          ? `${activeData.pointLeft} µm`
                          : activeData.paintThickness
                            ? `${activeData.paintThickness} µm`
                            : "-"}
                      </span>
                    </div>
                  </div>

                  {activeData.pointExtra && (
                    <div className="text-[11px] text-[#6B6560] bg-white p-1.5 rounded-lg border border-[#D9D4CB] flex justify-between">
                      <span>Titik Tambahan (Atap Belakang):</span>
                      <strong>{activeData.pointExtra} µm</strong>
                    </div>
                  )}

                  {/* Deteksi Cat Belang (Disparitas > 30 µm) */}
                  {analysis.pointsCount >= 2 && (
                    <div
                      className={cn(
                        "p-2 rounded-lg text-[11px] font-semibold flex items-center justify-between",
                        analysis.isBelang
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{analysis.isBelang ? "⚠️" : "✓"}</span>
                        <span>
                          {analysis.isBelang
                            ? "Terindikasi Belang / Spet Sebagian"
                            : "Ketebalan Merata Presisi"}
                        </span>
                      </span>
                      <span className="font-bold">
                        Delta: {analysis.delta} µm {analysis.isBelang ? "(>30)" : "(≤30)"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Catatan Inspektur */}
            <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EBE7E1] space-y-1">
              <span className="text-xs font-bold text-[#1C1917] block">
                Catatan Temuan Fisik Inspektur:
              </span>
              <p className="text-xs text-[#57534E] leading-relaxed">
                {activeData.notes || "Kondisi panel mulus, cat original presisi tanpa bekas dempol."}
              </p>
            </div>

            {/* Panduan Kode Kerusakan Balai Lelang (ACV) */}
            <div className="pt-2 border-t border-[#EBE7E1]">
              <span className="text-[11px] font-bold text-[#1C1917] block mb-2">
                Kamus Kode Simbol Inspeksi:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#57534E]">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Original / Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
                    D
                  </span>
                  <span>Cat Ulang (Spet)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
                    P
                  </span>
                  <span>Dempul / Tebal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                    A
                  </span>
                  <span>Goresan / Baret Tipis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Transparansi */}
          <div className="p-4 bg-[#FEF3C7]/40 border border-[#FDE68A] rounded-xl flex items-start gap-3 text-xs text-[#92400E]">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#D97706] mt-0.5" />
            <p>
              <strong>Komitmen Transparansi Nur Mobil:</strong> Setiap millimeter cat diuji
              menggunakan coating thickness gauge digital terkalibrasi standar OEM{" "}
              {calibration.brandGroupName}. Bekas spet dibilang spet, baret dibilang baret.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
