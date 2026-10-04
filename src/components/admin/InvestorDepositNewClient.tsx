"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  DollarSign,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Info,
  Calendar,
  Paperclip,
  UploadCloud,
  ExternalLink,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { formatThousands, parseThousands } from "@/lib/utils";
import { depositInvestorCapital } from "@/app/actions/capital-ledger";

interface InvestorOption {
  id: string;
  name: string;
  type: string;
}

interface ProofItem {
  id: string;
  url: string;
  name: string;
}

export function InvestorDepositNewClient({
  investors,
}: {
  investors: InvestorOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedInvestorId, setSelectedInvestorId] = useState(
    investors[0]?.id || ""
  );
  const [amount, setAmount] = useState<number | "">("");
  const [depositDate, setDepositDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  // Upload Bukti Transfer state (Mendukung beberapa foto/screenshot)
  const [proofList, setProofList] = useState<ProofItem[]>([]);
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!selectedInvestorId) {
      setUploadError("Pilih akun investor terlebih dahulu sebelum mengunggah bukti transfer.");
      return;
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        setUploadError(`File ${f.name} melebihi batas ukuran maksimal 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingProof(true);
    setUploadError("");

    try {
      const uploaded: ProofItem[] = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("investorId", selectedInvestorId);
        formData.append("uploadType", "TRANSFER_PROOF");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Gagal mengunggah file ${file.name}`);
        }

        uploaded.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          url: data.fileUrl,
          name: file.name,
        });
      }

      setProofList((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah beberapa bukti transfer");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = (id: string) => {
    setProofList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId) {
      setErrorMsg("Pilih akun investor terlebih dahulu");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal setoran modal harus lebih dari Rp 0");
      return;
    }
    if (!depositDate) {
      setErrorMsg("Tanggal setoran modal wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const proofUrls = proofList.map((p) => p.url);

      const res = await depositInvestorCapital({
        investorId: selectedInvestorId,
        type: "DEPOSIT",
        amount: Number(amount),
        notes: notes || undefined,
        proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
        proofUrl: proofUrls[0] || undefined,
        depositDate: depositDate || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat setoran modal investor");
      }

      setSuccessMsg(
        "Setoran modal investor berhasil dicatat pada Ledger & Kas Umum! Mengalihkan..."
      );
      setTimeout(() => {
        router.push("/admin/investors/accounts");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat setoran modal");
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
              Penyetoran Modal Investor
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pencatatan dana segar yang disetorkan investor ke rekening operasional showroom.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Sinkronisasi Ledger & Buku Kas:</strong>
          <span>
            Setoran modal secara otomatis menambah saldo berjalan di <strong>Capital Ledger Investor</strong> sekaligus menambah kas masuk (IN_CAPITAL_DEPOSIT) di buku kas utama rekening BCA showroom.
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
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Coins className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              Rincian Setoran Modal Investor
            </h2>
          </div>

          {/* 1. Pilih Investor */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Pilih Akun Investor *</span>
            </label>
            {investors.length === 0 ? (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                Belum ada profil investor. Silakan buat investor baru terlebih dahulu.
              </div>
            ) : (
              <select
                required
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                {investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.type === "MOTHER_SIBLING" ? "4 Saudara" : inv.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Tanggal Setoran Modal */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Tanggal Setoran Modal *</span>
            </label>
            <input
              required
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
            />
            <span className="text-[11px] text-[#6B6560] mt-1 block">
              Pilih tanggal saat dana masuk atau ditransfer ke rekening showroom.
            </span>
          </div>

          {/* 3. Nominal Setoran Modal */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Nominal Setoran Modal (Rp) *</span>
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 50.000.000"
              value={amount !== "" ? formatThousands(amount) : ""}
              onChange={(e) => setAmount(parseThousands(e.target.value) || "")}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
            />
          </div>

          {/* 4. Lampiran Bukti Transfer (Bisa Beberapa Foto / Screenshot) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Lampiran Bukti Transfer Bank (Bisa Beberapa Foto / Screenshot)</span>
              </label>
              {proofList.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ✓ {proofList.length} Foto/Dokumen Terlampir
                </span>
              )}
            </div>

            {uploadError && (
              <div className="mb-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Input File Tersembunyi (mendukung multiple) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFilesUpload(files);
                  e.target.value = "";
                }
              }}
            />

            {/* Daftar File yang Sudah Diunggah */}
            {proofList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {proofList.map((proof, idx) => {
                  const isImg = /\.(jpeg|jpg|png|webp)$/i.test(proof.url);
                  return (
                    <div
                      key={proof.id}
                      className="p-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl flex items-center justify-between gap-3 shadow-2xs group hover:border-[#D97706]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isImg ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#D9D4CB] bg-white shrink-0 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proof.url}
                              alt={`Bukti #${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex flex-col items-center justify-center shrink-0 border border-amber-200">
                            <FileText className="w-5 h-5" />
                            <span className="text-[9px] font-bold">PDF</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1C1917] truncate max-w-[150px] sm:max-w-[130px]">
                            {proof.name || `Bukti Transfer #${idx + 1}`}
                          </p>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Foto #{idx + 1} Tersimpan
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={proof.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white border border-[#D9D4CB] rounded-xl text-[#1C1917] hover:bg-[#EFECE8] transition-colors shadow-2xs"
                          title="Buka bukti ukuran penuh"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#6B6560]" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRemoveProof(proof.id)}
                          className="p-1.5 bg-red-50 border border-red-200 rounded-xl text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Hapus lampiran ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dropzone / Tombol Upload */}
            <div
              onClick={() => {
                if (!uploadingProof) {
                  fileInputRef.current?.click();
                }
              }}
              className="border-2 border-dashed border-[#D9D4CB] hover:border-[#D97706] bg-[#FAF9F6] hover:bg-[#F7F5F2] rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-colors group"
            >
              {uploadingProof ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
                  <span className="text-xs font-bold text-[#1C1917]">
                    Mengunggah lampiran foto/screenshot...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100 text-[#D97706] flex items-center justify-center transition-colors">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-[#1C1917]">
                    <span className="font-bold text-[#D97706] underline">
                      {proofList.length > 0
                        ? "+ Klik untuk menambah foto / screenshot lainnya"
                        : "Klik untuk memilih satu atau beberapa foto / screenshot"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B6560]">
                    Bisa pilih sekaligus lebih dari 1 file • Format: JPG, PNG, WEBP, PDF (Maksimal 10MB per file)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Keterangan / Catatan */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Keterangan / Catatan Transfer Bank</span>
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Transfer modal tambahan via BCA untuk alokasi lelang unit Fortuner..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 resize-none"
            />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/investors/accounts"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={
              loading ||
              uploadingProof ||
              !amount ||
              Number(amount) <= 0 ||
              investors.length === 0
            }
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membukukan Modal...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Setoran Modal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

