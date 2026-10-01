"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardCheck, 
  ShieldCheck, 
  AlertTriangle, 
  Car, 
  Save, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { createInspectionAction } from "@/app/actions/inspection";
import { 
  PANEL_LABELS, 
  CONDITION_LABELS, 
  getPaintMicronCategory,
  GRADE_LABELS
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
  "HOOD",
  "ROOF",
  "FENDER_FRONT_RIGHT",
  "FENDER_FRONT_LEFT",
  "FRONT_DOOR_RIGHT",
  "FRONT_DOOR_LEFT",
  "REAR_DOOR_RIGHT",
  "REAR_DOOR_LEFT",
  "TRUNK_LID",
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

  const [inspectedBy, setInspectedBy] = useState("Tim Inspeksi Nur Mobil");
  const [engineNotes, setEngineNotes] = useState("");
  const [interiorNotes, setInteriorNotes] = useState("");
  const [exteriorNotes, setExteriorNotes] = useState("");

  // 11 Panels state
  const [panels, setPanels] = useState(
    PANEL_KEYS.map((key) => ({
      panelType: key,
      paintThickness: 95, // default mikron original rata-rata
      condition: "ORIGINAL",
      notes: "",
    }))
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePanelChange = (index: number, field: string, value: any) => {
    const updated = [...panels];
    updated[index] = { ...updated[index], [field]: value };
    setPanels(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createInspectionAction({
        vehicleId: vehicle.id,
        stage: stage as any,
        engineGrade: engineGrade as any,
        interiorGrade: interiorGrade as any,
        exteriorGrade: exteriorGrade as any,
        frameGrade: frameGrade as any,
        accidentHistory,
        floodHistory,
        inspectedBy,
        engineNotes: engineNotes || undefined,
        interiorNotes: interiorNotes || undefined,
        exteriorNotes: exteriorNotes || undefined,
        panels: panels.map((p) => ({
          panelType: p.panelType as any,
          paintThickness: Number(p.paintThickness) || 0,
          condition: p.condition as any,
          notes: p.notes || undefined,
        })),
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
    <form onSubmit={handleSubmit} className="p-8 max-w-5xl mx-auto space-y-8">
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

      {/* ── 4 PILAR GRADE SELECTION ───────────────────────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">Penilaian 4 Pilar Utama (Grade A - D)</h2>
          <p className="text-xs text-[#6B6560]">
            Berdasarkan standar penaksiran transparansi Nur Mobil (A = Istimewa, D = Perlu Perbaikan Berat).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GradePicker title="Mesin & Penggerak" value={engineGrade} onChange={setEngineGrade} />
          <GradePicker title="Interior & Kelistrikan" value={interiorGrade} onChange={setInteriorGrade} />
          <GradePicker title="Eksterior & Bodi" value={exteriorGrade} onChange={setExteriorGrade} />
          <GradePicker title="Rangka & Sasis" value={frameGrade} onChange={setFrameGrade} note="A: Bebas laka berat" />
        </div>

        {/* Checkbox Bebas Tabrakan & Banjir */}
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
                {accidentHistory ? "Dinyatakan terbuka ada riwayat tabrakan" : "Apron, pilar sasis, dan lantai bagasi utuh"}
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

      {/* ── 11 PANEL BODY INSPECTION TABLE ─────────────────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">Cek Fisik 11 Panel Logam & Mikron Cat</h2>
          <p className="text-xs text-[#6B6560]">
            Ukur ketebalan cat per panel menggunakan coating gauge digital (&lt; 120µm: Original, 120–200µm: Repaint/Spet, &gt; 200µm: Dempul).
          </p>
        </div>

        <div className="overflow-x-auto border border-[#D9D4CB] rounded-xl">
          <table className="w-full text-left text-sm border-collapse bg-white">
            <thead>
              <tr className="bg-[#EFECE8] border-b border-[#D9D4CB] text-xs font-bold uppercase text-[#6B6560]">
                <th className="py-3 px-4">Panel Logam</th>
                <th className="py-3 px-4 w-40">Ketebalan (µm)</th>
                <th className="py-3 px-4 w-48">Kondisi Panel</th>
                <th className="py-3 px-4">Catatan Khusus (Opsional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE8]">
              {panels.map((p, idx) => {
                const category = getPaintMicronCategory(p.paintThickness);

                return (
                  <tr key={p.panelType} className="hover:bg-[#F7F5F2]/60">
                    <td className="py-3 px-4 font-semibold text-xs text-[#1C1917]">
                      {PANEL_LABELS[p.panelType] || p.panelType}
                    </td>

                    {/* Mikron input */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={p.paintThickness}
                          onChange={(e) => handlePanelChange(idx, "paintThickness", Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-[#D9D4CB] rounded text-xs font-bold text-center"
                        />
                        <span className="text-xs text-[#6B6560]">µm</span>
                        <MicronIndicator category={category} />
                      </div>
                    </td>

                    {/* Kondisi Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={p.condition}
                        onChange={(e) => handlePanelChange(idx, "condition", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#D9D4CB] rounded text-xs"
                      >
                        <option value="ORIGINAL">Original Pabrik</option>
                        <option value="REPAINTED">Cat Ulang / Spet</option>
                        <option value="DENTED_SCRATCHED">Baret / Lesung</option>
                        <option value="REPLACED">Penggantian Panel</option>
                      </select>
                    </td>

                    {/* Catatan Panel */}
                    <td className="py-3 px-4">
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

      {/* ── CATATAN INSAN PEMERIKSA ────────────────────────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1C1917]">Catatan Rinci Pemeriksa & Pengesahan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Mesin</label>
            <textarea
              rows={3}
              placeholder="Contoh: Suara mesin halus, tidak ada rembes oli, tarikan responsif"
              value={engineNotes}
              onChange={(e) => setEngineNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D9D4CB] rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Interior</label>
            <textarea
              rows={3}
              placeholder="Contoh: Jok original fabric bersih, plafon rapi, tombol AC berfungsi normal"
              value={interiorNotes}
              onChange={(e) => setInteriorNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D9D4CB] rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan Eksterior</label>
            <textarea
              rows={3}
              placeholder="Contoh: Kaca film masih bagus, lampu bening tidak menguning, ban 80%"
              value={exteriorNotes}
              onChange={(e) => setExteriorNotes(e.target.value)}
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

// ── HELPER GRADE PICKER ─────────────────────────────────────────
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
      <div className="grid grid-cols-4 gap-1.5 mt-2">
        {["A", "B", "C", "D"].map((g) => (
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
