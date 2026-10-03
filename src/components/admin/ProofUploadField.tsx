"use client";

import React, { useState, useRef } from "react";
import {
  Paperclip,
  UploadCloud,
  FileText,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
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
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#D9D4CB] bg-white shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Lampiran #${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-800 flex flex-col items-center justify-center shrink-0 border border-amber-200">
                      <FileText className="w-5 h-5" />
                      <span className="text-[8px] font-bold">PDF</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1C1917] truncate max-w-[140px] sm:max-w-[130px]">
                      {fileName}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Lampiran #{idx + 1} ✓
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white border border-[#D9D4CB] rounded-lg text-[#1C1917] hover:bg-[#EFECE8] transition-colors shadow-2xs"
                    title="Buka lampiran ukuran penuh"
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
    </div>
  );
}
