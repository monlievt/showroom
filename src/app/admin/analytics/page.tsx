import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AnalyticsVelocityClient } from "@/components/admin/AnalyticsVelocityClient";
import { getShowroomAnalyticsAction } from "@/app/actions/analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analitik & Perputaran Showroom | Nur Mobil Admin",
  description: "Visual timeline siklus unit beli ke laku, velocity matrix panduan kulakan cuan, analisa bottleneck garasi, dan kalkulator holding cost.",
};

export default async function AdminAnalyticsPage() {
  const result = await getShowroomAnalyticsAction();
  const analyticsData = result.success && result.data ? result.data : null;

  if (!analyticsData) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="Analitik & Perputaran Showroom"
          subtitle="Evaluasi kecepatan laku, visual timeline siklus beli ke laku, dan panduan kulakan cuan."
        />
        <div className="p-8 text-center text-xs text-[var(--muted)]">
          Gagal memuat data analitik. Pastikan Anda memiliki hak akses.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Analitik & Perputaran Showroom"
        subtitle="Visual timeline siklus beli ke laku, matriks rekomendasi kulakan lelang, analisa bottleneck garasi, dan estimasi biaya tunggu modal."
      />
      <main className="flex-1">
        <AnalyticsVelocityClient initialData={analyticsData} />
      </main>
    </div>
  );
}
