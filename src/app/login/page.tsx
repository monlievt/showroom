import React, { Suspense } from "react";
import { LoginClient } from "@/components/auth/LoginClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk Portal | Nur Mobil",
  description: "Masuk ke portal operasional showroom atau portal transparansi investor Nur Mobil.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
          <div className="text-sm font-semibold text-[#6B6560]">Memuat portal...</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
