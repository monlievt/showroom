"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";
  const waUrl = `https://wa.me/${waNumber}?text=Halo%20Admin%20Nur%20Mobil,%20saya%20ingin%20tanya%20stok%20unit%20mobil%20bekas`;

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--line)] sticky top-0 z-50">
      <div className="max-w-[var(--container)] mx-auto px-5 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-base shadow-xs">
            N
          </div>
          <span className="font-bold text-[18px] text-[var(--ink)] tracking-tight">
            Nur Mobil
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium">
          <Link
            href="/"
            className={cn(
              "transition-colors",
              pathname === "/" ? "text-[var(--ink)] font-semibold" : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            className={cn(
              "transition-colors",
              pathname.startsWith("/katalog") ? "text-[var(--ink)] font-semibold" : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Katalog Unit
          </Link>
          <Link
            href="/admin/inventory"
            className={cn(
              "transition-colors",
              pathname.startsWith("/admin") ? "text-[var(--ink)] font-semibold" : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Portal Internal
          </Link>
        </nav>

        {/* Desktop WhatsApp CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-[var(--r-btn)] text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Hubungi Admin</span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--ink)] hover:bg-[var(--bg)] rounded-[var(--r-btn)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-b border-[var(--line)] px-5 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "block text-[14px] py-1.5 transition-colors",
              pathname === "/" ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"
            )}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "block text-[14px] py-1.5 transition-colors",
              pathname.startsWith("/katalog") ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"
            )}
          >
            Katalog Unit
          </Link>
          <Link
            href="/admin/inventory"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[14px] py-1.5 text-[var(--muted)]"
          >
            Portal Internal
          </Link>
          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-[var(--r-btn)] text-[14px] font-semibold w-full transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Hubungi Admin</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
