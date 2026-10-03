"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  FileText,
  Upload,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Car,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Eye,
  ShieldCheck,
  Wrench,
  Gauge,
  Activity,
  SlidersHorizontal,
  Archive,
  BatteryCharging,
  Plus,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { deleteVehiclePhotoAction, deleteVehicleDocumentAction } from "@/app/actions/vehicle";

export interface VehiclePhotoItem {
  id: string;
  fileUrl: string;
  category?: string;
  tag?: string | null;
  title?: string | null;
}

export interface VehicleDocumentItem {
  id: string;
  fileUrl: string;
  docType?: string;
}

interface VehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  photos: VehiclePhotoItem[];
  documents: VehicleDocumentItem[];
}

import { IBID_STANDARD_PHOTO_SLOTS, InspectionPhotoSlot } from "@/lib/calculations/inspection";

const CUSTOM_PHOTO_CATEGORIES = [
  { value: "CONDITION_INTAKE", label: "Kondisi Saat Intake (Lelang/Baru Masuk)" },
  { value: "CONDITION_BEFORE_REPAIR", label: "Sebelum Perbaikan / Detail Cacat" },
  { value: "CONDITION_AFTER_REPAIR", label: "Setelah Selesai Pengerjaan / Poles" },
  { value: "FINAL_LISTING", label: "Foto Siap Tayang Katalog Showroom" },
  { value: "DOCUMENT_PROOF", label: "Bukti Fisik / Nota Perbaikan Bengkel" },
];

const DOC_CATEGORIES = [
  { value: "STNK_SCAN", label: "Scan STNK & Lembar Pajak Berjalan" },
  { value: "BPKB_SCAN", label: "Scan BPKB & Faktur Asli" },
  { value: "FAKTUR_SCAN", label: "Faktur Pembelian & Sertifikat NIK" },
  { value: "KUITANSI", label: "Kuitansi / Bukti Pelunasan Resmi" },
  { value: "KTP_PEMILIK", label: "Foto KTP Pembeli / Pemilik Asli" },
  { value: "SPK_AGREEMENT", label: "Surat Perjanjian / SPK Jual Beli" },
  { value: "OTHER", label: "BAST & Dokumen Pendukung Lainnya" },
];

const DOC_LABEL_MAP: Record<string, string> = {
  STNK_SCAN: "Scan STNK & Pajak Berjalan",
  BPKB_SCAN: "Scan BPKB & Faktur Asli",
  FAKTUR: "Faktur & Sertifikat NIK",
  FAKTUR_SCAN: "Faktur Pembelian & NIK",
  KUITANSI: "Kuitansi / Bukti Pelunasan",
  KTP_PEMILIK: "Foto KTP Pembeli / Pemilik",
  FORM_A: "Formulir A (CBU)",
  KEUR: "Buku Uji KIR",
  SPK_AGREEMENT: "Surat Perjanjian / SPJB",
  OTHER: "BAST / Berkas Serah Terima",
};

function renderSlotIcon(iconName: string) {
  switch (iconName) {
    case "Car":
      return <Car className="w-4 h-4" />;
    case "Gauge":
      return <Gauge className="w-4 h-4" />;
    case "Wrench":
      return <Wrench className="w-4 h-4" />;
    case "ShieldCheck":
      return <ShieldCheck className="w-4 h-4" />;
    case "Activity":
      return <Activity className="w-4 h-4" />;
    case "SlidersHorizontal":
      return <SlidersHorizontal className="w-4 h-4" />;
    case "Archive":
      return <Archive className="w-4 h-4" />;
    case "BatteryCharging":
      return <BatteryCharging className="w-4 h-4" />;
    default:
      return <Camera className="w-4 h-4" />;
  }
}

export function VehicleMediaUploadClient({
  vehicle,
}: {
  vehicle: VehicleSummary;
}) {
  const router = useRouter();

  // Active view tab: "STANDARD_SLOTS" (Priority 3 IBID ACV) vs "CUSTOM_UPLOAD"
  const [activeTab, setActiveTab] = useState<"STANDARD_SLOTS" | "CUSTOM_UPLOAD">("STANDARD_SLOTS");

  // Custom Upload state
  const [uploadType, setUploadType] = useState<"PHOTO" | "DOCUMENT">("PHOTO");
  const [photoCategory, setPhotoCategory] = useState("CONDITION_INTAKE");
  const [docType, setDocType] = useState("STNK_SCAN");
  const [customTag, setCustomTag] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Loading & Message
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeSlotUpload, setActiveSlotUpload] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hidden file input refs for slot direct upload
  const slotInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Helper to find photo for a slot
  const getPhotoForSlot = (slot: InspectionPhotoSlot): VehiclePhotoItem | undefined => {
    return vehicle.photos.find((p) => p.tag === slot.tag || p.title === slot.title);
  };

  // Calculate completion percentage
  const completedSlotsCount = IBID_STANDARD_PHOTO_SLOTS.filter(
    (slot) => !!getPhotoForSlot(slot)
  ).length;
  const completionPercentage = Math.round(
    (completedSlotsCount / IBID_STANDARD_PHOTO_SLOTS.length) * 100
  );

  // Direct upload for a specific slot
  const handleSlotFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: InspectionPhotoSlot
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setActiveSlotUpload(slot.id);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("vehicleId", vehicle.id);
      formData.append("uploadType", "PHOTO");
      formData.append("category", "CONDITION_INTAKE");
      formData.append("tag", slot.tag);
      formData.append("title", slot.title);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah foto slot");
      }

      setMsg({
        type: "success",
        text: `Foto ${slot.badge} berhasil disimpan sesuai standar inspeksi!`,
      });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal mengunggah foto" });
    } finally {
      setActiveSlotUpload(null);
      // Reset input
      if (slotInputRefs.current[slot.id]) {
        slotInputRefs.current[slot.id]!.value = "";
      }
    }
  };

  // Custom Upload handler
  const handleCustomUpload = async (e: React.FormEvent) => {
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
        if (customTag.trim()) formData.append("tag", customTag.trim());
        if (customTitle.trim()) formData.append("title", customTitle.trim());
      } else {
        formData.append("docType", docType);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah berkas");
      }

      setMsg({
        type: "success",
        text: "Berkas berhasil diunggah dan disimpan ke sistem!",
      });
      setFile(null);
      setPreviewUrl("");
      setCustomTag("");
      setCustomTitle("");
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal mengunggah berkas" });
    } finally {
      setUploading(false);
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Hapus foto ini dari arsip kendaraan?")) return;
    setDeletingId(photoId);
    try {
      const res = await deleteVehiclePhotoAction(photoId, vehicle.id);
      if (!res.success) {
        throw new Error(res.error || "Gagal menghapus foto");
      }
      setMsg({ type: "success", text: "Foto berhasil dihapus." });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal menghapus foto" });
    } finally {
      setDeletingId(null);
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Hapus dokumen ini dari arsip kendaraan?")) return;
    setDeletingId(docId);
    try {
      const res = await deleteVehicleDocumentAction(docId, vehicle.id);
      if (!res.success) {
        throw new Error(res.error || "Gagal menghapus dokumen");
      }
      setMsg({ type: "success", text: "Dokumen berhasil dihapus." });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal menghapus dokumen" });
    } finally {
      setDeletingId(null);
    }
  };

  // Grouped slots for presentation
  const groupedSlots = [
    {
      groupKey: "EXTERIOR",
      title: "1. Empat Sudut Eksterior Utama (3/4 Angle)",
      slots: IBID_STANDARD_PHOTO_SLOTS.filter((s) => s.group === "EXTERIOR"),
    },
    {
      groupKey: "COMPARTMENT",
      title: "2. Kompartemen Utama (Interior & Mesin)",
      slots: IBID_STANDARD_PHOTO_SLOTS.filter((s) => s.group === "COMPARTMENT"),
    },
    {
      groupKey: "LEGALITY",
      title: "3. Legalitas & Identitas Fisik Kendaraan",
      slots: IBID_STANDARD_PHOTO_SLOTS.filter((s) => s.group === "LEGALITY"),
    },
    {
      groupKey: "EQUIPMENT",
      title: "4. Instrumen & Kelengkapan Kritis",
      slots: IBID_STANDARD_PHOTO_SLOTS.filter((s) => s.group === "EQUIPMENT"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Inventori</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1C1917]">
                Media & Standar Dokumentasi Unit
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/30">
                Standar Cek Fisik
              </span>
            </div>
            <p className="text-xs text-[#6B6560]">
              11 Titik Foto Standar Inspeksi, verifikasi nomor rangka fisik, dan kelengkapan dokumen legalitas.
            </p>
          </div>
        </div>

        <Link
          href={`/admin/inventory/${vehicle.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C1917] hover:bg-[#D97706] text-white font-semibold text-xs transition-colors shadow-xs self-start sm:self-auto"
        >
          <span>Detail Unit Kendaraan</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Info Card Unit & ACV Compliance Progress */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Progress Tracker */}
        <div className="bg-white border border-[#D9D4CB] rounded-xl p-3.5 flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Standar 11 Foto Wajib:</span>
            </span>
            <span
              className={`font-black ${
                completionPercentage === 100
                  ? "text-emerald-600"
                  : completionPercentage >= 60
                  ? "text-amber-600"
                  : "text-[#6B6560]"
              }`}
            >
              {completedSlotsCount} / 11 Slot ({completionPercentage}%)
            </span>
          </div>

          <div className="w-full bg-[#EFECE8] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completionPercentage === 100
                  ? "bg-emerald-500"
                  : completionPercentage >= 60
                  ? "bg-[#D97706]"
                  : "bg-stone-400"
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6B6560]">
            <span>{vehicle.photos.length} Total Foto Tersimpan</span>
            <span>{vehicle.documents.length} Dokumen Legalitas</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            onClick={() => setMsg(null)}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Mode Navigation */}
      <div className="flex border-b border-[#D9D4CB] gap-3">
        <button
          onClick={() => setActiveTab("STANDARD_SLOTS")}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "STANDARD_SLOTS"
              ? "border-[#D97706] text-[#D97706]"
              : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>11 Titik Foto Standar Wajib</span>
          <span
            className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
              completionPercentage === 100
                ? "bg-emerald-100 text-emerald-800"
                : "bg-[#EFECE8] text-[#6B6560]"
            }`}
          >
            {completedSlotsCount}/11
          </span>
        </button>

        <button
          onClick={() => setActiveTab("CUSTOM_UPLOAD")}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "CUSTOM_UPLOAD"
              ? "border-[#D97706] text-[#D97706]"
              : "border-transparent text-[#6B6560] hover:text-[#1C1917]"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Manual / Tambahan & Scan Dokumen</span>
        </button>
      </div>

      {/* TAB 1: 11 TITIK FOTO STANDAR WAJIB */}
      {activeTab === "STANDARD_SLOTS" && (
        <div className="space-y-8">
          <div className="bg-[#FAF8F5] border border-[#D9D4CB] rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                  <span>Panduan Pengambilan 11 Sudut Foto Standar</span>
                </h2>
                <p className="text-xs text-[#6B6560] mt-1">
                  Sesuai format dokumentasi visual resmi. Setiap slot foto mewakili bukti fisik integritas kendaraan sebelum diterbitkan ke katalog publik maupun sertifikat inspeksi.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#6B6560] bg-white px-3 py-1.5 rounded-lg border border-[#D9D4CB] shrink-0">
                Format: JPEG / PNG • Maks 10MB
              </div>
            </div>
          </div>

          {groupedSlots.map((group) => (
            <div key={group.groupKey} className="space-y-3">
              <h3 className="text-xs font-black text-[#1C1917] uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-[#EBE7E1]">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span>{group.title}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.slots.map((slot) => {
                  const existingPhoto = getPhotoForSlot(slot);
                  const isUploadingThis = activeSlotUpload === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                        existingPhoto
                          ? "bg-white border-[#D9D4CB] shadow-xs"
                          : "bg-[#F7F5F2] border-dashed border-[#D9D4CB] hover:border-[#D97706]/60 hover:bg-[#FAF8F5]"
                      }`}
                    >
                      {/* Slot Header */}
                      <div className="p-3.5 border-b border-[#EBE7E1] bg-white/70 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              existingPhoto
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-[#EFECE8] text-[#6B6560]"
                            }`}
                          >
                            {renderSlotIcon(slot.iconName)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#1C1917] block leading-tight">
                              {slot.badge}
                            </span>
                            <span className="text-[10px] text-[#6B6560] line-clamp-1">
                              {slot.title}
                            </span>
                          </div>
                        </div>

                        {existingPhoto ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Terisi</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Wajib
                          </span>
                        )}
                      </div>

                      {/* Image Preview / Empty Slot Upload State */}
                      <div className="p-3.5 flex-1 flex flex-col justify-center">
                        {existingPhoto ? (
                          <div className="space-y-2">
                            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden border border-[#D9D4CB] bg-black/5 group">
                              <Image
                                src={existingPhoto.fileUrl}
                                alt={slot.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightboxUrl({
                                      url: existingPhoto.fileUrl,
                                      title: slot.title,
                                    })
                                  }
                                  className="p-2 rounded-lg bg-white/90 hover:bg-white text-[#1C1917] shadow-sm transition-colors cursor-pointer"
                                  title="Lihat Ukuran Penuh"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(existingPhoto.id)}
                                  disabled={deletingId === existingPhoto.id}
                                  className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer"
                                  title="Hapus Foto Ini"
                                >
                                  {deletingId === existingPhoto.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-[#6B6560] line-clamp-2">
                              {slot.description}
                            </p>
                          </div>
                        ) : (
                          <div className="py-4 text-center space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-[#EFECE8] flex items-center justify-center text-[#6B6560]">
                              {isUploadingThis ? (
                                <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" />
                              ) : (
                                <Camera className="w-5 h-5" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B6560] px-2 leading-relaxed">
                              {slot.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Slot Action Footer */}
                      <div className="p-3 bg-[#FAF8F5] border-t border-[#EBE7E1] flex items-center justify-between">
                        <input
                          ref={(el) => {
                            slotInputRefs.current[slot.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSlotFileChange(e, slot)}
                        />

                        {existingPhoto ? (
                          <button
                            type="button"
                            disabled={isUploadingThis}
                            onClick={() => slotInputRefs.current[slot.id]?.click()}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white border border-[#D9D4CB] hover:bg-[#EFECE8] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {isUploadingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 text-[#6B6560]" />
                                <span>Ganti Foto Slot</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUploadingThis}
                            onClick={() => slotInputRefs.current[slot.id]?.click()}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C1917] hover:bg-[#D97706] text-xs font-bold text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isUploadingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Unggah Foto Ini</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: UNGGAH MANUAL & DOKUMEN */}
      {activeTab === "CUSTOM_UPLOAD" && (
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#EBE7E1] pb-3">
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#D97706]" />
              <span>Unggah Berkas Tambahan / Dokumen Legalitas</span>
            </h2>
            <p className="text-xs text-[#6B6560] mt-1">
              Gunakan formulir ini untuk menambahkan foto detail baret, hasil perbaikan bodi, atau berkas legalitas (STNK, BPKB, Faktur).
            </p>
          </div>

          <form onSubmit={handleCustomUpload} className="space-y-4">
            {/* Switch Type */}
            <div className="flex rounded-xl bg-[#F7F5F2] border border-[#D9D4CB] p-1 max-w-sm">
              <button
                type="button"
                onClick={() => {
                  setUploadType("PHOTO");
                  setFile(null);
                  setPreviewUrl("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadType === "PHOTO"
                    ? "bg-[#1C1917] text-white shadow-xs"
                    : "text-[#6B6560] hover:text-[#1C1917]"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Tambahan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadType("DOCUMENT");
                  setFile(null);
                  setPreviewUrl("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  {uploadType === "PHOTO" ? "Kategori Siklus Unit" : "Jenis Dokumen Legalitas"}
                </label>
                {uploadType === "PHOTO" ? (
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                  >
                    {CUSTOM_PHOTO_CATEGORIES.map((c) => (
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
                  Pilih Berkas * (Maks 10MB)
                </label>
                <input
                  type="file"
                  required
                  accept={uploadType === "PHOTO" ? "image/*" : "image/*,.pdf"}
                  onChange={(e) => {
                    const sel = e.target.files?.[0];
                    if (sel) {
                      setFile(sel);
                      if (sel.type.startsWith("image/")) {
                        setPreviewUrl(URL.createObjectURL(sel));
                      } else {
                        setPreviewUrl("");
                      }
                    }
                  }}
                  className="w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1C1917] file:text-white hover:file:bg-[#D97706] file:cursor-pointer"
                />
              </div>
            </div>

            {uploadType === "PHOTO" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    Judul Foto / Keterangan Panel (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Detail Baret Bumper Kiri Bawah (A2)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-xs font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    Tag Komponen (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: DEFECT_BUMPER_FRONT, DOOR_SEALER"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-xs font-mono font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                  />
                </div>
              </div>
            )}

            {previewUrl && (
              <div className="p-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#D9D4CB] bg-black/5 shrink-0">
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
      )}

      {/* Existing Photos Gallery (All Uploaded Photos) */}
      <div className="bg-white border border-[#D9D4CB] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
          <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#D97706]" />
            <span>Seluruh Foto Terarsip ({vehicle.photos.length})</span>
          </h2>
          <span className="text-xs font-semibold text-[#6B6560]">
            Klik foto untuk memperbesar atau menghapus
          </span>
        </div>

        {vehicle.photos.length === 0 ? (
          <p className="text-xs text-[#6B6560] py-8 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#D9D4CB]">
            Belum ada foto yang diunggah untuk unit ini. Silakan penuhi 11 slot standar di atas.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {vehicle.photos.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-xl border border-[#D9D4CB] overflow-hidden bg-[#F7F5F2] flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 w-full bg-black/5">
                  <Image
                    src={p.fileUrl}
                    alt={p.title || p.tag || "Foto Unit"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxUrl({
                          url: p.fileUrl,
                          title: p.title || p.tag || "Foto Unit",
                        })
                      }
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#1C1917] shadow-sm transition-colors cursor-pointer"
                      title="Perbesar"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => handleDeletePhoto(p.id)}
                      className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-white border-t border-[#D9D4CB]">
                  <span className="text-xs font-bold text-[#1C1917] block truncate">
                    {p.title || p.tag || p.category || "Foto Unit"}
                  </span>
                  {p.tag && (
                    <span className="text-[10px] font-mono text-[#D97706] block truncate">
                      {p.tag}
                    </span>
                  )}
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
          <span>Dokumen Legalitas & Scan Berkas ({vehicle.documents.length})</span>
        </h2>

        {vehicle.documents.length === 0 ? (
          <p className="text-xs text-[#6B6560] py-6 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#D9D4CB]">
            Belum ada scan dokumen legalitas (STNK/BPKB/Faktur) untuk unit ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vehicle.documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2]"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1C1917] min-w-0 pr-2">
                  <div className="p-2 bg-white rounded-lg border border-[#D9D4CB] text-[#D97706] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-bold text-[#1C1917]">
                      {(d.docType && DOC_LABEL_MAP[d.docType]) || d.docType || "Dokumen Legalitas"}
                    </span>
                    <span className="text-[10px] text-[#6B6560] block truncate">
                      Arsip Berkas Digital
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#D9D4CB] text-xs font-semibold text-[#1C1917] hover:bg-[#EFECE8] transition-colors"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    disabled={deletingId === d.id}
                    onClick={() => handleDeleteDoc(d.id)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                    title="Hapus Dokumen"
                  >
                    {deletingId === d.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#1C1917] text-white flex items-center justify-between">
              <span className="text-xs font-bold truncate pr-4">
                {lightboxUrl.title}
              </span>
              <button
                onClick={() => setLightboxUrl(null)}
                className="text-stone-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[400px] w-full bg-black/90">
              <Image
                src={lightboxUrl.url}
                alt={lightboxUrl.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
