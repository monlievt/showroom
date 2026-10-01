"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Car, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Camera,
  Layers,
  Wrench,
  FileCheck,
  Play,
  Video
} from "lucide-react";

export interface GalleryPhoto {
  id: string;
  fileUrl: string;
  category: string;
  tag?: string | null;
  title?: string | null;
}

export interface GalleryVideo {
  id: string;
  title: string;
  youtubeId?: string | null;
  videoUrl?: string | null;
  duration?: string | null;
}

interface VehicleGalleryProps {
  photos: GalleryPhoto[];
  brand: string;
  model: string;
  isBooked: boolean;
  youtubeVideoId?: string | null;
  videos?: GalleryVideo[];
}

const TAG_LABELS: Record<string, { label: string; badgeColor: string }> = {
  FRONT_3_4: { label: "Tampak Depan (Front 3/4)", badgeColor: "bg-blue-600 text-white" },
  REAR_3_4: { label: "Tampak Belakang (Rear 3/4)", badgeColor: "bg-blue-600 text-white" },
  SIDE_RIGHT: { label: "Sisi Samping Kanan", badgeColor: "bg-blue-600 text-white" },
  SIDE_LEFT: { label: "Sisi Samping Kiri", badgeColor: "bg-blue-600 text-white" },
  ENGINE_BAY: { label: "Ruang Mesin & Sealer Kap", badgeColor: "bg-amber-600 text-white" },
  DOOR_SEALER: { label: "Sealer Pintu & Engsel Baut", badgeColor: "bg-emerald-600 text-white" },
  UNDER_DASHBOARD: { label: "Bawah Dashboard (Cek Bebas Banjir)", badgeColor: "bg-cyan-700 text-white" },
  UNDERBODY_CHASSIS: { label: "Kolong Sasis (Cek Bebas Karat/Tabrak)", badgeColor: "bg-emerald-700 text-white" },
  INTERIOR_DASHBOARD: { label: "Interior & Odometer Speedo", badgeColor: "bg-purple-600 text-white" },
  TRUNK_SPARE_TIRE: { label: "Bagasi & Tempat Ban Serep", badgeColor: "bg-stone-700 text-white" },
  DOCUMENT_STNK_BPKB: { label: "Fisik Asli Dokumen STNK & BPKB", badgeColor: "bg-amber-700 text-white" },
};

export function isExterior(photo: GalleryPhoto): boolean {
  if (photo.tag) {
    return [
      "FRONT_3_4",
      "REAR_3_4",
      "SIDE_RIGHT",
      "SIDE_LEFT",
      "EXTERIOR",
      "FRONT",
      "REAR",
    ].includes(photo.tag);
  }
  return photo.category === "FINAL_LISTING";
}

export function isEngineUnderbody(photo: GalleryPhoto): boolean {
  if (photo.tag) {
    return [
      "ENGINE_BAY",
      "UNDERBODY_CHASSIS",
      "UNDER_DASHBOARD",
      "DOOR_SEALER",
      "ENGINE",
      "UNDERBODY",
      "CHASSIS",
    ].includes(photo.tag);
  }
  return photo.category === "CONDITION_INTAKE";
}

export function isInterior(photo: GalleryPhoto): boolean {
  if (photo.tag) {
    return [
      "INTERIOR_DASHBOARD",
      "INTERIOR",
      "TRUNK_SPARE_TIRE",
      "TRUNK",
      "CABIN",
    ].includes(photo.tag);
  }
  return false;
}

export function isDocument(photo: GalleryPhoto): boolean {
  if (photo.tag) {
    return [
      "DOCUMENT_STNK_BPKB",
      "DOCUMENT",
      "BPKB",
      "STNK",
      "FAKTUR",
      "KUITANSI",
    ].includes(photo.tag);
  }
  return photo.category === "DOCUMENT_PROOF" || photo.category === "DOCUMENT";
}

type GalleryFilter = "ALL" | "EXTERIOR" | "ENGINE_UNDERBODY" | "INTERIOR" | "DOCUMENT" | "VIDEO";

export function VehicleGallery({
  photos,
  brand,
  model,
  isBooked,
  youtubeVideoId,
  videos,
}: VehicleGalleryProps) {
  // Hitung jumlah foto per kategori
  const exteriorPhotos = photos.filter(isExterior);
  const enginePhotos = photos.filter(isEngineUnderbody);
  const interiorPhotos = photos.filter(isInterior);
  const documentPhotos = photos.filter(isDocument);

  // Kumpulkan list video jika tersedia
  const videoList: GalleryVideo[] = videos && videos.length > 0
    ? videos
    : youtubeVideoId
      ? [{ id: "main-yt", title: "Video Walkaround & Review Unit", youtubeId: youtubeVideoId }]
      : [];

  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("ALL");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Filter foto sesuai kategori aktif
  const filteredPhotos = photos.filter((p) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "EXTERIOR") return isExterior(p);
    if (activeFilter === "ENGINE_UNDERBODY") return isEngineUnderbody(p);
    if (activeFilter === "INTERIOR") return isInterior(p);
    if (activeFilter === "DOCUMENT") return isDocument(p);
    return true;
  });

  const currentPhoto = filteredPhotos[selectedIdx] || filteredPhotos[0] || photos[0];
  const currentVideo = videoList[selectedVideoIdx] || videoList[0];
  const tagInfo = currentPhoto?.tag ? TAG_LABELS[currentPhoto.tag] : null;

  const handleNext = () => {
    setSelectedIdx((prev) => (prev + 1) % filteredPhotos.length);
  };

  const handlePrev = () => {
    setSelectedIdx((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  return (
    <div className="space-y-3">
      {/* ── FILTER KATEGORI FOTO & VIDEO ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        {/* 1. Semua Foto */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter("ALL");
            setIsPlayingVideo(false);
            setSelectedIdx(0);
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
            activeFilter === "ALL" && !isPlayingVideo
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#6B6560] border border-[#D9D4CB] hover:bg-[#F7F5F2]"
          )}
        >
          Semua Foto ({photos.length})
        </button>

        {/* 2. Eksterior Bodi */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter("EXTERIOR");
            setIsPlayingVideo(false);
            setSelectedIdx(0);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
            activeFilter === "EXTERIOR" && !isPlayingVideo
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#6B6560] border border-[#D9D4CB] hover:bg-[#F7F5F2]"
          )}
        >
          <Car className="w-3.5 h-3.5 text-[#D97706]" />
          <span>
            Eksterior Bodi{exteriorPhotos.length > 0 ? ` (${exteriorPhotos.length})` : ""}
          </span>
        </button>

        {/* 3. Mesin & Kolong */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter("ENGINE_UNDERBODY");
            setIsPlayingVideo(false);
            setSelectedIdx(0);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
            activeFilter === "ENGINE_UNDERBODY" && !isPlayingVideo
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#6B6560] border border-[#D9D4CB] hover:bg-[#F7F5F2]"
          )}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>
            Mesin & Kolong{enginePhotos.length > 0 ? ` (${enginePhotos.length})` : ""}
          </span>
        </button>

        {/* 4. Interior */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter("INTERIOR");
            setIsPlayingVideo(false);
            setSelectedIdx(0);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
            activeFilter === "INTERIOR" && !isPlayingVideo
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#6B6560] border border-[#D9D4CB] hover:bg-[#F7F5F2]"
          )}
        >
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          <span>
            Interior{interiorPhotos.length > 0 ? ` (${interiorPhotos.length})` : ""}
          </span>
        </button>

        {/* 5. Dokumen */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter("DOCUMENT");
            setIsPlayingVideo(false);
            setSelectedIdx(0);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
            activeFilter === "DOCUMENT" && !isPlayingVideo
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#6B6560] border border-[#D9D4CB] hover:bg-[#F7F5F2]"
          )}
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Dokumen{documentPhotos.length > 0 ? ` (${documentPhotos.length})` : ""}
          </span>
        </button>

        {/* 6. Video (Jika Ada) */}
        {videoList.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveFilter("VIDEO");
              setIsPlayingVideo(true);
              setSelectedVideoIdx(0);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
              isPlayingVideo
                ? "bg-red-600 text-white"
                : "bg-white text-[#6B6560] border border-[#D9D4CB] hover:bg-[#F7F5F2]"
            )}
          >
            <Play className="w-3.5 h-3.5 fill-current text-red-500" />
            <span>Video ({videoList.length})</span>
          </button>
        )}
      </div>

      {/* ── AREA TAMPILAN UTAMA (FOTO BESAR / VIDEO PLAYER / EMPTY STATE) ── */}
      <div className="relative aspect-[16/10] bg-[#EFECE8] rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm group">
        {isPlayingVideo && currentVideo ? (
          /* Pemutar Video Terintegrasi */
          <div className="w-full h-full bg-black relative">
            {currentVideo.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : currentVideo.videoUrl ? (
              <video
                src={currentVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : null}

            {/* Video Header Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentVideo.title}</span>
              </span>
            </div>
          </div>
        ) : filteredPhotos.length > 0 && currentPhoto ? (
          /* Tampilan Foto Besar */
          <>
            <img
              src={currentPhoto.fileUrl}
              alt={currentPhoto.title || `${brand} ${model}`}
              onClick={() => setLightboxOpen(true)}
              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* Status Unit Badge (Top Left) */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm",
                  isBooked ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                )}
              >
                {isBooked ? "BOOKED (Tanda Jadi)" : "READY FOR SALE"}
              </span>
            </div>

            {/* Tombol Zoom Fullscreen (Top Right) */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Lihat Layar Penuh"
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all shadow-md cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Tag & Judul Foto Overlay (Bottom Bar) */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 shadow-sm bg-[#D97706] text-white">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{tagInfo?.label || currentPhoto.title || "Foto Detail Cek Fisik"}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white drop-shadow-md">
                  {currentPhoto.title || `${brand} ${model}`}
                </h4>
              </div>

              <span className="text-[11px] font-bold text-white/90 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm shrink-0 self-end">
                {`${selectedIdx + 1} / ${filteredPhotos.length} Foto`}
              </span>
            </div>
          </>
        ) : (
          /* Empty State Jika Kategori Belum Ada Foto */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9D4CB] flex items-center justify-center text-[#D97706] mb-3 shadow-2xs">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#1C1917] mb-1">
              Foto Kategori Ini Belum Diunggah
            </h4>
            <p className="text-xs text-[#6B6560] max-w-sm mb-4 leading-relaxed">
              Arsip foto untuk bagian ini sedang dalam proses pemotretan & verifikasi tim inspeksi.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("ALL");
                setIsPlayingVideo(false);
                setSelectedIdx(0);
              }}
              className="text-xs font-bold bg-[#1C1917] hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Kembali ke Semua Foto ({photos.length})
            </button>
          </div>
        )}
      </div>

      {/* ── THUMBNAIL STRIP (FIXED CLIPPING & MULTI-MEDIA) ── */}
      {/* 
        Catatan Perbaikan:
        1. Menambahkan `px-2 py-2` pada container agar border dan ring thumbnail pertama 
           tidak terpotong oleh overflow-x-auto pada sisi kiri (x=0).
        2. Menghilangkan `scale-105` yang menyebabkan elemen keluar dari bounding box overflow.
        3. Memasukkan thumbnail video secara elegan jika unit memiliki video.
      */}
      {(filteredPhotos.length > 1 || videoList.length > 0) && (
        <div className="flex items-center gap-2.5 overflow-x-auto px-2 py-2 scrollbar-thin rounded-xl">
          {/* Thumbnails Foto */}
          {!isPlayingVideo &&
            filteredPhotos.map((p, idx) => {
              const pTag = p.tag ? TAG_LABELS[p.tag] : null;

              return (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={cn(
                    "relative w-24 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left group",
                    selectedIdx === idx
                      ? "border-[#D97706] ring-2 ring-[#D97706]/40 shadow-sm opacity-100"
                      : "border-[#D9D4CB] opacity-75 hover:opacity-100 hover:border-stone-400"
                  )}
                >
                  <img
                    src={p.fileUrl}
                    alt={p.title || `Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Mini Tag Label */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1 py-0.5 truncate text-[9px] font-semibold text-white">
                    {pTag ? pTag.label.split("(")[0].trim() : `Foto ${idx + 1}`}
                  </div>
                </button>
              );
            })}

          {/* Thumbnails Video */}
          {videoList.map((v, vIdx) => (
            <button
              key={v.id || vIdx}
              type="button"
              onClick={() => {
                setSelectedVideoIdx(vIdx);
                setIsPlayingVideo(true);
              }}
              className={cn(
                "relative w-24 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left group bg-stone-900",
                isPlayingVideo && selectedVideoIdx === vIdx
                  ? "border-red-600 ring-2 ring-red-500/50 shadow-sm opacity-100"
                  : "border-[#D9D4CB] opacity-75 hover:opacity-100 hover:border-stone-400"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-black/90 px-1 py-0.5 truncate text-[9px] font-semibold text-white text-center">
                {v.title}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX MODAL FULLSCREEN ── */}
      {lightboxOpen && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md">
          {/* Header Lightbox */}
          <div className="flex items-center justify-between text-white border-b border-white/20 pb-3">
            <div>
              <span className="text-xs text-[#D97706] font-bold uppercase tracking-wider">
                {tagInfo?.label || "Pemeriksaan Fisik"}
              </span>
              <h3 className="text-base sm:text-lg font-bold">
                {currentPhoto.title || `${brand} ${model}`}
              </h3>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Gambar Besar Tengah & Tombol Panah Navigasi */}
          <div className="relative flex-1 flex items-center justify-center my-4 select-none">
            {filteredPhotos.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={currentPhoto.fileUrl}
              alt={currentPhoto.title || "Foto Detail"}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {filteredPhotos.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Lightbox */}
          <div className="flex items-center justify-between text-xs text-white/80 border-t border-white/20 pt-3">
            <span>
              Nur Mobil • Standar Transparansi Cek Fisik Apa Adanya
            </span>
            <span className="font-bold">
              {selectedIdx + 1} dari {filteredPhotos.length} Foto
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
