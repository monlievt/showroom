"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, ShieldCheck, Phone, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#D9D4CB] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#D97706] flex items-center justify-center text-white font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
            N
          </div>
          <div>
            <span className="font-bold text-lg text-[#1C1917] tracking-tight block leading-tight">
              Nur Mobil
            </span>
            <span className="text-[11px] text-[#6B6560] font-medium block">
              Apa Adanya & Bergaransi Cek Fisik
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <Link
            href="/"
            className={cn(
              "transition-colors",
              pathname === "/" ? "text-[#D97706]" : "text-[#1C1917] hover:text-[#D97706]"
            )}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            className={cn(
              "transition-colors",
              pathname.startsWith("/katalog") ? "text-[#D97706]" : "text-[#1C1917] hover:text-[#D97706]"
            )}
          >
            Katalog Unit
          </Link>
          <Link
            href="/admin/inventory"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D9D4CB] text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors"
          >
            Portal Internal
          </Link>
        </nav>

        {/* Desktop WhatsApp CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20Nur%20Mobil,%20saya%20ingin%20tanya%20stok%20unit%20mobil%20bekas"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow"
          >
            <Phone className="w-4 h-4" />
            <span>Hubungi Admin</span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1C1917] hover:bg-[#F7F5F2] rounded-lg"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#D9D4CB] px-4 py-4 space-y-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold py-2 text-[#1C1917] hover:text-[#D97706]"
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold py-2 text-[#1C1917] hover:text-[#D97706]"
          >
            Katalog Unit Ready
          </Link>
          <Link
            href="/admin/inventory"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold py-2 text-[#6B6560]"
          >
            Masuk Portal Internal
          </Link>
          <div className="pt-2">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Nur%20Mobil,%20saya%20ingin%20tanya%20stok%20unit%20mobil%20bekas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#D97706] text-white px-4 py-2.5 rounded-xl text-sm font-bold"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp Admin Nur Mobil</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
