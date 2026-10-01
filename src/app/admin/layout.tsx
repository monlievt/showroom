import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Admin Operasional — Nur Mobil",
  description: "Platform Operasional & Transparansi Showroom Nur Mobil",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col md:flex-row">
      <AdminSidebar
        userRole={session?.role || "ADMIN"}
        userName={session?.fullName || "Owner Nur Mobil"}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

