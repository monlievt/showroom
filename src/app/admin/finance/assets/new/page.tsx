import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AssetNewClient } from "@/components/admin/AssetNewClient";

export const metadata = {
  title: "Tambah Aset Tetap Showroom | Nur Mobil Admin",
  description: "Pencatatan peralatan, mesin poles, scanner inspeksi dan inventaris garasi showroom.",
};

export default function AdminNewAssetPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Tambah Aset Tetap Showroom"
        subtitle="Pencatatan peralatan poles, alat cek fisik, elektronik kasir, dan inventaris showroom."
      />
      <main className="flex-1">
        <AssetNewClient />
      </main>
    </div>
  );
}
