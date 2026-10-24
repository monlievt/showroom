"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CarCard } from "@/components/public/CarCard";
import { cn } from "@/lib/utils";

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
    tag?: string | null;
  }>;
  inspection?: {
    id: string;
    engineGrade: string;
    interiorGrade: string;
    exteriorGrade: string;
    frameGrade: string;
    accidentHistory: boolean;
    floodHistory: boolean;
    panels?: Array<{
      panelType: string;
      condition: string;
      paintThickness?: number | null;
    }>;
  } | null;
}

export function CatalogClient({ initialVehicles }: { initialVehicles: VehicleItem[] }) {
  const searchParams = useSearchParams();

  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "READY_FOR_SALE" | "UPCOMING" | "SOLD_SETTLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTransmission, setSelectedTransmission] = useState("ALL");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "KM_ASC">("NEWEST");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync initial search params from HeroSearchBar
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    const priceParam = searchParams.get("price");
    const yearParam = searchParams.get("year");

    if (brandParam) {
      setSelectedBrands([brandParam]);
    }
    if (priceParam) {
      if (priceParam === "under_100") setMaxPriceFilter(100000000);
      else if (priceParam === "100_150") setMaxPriceFilter(150000000);
      else if (priceParam === "150_200") setMaxPriceFilter(200000000);
      else if (priceParam === "above_200") setMaxPriceFilter("ALL");
    }
    if (yearParam) {
      setSearchQuery(yearParam);
    }
  }, [searchParams]);

  // Unique brands
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(initialVehicles.map((v) => v.brand)));
    return brands.sort();
  }, [initialVehicles]);

  // Ready count
  const readyCount = useMemo(() => {
    return initialVehicles.filter((v) => v.status === "READY_FOR_SALE" || v.status === "BOOKED").length;
  }, [initialVehicles]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Filter & Sort
  const filteredVehicles = useMemo(() => {
    const result = initialVehicles.filter((v) => {
      // 0. Status
      if (selectedStatus === "READY_FOR_SALE") {
        if (v.status !== "READY_FOR_SALE" && v.status !== "BOOKED") return false;
      } else if (selectedStatus === "UPCOMING") {
        if (v.status !== "INTAKE" && v.status !== "IN_REPAIR") return false;
      } else if (selectedStatus === "SOLD_SETTLED") {
        if (v.status !== "SOLD_SETTLED") return false;
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.plateNumber.toLowerCase().includes(q) ||
          v.year.toString().includes(q);
        if (!matches) return false;
      }

      // 2. Brand
      if (selectedBrands.length > 0 && !selectedBrands.includes(v.brand)) {
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

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "PRICE_ASC") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === "PRICE_DESC") {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === "KM_ASC") {
        return a.odometer - b.odometer;
      }
      // NEWEST default: priority by status, then year desc
      const priority: Record<string, number> = {
        READY_FOR_SALE: 1,
        BOOKED: 2,
        INTAKE: 3,
        IN_REPAIR: 3,
        SOLD_SETTLED: 4,
      };
      const prioDiff = (priority[a.status] || 99) - (priority[b.status] || 99);
      if (prioDiff !== 0) return prioDiff;
      return b.year - a.year;
    });

    return result;
  }, [
    initialVehicles,
    selectedStatus,
    searchQuery,
    selectedBrands,
    selectedTransmission,
    maxPriceFilter,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedStatus("ALL");
    setSearchQuery("");
    setSelectedBrands([]);
    setSelectedTransmission("ALL");
    setMaxPriceFilter("ALL");
    setSortBy("NEWEST");
  };

  const hasActiveFilters =
    selectedStatus !== "ALL" ||
    searchQuery !== "" ||
    selectedBrands.length > 0 ||
    selectedTransmission !== "ALL" ||
    maxPriceFilter !== "ALL";

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman (§6.2) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--ink)] tracking-[-0.015em]">
            Katalog unit
          </h1>
          <p className="text-[14px] text-[var(--muted)]">
            {readyCount} unit ready siap pakai dengan uji mikron 34 titik
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden pt-2">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--surface)] border border-[var(--line-input)] text-[var(--ink)] px-4 py-2.5 rounded-[var(--r-btn)] text-[14px] font-medium"
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
            <span>Filter Unit {hasActiveFilters && `(${selectedBrands.length + (selectedStatus !== "ALL" ? 1 : 0)})`}</span>
          </button>
        </div>
      </div>

      {/* 2. Layout Dua Kolom di Desktop (≥860px) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* SIDEBAR FILTER (250px di desktop) */}
        <aside
          className={cn(
            "w-full md:w-[250px] shrink-0 space-y-5 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-4 md:sticky md:top-[76px] self-start transition-all",
            !mobileFilterOpen && "hidden md:block"
          )}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="text-[15px] font-bold text-[var(--ink)]">Filter</h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[12px] text-[var(--accent)] hover:underline font-medium cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Field */}
          <div className="space-y-1.5">
            <label htmlFor="search-input" className="block text-[12px] font-medium text-[var(--muted)]">
              Pencarian
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Model, plat, tahun..."
                className="w-full h-9 pl-8 pr-3 bg-white border border-[var(--line-input)] rounded-[var(--r-btn)] text-[13px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Status Unit */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-[var(--muted)]">
              Status Unit
            </label>
            <div className="space-y-1 text-[13px]">
              {[
                { id: "ALL", label: "Semua status" },
                { id: "READY_FOR_SALE", label: "Ready siap pakai" },
                { id: "UPCOMING", label: "Segera hadir" },
                { id: "SOLD_SETTLED", label: "Arsip terjual" },
              ].map((st) => (
                <label
                  key={st.id}
                  className="flex items-center gap-2 cursor-pointer py-1 text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  <input
                    type="radio"
                    name="status_filter"
                    checked={selectedStatus === st.id}
                    onChange={() => setSelectedStatus(st.id as any)}
                    className="accent-[var(--accent)]"
                  />
                  <span>{st.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Merek (Checkbox) */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
            <label className="block text-[12px] font-medium text-[var(--muted)]">
              Merek Kendaraan
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto text-[13px] pr-1">
              {availableBrands.map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-2 cursor-pointer py-0.5 text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="accent-[var(--accent)] rounded"
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rentang Harga */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
            <label htmlFor="filter-price" className="block text-[12px] font-medium text-[var(--muted)]">
              Batas Harga Maksimal
            </label>
            <select
              id="filter-price"
              value={maxPriceFilter === "ALL" ? "ALL" : maxPriceFilter.toString()}
              onChange={(e) =>
                setMaxPriceFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
              className="w-full h-9 px-2.5 bg-white border border-[var(--line-input)] rounded-[var(--r-btn)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="ALL">Semua Harga</option>
              <option value="100000000">&lt; Rp 100 Juta</option>
              <option value="150000000">&lt; Rp 150 Juta</option>
              <option value="200000000">&lt; Rp 200 Juta</option>
              <option value="300000000">&lt; Rp 300 Juta</option>
            </select>
          </div>

          {/* Transmisi */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
            <label htmlFor="filter-trans" className="block text-[12px] font-medium text-[var(--muted)]">
              Transmisi
            </label>
            <select
              id="filter-trans"
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
              className="w-full h-9 px-2.5 bg-white border border-[var(--line-input)] rounded-[var(--r-btn)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="ALL">Semua Transmisi</option>
              <option value="AUTOMATIC">Otomatis / Matic</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
        </aside>

        {/* HASIL KATALOG (Kolom Kanan) */}
        <div className="flex-1 space-y-4">
          {/* Bar Atas Hasil */}
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-[var(--muted)]">
              Menampilkan {filteredVehicles.length} dari {initialVehicles.length} unit
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-[13px] text-[var(--muted)] hidden sm:inline">
                Urutkan:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2 bg-[var(--surface)] border border-[var(--line-input)] rounded-[var(--r-btn)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="NEWEST">Terbaru &amp; Status</option>
                <option value="PRICE_ASC">Harga Terendah</option>
                <option value="PRICE_DESC">Harga Tertinggi</option>
                <option value="KM_ASC">KM Terendah</option>
              </select>
            </div>
          </div>

          {/* Grid Unit atau Empty State */}
          {filteredVehicles.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-12 text-center space-y-4">
              <p className="text-[15px] font-medium text-[var(--ink)]">
                Belum ada unit yang cocok dengan filter ini
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center justify-center bg-white text-[var(--ink)] border border-[var(--line-input)] hover:border-[var(--ink)] px-4 py-2 rounded-[var(--r-btn)] text-[14px] font-medium transition-colors"
              >
                Reset filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
              {filteredVehicles.map((v) => (
                <CarCard
                  key={v.id}
                  vehicle={{
                    id: v.id,
                    slug: v.slug,
                    brand: v.brand,
                    model: v.model,
                    year: v.year,
                    transmission: v.transmission,
                    odometer: v.odometer,
                    plateNumber: v.plateNumber,
                    price: v.price,
                    status: v.status,
                    photos: v.photos,
                    inspection: v.inspection,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
