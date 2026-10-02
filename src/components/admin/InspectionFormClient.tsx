"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardCheck, 
  ShieldCheck, 
  AlertTriangle, 
  Car, 
  Save, 
  ArrowLeft,
  KeyRound,
  BookOpen,
  Activity,
  Layers,
  Wrench
} from "lucide-react";
import Link from "next/link";
import { createInspectionAction } from "@/app/actions/inspection";
import { 
  PANEL_LABELS, 
  CONDITION_LABELS, 
  getPaintMicronCategory,
  GRADE_LABELS,
  DEFECT_CODES,
  DAMAGE_LEVELS,
  FRAME_CHECKLIST_ITEMS,
  calculateTotalGrade
} from "@/lib/calculations/inspection";
import { cn } from "@/lib/utils";

interface InspectionFormClientProps {
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    color: string;
  };
}

const PANEL_KEYS = [
  "BUMPER_FRONT",
  "HOOD",
  "ROOF",
  "TRUNK_LID",
  "BUMPER_REAR",
  "FENDER_FRONT_RIGHT",
  "FENDER_FRONT_LEFT",
  "FRONT_DOOR_RIGHT",
  "FRONT_DOOR_LEFT",
  "ROCKER_PANEL_RIGHT",
  "ROCKER_PANEL_LEFT",
  "REAR_DOOR_RIGHT",
  "REAR_DOOR_LEFT",
  "QUARTER_PANEL_RIGHT",
  "QUARTER_PANEL_LEFT",
];

export function InspectionFormClient({ vehicle }: InspectionFormClientProps) {
  const router = useRouter();

  const [stage, setStage] = useState("INTAKE");
  const [engineGrade, setEngineGrade] = useState("B");
  const [interiorGrade, setInteriorGrade] = useState("B");
  const [exteriorGrade, setExteriorGrade] = useState("B");
  const [frameGrade, setFrameGrade] = useState("A");

  const [accidentHistory, setAccidentHistory] = useState(false);
  const [floodHistory, setFloodHistory] = useState(false);

  // Kelengkapan & Malfungsi Standar IBID ACV
  const [hasServiceBook, setHasServiceBook] = useState(true);
  const [hasSpareKey, setHasSpareKey] = useState(true);
  const [milAirbagOk, setMilAirbagOk] = useState(true);

  // 14 Titik Rangka Kritis
  const [frameItemsState, setFrameItemsState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    FRAME_CHECKLIST_ITEMS.forEach((item) => {
      initial[item.id] = true; // true = Normal Utuh Bebas Laka
    });
    return initial;
  });

  const [inspectedBy, setInspectedBy] = useState("Tim Inspeksi Nur Mobil");
  const [engineNotes, setEngineNotes] = useState("");
  const [interiorNotes, setInteriorNotes] = useState("");
  const [exteriorNotes, setExteriorNotes] = useState("");
  const [frameNotes, setFrameNotes] = useState("");

  // 15 Panels state (13 Logam + 2 Bumper Plastik)
  const [panels, setPanels] = useState(
    PANEL_KEYS.map((key) => {
      const isBumper = key === "BUMPER_FRONT" || key === "BUMPER_REAR";
      return {
        panelType: key,
        paintThickness: isBumper ? 0 : 95,
        pointRight: isBumper ? 0 : 95,
        pointCenter: isBumper ? 0 : 95,
        pointLeft: isBumper ? 0 : 95,
        pointExtra: key === "ROOF" ? 95 : 0,
        condition: isBumper ? "PLASTIC_NORMAL" : "ORIGINAL",
        defectCode: "OK",
        damageLevel: 0,
        notes: "",
      };
    })
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Live Total Grade calculation
  const totalGradePreview = calculateTotalGrade(
    engineGrade,
    interiorGrade,
    exteriorGrade,
    frameGrade,
    accidentHistory
  );

  const handlePanelChange = (index: number, field: string, value: any) => {
    const updated = [...panels];
    updated[index] = { ...updated[index], [field]: value };
    setPanels(updated);
  };

  const handleFrameItemToggle = (itemId: string) => {
    setFrameItemsState((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      // Jika ada item rangka yang rusak, warning otomatis terindikasi riwayat tabrakan
      const anyDefect = Object.values(next).some((v) => v === false);
      if (anyDefect && frameGrade === "A") {
        setFrameGrade("C");
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createInspectionAction({
        vehicleId: vehicle.id,
        stage: stage as any,
        totalGrade: totalGradePreview,
        engineGrade: engineGrade as any,
        interiorGrade: interiorGrade as any,
        exteriorGrade: exteriorGrade as any,
        frameGrade: frameGrade as any,
        accidentHistory,
        floodHistory,
        hasServiceBook,
        hasSpareKey,
        milAirbagOk,
        inspectedBy,
        engineNotes: engineNotes || undefined,
        interiorNotes: interiorNotes || undefined,
        exteriorNotes: exteriorNotes || undefined,
        frameNotes: frameNotes || undefined,
        checklistData: {
          frameChecklist: frameItemsState,
          hasServiceBook,
          hasSpareKey,
          milAirbagOk,
        },
        panels: panels.map((p) => {
          const isBumper = p.panelType === "BUMPER_FRONT" || p.panelType === "BUMPER_REAR";
          return {
            panelType: p.panelType as any,
            paintThickness: isBumper ? null : Number(p.paintThickness) || null,
            pointRight: isBumper ? null : Number(p.pointRight) || null,
            pointCenter: isBumper ? null : Number(p.pointCenter) || null,
            pointLeft: isBumper ? null : Number(p.pointLeft) || null,
            pointExtra: p.panelType === "ROOF" ? Number(p.pointExtra) || null : null,
            condition: p.condition as any,
            defectCode: p.defectCode || null,
            damageLevel: Number(p.damageLevel) || 0,
            isMetal: !isBumper,
            notes: p.notes || undefined,
          };
        }),
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      router.push(`/admin/inspections/${vehicle.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan hasil inspeksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/inspections/${vehicle.id}`}
          className="flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#1C1917] font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Riwayat Inspeksi</span>
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Menyimpan..." : "Simpan & Terbitkan Sertifikat"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* ── UNIT INFO HEADER CARD ─────────────────────────────── */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
            Unit yang Sedang Diinspeksi
          </div>
          <div className="text-2xl font-bold text-[#1C1917] tracking-tight mt-0.5">
            {vehicle.brand} {vehicle.model} ({vehicle.year})
          </div>
          <div className="text-sm font-semibold text-[#D97706] mt-0.5">
            Plat Nomor: {vehicle.plateNumber} • Warna: {vehicle.color}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-white border border-[#D9D4CB] px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#6B6560] block">
              Total Grade
            </span>
            <span className={cn(
              "text-2xl font-black block",
              totalGradePreview === "A" ? "text-emerald-600" :
              totalGradePreview === "B" ? "text-blue-600" :
              totalGradePreview === "C" ? "text-amber-600" :
              totalGradePreview === "D" ? "text-orange-600" : "text-red-600"
            )}>
              {totalGradePreview}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tahapan / Stage Inspeksi</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-semibold text-[#1C1917]"
            >
              <option value="INTAKE">1. INTAKE (Kondisi Awal Masuk Garasi)</option>
              <option value="AFTER_REPAIR">2. AFTER_REPAIR (Setelah Selesai Pengerjaan Bengkel)</option>
              <option value="FINAL_LISTING">3. FINAL_LISTING (Final Sebelum Tayang Katalog)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4 PILAR GRADE SELECTION & TOTAL GRADE PREVIEW ─────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D4CB] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
              Penilaian 4 Pilar Utama (Grade A - E Standar Lelang IBID)
            </h2>
            <p className="text-xs text-[#6B6560]">
              Total Grade dihitung otomatis dari agregat tertimbang 4 pilar (Rangka 35%, Mesin 30%, Eksterior 20%, Interior 15%).
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-xs font-bold">
            <span>Hasil Kalkulasi: Grade {totalGradePreview}</span>
            <span>({GRADE_LABELS[totalGradePreview]?.desc})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GradePicker title="Mesin & Penggerak" value={engineGrade} onChange={setEngineGrade} />
          <GradePicker title="Interior & Kabin" value={interiorGrade} onChange={setInteriorGrade} />
          <GradePicker title="Eksterior & Bodi" value={exteriorGrade} onChange={setExteriorGrade} />
          <GradePicker title="Rangka & Sasis" value={frameGrade} onChange={setFrameGrade} note="A: Bebas laka berat" />
        </div>

        {/* Checkbox Riwayat Tabrakan & Banjir */}
        <div className="pt-4 border-t border-[#D9D4CB] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={cn(
            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
            accidentHistory ? "bg-[#FEE2E2] border-[#DC2626]" : "bg-white border-[#D9D4CB]"
          )}>
            <input
              type="checkbox"
              checked={accidentHistory}
              onChange={(e) => setAccidentHistory(e.target.checked)}
              className="w-5 h-5 rounded text-[#DC2626] cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-[#1C1917] block">
                {accidentHistory ? "⚠️ Terindikasi Pernah Tabrakan" : "✓ Bebas Tabrakan Berat"}
              </span>
              <span className="text-xs text-[#6B6560] block">
                {accidentHistory ? "Dinyatakan terbuka ada riwayat tabrakan (Total Grade turun ke D/E)" : "Apron, pilar sasis, dan lantai bagasi utuh"}
              </span>
            </div>
          </label>

          <label className={cn(
            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
            floodHistory ? "bg-[#FEE2E2] border-[#DC2626]" : "bg-white border-[#D9D4CB]"
          )}>
            <input
              type="checkbox"
              checked={floodHistory}
              onChange={(e) => setFloodHistory(e.target.checked)}
              className="w-5 h-5 rounded text-[#DC2626] cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-[#1C1917] block">
                {floodHistory ? "⚠️ Terindikasi Pernah Terendam Banjir" : "✓ Bebas Terendam Banjir"}
              </span>
              <span className="text-xs text-[#6B6560] block">
                {floodHistory ? "Ditemukan lumpur/karat di dasar jok & modul kabel" : "Kabin bawah bersih bebas bau apek dan endapan lumpur"}
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* ── KELENGKAPAN ESENSIAL & MALFUNGSI SPEEDOMETER (IBID HAL 8 & 9) ── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#D97706]" />
            <span>Kelengkapan Esensial & Malfungsi Listrik (IBID Checklist)</span>
          </h2>
          <p className="text-xs text-[#6B6560]">
            Pemeriksaan kelengkapan bawaan pabrik dan deteksi lampu malfungsi airbag / check engine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className={cn(
            "p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
            hasServiceBook ? "bg-white border-[#D9D4CB]" : "bg-amber-50 border-amber-300"
          )}>
            <input
              type="checkbox"
              checked={hasServiceBook}
              onChange={(e) => setHasServiceBook(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#D97706]"
            />
            <div>
              <span className="text-xs font-bold text-[#1C1917] block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Buku Servis & Manual</span>
              </span>
              <span className="text-[11px] text-[#6B6560]">
                {hasServiceBook ? "Lengkap ada buku servis" : "⚠️ Tidak ada buku servis"}
              </span>
            </div>
          </label>

          <label className={cn(
            "p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
            hasSpareKey ? "bg-white border-[#D9D4CB]" : "bg-amber-50 border-amber-300"
          )}>
            <input
              type="checkbox"
              checked={hasSpareKey}
              onChange={(e) => setHasSpareKey(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#D97706]"
            />
            <div>
              <span className="text-xs font-bold text-[#1C1917] block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Kunci Cadangan (Serep)</span>
              </span>
              <span className="text-[11px] text-[#6B6560]">
                {hasSpareKey ? "Kunci serep lengkap 2 buah" : "⚠️ Hanya ada 1 kunci utama"}
              </span>
            </div>
          </label>

          <label className={cn(
            "p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
            milAirbagOk ? "bg-white border-[#D9D4CB]" : "bg-red-50 border-red-300"
          )}>
            <input
              type="checkbox"
              checked={milAirbagOk}
              onChange={(e) => setMilAirbagOk(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#D97706]"
            />
            <div>
              <span className="text-xs font-bold text-[#1C1917] block flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Indikator Airbag & MIL</span>
              </span>
              <span className="text-[11px] text-[#6B6560]">
                {milAirbagOk ? "Normal (Mati setelah mesin hidup)" : "⚠️ Lampu Airbag/MIL Menyala"}
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* ── 14 TITIK RANGKA KRITIS (IBID ACV HALAMAN 10) ────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D97706]" />
            <span>Checklist 14 Titik Rangka Kritis (Standar Integritas Struktur IBID)</span>
          </h2>
          <p className="text-xs text-[#6B6560]">
            Pemeriksaan rangka monokok untuk memastikan unit 100% bebas tabrakan depan, samping, dan belakang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FRAME_CHECKLIST_ITEMS.map((item) => {
            const isOk = frameItemsState[item.id] !== false;
            return (
              <label
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2.5 px-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all",
                  isOk ? "bg-white border-[#D9D4CB] text-[#1C1917]" : "bg-red-50 border-red-300 text-red-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isOk}
                    onChange={() => handleFrameItemToggle(item.id)}
                    className="w-4 h-4 rounded text-[#059669]"
                  />
                  <span>{item.label}</span>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                  isOk ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                )}>
                  {isOk ? "Normal" : "Ada Cacat"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── 15 PANEL BODY INSPECTION TABLE (13 LOGAM + 2 BUMPER) ─── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
            Cek Fisik 15 Panel Bodi (13 Panel Logam + 2 Bumper Plastik)
          </h2>
          <p className="text-xs text-[#6B6560]">
            Panel logam diuji dengan coating gauge digital (Atap 4 titik, bodi lain 3 titik). Bumper diuji kerapatan klip kancing dan retak visual (non-mikron).
          </p>
        </div>

        <div className="overflow-x-auto border border-[#D9D4CB] rounded-xl">
          <table className="w-full text-left text-sm border-collapse bg-white">
            <thead>
              <tr className="bg-[#EFECE8] border-b border-[#D9D4CB] text-xs font-bold uppercase text-[#6B6560]">
                <th className="py-3 px-3">Panel Kendaraan</th>
                <th className="py-3 px-3 w-48">Uji Titik Mikron / Material</th>
                <th className="py-3 px-3 w-36">Kode Defect</th>
                <th className="py-3 px-3 w-40">Kondisi Panel</th>
                <th className="py-3 px-3">Catatan Inspektur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE8]">
              {panels.map((p, idx) => {
                const isBumper = p.panelType === "BUMPER_FRONT" || p.panelType === "BUMPER_REAR";
                const isRoof = p.panelType === "ROOF";
                const category = getPaintMicronCategory(p.paintThickness);

                return (
                  <tr key={p.panelType} className="hover:bg-[#F7F5F2]/60">
                    <td className="py-3 px-3 font-semibold text-xs text-[#1C1917]">
                      <div>{PANEL_LABELS[p.panelType] || p.panelType}</div>
                      {isBumper && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Plastik Non-Mikron
                        </span>
                      )}
                      {p.panelType.includes("ROCKER") && (
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Sasis Samping
                        </span>
                      )}
                    </td>

                    {/* Mikron / Material input */}
                    <td className="py-3 px-3">
                      {isBumper ? (
                        <div className="text-xs text-[#6B6560] font-medium italic">
                          Plastik Sintetis ABS (Non-Mikron)
                        </div>
                      ) : isRoof ? (
                        <div className="space-y-1">
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <input
                              type="number"
                              title="Kanan Depan"
                              placeholder="Kn Dpn"
                              value={p.pointRight ?? ""}
                              onChange={(e) => handlePanelChange(idx, "pointRight", Number(e.target.value))}
                              className="px-1.5 py-0.5 border border-[#D9D4CB] rounded text-[11px] font-bold text-center"
                            />
                            <input
                              type="number"
                              title="Kiri Depan"
                              placeholder="Kr Dpn"
                              value={p.pointLeft ?? ""}
                              onChange={(e) => handlePanelChange(idx, "pointLeft", Number(e.target.value))}
                              className="px-1.5 py-0.5 border border-[#D9D4CB] rounded text-[11px] font-bold text-center"
                            />
                            <input
                              type="number"
                              title="Kanan Belakang"
                              placeholder="Kn Blk"
                              value={p.pointCenter ?? ""}
                              onChange={(e) => handlePanelChange(idx, "pointCenter", Number(e.target.value))}
                              className="px-1.5 py-0.5 border border-[#D9D4CB] rounded text-[11px] font-bold text-center"
                            />
                            <input
                              type="number"
                              title="Kiri Belakang"
                              placeholder="Kr Blk"
                              value={p.pointExtra ?? ""}
                              onChange={(e) => handlePanelChange(idx, "pointExtra", Number(e.target.value))}
                              className="px-1.5 py-0.5 border border-[#D9D4CB] rounded text-[11px] font-bold text-center"
                            />
                          </div>
                          <span className="text-[10px] text-[#6B6560] block text-center">4 Penjuru Atap (µm)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            title="Titik Kanan"
                            placeholder="Kanan"
                            value={p.pointRight ?? ""}
                            onChange={(e) => handlePanelChange(idx, "pointRight", Number(e.target.value))}
                            className="w-14 px-1.5 py-1 border border-[#D9D4CB] rounded text-xs font-bold text-center"
                          />
                          <input
                            type="number"
                            title="Titik Tengah"
                            placeholder="Tengah"
                            value={p.pointCenter ?? ""}
                            onChange={(e) => handlePanelChange(idx, "pointCenter", Number(e.target.value))}
                            className="w-14 px-1.5 py-1 border border-[#D9D4CB] rounded text-xs font-bold text-center"
                          />
                          <input
                            type="number"
                            title="Titik Kiri"
                            placeholder="Kiri"
                            value={p.pointLeft ?? ""}
                            onChange={(e) => handlePanelChange(idx, "pointLeft", Number(e.target.value))}
                            className="w-14 px-1.5 py-1 border border-[#D9D4CB] rounded text-xs font-bold text-center"
                          />
                          <MicronIndicator category={category} />
                        </div>
                      )}
                    </td>

                    {/* Defect Code Dropdown */}
                    <td className="py-3 px-3">
                      <select
                        value={p.defectCode || "OK"}
                        onChange={(e) => handlePanelChange(idx, "defectCode", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#D9D4CB] rounded text-xs font-bold"
                      >
                        <option value="OK">✓ Normal / Mulus</option>
                        <option value="A1">A1 Baret Halus</option>
                        <option value="A2">A2 Baret Sedang</option>
                        <option value="A3">A3 Baret Dalam</option>
                        <option value="U1">U1 Penyok Kecil</option>
                        <option value="U2">U2 Penyok Sedang</option>
                        <option value="U3">U3 Penyok Dalam</option>
                        <option value="AU1">AU1 Baret & Penyok 1</option>
                        <option value="AU2">AU2 Baret & Penyok 2</option>
                        <option value="Y1">Y1 Retak / Gap Tipis</option>
                        <option value="Y2">Y2 Retak / Klip Lepas</option>
                        <option value="Y3">Y3 Pecah / Gap Parah</option>
                        <option value="B">B Modifikasi</option>
                        <option value="0">0 Bekas Perbaikan</option>
                      </select>
                    </td>

                    {/* Kondisi Dropdown */}
                    <td className="py-3 px-3">
                      <select
                        value={p.condition}
                        onChange={(e) => handlePanelChange(idx, "condition", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#D9D4CB] rounded text-xs"
                      >
                        {isBumper ? (
                          <>
                            <option value="PLASTIC_NORMAL">Plastik Normal Utuh</option>
                            <option value="PLASTIC_DAMAGED">Plastik Baret/Renggang</option>
                            <option value="REPAINTED">Cat Ulang Bumper</option>
                            <option value="REPLACED">Penggantian Bumper</option>
                          </>
                        ) : (
                          <>
                            <option value="ORIGINAL">Original Pabrik</option>
                            <option value="REPAINTED">Cat Ulang / Spet</option>
                            <option value="DENTED_SCRATCHED">Baret / Lesung</option>
                            <option value="REPLACED">Penggantian Panel</option>
                          </>
                        )}
                      </select>
                    </td>

                    {/* Catatan Panel */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Contoh: baret rambut halus"
                        value={p.notes}
                        onChange={(e) => handlePanelChange(idx, "notes", e.target.value)}
                        className="w-full px-2 py-1 border border-[#D9D4CB] rounded text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CATATAN INSAN PEMERIKSA (RINGKASAN EKSEKUTIF PER PILAR) ─ */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1C1917]">
            Catatan Ringkas Eksekutif Pemeriksa
          </h2>
          <p className="text-xs text-[#6B6560]">
            Catatan ini akan dirangkum di lembar muka sertifikat untuk calon pembeli dan investor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Mesin</label>
            <textarea
              rows={3}
              placeholder="Contoh: Suara halus, transmisi responsif, oli bening"
              value={engineNotes}
              onChange={(e) => setEngineNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D9D4CB] rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Interior</label>
            <textarea
              rows={3}
              placeholder="Contoh: Jok bersih terawat, plafon rapi, AC dingin menggigil"
              value={interiorNotes}
              onChange={(e) => setInteriorNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D9D4CB] rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Eksterior</label>
            <textarea
              rows={3}
              placeholder="Contoh: Baret rambut pemakaian di bumper, cat mayoritas asli pabrik"
              value={exteriorNotes}
              onChange={(e) => setExteriorNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D9D4CB] rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Rangka</label>
            <textarea
              rows={3}
              placeholder="Contoh: Bullhead dan apron depan 100% utuh tanpa tanda ketok/las"
              value={frameNotes}
              onChange={(e) => setFrameNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D9D4CB] rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#D9D4CB]">
          <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nama Inspektur Pemeriksa</label>
          <input
            required
            type="text"
            value={inspectedBy}
            onChange={(e) => setInspectedBy(e.target.value)}
            className="w-full max-w-sm px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-semibold"
          />
        </div>
      </div>
    </form>
  );
}

// ── HELPER GRADE PICKER (MENDUKUNG A SAMPAI E) ───────────────────
function GradePicker({
  title,
  value,
  onChange,
  note,
}: {
  title: string;
  value: string;
  onChange: (val: string) => void;
  note?: string;
}) {
  return (
    <div className="bg-white border border-[#D9D4CB] rounded-xl p-4">
      <div className="text-xs font-bold text-[#1C1917]">{title}</div>
      {note && <div className="text-[10px] text-[#6B6560] mb-2">{note}</div>}
      <div className="grid grid-cols-5 gap-1.5 mt-2">
        {["A", "B", "C", "D", "E"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={cn(
              "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              value === g
                ? "bg-[#D97706] text-white shadow-sm scale-105"
                : "bg-[#EFECE8] text-[#6B6560] hover:text-[#1C1917]"
            )}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── HELPER MICRON INDICATOR BADGE ──────────────────────────────
function MicronIndicator({ category }: { category: string }) {
  if (category === "ORIGINAL") {
    return <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" title="Original (<120µm)" />;
  }
  if (category === "REPAINT") {
    return <span className="w-2.5 h-2.5 rounded-full bg-[#CA8A04]" title="Repaint (120-200µm)" />;
  }
  return <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" title="Dempul Tebal (>200µm)" />;
}
