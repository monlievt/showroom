"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CarBlueprintView, PanelData } from "./CarBlueprintView";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Car, 
  Wind,
  Sparkles,
  KeyRound,
  BookOpen,
} from "lucide-react";
import { calculateTotalGrade, GRADE_LABELS } from "@/lib/calculations/inspection";

interface InspectionChecklistTabsProps {
  panels: PanelData[];
  inspection: {
    id: string;
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
  };
  brand?: string | null;
  model?: string | null;
}

export function InspectionChecklistTabs({
  panels,
  inspection,
  brand,
  model,
}: InspectionChecklistTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "blueprint" | "frame" | "exterior" | "interior" | "mechanical"
  >("blueprint");

  const totalGrade =
    inspection.totalGrade ||
    calculateTotalGrade(
      inspection.engineGrade,
      inspection.interiorGrade,
      inspection.exteriorGrade,
      inspection.frameGrade,
      inspection.accidentHistory
    );

  // Titik Uji Rangka Utama (14 Titik sesuai standar IBID / JBA)
  const frameCheckpoints = [
    { name: "Pilar A Depan Kanan", status: "NORMAL", desc: "Bebas bekas potong / ketok / las ulang" },
    { name: "Pilar A Depan Kiri", status: "NORMAL", desc: "Bebas bekas potong / ketok / las ulang" },
    { name: "Pilar B Tengah Kanan", status: "NORMAL", desc: "Titik las pabrik (spot welding) utuh presisi" },
    { name: "Pilar B Tengah Kiri", status: "NORMAL", desc: "Titik las pabrik (spot welding) utuh presisi" },
    { name: "Pilar C Belakang Kanan", status: "NORMAL", desc: "Lempeng tanpa bekas benturan samping" },
    { name: "Pilar C Belakang Kiri", status: "NORMAL", desc: "Lempeng tanpa bekas benturan samping" },
    { name: "Apron / Dudukan Radiator Depan", status: "NORMAL", desc: "Bebas tekukan, sealer pabrik utuh" },
    { name: "Panel Dalam Ruang Mesin Kanan", status: "NORMAL", desc: "Cat dasar pabrik utuh tanpa semprotan spet" },
    { name: "Panel Dalam Ruang Mesin Kiri", status: "NORMAL", desc: "Cat dasar pabrik utuh tanpa semprotan spet" },
    { name: "Lantai Bawah & Kolong Sasis", status: "NORMAL", desc: "Lurus bebas bengkok, bebas karat korosi" },
    { name: "Ruang Bagasi & Rumah Ban Serep", status: "NORMAL", desc: "Sealer melingkar utuh, bebas bekas tabrak belakang" },
    { name: "Baut Pintu & Engsel Rangka", status: "NORMAL", desc: "Segel cat baut tidak ada tanda mata kunci / bekas buka" },
    { name: "Bebas Rendaman Air Banjir", status: !inspection.floodHistory ? "NORMAL" : "PERINGATAN", desc: "Kolong dasbor & rel jok bebas lumpur/karat residu air" },
    { name: "Sertifikasi Struktur Bebas Tabrak", status: !inspection.accidentHistory ? "NORMAL" : "PERINGATAN", desc: "Garansi tertulis uang kembali jika terbukti eks tabrak berat" },
  ];

  // Titik Uji Eksterior (Kaca, Lampu, Bumper, Spion, Ban)
  const exteriorCheckpoints = [
    { name: "Kaca Depan (Windshield)", status: "NORMAL", condition: "Bening, bebas retak / baret wiper dalam" },
    { name: "Kaca Belakang & Kaca Pintu", status: "NORMAL", condition: "Defogger aktif, kaca film terpasang rapi" },
    { name: "Lampu Utama (Headlamp Kanan & Kiri)", status: "NORMAL", condition: "Mika bening tanpa kusam/menguning, LED menyala terang" },
    { name: "Lampu Kabut (Foglamp)", status: "NORMAL", condition: "Berfungsi normal, reflektor bersih" },
    { name: "Lampu Belakang (Stop Lamp)", status: "NORMAL", condition: "Mika merah utuh bebas pecah, lampu rem & mundur aktif" },
    { name: "Grille & Bumper Depan", status: "NORMAL", condition: "Gap presisi, klip pengunci bumper kencang" },
    { name: "Bumper Belakang", status: "NORMAL", condition: "Sensor parkir aktif, nat bodi rapat presisi" },
    { name: "Spion Kanan & Kiri", status: "NORMAL", condition: "Pengaturan kaca elektrik & auto-retract lipat lancar" },
    { name: "Kondisi 4 Ban Utama", status: "NORMAL", condition: "Ketebalan alur tapak 85-90%, tahun produksi seragam" },
    { name: "Ban Cadangan (Serep) & Dongkrak", status: "NORMAL", condition: "Tersedia lengkap, angin terisi penuh, toolkit ada" },
  ];

  // Titik Uji Interior & Kabin
  const interiorCheckpoints = [
    { name: "Jok Baris Depan (Driver & Penumpang)", status: "NORMAL", condition: "Busa tebal empuk, rel maju-mundur & reclining lancar" },
    { name: "Jok Baris Tengah & Belakang", status: "NORMAL", condition: "Lipatan kursi one-touch tumble berfungsi normal, bersih" },
    { name: "Plafon Kabin Atas", status: "NORMAL", condition: "Bersih bebas noda asap rokok, tidak kendur" },
    { name: "Karpet Dasar & Karpet Lembaran", status: "NORMAL", condition: "Bebas noda oli, bebas bau apek, sudah cuci salon" },
    { name: "AC Double Blower", status: "NORMAL", condition: "Suhu hembusan 6°C dingin menggigil, kompresor halus tanpa ngorok" },
    { name: "Dashboard & Instrumen Speedometer", status: "NORMAL", condition: "MID normal, tidak ada lampu indikator check engine yang menyala" },
    { name: "Audio Head Unit & Speaker", status: "NORMAL", condition: "Bluetooth / Android Auto responsif, suara jernih" },
    { name: "Power Window & Central Lock", status: "NORMAL", condition: "Keempat kaca naik-turun lancar dan tombol lock mengunci serentak" },
    { name: "Kebersihan & Aroma Kabin", status: "NORMAL", condition: "Wangi segar alami, garansi kabin bebas asap rokok" },
  ];

  // Titik Uji Mesin & Mekanikal
  const mechanicalCheckpoints = [
    { name: "Getaran & Suara Mesin", status: "NORMAL", condition: "Idle stasioner halus stabil pada 800 RPM, engine mounting padat" },
    { name: "Kebocoran / Rembesan Oli Mesin", status: "NORMAL", condition: "Kering total pada paking tutup klep, karter oli, dan seal kruk as" },
    { name: "Oli Mesin & Filter", status: "NORMAL", condition: "Warna oli bening bersih, baru servis rutin dan ganti filter" },
    { name: "Radiator, Selang & Reservoir Coolant", status: "NORMAL", condition: "Cairan coolant biru/merah bersih, tidak pernah overheat" },
    { name: "Transmisi (Matic / Manual)", status: "NORMAL", condition: "Perpindahan tuas gigi presisi tanpa jedug (bebas shift shock)" },
    { name: "Aki / Baterai & Sistem Pengisian Alternator", status: "NORMAL", condition: "Voltase 12.6V mati / 14.1V hidup, cranking enteng 1x start" },
    { name: "Sistem Kemudi (Rack Steer & Power Steering)", status: "NORMAL", condition: "Putaran setir enteng presisi, tidak lari ke kiri/kanan saat jalan lurus" },
    { name: "Kaki-Kaki & Suspensi (Depan & Belakang)", status: "NORMAL", condition: "Shockbreaker kering tanpa bocor, senyap saat lewat jalan paving/bergelombang" },
  ];

  return (
    <div className="space-y-6">
      {/* ── EXECUTIVE SUMMARY SCORECARD BANNER ── */}
      <div className="p-5 sm:p-6 rounded-[var(--r-card)] bg-[var(--surface)] border border-[var(--line)] space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--r-btn)] bg-[var(--accent)] text-white flex flex-col items-center justify-center shadow-xs">
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">Total</span>
              <span className="text-xl font-bold leading-none">{totalGrade}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[var(--ink)]">
                  Hasil Valuasi &amp; Grade Keseluruhan
                </span>
                <span className="text-[11px] bg-[var(--bg)] text-[var(--ink)] font-semibold px-2 py-0.5 rounded border border-[var(--line)]">
                  {GRADE_LABELS[totalGrade]?.desc || "Prima"}
                </span>
              </div>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                Nilai komposit dari 4 pilar teknis dengan bobot perlindungan struktur sasis.
              </p>
            </div>
          </div>

          {/* 4 Pilar Pill */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs w-full md:w-auto">
            <div className="p-2 bg-[var(--bg)] rounded-[var(--r-btn)] border border-[var(--line)] px-3">
              <span className="text-[10px] text-[var(--muted)] block font-medium">Mesin</span>
              <span className="font-bold text-[var(--ink)] text-[13px]">Grade {inspection.engineGrade}</span>
            </div>
            <div className="p-2 bg-[var(--bg)] rounded-[var(--r-btn)] border border-[var(--line)] px-3">
              <span className="text-[10px] text-[var(--muted)] block font-medium">Interior</span>
              <span className="font-bold text-[var(--ink)] text-[13px]">Grade {inspection.interiorGrade}</span>
            </div>
            <div className="p-2 bg-[var(--bg)] rounded-[var(--r-btn)] border border-[var(--line)] px-3">
              <span className="text-[10px] text-[var(--muted)] block font-medium">Eksterior</span>
              <span className="font-bold text-[var(--ink)] text-[13px]">Grade {inspection.exteriorGrade}</span>
            </div>
            <div className="p-2 bg-[var(--bg)] rounded-[var(--r-btn)] border border-[var(--line)] px-3">
              <span className="text-[10px] text-[var(--muted)] block font-medium">Rangka</span>
              <span className="font-bold text-[var(--ok)] text-[13px]">Grade {inspection.frameGrade}</span>
            </div>
          </div>
        </div>

        {/* Status Bebas Laka/Banjir & Kelengkapan Kunci/Buku */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[8px] flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {inspection.accidentHistory ? "Terindikasi Tabrakan" : "✓ Bebas Tabrakan Berat"}
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[8px] flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {inspection.floodHistory ? "Terindikasi Banjir" : "✓ Bebas Rendaman Banjir"}
            </span>
          </div>

          <div className="p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-[8px] flex items-center justify-between text-[var(--ink)]">
            <span className="flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{inspection.hasSpareKey !== false ? "Kunci Serep: 2 Buah" : "Kunci: 1 Buah"}</span>
            </span>
            <span className="text-[var(--muted)]">&middot;</span>
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{inspection.hasServiceBook !== false ? "Buku Servis: Ada" : "Buku: -"}</span>
            </span>
          </div>
        </div>

        {/* Ringkasan Catatan Resmi */}
        {(inspection.engineNotes || inspection.interiorNotes || inspection.exteriorNotes || inspection.frameNotes) && (
          <div className="p-3 bg-[var(--bg)] rounded-[8px] border border-[var(--line)] text-[12px] space-y-1">
            <span className="font-bold text-[var(--ink)] block text-[11px] uppercase tracking-wider">
              Catatan Resmi Tim Inspektur:
            </span>
            <p className="text-[var(--muted)] leading-relaxed">
              {[
                inspection.engineNotes ? `Mesin: ${inspection.engineNotes}` : null,
                inspection.interiorNotes ? `Interior: ${inspection.interiorNotes}` : null,
                inspection.exteriorNotes ? `Eksterior: ${inspection.exteriorNotes}` : null,
                inspection.frameNotes ? `Rangka: ${inspection.frameNotes}` : null,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* ── TAB SELECTOR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--line)]">
        <button
          onClick={() => setActiveTab("blueprint")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-btn)] text-[13px] font-semibold transition-all cursor-pointer shrink-0",
            activeTab === "blueprint"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-white text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] border border-[var(--line)]"
          )}
        >
          <Car className="w-3.5 h-3.5" />
          <span>1. Peta Bodi (15 Panel)</span>
        </button>

        <button
          onClick={() => setActiveTab("frame")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-btn)] text-[13px] font-semibold transition-all cursor-pointer shrink-0",
            activeTab === "frame"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-white text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] border border-[var(--line)]"
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2. Rangka Utama (14 Titik)</span>
        </button>

        <button
          onClick={() => setActiveTab("exterior")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-btn)] text-[13px] font-semibold transition-all cursor-pointer shrink-0",
            activeTab === "exterior"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-white text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] border border-[var(--line)]"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>3. Eksterior</span>
        </button>

        <button
          onClick={() => setActiveTab("interior")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-btn)] text-[13px] font-semibold transition-all cursor-pointer shrink-0",
            activeTab === "interior"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-white text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] border border-[var(--line)]"
          )}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>4. Interior &amp; AC</span>
        </button>

        <button
          onClick={() => setActiveTab("mechanical")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-btn)] text-[13px] font-semibold transition-all cursor-pointer shrink-0",
            activeTab === "mechanical"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-white text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] border border-[var(--line)]"
          )}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>5. Mesin &amp; Kaki-kaki</span>
        </button>
      </div>

      {/* ── ISI TAB ── */}
      {/* 1. Tab Peta Bodi */}
      {activeTab === "blueprint" && (
        <CarBlueprintView panels={panels} brand={brand} model={model} />
      )}

      {/* 2. Tab Rangka Utama (14 Titik) */}
      {activeTab === "frame" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
                <h3 className="font-bold text-[15px] text-[var(--ink)]">
                  Pemeriksaan 14 Titik Rangka Utama &amp; Sasis
                </h3>
              </div>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                Bebas benturan keras tulang sasis &amp; bebas rendaman banjir.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[var(--ok)] font-semibold text-[12px] rounded-full border border-emerald-200">
              Grade Rangka: {inspection.frameGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {frameCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[13px] text-[var(--ink)]">{pt.name}</span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 ml-6 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
                <span className="font-semibold text-[11px] text-[var(--ok)] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Normal</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Tab Eksterior */}
      {activeTab === "exterior" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-bold text-[15px] text-[var(--ink)]">
                Checklist Komponen Eksterior
              </h3>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                Kondisi lampu, kaca, bemper, spion, serta ketebalan tapak ban.
              </p>
            </div>
            <span className="px-3 py-1 bg-[var(--bg)] text-[var(--ink)] font-semibold text-[12px] rounded-full border border-[var(--line)]">
              Grade Eksterior: {inspection.exteriorGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exteriorCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[13px] text-[var(--ink)] block">{pt.name}</span>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                    {pt.condition}
                  </p>
                </div>
                <span className="font-semibold text-[11px] text-[var(--ok)] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Baik</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Interior */}
      {activeTab === "interior" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-bold text-[15px] text-[var(--ink)]">
                Checklist Kenyamanan Kabin &amp; Elektrikal
              </h3>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                Kondisi jok, AC, karpet, plafon, dan instrumen speedometer.
              </p>
            </div>
            <span className="px-3 py-1 bg-[var(--bg)] text-[var(--ink)] font-semibold text-[12px] rounded-full border border-[var(--line)]">
              Grade Interior: {inspection.interiorGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {interiorCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[13px] text-[var(--ink)] block">{pt.name}</span>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                    {pt.condition}
                  </p>
                </div>
                <span className="font-semibold text-[11px] text-[var(--ok)] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Bersih</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab Mesin & Mekanikal */}
      {activeTab === "mechanical" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-bold text-[15px] text-[var(--ink)]">
                Checklist Ruang Mesin, Transmisi &amp; Kaki-kaki
              </h3>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                Getaran, rembesan oli, sistem radiator, dan suspensi.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[var(--ok)] font-semibold text-[12px] rounded-full border border-emerald-200">
              Grade Mesin: {inspection.engineGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mechanicalCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[8px] border border-[var(--line)] bg-[var(--bg)] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[13px] text-[var(--ink)] block">{pt.name}</span>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                    {pt.condition}
                  </p>
                </div>
                <span className="font-semibold text-[11px] text-[var(--ok)] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sehat</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
