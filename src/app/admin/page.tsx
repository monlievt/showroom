import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { getDashboardData } from "@/app/actions/ai-assistant";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Utama & AI Assistant | Nur Mobil Admin",
  description: "Command Center Showroom Nur Mobil: Funnel Operasional, Alarm BPKB, Kas Runway, dan Asisten Keputusan AI Gemini.",
};

export default async function AdminDashboardPage() {
  const result = await getDashboardData();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Dashboard Utama & Asisten AI"
        subtitle="Command Center operasional showroom: funnel garasi, alarm BPKB tertahan, analisa kas kulakan, dan asisten keputusan cerdas."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
        <DashboardClient
          initialData={result.data}
          hasGeminiKey={result.hasGeminiKey}
          geminiKeySet={result.geminiKeySet}
          geminiEnabled={result.geminiEnabled}
        />
      </main>
    </div>
  );
}
