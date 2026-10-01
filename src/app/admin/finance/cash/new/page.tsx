import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CashTransactionNewClient } from "@/components/admin/CashTransactionNewClient";

export const metadata = {
  title: "Catat Transaksi Kas Manual | Nur Mobil Admin",
  description: "Pencatatan kas masuk atau keluar rekening bank showroom.",
};

export default function AdminNewCashPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Catat Transaksi Kas Manual"
        subtitle="Pencatatan mutasi kas masuk atau keluar di luar transaksi jual beli unit mobil."
      />
      <main className="flex-1">
        <CashTransactionNewClient />
      </main>
    </div>
  );
}
