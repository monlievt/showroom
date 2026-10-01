"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [role, setRole] = useState<"ADMIN" | "INVESTOR">("ADMIN");
  const [identifier, setIdentifier] = useState("admin");
  const [pin, setPin] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await loginAction({
      identifier,
      pin,
      role,
    });

    setLoading(false);

    if (res.success && res.redirectUrl) {
      const destination = callbackUrl || res.redirectUrl;
      router.push(destination);
      router.refresh();
    } else {
      setError(res.error || "Login gagal");
    }
  };

  const handleQuickLogin = (targetRole: "ADMIN" | "INVESTOR", targetId: string, targetPin: string = "123456") => {
    setRole(targetRole);
    setIdentifier(targetId);
    setPin(targetPin);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#D97706] flex items-center justify-center text-white font-extrabold text-2xl shadow-sm mx-auto">
            N
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
            Nur Mobil
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6560]">
            Portal Operasional Internal & Transparansi Investor
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-8 shadow-sm space-y-6">
          {/* Tab Selector: Admin vs Investor */}
          <div className="grid grid-cols-2 bg-[#F7F5F2] p-1.5 rounded-2xl border border-[#D9D4CB]">
            <button
              type="button"
              onClick={() => {
                setRole("ADMIN");
                setIdentifier("admin");
                setPin("123456");
                setError(null);
              }}
              className={cn(
                "py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                role === "ADMIN"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              Owner / Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("INVESTOR");
                setIdentifier("081298765432");
                setPin("123456");
                setError(null);
              }}
              className={cn(
                "py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                role === "INVESTOR"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              Mitra Investor
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                {role === "ADMIN" ? "Username / No. WhatsApp" : "Nomor WhatsApp Terdaftar"}
              </label>
              <div className="relative">
                {role === "ADMIN" ? (
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
                ) : (
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
                )}
                <input
                  type="text"
                  required
                  placeholder={role === "ADMIN" ? "admin" : "081298765432"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                PIN Akses (6 Digit)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
                <input
                  type="password"
                  required
                  placeholder="123456"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow cursor-pointer mt-2"
            >
              <span>{loading ? "Memverifikasi..." : `Masuk sebagai ${role === "ADMIN" ? "Owner" : "Investor"}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-[#EBE7E1] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6560] block text-center">
              Pintasan Uji Coba Cepat (Akun Demo)
            </span>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("ADMIN", "admin", "123456")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">Owner (Toko Bu Nur)</span>
                  <span className="text-[11px] text-[#6B6560]">Akses penuh semua modul operasional</span>
                </div>
                <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded">
                  PILIH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("INVESTOR", "081298765432", "123456")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">Ibu Nurdiah (Modal Keluarga)</span>
                  <span className="text-[11px] text-[#6B6560]">Portal modal & bagi hasil 4 saudara</span>
                </div>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  PILIH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("INVESTOR", "081345678901", "123456")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">Pak Budi (Pihak Ketiga)</span>
                  <span className="text-[11px] text-[#6B6560]">Portal investor akad custom 50%</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  PILIH
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#6B6560]">
          <ShieldCheck className="w-4 h-4 text-[#D97706]" />
          <span>Sesi terenkripsi HMAC SHA-256 aman di server lokal</span>
        </div>
      </div>
    </div>
  );
}
