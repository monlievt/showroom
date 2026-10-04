"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Car,
  Gauge,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  SlidersHorizontal,
  X,
  History,
  Archive,
  Sparkles,
} from "lucide-react";
import { formatRupiah, formatUpcomingPrice, cn } from "@/lib/utils";
import { generateCatalogWhatsAppLink } from "@/lib/utils/whatsapp";

interface VehicleItem {
  id: string;
  slug: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  odometer: number;
  transmission: string;
  engineCapacity: number;
  price: number | null;
  status: string;
  location: string;
  youtubeVideoId?: string | null;
  photos: Array<{
    id: string;
    fileUrl: string;
    category: string;
  }>;
  inspection?: {
    id: string;
    engineGrade: string;
    interiorGrade: string;
    exteriorGrade: string;
    frameGrade: string;
    accidentHistory: boolean;
    floodHistory: boolean;
  } | null;
}

export function CatalogClient({ initialVehicles }: { initialVehicles: VehicleItem[] }) {
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "READY_FOR_SALE" | "UPCOMING" | "BOOKED" | "SOLD_SETTLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedTransmission, setSelectedTransmission] = useState("ALL");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | "ALL">("ALL");

  // Hitung jumlah per kategori status
  const statusCounts = useMemo(() => {
    return {
      ALL: initialVehicles.length,
      READY_FOR_SALE: initialVehicles.filter((v) => v.status === "READY_FOR_SALE").length,
      UPCOMING: initialVehicles.filter((v) => v.status === "INTAKE" || v.status === "IN_REPAIR").length,
      BOOKED: initialVehicles.filter((v) => v.status === "BOOKED").length,
      SOLD_SETTLED: initialVehicles.filter((v) => v.status === "SOLD_SETTLED").length,
    };
  }, [initialVehicles]);

  // Ekstrak daftar brand unik
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(initialVehicles.map((v) => v.brand)));
    return brands.sort();
  }, [initialVehicles]);

  // Filter unit
  const filteredVehicles = useMemo(() => {
    const result = initialVehicles.filter((v) => {
      // 0. Kategori Status
      if (selectedStatus === "UPCOMING") {
        if (v.status !== "INTAKE" && v.status !== "IN_REPAIR") return false;
      } else if (selectedStatus !== "ALL" && v.status !== selectedStatus) {
        return false;
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.plateNumber.toLowerCase().includes(q) ||
          v.year.toString().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Brand
      if (selectedBrand !== "ALL" && v.brand !== selectedBrand) {
        return false;
      }

      // 3. Transmission
      if (selectedTransmission !== "ALL" && v.transmission !== selectedTransmission) {
        return false;
      }

      // 4. Max Price
      if (maxPriceFilter !== "ALL" && v.price && v.price > maxPriceFilter) {
        return false;
      }

      return true;
    });

    // Urutkan: READY_FOR_SALE di atas, BOOKED, UPCOMING di tengah, SOLD_SETTLED di bawah jika melihat SEMUA
    if (selectedStatus === "ALL") {
      const priority: Record<string, number> = {
        READY_FOR_SALE: 1,
        BOOKED: 2,
        INTAKE: 3,
        IN_REPAIR: 3,
        SOLD_SETTLED: 4,
      };
      result.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
    }

    return result;
  }, [initialVehicles, selectedStatus, searchQuery, selectedBrand, selectedTransmission, maxPriceFilter]);

  const resetFilters = () => {
    setSelectedStatus("ALL");
    setSearchQuery("");
    setSelectedBrand("ALL");
    setSelectedTransmission("ALL");
    setMaxPriceFilter("ALL");
  };

  const hasActiveFilters =
    selectedStatus !== "ALL" ||
    searchQuery !== "" ||
    selectedBrand !== "ALL" ||
    selectedTransmission !== "ALL" ||
    maxPriceFilter !== "ALL";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
            <span>Transparansi 100% — Tanpa Rekayasa</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
            Katalog Mobil Bekas & Arsip Rekam Jejak
          </h1>
          <p className="text-sm sm:text-base text-[#6B6560] leading-relaxed">
            Temukan stok mobil siap pakai dengan dokumen uji mikron cat 11 panel body, garansi bebas tabrak & banjir, serta rekam jejak unit yang telah berhasil terjual lunas ke konsumen kami.
          </p>
        </div>
      </div>

      {/* Tabs Kategori Status Unit */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "ALL", label: "Semua Unit", count: statusCounts.ALL, icon: Car },
          { id: "READY_FOR_SALE", label: "Ready Siap Pakai", count: statusCounts.READY_FOR_SALE, icon: ShieldCheck },
          { id: "UPCOMING", label: "Segera Hadir", count: statusCounts.UPCOMING, icon: Sparkles },
          { id: "BOOKED", label: "Tanda Jadi (Booked)", count: statusCounts.BOOKED, icon: History },
          { id: "SOLD_SETTLED", label: "Terjual", count: statusCounts.SOLD_SETTLED, icon: Archive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border shadow-xs",
                isActive
                  ? "bg-[#1C1917] text-white border-[#1C1917] shadow-sm"
                  : "bg-white text-[#6B6560] border-[#D9D4CB] hover:bg-[#F7F5F2] hover:text-[#1C1917]"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-amber-400" : "text-[#8C827A]")} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  isActive
                    ? "bg-amber-400 text-stone-950"
                    : "bg-[#EFECE8] text-[#6B6560]"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6560]" />
            <input
              type="text"
              placeholder="Cari merk, model, atau plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm placeholder:text-[#6B6560] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          {/* Filter Merk */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full h-10 py-2 px-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706]"
            >
              <option value="ALL">Semua Merk Kendaraan</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Transmisi */}
          <div>
            <select
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
              className="w-full h-10 py-2 px-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706]"
            >
              <option value="ALL">Semua Transmisi</option>
              <option value="AUTOMATIC">Matic (Automatic)</option>
              <option value="MANUAL">Manual</option>
              <option value="CVT">CVT</option>
              <option value="DCT">DCT</option>
            </select>
          </div>

          {/* Filter Budget / Rentang Harga */}
          <div>
            <select
              value={maxPriceFilter === "ALL" ? "ALL" : maxPriceFilter.toString()}
              onChange={(e) =>
                setMaxPriceFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
              className="w-full h-10 py-2 px-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706]"
            >
              <option value="ALL">Semua Rentang Harga</option>
              <option value="100000000">Di bawah Rp 100 Juta</option>
              <option value="150000000">Di bawah Rp 150 Juta</option>
              <option value="200000000">Di bawah Rp 200 Juta</option>
              <option value="300000000">Di bawah Rp 300 Juta</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[#EBE7E1] text-xs">
            <span className="text-[#6B6560]">
              Menampilkan <strong>{filteredVehicles.length}</strong> unit dari{" "}
              {initialVehicles.length} stok
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[#D97706] hover:underline font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Mobil */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D9D4CB] p-12 text-center space-y-3">
          <Car className="w-12 h-12 text-[#6B6560] mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-[#1C1917]">Tidak Ada Unit yang Cocok</h3>
          <p className="text-sm text-[#6B6560] max-w-md mx-auto">
            Maaf, kami belum menemukan unit yang sesuai dengan kriteria filter Anda. Coba pilih kategori tab lain atau tanyakan unit idaman Anda ke admin WhatsApp.
          </p>
          <button
            onClick={resetFilters}
            className="bg-[#D97706] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-[#B45309] transition-colors cursor-pointer"
          >
            Tampilkan Semua Stok
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((v) => {
            const isBooked = v.status === "BOOKED";
            const isSold = v.status === "SOLD_SETTLED";
            const isUpcoming = v.status === "INTAKE" || v.status === "IN_REPAIR";
            const thumbnail = v.photos[0]?.fileUrl;
            const waLink = generateCatalogWhatsAppLink("081234567890", {
              brand: v.brand,
              model: v.model,
              year: v.year,
              plateNumber: v.plateNumber,
              targetSellingPrice: v.price,
              status: v.status,
            });

            return (
              <div
                key={v.id}
                className={cn(
                  "bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer relative",
                  isSold
                    ? "border-stone-300 bg-stone-50/60 hover:border-stone-400"
                    : isUpcoming
                    ? "border-amber-200 bg-amber-50/20 hover:border-amber-400"
                    : "border-[#D9D4CB] hover:border-amber-400/80"
                )}
              >
                {/* Area Card Atas (Foto, Judul, Spek, Harga) dapat langsung diklik */}
                <Link href={`/katalog/${v.slug}`} className="block flex-1 text-inherit no-underline">
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-[16/10] bg-[#EFECE8] overflow-hidden">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`${v.brand} ${v.model}`}
                        className={cn(
                          "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                          isSold && "grayscale-30 contrast-95"
                        )}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#6B6560]">
                        <Car className="w-12 h-12 mb-1 opacity-40" />
                        <span className="text-xs font-medium">Foto Unit Segera Tayang</span>
                      </div>
                    )}

                    {/* Overlay Watermark Khusus Unit Terjual */}
                    {isSold && (
                      <div className="absolute inset-0 bg-stone-900/35 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                        <div className="bg-stone-950/85 border border-amber-500/60 text-amber-400 px-4 py-1.5 rounded-xl shadow-xl transform -rotate-6 font-extrabold text-xs tracking-widest uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>TERJUAL / SOLD</span>
                        </div>
                      </div>
                    )}

                    {/* Badge Status */}
                    <div className="absolute top-3 left-3">
                      {isSold ? (
                        <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm bg-stone-900/90 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                          <Archive className="w-3 h-3 text-amber-400" />
                          <span>TERJUAL</span>
                        </span>
                      ) : isUpcoming ? (
                        <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm bg-amber-500 text-stone-950 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>SEGERA HADIR</span>
                        </span>
                      ) : isBooked ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm bg-amber-500 text-white">
                          BOOKED (Tanda Jadi)
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm bg-emerald-600 text-white">
                          READY FOR SALE
                        </span>
                      )}
                    </div>

                    {/* Badge Grade Inspeksi (jika sudah diinspeksi) */}
                    {v.inspection && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#D9D4CB] text-[11px] font-bold text-[#1C1917] shadow-sm flex items-center gap-1.5">
                        <span className="text-[#D97706]">Grade Rangka:</span>
                        <span className="font-extrabold text-sm">{v.inspection.frameGrade}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                        {v.brand} • {v.year}
                      </div>
                      <h3 className="font-bold text-lg text-[#1C1917] group-hover:text-[#D97706] transition-colors leading-snug">
                        {v.model}
                      </h3>
                      <span className="text-xs font-semibold text-[#6B6560] block mt-0.5">
                        Plat: {v.plateNumber}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="pt-1">
                      <div className="text-xs text-[#6B6560]">
                        {isSold
                          ? "Status Transaksi:"
                          : isUpcoming
                          ? "Estimasi Kisaran Harga:"
                          : "Harga Cash / Kredit:"}
                      </div>
                      <div className="text-xl font-extrabold text-[#1C1917] tracking-tight">
                        {isSold ? (
                          <div className="flex items-baseline gap-2">
                            {v.price && (
                              <span className="text-stone-400 line-through text-sm font-semibold">
                                {formatRupiah(v.price)}
                              </span>
                            )}
                            <span className="text-emerald-700 text-base font-extrabold">Terjual</span>
                          </div>
                        ) : isUpcoming ? (
                          <div className="space-y-0.5">
                            <div className="text-[#D97706] font-black text-lg">
                              {formatUpcomingPrice(v.price)}
                            </div>
                            <span className="text-[10px] text-[#6B6560] block font-normal">
                              *Harga pas ditentukan setelah salon & cek fisik
                            </span>
                          </div>
                        ) : v.price ? (
                          formatRupiah(v.price)
                        ) : (
                          "Hubungi Kami"
                        )}
                      </div>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EBE7E1] text-xs text-[#6B6560]">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{v.odometer.toLocaleString("id-ID")} KM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{v.transmission}</span>
                      </div>
                    </div>

                    {/* Pilar Transparansi Mini */}
                    {v.inspection && (
                      <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#EBE7E1] flex items-center justify-between text-[11px]">
                        <span className="text-[#6B6560]">Bebas Laka/Banjir:</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-bold",
                              !v.inspection.accidentHistory ? "text-emerald-700" : "text-red-600"
                            )}
                          >
                            {!v.inspection.accidentHistory ? "✓ Bebas Laka" : "Ada Riwayat"}
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              !v.inspection.floodHistory ? "text-emerald-700" : "text-blue-600"
                            )}
                          >
                            {!v.inspection.floodHistory ? "✓ Bebas Banjir" : "Pernah Banjir"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Card Actions */}
                <div
                  className="p-5 pt-0 grid grid-cols-2 gap-2 mt-auto relative z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/katalog/${v.slug}`}
                    className="flex items-center justify-center gap-1 bg-[#F7F5F2] hover:bg-[#EFECE8] border border-[#D9D4CB] text-[#1C1917] text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <span>{isSold ? "Arsip & Cek Fisik" : isUpcoming ? "Detail Persiapan" : "Cek Detail"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm",
                      isSold
                        ? "bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800"
                        : "bg-[#D97706] hover:bg-[#B45309] text-white"
                    )}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isSold ? "Tanya Unit Serupa" : isUpcoming ? "Booking Duluan" : "Tanya Unit"}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
