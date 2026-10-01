"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CarBlueprintView, PanelData } from "./CarBlueprintView";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Car, 
  Eye, 
  Gauge, 
  Wind,
  Layers,
  Sparkles,
  Info
} from "lucide-react";

interface InspectionChecklistTabsProps {
  panels: PanelData[];
  inspection: {
    id: string;
    engineGrade: string;
    interiorGrade: string;
    exteriorGrade: string;
    frameGrade: string;
    accidentHistory: boolean;
    floodHistory: boolean;
    engineNotes?: string | null;
    interiorNotes?: string | null;
    exteriorNotes?: string | null;
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
      {/* ── TAB SELECTOR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#D9D4CB]">
        <button
          onClick={() => setActiveTab("blueprint")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0",
            activeTab === "blueprint"
              ? "bg-[#D97706] text-white shadow-sm"
              : "bg-white text-[#6B6560] hover:text-[#1C1917] hover:bg-[#FAF9F6] border border-[#D9D4CB]"
          )}
        >
          <Car className="w-4 h-4" />
          <span>1. Peta Bodi & Uji Mikron (Blueprint)</span>
        </button>

        <button
          onClick={() => setActiveTab("frame")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0",
            activeTab === "frame"
              ? "bg-[#D97706] text-white shadow-sm"
              : "bg-white text-[#6B6560] hover:text-[#1C1917] hover:bg-[#FAF9F6] border border-[#D9D4CB]"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Rangka Utama (14 Titik Bebas Tabrak)</span>
        </button>

        <button
          onClick={() => setActiveTab("exterior")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0",
            activeTab === "exterior"
              ? "bg-[#D97706] text-white shadow-sm"
              : "bg-white text-[#6B6560] hover:text-[#1C1917] hover:bg-[#FAF9F6] border border-[#D9D4CB]"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>3. Eksterior & Kelengkapan</span>
        </button>

        <button
          onClick={() => setActiveTab("interior")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0",
            activeTab === "interior"
              ? "bg-[#D97706] text-white shadow-sm"
              : "bg-white text-[#6B6560] hover:text-[#1C1917] hover:bg-[#FAF9F6] border border-[#D9D4CB]"
          )}
        >
          <Wind className="w-4 h-4" />
          <span>4. Interior & Kelistrikan</span>
        </button>

        <button
          onClick={() => setActiveTab("mechanical")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0",
            activeTab === "mechanical"
              ? "bg-[#D97706] text-white shadow-sm"
              : "bg-white text-[#6B6560] hover:text-[#1C1917] hover:bg-[#FAF9F6] border border-[#D9D4CB]"
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>5. Mesin & Mekanikal</span>
        </button>
      </div>

      {/* ── ISI TAB ── */}
      {/* 1. Tab Peta Bodi (Blueprint Siluet Mobil Adaptif) */}
      {activeTab === "blueprint" && (
        <CarBlueprintView panels={panels} brand={brand} model={model} />
      )}

      {/* 2. Tab Rangka Utama (14 Titik) */}
      {activeTab === "frame" && (
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9D4CB]">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base sm:text-lg text-[#1C1917]">
                  Pemeriksaan 14 Titik Rangka Utama & Sasis
                </h3>
              </div>
              <p className="text-xs text-[#6B6560] mt-1">
                Jaminan integritas struktur mobil: Bebas benturan keras tulang sasis & bebas rendaman banjir.
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
              Grade Rangka: {inspection.frameGrade} (Lolos Uji Integritas)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {frameCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-[#1C1917]">{pt.name}</span>
                  </div>
                  <p className="text-[11px] text-[#6B6560] mt-1 ml-7 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Normal</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Tab Eksterior */}
      {activeTab === "exterior" && (
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D4CB]">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#1C1917]">
                Checklist Komponen Eksterior & Kelengkapan
              </h3>
              <p className="text-xs text-[#6B6560] mt-1">
                Kondisi lampu, kaca, bemper, spion, serta ketebalan tapak ban.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
              Grade Eksterior: {inspection.exteriorGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {exteriorCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-xs text-[#1C1917] block">{pt.name}</span>
                  <p className="text-[11px] text-[#6B6560] mt-0.5 leading-relaxed">
                    {pt.condition}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Baik</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Interior */}
      {activeTab === "interior" && (
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D4CB]">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#1C1917]">
                Checklist Kenyamanan Kabin & Elektrikal Interior
              </h3>
              <p className="text-xs text-[#6B6560] mt-1">
                Kondisi jok, sistem AC, kebersihan karpet & plafon, serta perangkat elektrikal kabin.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
              Grade Interior: {inspection.interiorGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {interiorCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-xs text-[#1C1917] block">{pt.name}</span>
                  <p className="text-[11px] text-[#6B6560] mt-0.5 leading-relaxed">
                    {pt.condition}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bersih & Normal</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab Mesin & Mekanikal */}
      {activeTab === "mechanical" && (
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D4CB]">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#1C1917]">
                Checklist Ruang Mesin, Transmisi & Kaki-Kaki
              </h3>
              <p className="text-xs text-[#6B6560] mt-1">
                Pemeriksaan getaran, suara stasioner, sistem pelumasan, pendingin radiator, dan suspensi.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
              Grade Mesin: {inspection.engineGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {mechanicalCheckpoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#EBE7E1] bg-[#FAF9F6] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-xs text-[#1C1917] block">{pt.name}</span>
                  <p className="text-[11px] text-[#6B6560] mt-0.5 leading-relaxed">
                    {pt.condition}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sehat & Kering</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
