import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImportSpreadsheetPanel } from "@/components/admin/ImportSpreadsheetPanel";

export const metadata = {
  title: "Import Data Spreadsheet | Nur Mobil Admin",
  description: "Impor data mobil lama dan riwayat biaya dari Excel / CSV / Google Sheets.",
};

export default function InventoryImportPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Import Data Mobil & Biaya dari Spreadsheet"
        subtitle="Migrasi cepat data pembukuan lama atau Excel/Google Sheets langsung ke sistem Showroom."
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Inventori</span>
          </Link>
        </div>

        <div className="bg-white border border-[#D9D4CB] rounded-3xl p-6 sm:p-8 shadow-xs">
          <ImportSpreadsheetPanel />
        </div>
      </main>
    </div>
  );
}
