"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Kesalahan pada modul Kelola Pengguna:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[var(--line)] p-8 shadow-xs text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-[var(--bg)] border border-red-200 flex items-center justify-center text-[var(--bad)]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[var(--ink)]">Gagal Memuat Halaman Pengguna</h2>
          <p className="text-sm text-[var(--muted)]">
            {error.message || "Terjadi kesalahan internal saat mengambil data pengguna atau sesi Anda telah berakhir."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] text-sm font-semibold hover:bg-[var(--bg)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
