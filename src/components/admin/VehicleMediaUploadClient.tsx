"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Car,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

interface VehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  photos: Array<{ id: string; fileUrl: string; category?: string }>;
  documents: Array<{ id: string; fileUrl: string; docType?: string }>;
}

const PHOTO_CATEGORIES = [
  { value: "CONDITION_INTAKE", label: "Kondisi Saat Intake (Lelang/Baru Datang)" },
  { value: "EXTERIOR_FRONT", label: "Tampak Depan (Katalog)" },
  { value: "EXTERIOR_BACK", label: "Tampak Belakang (Katalog)" },
  { value: "INTERIOR", label: "Interior & Dasbor" },
  { value: "ENGINE_BAY", label: "Ruang Mesin (Kering/Bersih)" },
  { value: "DEFECT_SCRATCH", label: "Detail Baret / Cacat Fisik (Transparansi)" },
  { value: "DOCUMENT_PROOF", label: "Dokumen Fisik / Nota Perbaikan" },
];

const DOC_CATEGORIES = [
  { value: "STNK_SCAN", label: "Scan STNK & Pajak Berjalan" },
  { value: "BPKB_SCAN", label: "Scan BPKB & Faktur Asli" },
  { value: "FAKTUR_SCAN", label: "Faktur Pembelian & Sertifikat NIK" },
  { value: "SPK_AGREEMENT", label: "Surat Perjanjian / SPK Jual Beli" },
  { value: "OTHER", label: "Dokumen Pendukung Lainnya" },
];

export function VehicleMediaUploadClient({
  vehicle,
}: {
  vehicle: VehicleSummary;
}) {
  const router = useRouter();

  const [uploadType, setUploadType] = useState<"PHOTO" | "DOCUMENT">("PHOTO");
  const [photoCategory, setPhotoCategory] = useState("CONDITION_INTAKE");
  const [docType, setDocType] = useState("STNK_SCAN");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl("");
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMsg({ type: "error", text: "Silakan pilih berkas terlebih dahulu." });
      return;
    }

    setUploading(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicleId", vehicle.id);
      formData.append("uploadType", uploadType);
      if (uploadType === "PHOTO") {
        formData.append("category", photoCategory);
      } else {
        formData.append("docType", docType);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah file");
      }

      setMsg({
        type: "success",
        text: "File berhasil disimpan ke server! Memperbarui galeri...",
      });
      setFile(null);
      setPreviewUrl("");

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal mengunggah berkas" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Inventori</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Galeri Foto & Dokumen Legalitas
            </h1>
            <p className="text-xs text-[#6B6560]">
              Unggah foto kondisi intake, katalog website, serta scan berkas STNK / BPKB.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card Unit */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white rounded-xl border border-[#D9D4CB] text-[#D97706]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[#1C1917]">
                {vehicle.brand} {vehicle.model}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#D9D4CB] font-bold text-[#1C1917]">
                {vehicle.year}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-[#D97706] mt-0.5">
              {vehicle.plateNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-[#6B6560]">
          <span>{vehicle.photos.length} Foto</span>
          <span>•</span>
          <span>{vehicle.documents.length} Dokumen</span>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white border border-[#D9D4CB] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-[#EBE7E1] pb-3">
          <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#D97706]" />
            <span>Unggah Berkas Baru</span>
          </h2>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Switch Type */}
          <div className="flex rounded-xl bg-[#F7F5F2] border border-[#D9D4CB] p-1 max-w-sm">
            <button
              type="button"
              onClick={() => {
                setUploadType("PHOTO");
                setFile(null);
                setPreviewUrl("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                uploadType === "PHOTO"
                  ? "bg-[#1C1917] text-white shadow-xs"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto Kendaraan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadType("DOCUMENT");
                setFile(null);
                setPreviewUrl("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                uploadType === "DOCUMENT"
                  ? "bg-[#1C1917] text-white shadow-xs"
                  : "text-[#6B6560] hover:text-[#1C1917]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Scan Dokumen / PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                {uploadType === "PHOTO" ? "Kategori Foto" : "Jenis Dokumen"}
              </label>
              {uploadType === "PHOTO" ? (
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                >
                  {PHOTO_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                >
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Pilih Berkas *
              </label>
              <input
                type="file"
                required
                accept={uploadType === "PHOTO" ? "image/*" : "image/*,.pdf"}
                onChange={handleFileChange}
                className="w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1C1917] file:text-white hover:file:bg-[#D97706] file:cursor-pointer"
              />
            </div>
          </div>

          {previewUrl && (
            <div className="p-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#D9D4CB] bg-black/5">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#1C1917] block">Preview Siap Unggah</span>
                <span className="text-[#6B6560]">{file?.name}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] hover:bg-[#D97706] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Mulai Unggah Berkas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Photos Gallery */}
      <div className="bg-white border border-[#D9D4CB] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
          <ImageIcon className="w-4 h-4 text-[#D97706]" />
          <span>Foto Unit Terarsip ({vehicle.photos.length})</span>
        </h2>

        {vehicle.photos.length === 0 ? (
          <p className="text-xs text-[#6B6560] py-4 text-center">
            Belum ada foto yang diunggah untuk unit ini.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {vehicle.photos.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-xl border border-[#D9D4CB] overflow-hidden bg-[#F7F5F2]"
              >
                <div className="relative aspect-4/3 w-full">
                  <Image
                    src={p.fileUrl}
                    alt={p.category || "Foto Unit"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2 text-[10px] font-semibold text-[#1C1917] truncate bg-white border-t border-[#D9D4CB]">
                  {p.category || "Foto Unit"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Documents List */}
      <div className="bg-white border border-[#D9D4CB] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
          <FileText className="w-4 h-4 text-[#D97706]" />
          <span>Dokumen Legalitas & Scan ({vehicle.documents.length})</span>
        </h2>

        {vehicle.documents.length === 0 ? (
          <p className="text-xs text-[#6B6560] py-4 text-center">
            Belum ada scan dokumen untuk unit ini.
          </p>
        ) : (
          <div className="space-y-2">
            {vehicle.documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2]"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1C1917]">
                  <FileText className="w-4 h-4 text-[#D97706]" />
                  <span>{d.docType || "Dokumen Legalitas"}</span>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D9D4CB] text-xs font-semibold text-[#1C1917] hover:bg-[#EFECE8] transition-colors"
                >
                  <span>Buka Berkas</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
