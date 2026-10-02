import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  FileText, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Calendar,
  Layers,
  Sparkles,
  Eye
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { 
  PANEL_LABELS, 
  CONDITION_LABELS, 
  getPaintMicronCategory 
} from "@/lib/calculations/inspection";
import { formatDate, cn } from "@/lib/utils";

export default async function VehicleInspectionsPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      inspections: {
        orderBy: { version: "desc" },
        include: {
          panels: true,
        },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  const inspections = vehicle.inspections;
  const currentInspection = inspections.find((i) => i.isCurrent) || inspections[0];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Riwayat Inspeksi — ${vehicle.brand} ${vehicle.model}`}
        subtitle={`Plat ${vehicle.plateNumber} • ${vehicle.year} • ${vehicle.color}`}
      >
        <Link
          href={`/admin/inspections/${vehicle.id}/new`}
          className="flex items-center gap-2 px-4 py-2 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Inspeksi Baru</span>
        </Link>
      </AdminHeader>

      <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#1C1917] font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Inventori</span>
        </Link>

        {inspections.length === 0 ? (
          <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-12 text-center space-y-4">
            <Layers className="w-12 h-12 text-[#D97706] mx-auto opacity-80" />
            <h2 className="text-xl font-bold text-[#1C1917]">Belum Ada Laporan Cek Fisik</h2>
            <p className="text-sm text-[#6B6560] max-w-md mx-auto">
              Unit ini belum memiliki riwayat uji mikron cat atau penilaian 4 pilar. Buat inspeksi awal (Intake) untuk mencatat kondisi asli mobil saat datang.
            </p>
            <Link
              href={`/admin/inspections/${vehicle.id}/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Mulai Cek Fisik Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Version Switcher Tabs */}
            <div className="flex items-center gap-3 border-b border-[#D9D4CB] pb-3 overflow-x-auto">
              <span className="text-xs font-bold uppercase text-[#6B6560] mr-2">Versi Laporan:</span>
              {inspections.map((insp) => (
                <div
                  key={insp.id}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2",
                    insp.isCurrent
                      ? "bg-[#1C1917] text-white border-[#1C1917] shadow-sm"
                      : "bg-[#EFECE8] text-[#6B6560] border-[#D9D4CB]"
                  )}
                >
                  <span>Versi {insp.version} ({insp.stage})</span>
                  {insp.isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#16A34A] text-white font-bold">
                      Aktif
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Current Inspection Display */}
            {currentInspection && (
              <div className="space-y-6">
                {/* Header Action Bar */}
                <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#1C1917]">
                        Laporan Inspeksi Versi {currentInspection.version}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/30">
                        {currentInspection.stage}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B6560] mt-1">
                      Diperiksa oleh: <strong className="text-[#1C1917]">{currentInspection.inspectedBy}</strong> pada {formatDate(currentInspection.inspectedAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/inspeksi/${currentInspection.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C1917] hover:bg-[#D97706] text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview Sertifikat Web (Mobile Friendly)</span>
                    </Link>
                    <a
                      href={`/api/pdf/inspection/${currentInspection.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak PDF</span>
                    </a>
                  </div>
                </div>

                {/* Total Grade & 4 Pilar Grades */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white border border-[#D9D4CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs uppercase font-bold text-[#6B6560]">
                          Total Grade Keseluruhan Unit
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-2xl font-black text-[#1C1917]">
                            Grade {currentInspection.totalGrade || "A"}
                          </span>
                          <span className="text-xs font-semibold text-[#6B6560]">
                            • Skor Gabungan Mesin, Interior, Eksterior & Rangka
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full border",
                        currentInspection.hasServiceBook !== false
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-600 border-stone-200"
                      )}>
                        {currentInspection.hasServiceBook !== false ? "✓ Buku Servis Ada" : "Buku Servis Nihil"}
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full border",
                        currentInspection.hasSpareKey !== false
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-600 border-stone-200"
                      )}>
                        {currentInspection.hasSpareKey !== false ? "✓ Kunci Cadangan Ada" : "1 Kunci"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#D9D4CB] rounded-xl p-4 text-center">
                      <span className="text-xs text-[#6B6560] uppercase font-semibold">Mesin & Transmisi</span>
                      <div className="text-3xl font-extrabold text-[#D97706] mt-1">{currentInspection.engineGrade}</div>
                    </div>
                    <div className="bg-white border border-[#D9D4CB] rounded-xl p-4 text-center">
                      <span className="text-xs text-[#6B6560] uppercase font-semibold">Interior & AC</span>
                      <div className="text-3xl font-extrabold text-[#D97706] mt-1">{currentInspection.interiorGrade}</div>
                    </div>
                    <div className="bg-white border border-[#D9D4CB] rounded-xl p-4 text-center">
                      <span className="text-xs text-[#6B6560] uppercase font-semibold">Eksterior & Bodi</span>
                      <div className="text-3xl font-extrabold text-[#D97706] mt-1">{currentInspection.exteriorGrade}</div>
                    </div>
                    <div className="bg-white border border-[#D9D4CB] rounded-xl p-4 text-center">
                      <span className="text-xs text-[#6B6560] uppercase font-semibold">Rangka / Sasis</span>
                      <div className="text-3xl font-extrabold text-[#D97706] mt-1">{currentInspection.frameGrade}</div>
                    </div>
                  </div>
                </div>

                {/* Laka & Banjir Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-3",
                    currentInspection.accidentHistory 
                      ? "bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]" 
                      : "bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]"
                  )}>
                    {currentInspection.accidentHistory ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <div>
                      <div className="font-bold text-sm">
                        {currentInspection.accidentHistory ? "Ada Riwayat Tabrakan" : "Bebas Tabrakan Berat"}
                      </div>
                      <div className="text-xs opacity-90">
                        {currentInspection.accidentHistory ? "Ditemukan perbaikan sasis/apron depan" : "Sasis, pilar A/B/C dan lantai bagasi utuh pabrik"}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-3",
                    currentInspection.floodHistory 
                      ? "bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]" 
                      : "bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]"
                  )}>
                    {currentInspection.floodHistory ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <div>
                      <div className="font-bold text-sm">
                        {currentInspection.floodHistory ? "Ada Riwayat Terendam Banjir" : "Bebas Terendam Banjir"}
                      </div>
                      <div className="text-xs opacity-90">
                        {currentInspection.floodHistory ? "Ditemukan endapan lumpur/korosi abnormal" : "Jalur kabel, karpet dasar, dan dashboard bersih"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 15 Panel Table */}
                <div className="bg-white border border-[#D9D4CB] rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-[#EFECE8] border-b border-[#D9D4CB] font-bold text-sm text-[#1C1917] flex items-center justify-between">
                    <span>Hasil Pengukuran 15 Titik Panel Bodi & Bumper (Standar Inspeksi)</span>
                    <span className="text-xs font-normal text-[#6B6560]">
                      Termasuk Rocker Panel & Bumper Plastik Non-Mikron
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#D9D4CB] text-xs font-semibold uppercase text-[#6B6560]">
                          <th className="py-3 px-4">Panel</th>
                          <th className="py-3 px-4">Material</th>
                          <th className="py-3 px-4">Ketebalan Cat</th>
                          <th className="py-3 px-4">Kode Cacat</th>
                          <th className="py-3 px-4">Kondisi Panel</th>
                          <th className="py-3 px-4">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFECE8]">
                        {currentInspection.panels.map((panel) => {
                          const isPlasticBumper = panel.panelType === "BUMPER_FRONT" || panel.panelType === "BUMPER_REAR";
                          const category = !isPlasticBumper ? getPaintMicronCategory(panel.paintThickness) : null;

                          return (
                            <tr key={panel.id}>
                              <td className="py-3 px-4 font-semibold text-xs text-[#1C1917]">
                                {PANEL_LABELS[panel.panelType] || panel.panelType}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {isPlasticBumper ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    Plastik ABS
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                                    Bodi Logam
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isPlasticBumper ? (
                                  <span className="text-[#6B6560] italic text-xs">
                                    Non-Micron
                                  </span>
                                ) : (
                                  <>
                                    <span className="font-bold text-xs">{panel.paintThickness ?? "-"} µm</span>
                                    {category && (
                                      <span className={cn(
                                        "ml-2 text-[11px] font-semibold",
                                        category === "ORIGINAL" && "text-[#16A34A]",
                                        category === "REPAINT" && "text-[#CA8A04]",
                                        category === "THICK_FILLER" && "text-[#DC2626]"
                                      )}>
                                        ({category === "ORIGINAL" ? "Original" : category === "REPAINT" ? "Repaint" : "Dempul"})
                                      </span>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {panel.defectCode ? (
                                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs">
                                    {panel.defectCode}
                                  </span>
                                ) : (
                                  <span className="text-[#6B6560]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs text-[#1C1917]">
                                {CONDITION_LABELS[panel.condition] || panel.condition}
                              </td>
                              <td className="py-3 px-4 text-xs text-[#6B6560]">
                                {panel.notes || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
