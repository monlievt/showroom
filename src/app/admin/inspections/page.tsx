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
        <div className="bg-[var(--bg)] border border-[var(--line)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-xs font-bold uppercase text-[var(--muted)]">
                  <th className="py-3.5 px-4">Plat & Unit</th>
                  <th className="py-3.5 px-4">Status Inspeksi</th>
                  <th className="py-3.5 px-4">Nilai 4 Pilar</th>
                  <th className="py-3.5 px-4">Integritas Fisik</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--muted)]">
                      Belum ada unit kendaraan di inventori.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => {
                    const currentInsp = v.inspections.find((i) => i.isCurrent) || v.inspections[0];

                    return (
                      <tr key={v.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-base text-[var(--ink)] tracking-tight">
                            {v.plateNumber}
                          </div>
                          <div className="text-xs text-[var(--muted)]">
                            {v.brand} {v.model} ({v.year}) • {v.color}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {currentInsp ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--bg)] text-[var(--ok)] border border-[var(--ok)]/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Versi {currentInsp.version} ({currentInsp.stage})
                              </span>
                              <div className="text-[11px] text-[var(--muted)] mt-1">
                                {formatDate(currentInsp.inspectedAt)} • Oleh {currentInsp.inspectedBy}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--bg)] text-[var(--bad)] border border-[var(--bad)]/30">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Belum Diinspeksi
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {currentInsp ? (
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span className="px-2 py-0.5 bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded" title="Mesin">
                                M: {currentInsp.engineGrade}
                              </span>
                              <span className="px-2 py-0.5 bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded" title="Interior">
                                I: {currentInsp.interiorGrade}
                              </span>
                              <span className="px-2 py-0.5 bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded" title="Eksterior">
                                E: {currentInsp.exteriorGrade}
                              </span>
                              <span className="px-2 py-0.5 bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded" title="Rangka">
                                R: {currentInsp.frameGrade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted)] italic">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {currentInsp ? (
                            <div className="text-xs space-y-0.5">
                              <div className={cn("font-semibold", currentInsp.accidentHistory ? "text-[var(--bad)]" : "text-[var(--ok)]")}>
                                {currentInsp.accidentHistory ? "⚠️ Riwayat Laka" : "✓ Bebas Laka"}
                              </div>
                              <div className={cn("font-semibold", currentInsp.floodHistory ? "text-[var(--bad)]" : "text-[var(--ok)]")}>
                                {currentInsp.floodHistory ? "⚠️ Riwayat Banjir" : "✓ Bebas Banjir"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted)] italic">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentInsp && (
                              <a
                                href={`/api/pdf/inspection/${currentInsp.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:bg-white text-[var(--ink)] transition-colors shadow-2xs"
                                title="Unduh Sertifikat PDF"
                              >
                                <Printer className="w-4 h-4 text-[var(--accent)]" />
                              </a>
                            )}
                            <Link
                              href={`/admin/inspections/${v.id}`}
                              className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
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
