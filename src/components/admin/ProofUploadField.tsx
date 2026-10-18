"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  UploadCloud,
  FileText,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  Download,
} from "lucide-react";

interface ProofUploadFieldProps {
  label?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  uploadType?: "RECEIPT" | "TRANSFER_PROOF" | "DOCUMENT";
  referenceId?: string;
  vehicleId?: string;
  investorId?: string;
  saleId?: string;
  helperText?: string;
}

export function ProofUploadField({
  label = "Lampiran Bukti / Nota / Kwitansi (Bisa Beberapa Foto / Screenshot)",
  value = [],
  onChange,
  uploadType = "RECEIPT",
  referenceId,
  vehicleId,
  investorId,
  saleId,
  helperText = "Bisa pilih sekaligus lebih dari 1 file • Format: JPG, PNG, WEBP, PDF (Maks. 10MB per file)",
}: ProofUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewItem, setPreviewItem] = useState<{ url: string; name: string } | null>(null);

  // Keyboard navigation untuk menutup preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewItem) {
        setPreviewItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem]);

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        setError(`File ${f.name} melebihi batas ukuran maksimal 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const newUrls: string[] = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploadType", uploadType);
        if (vehicleId) formData.append("vehicleId", vehicleId);
        if (investorId) formData.append("investorId", investorId);
        if (saleId) formData.append("saleId", saleId);
        if (referenceId) formData.append("referenceId", referenceId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Gagal mengunggah file ${file.name}`);
        }

        newUrls.push(data.fileUrl);
      }

      onChange([...value, ...newUrls]);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah beberapa lampiran bukti.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-[#D97706]" />
          <span>{label}</span>
        </label>
        {value.length > 0 && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{value.length} File Terlampir</span>
          </span>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
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

      {/* List / Grid of Uploaded Files */}
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {value.map((url, idx) => {
            const isImg = /\.(jpeg|jpg|png|webp)$/i.test(url);
            const fileName = url.split("/").pop() || `Bukti #${idx + 1}`;

            return (
              <div
                key={`${url}-${idx}`}
                className="p-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl flex items-center justify-between gap-2.5 shadow-2xs group hover:border-[#D97706]/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImg ? (
                    <div
                      onClick={() => setPreviewItem({ url, name: fileName })}
                      className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#D9D4CB] bg-white shrink-0 shadow-2xs cursor-pointer group/thumb hover:ring-2 hover:ring-[#D97706]/50 transition-all"
                      title="Klik untuk pratinjau foto bukti"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Lampiran #${idx + 1}`}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreviewItem({ url, name: fileName })}
                      className="w-11 h-11 rounded-lg bg-amber-100 text-amber-800 flex flex-col items-center justify-center shrink-0 border border-amber-200 cursor-pointer hover:bg-amber-200 transition-colors"
                      title="Klik untuk pratinjau dokumen PDF"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[8px] font-bold">PDF</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p
                      onClick={() => setPreviewItem({ url, name: fileName })}
                      className="text-xs font-bold text-[#1C1917] truncate max-w-[140px] sm:max-w-[130px] cursor-pointer hover:text-[#D97706] hover:underline transition-colors"
                    >
                      {fileName}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Lampiran #{idx + 1} ✓
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewItem({ url, name: fileName })}
                    className="p-1.5 bg-white border border-[#D9D4CB] rounded-lg text-[#1C1917] hover:bg-[#EFECE8] transition-colors shadow-2xs cursor-pointer"
                    title="Pratinjau bukti"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#6B6560]" />
                  </button>

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white border border-[#D9D4CB] rounded-lg text-[#1C1917] hover:bg-[#EFECE8] transition-colors shadow-2xs"
                    title="Buka lampiran di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#6B6560]" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
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

      {/* Upload Dropzone / Button */}
      <div
        onClick={() => {
          if (!uploading) {
            fileInputRef.current?.click();
          }
        }}
        className="border-2 border-dashed border-[#D9D4CB] hover:border-[#D97706] bg-[#FAF9F6] hover:bg-[#F7F5F2] rounded-xl p-3.5 sm:p-4 text-center cursor-pointer transition-colors group"
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-1.5 space-y-1.5">
            <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" />
            <span className="text-xs font-bold text-[#1C1917]">
              Mengunggah lampiran bukti...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 group-hover:bg-amber-100 text-[#D97706] flex items-center justify-center transition-colors">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="text-xs text-[#1C1917]">
              <span className="font-bold text-[#D97706] underline">
                {value.length > 0
                  ? "+ Klik untuk menambah foto / screenshot lainnya"
                  : "Klik untuk memilih foto struk / screenshot transfer / PDF"}
              </span>
            </div>
            <span className="text-[11px] text-[#6B6560]">{helperText}</span>
          </div>
        )}
      </div>

      {/* ── MODAL LIGHTBOX PRATINJAU BUKTI TRANSAKSI ── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-[#D9D4CB]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#FAF9F6] border-b border-[#D9D4CB] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#1C1917] truncate">
                  {previewItem.name}
                </h4>
                <p className="text-[11px] text-[#6B6560]">
                  Pratinjau Lampiran Bukti Transaksi
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-white border border-[#D9D4CB] hover:bg-[#EFECE8] text-[#1C1917] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Buka ukuran penuh di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#6B6560]" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>

                <a
                  href={previewItem.url}
                  download
                  className="px-2.5 py-1.5 bg-white border border-[#D9D4CB] hover:bg-[#EFECE8] text-[#1C1917] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Unduh file bukti"
                >
                  <Download className="w-3.5 h-3.5 text-[#6B6560]" />
                  <span className="hidden sm:inline">Unduh</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 text-[#6B6560] hover:text-[#1C1917] hover:bg-[#EFECE8] rounded-lg transition-colors cursor-pointer ml-1"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-[#1C1917]/5 min-h-[300px]">
              {/\.(jpeg|jpg|png|webp)$/i.test(previewItem.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-md border border-[#D9D4CB] bg-white"
                />
              ) : (
                <iframe
                  src={previewItem.url}
                  title={previewItem.name}
                  className="w-full h-[72vh] rounded-lg border border-[#D9D4CB] bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
