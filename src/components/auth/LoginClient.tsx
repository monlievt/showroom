"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Wrench,
  TrendingUp,
  Briefcase,
  Users,
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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-[10px] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xl shadow-xs mx-auto">
            N
          </div>
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
            Nur Mobil
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            Portal Operasional Internal &amp; Transparansi Investor
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[var(--surface)] rounded-[var(--r-card)] border border-[var(--line)] p-6 sm:p-7 shadow-xs space-y-5">
          {/* Tab Selector: 4 Peran RBAC */}
          <div className="grid grid-cols-4 gap-1 bg-[var(--bg)] p-1 rounded-[var(--r-btn)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => {
                setRole("OWNER");
                setIdentifier("owner");
                setError(null);
              }}
              className={cn(
                "py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer text-center",
                role === "OWNER"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--line)] font-bold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("STAFF_ADMIN");
                setIdentifier("admin_garasi");
                setError(null);
              }}
              className={cn(
                "py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer text-center",
                role === "STAFF_ADMIN"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--line)] font-bold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              Staf
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("SALES");
                setIdentifier("sales01");
                setError(null);
              }}
              className={cn(
                "py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer text-center",
                role === "SALES"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--line)] font-bold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("INVESTOR");
                setIdentifier("hendra_investor");
                setError(null);
              }}
              className={cn(
                "py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer text-center",
                role === "INVESTOR"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--line)] font-bold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              Investor
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-[var(--r-btn)] text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-[var(--muted)] block mb-1">
                {role === "INVESTOR" ? "Username atau Nomor WhatsApp Terdaftar" : "Username / ID Pengguna"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  required
                  placeholder={
                    role === "INVESTOR"
                      ? "hendra_investor atau 081234567895"
                      : role === "OWNER"
                      ? "owner"
                      : role === "STAFF_ADMIN"
                      ? "admin_garasi"
                      : "sales01"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--line-input)] rounded-[var(--r-btn)] text-[14px] text-[var(--ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[var(--muted)] block mb-1">
                Kata Sandi Keamanan
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Masukkan kata sandi..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-[var(--surface)] border border-[var(--line-input)] rounded-[var(--r-btn)] text-[14px] text-[var(--ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none p-1 cursor-pointer"
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-[var(--r-btn)] font-semibold text-[14px] shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-1"
            >
              <span>
                {loading
                  ? "Memverifikasi..."
                  : `Masuk sebagai ${
                      role === "OWNER"
                        ? "Owner Showroom"
                        : role === "STAFF_ADMIN"
                        ? "Staf Garasi"
                        : role === "SALES"
                        ? "Tim Sales"
                        : "Mitra Investor"
                    }`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Role Preset Selector */}
          <div className="pt-4 border-t border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Pilih Cepat Peran Pengguna
              </span>
              <span className="text-[11px] text-[var(--muted)]">Isi otomatis akun</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectRole("OWNER", "owner")}
                className="p-2.5 rounded-[var(--r-btn)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--bg)] text-left transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg)] flex items-center justify-center text-[var(--ink)]">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[12px] text-[var(--ink)] block">Owner</span>
                    <span className="text-[10px] text-[var(--muted)]">Akses penuh</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)] group-hover:text-[var(--accent)]">
                  Pilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("STAFF_ADMIN", "admin_garasi")}
                className="p-2.5 rounded-[var(--r-btn)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--bg)] text-left transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg)] flex items-center justify-center text-[var(--ink)]">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[12px] text-[var(--ink)] block">Staf Garasi</span>
                    <span className="text-[10px] text-[var(--muted)]">Unit &amp; SPK</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)] group-hover:text-[var(--accent)]">
                  Pilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("SALES", "sales01")}
                className="p-2.5 rounded-[var(--r-btn)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--bg)] text-left transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg)] flex items-center justify-center text-[var(--ink)]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[12px] text-[var(--ink)] block">Tim Sales</span>
                    <span className="text-[10px] text-[var(--muted)]">Katalog &amp; harga</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)] group-hover:text-[var(--accent)]">
                  Pilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("INVESTOR", "081298765432")}
                className="p-2.5 rounded-[var(--r-btn)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--bg)] text-left transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg)] flex items-center justify-center text-[var(--ink)]">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[12px] text-[var(--ink)] block">Mitra Investor</span>
                    <span className="text-[10px] text-[var(--muted)]">Bagi hasil</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)] group-hover:text-[var(--accent)]">
                  Pilih
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--muted)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
          <span>Sesi terenkripsi HMAC SHA-256 aman di server lokal</span>
        </div>
      </div>
    </div>
  );
}
