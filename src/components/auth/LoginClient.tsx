"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Phone,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [role, setRole] = useState<"OWNER" | "STAFF_ADMIN" | "SALES" | "INVESTOR">("OWNER");
  const [identifier, setIdentifier] = useState("owner");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Username atau nomor telepon wajib diisi.");
      return;
    }

    if (!pin) {
      setError("Kata sandi wajib diisi.");
      return;
    }

    if (pin.length < 8) {
      setError("Password salah.");
      return;
    }

    setLoading(true);

    const res = await loginAction({
      identifier,
      pin,
      password: pin,
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

  const handleSelectRole = (
    targetRole: "OWNER" | "STAFF_ADMIN" | "SALES" | "INVESTOR",
    targetId: string
  ) => {
    setRole(targetRole);
    setIdentifier(targetId);
    setError(null);
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
          {/* Tab Selector: 4 Peran RBAC */}
          <div className="grid grid-cols-4 gap-1 bg-[#F7F5F2] p-1.5 rounded-2xl border border-[#D9D4CB]">
            <button
              type="button"
              onClick={() => {
                setRole("OWNER");
                setIdentifier("owner");
                setError(null);
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                role === "OWNER"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              👑 Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("STAFF_ADMIN");
                setIdentifier("admin_garasi");
                setError(null);
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                role === "STAFF_ADMIN"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              🔧 Staff
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("SALES");
                setIdentifier("sales01");
                setError(null);
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                role === "SALES"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              🎯 Sales
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("INVESTOR");
                setIdentifier("081298765432");
                setError(null);
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                role === "INVESTOR"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              🤝 Investor
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
                {role === "INVESTOR" ? "Nomor WhatsApp Terdaftar" : "Username / ID Pengguna"}
              </label>
              <div className="relative">
                {role === "INVESTOR" ? (
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
                ) : (
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
                )}
                <input
                  type="text"
                  required
                  placeholder={
                    role === "INVESTOR"
                      ? "Contoh: 081298765432"
                      : role === "OWNER"
                      ? "owner"
                      : role === "STAFF_ADMIN"
                      ? "admin_garasi"
                      : "sales01"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C1917] block mb-1.5">
                Kata Sandi Keamanan
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Masukkan kata sandi..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D97706]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1917] focus:outline-none p-1 cursor-pointer"
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow cursor-pointer mt-2"
            >
              <span>
                {loading
                  ? "Memverifikasi..."
                  : `Masuk sebagai ${
                      role === "OWNER"
                        ? "Owner Showroom"
                        : role === "STAFF_ADMIN"
                        ? "Staff Garasi"
                        : role === "SALES"
                        ? "Tim Sales"
                        : "Mitra Investor"
                    }`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Role Preset Selector */}
          <div className="pt-4 border-t border-[#EBE7E1] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6560]">
                Pilih Cepat Peran Pengguna
              </span>
              <span className="text-[10px] text-[#6B6560]">Isi otomatis username</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectRole("OWNER", "owner")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">👑 Owner</span>
                  <span className="text-[10px] text-[#6B6560]">Akses penuh sistem</span>
                </div>
                <span className="text-[9px] font-bold bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded">
                  PILIH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("STAFF_ADMIN", "admin_garasi")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">🔧 Staff Garasi</span>
                  <span className="text-[10px] text-[#6B6560]">Unit, SPK & kasir</span>
                </div>
                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  PILIH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("SALES", "sales01")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">🎯 Tim Sales</span>
                  <span className="text-[10px] text-[#6B6560]">Stok ready & harga</span>
                </div>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  PILIH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("INVESTOR", "081298765432")}
                className="p-2.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#F7F5F2] text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#1C1917] block">🤝 Mitra Investor</span>
                  <span className="text-[10px] text-[#6B6560]">Portal 4 saudara</span>
                </div>
                <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
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
