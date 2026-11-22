import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { getDashboardData } from "@/app/actions/ai-assistant";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Beranda | Nur Mobil",
  description: "Ringkasan stok harian, tagihan tempo, saldo kas, dan aksi cepat showroom Nur Mobil.",
};

export default async function AdminDashboardPage() {
  const result = await getDashboardData();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Beranda Showroom"
        subtitle="Catat unit masuk, penjualan, dan pantau tagihan harian dari HP."
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
        <DashboardClient
          initialData={result.data}
          initialOrchestration={result.initialOrchestration}
          hasGeminiKey={result.hasGeminiKey}
          geminiKeySet={result.geminiKeySet}
          geminiEnabled={result.geminiEnabled}
        />
      </main>
    </div>
  );
}
