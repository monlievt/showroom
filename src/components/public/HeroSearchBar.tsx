"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
    <form
      onSubmit={handleSearch}
      className="w-full max-w-[860px] bg-[var(--surface)] border border-[var(--line-input)] rounded-[12px] p-2.5 sm:p-2 shadow-[var(--shadow-sm)] transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x sm:divide-[var(--line)] gap-2 sm:gap-0">
        {/* Field 1: Merek */}
        <div className="flex-1 px-3 py-1.5 text-left">
          <label htmlFor="hero-brand" className="block text-[12px] font-medium text-[var(--muted)] mb-0.5">
            Merek
          </label>
          <select
            id="hero-brand"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-transparent text-[15px] font-semibold text-[var(--ink)] focus:outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="">Semua Merek</option>
            {defaultBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Field 2: Rentang Harga */}
        <div className="flex-1 px-3 py-1.5 text-left">
          <label htmlFor="hero-price" className="block text-[12px] font-medium text-[var(--muted)] mb-0.5">
            Harga
          </label>
          <select
            id="hero-price"
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="w-full bg-transparent text-[15px] font-semibold text-[var(--ink)] focus:outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="">Semua Harga</option>
            <option value="under_100">&lt; Rp 100 Juta</option>
            <option value="100_150">Rp 100 - 150 Juta</option>
            <option value="150_200">Rp 150 - 200 Juta</option>
            <option value="above_200">&gt; Rp 200 Juta</option>
          </select>
        </div>

        {/* Field 3: Tahun */}
        <div className="flex-1 px-3 py-1.5 text-left">
          <label htmlFor="hero-year" className="block text-[12px] font-medium text-[var(--muted)] mb-0.5">
            Tahun
          </label>
          <select
            id="hero-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-transparent text-[15px] font-semibold text-[var(--ink)] focus:outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="">Semua Tahun</option>
            <option value="2023">&gt;= 2023</option>
            <option value="2021">&gt;= 2021</option>
            <option value="2018">&gt;= 2018</option>
            <option value="2015">&gt;= 2015</option>
          </select>
        </div>

        {/* Primary Submit Button */}
        <div className="sm:pl-3 pt-1 sm:pt-0">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold px-5 py-2.5 sm:py-3 rounded-[var(--r-btn)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Cari {totalVehicles > 0 ? `${totalVehicles} unit` : "unit"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
