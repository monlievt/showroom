"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, Sparkles } from "lucide-react";

interface HeroSearchBarProps {
  totalVehicles?: number;
  brands?: string[];
}

export function HeroSearchBar({ totalVehicles = 5, brands = [] }: HeroSearchBarProps) {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (selectedBrand && selectedBrand !== "ALL") {
      params.set("brand", selectedBrand);
    }
    if (selectedPrice && selectedPrice !== "ALL") {
      params.set("price", selectedPrice);
    }
    if (selectedYear && selectedYear !== "ALL") {
      params.set("year", selectedYear);
    }

    const query = params.toString();
    router.push(query ? `/katalog?${query}` : "/katalog");
  };

  const defaultBrands = brands.length > 0 ? brands : ["Toyota", "Honda", "Daihatsu", "Mitsubishi", "Suzuki", "Hyundai", "Wuling"];

  return (
    <div className="w-full max-w-[860px] space-y-3">
      <form
        onSubmit={handleSearch}
        className="w-full bg-[var(--surface)] border border-[var(--line-input)] rounded-[14px] p-3 sm:p-2 shadow-[var(--shadow-sm)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x sm:divide-[var(--line)] gap-2 sm:gap-0">
          {/* Field 1: Merek */}
          <div className="flex-1 px-3 py-2 sm:py-1.5 text-left bg-[var(--bg)] sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-[var(--line)]">
            <label htmlFor="hero-brand" className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-0.5">
              Merek Mobil
            </label>
            <div className="relative">
              <select
                id="hero-brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-transparent text-[15px] font-semibold text-[var(--ink)] focus:outline-none cursor-pointer appearance-none pr-6 min-h-[36px]"
              >
                <option value="">Semua Merek</option>
                {defaultBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field 2: Rentang Harga */}
          <div className="flex-1 px-3 py-2 sm:py-1.5 text-left bg-[var(--bg)] sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-[var(--line)]">
            <label htmlFor="hero-price" className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-0.5">
              Rentang Harga
            </label>
            <div className="relative">
              <select
                id="hero-price"
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full bg-transparent text-[15px] font-semibold text-[var(--ink)] focus:outline-none cursor-pointer appearance-none pr-6 min-h-[36px]"
              >
                <option value="">Semua Harga</option>
                <option value="under_100">&lt; Rp 100 Juta</option>
                <option value="100_150">Rp 100 - 150 Juta</option>
                <option value="150_200">Rp 150 - 200 Juta</option>
                <option value="above_200">&gt; Rp 200 Juta</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field 3: Tahun */}
          <div className="flex-1 px-3 py-2 sm:py-1.5 text-left bg-[var(--bg)] sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-[var(--line)]">
            <label htmlFor="hero-year" className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-0.5">
              Tahun Minimal
            </label>
            <div className="relative">
              <select
                id="hero-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-transparent text-[15px] font-semibold text-[var(--ink)] focus:outline-none cursor-pointer appearance-none pr-6 min-h-[36px]"
              >
                <option value="">Semua Tahun</option>
                <option value="2023">&gt;= 2023</option>
                <option value="2021">&gt;= 2021</option>
                <option value="2018">&gt;= 2018</option>
                <option value="2015">&gt;= 2015</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Primary Submit Button */}
          <div className="sm:pl-3 pt-1 sm:pt-0">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold px-6 py-3 rounded-[var(--r-btn)] transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer min-h-[46px]"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Cari {totalVehicles > 0 ? `${totalVehicles} unit` : "unit"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Quick Filter Chips (Sangat ergonomis di layar ponsel) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[12px]">
        <span className="text-[var(--muted)] font-medium text-[11px] hidden sm:inline mr-1">
          Paling sering dicari:
        </span>
        <Link
          href="/katalog"
          className="px-2.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-medium transition-colors min-h-[32px] flex items-center"
        >
          Semua Stok Ready
        </Link>
        <Link
          href="/katalog?price=100_150"
          className="px-2.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-medium transition-colors min-h-[32px] flex items-center"
        >
          100 - 150 Juta
        </Link>
        <Link
          href="/katalog?price=under_100"
          className="px-2.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-medium transition-colors min-h-[32px] flex items-center"
        >
          &lt; 100 Juta
        </Link>
        <Link
          href="/katalog?transmission=AUTOMATIC"
          className="px-2.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-medium transition-colors min-h-[32px] flex items-center"
        >
          Matic
        </Link>
        <Link
          href="/katalog?year=2021"
          className="px-2.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-medium transition-colors min-h-[32px] flex items-center"
        >
          Tahun 2021+
        </Link>
      </div>
    </div>
  );
}
