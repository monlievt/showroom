"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  User,
  Phone,
  Layers,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  CreditCard,
  Percent,
} from "lucide-react";
import { createInvestor } from "@/app/actions/investor";

export function InvestorNewClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"THIRD_PARTY" | "MOTHER_SIBLING" | "OWNER_EQUITY">("THIRD_PARTY");
  const [bankName, setBankName] = useState("BCA");
  const [customBankName, setCustomBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [defaultProfitSharePercent, setDefaultProfitSharePercent] = useState("50");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Nama investor wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const resolvedBankName = bankName === "LAINNYA" ? customBankName.trim() : bankName;

    try {
      const res = await createInvestor({
        name: name.trim(),
        phone: phone.trim() || undefined,
        type,
        bankName: resolvedBankName || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        defaultProfitSharePercent:
          type === "THIRD_PARTY" && defaultProfitSharePercent
            ? Number(defaultProfitSharePercent)
            : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal membuat investor baru");
      }

      setSuccessMsg("Profil investor berhasil dibuat! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/investors/accounts");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menambahkan investor");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/investors/accounts"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Akun Investor</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Tambah Investor Baru
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pendaftaran mitra pemodal untuk skema bagi hasil keuntungan unit mobil.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Skema Pembagian Keuntungan:</strong>
          <span>
            Pilih <strong>Mitra Pihak Ketiga</strong> untuk pemodal luar dengan sistem persentase (%) laba unit, atau <strong>Ibu / 4 Saudara</strong> untuk pembagian skema nominal tier bertingkat keluarga.
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Dasar */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Users className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              1. Identitas &amp; Peran Pemodal
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Nama Lengkap Investor *</span>
            </label>
            <input
              required
              type="text"
              placeholder="Contoh: H. Ahmad Fauzi / Ibu Nur Hayati"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Nomor WhatsApp / HP</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Tipe Hubungan Investor *</span>
              </label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="THIRD_PARTY">Mitra Pihak Ketiga (Bagi Hasil Pro-rata %)</option>
                <option value="MOTHER_SIBLING">Ibu / 4 Saudara (Skema Tier Bertingkat)</option>
                <option value="OWNER_EQUITY">Owner Showroom (Modal Pribadi Toko)</option>
              </select>
            </div>
          </div>

          {/* Pengaturan Persentase Default (Khusus Pihak Ketiga) */}
          {type === "THIRD_PARTY" && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-700" />
                <span>Default Persentase Bagi Hasil Investor (%)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-36">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultProfitSharePercent}
                    onChange={(e) => setDefaultProfitSharePercent(e.target.value)}
                    className="w-full pr-8 pl-3.5 py-2 bg-white border border-blue-300 rounded-lg text-sm font-black text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-700">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-snug">
                  Persentase keuntungan yang didapat investor dari laba bersih setiap unit mobil yang didanai (contoh: 50% untuk investor, 50% untuk showroom).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rekening Bank Tujuan Transfer Dividen */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <CreditCard className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              2. Rekening Bank Tujuan Transfer Bagi Hasil
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nama Bank
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Bank Jatim">Bank Jatim</option>
                <option value="LAINNYA">Bank Lainnya</option>
              </select>
              {bankName === "LAINNYA" && (
                <input
                  type="text"
                  placeholder="Ketik nama bank..."
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 bg-white border border-[#D9D4CB] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nomor Rekening
              </label>
              <input
                type="text"
                placeholder="Contoh: 0123456789"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-mono font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nama Pemilik Rekening (a.n)
              </label>
              <input
                type="text"
                placeholder="Contoh: Ahmad Fauzi"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/investors/accounts"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal &amp; Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Investor...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Profil Investor</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
