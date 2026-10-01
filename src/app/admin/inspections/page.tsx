import React from "react";
import Link from "next/link";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  Car
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InspectionsIndexPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { purchaseDate: "desc" },
    include: {
      inspections: {
        orderBy: { version: "desc" },
      },
    },
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Pusat Cek Fisik & Inspeksi Transparansi"
        subtitle="Daftar laporan uji 11 panel logam, ketebalan cat mikron, sertifikat bebas laka/banjir & unduh PDF resmi."
      />

      <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#EFECE8] border-b border-[#D9D4CB] text-xs font-bold uppercase text-[#6B6560]">
                  <th className="py-3.5 px-4">Plat & Unit</th>
                  <th className="py-3.5 px-4">Status Inspeksi</th>
                  <th className="py-3.5 px-4">Nilai 4 Pilar</th>
                  <th className="py-3.5 px-4">Integritas Fisik</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#6B6560]">
                      Belum ada unit kendaraan di inventori.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => {
                    const currentInsp = v.inspections.find((i) => i.isCurrent) || v.inspections[0];

                    return (
                      <tr key={v.id} className="hover:bg-[#EFECE8]/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-base text-[#1C1917] tracking-tight">
                            {v.plateNumber}
                          </div>
                          <div className="text-xs text-[#6B6560]">
                            {v.brand} {v.model} ({v.year}) • {v.color}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {currentInsp ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Versi {currentInsp.version} ({currentInsp.stage})
                              </span>
                              <div className="text-[11px] text-[#6B6560] mt-1">
                                {formatDate(currentInsp.inspectedAt)} • Oleh {currentInsp.inspectedBy}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Belum Diinspeksi
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {currentInsp ? (
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded" title="Mesin">
                                M: {currentInsp.engineGrade}
                              </span>
                              <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded" title="Interior">
                                I: {currentInsp.interiorGrade}
                              </span>
                              <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded" title="Eksterior">
                                E: {currentInsp.exteriorGrade}
                              </span>
                              <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded" title="Rangka">
                                R: {currentInsp.frameGrade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6B6560] italic">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {currentInsp ? (
                            <div className="text-xs space-y-0.5">
                              <div className={cn("font-semibold", currentInsp.accidentHistory ? "text-[#DC2626]" : "text-[#16A34A]")}>
                                {currentInsp.accidentHistory ? "⚠️ Riwayat Laka" : "✓ Bebas Laka"}
                              </div>
                              <div className={cn("font-semibold", currentInsp.floodHistory ? "text-[#DC2626]" : "text-[#16A34A]")}>
                                {currentInsp.floodHistory ? "⚠️ Riwayat Banjir" : "✓ Bebas Banjir"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6B6560] italic">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentInsp && (
                              <a
                                href={`/api/pdf/inspection/${currentInsp.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg border border-[#D9D4CB] bg-[#EFECE8] hover:bg-[#16A34A] hover:text-white text-[#1C1917] transition-colors"
                                title="Unduh Sertifikat PDF"
                              >
                                <Printer className="w-4 h-4" />
                              </a>
                            )}
                            <Link
                              href={`/admin/inspections/${v.id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#92400E] text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <span>Detail Cek</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
