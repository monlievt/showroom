import React from "react";
import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--line)] text-[var(--ink)] mt-12 sm:mt-16">
      <div className="max-w-[var(--container)] mx-auto px-4 sm:px-5 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom 1: Tentang */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-base shadow-xs">
              N
            </div>
            <span className="font-bold text-[18px] text-[var(--ink)]">Nur Mobil</span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed max-w-sm">
            Showroom jual-beli mobil bekas yang mengutamakan transparansi dan kejujuran apa adanya.
            Setiap unit melalui inspeksi 34 titik bodi, uji mikron ketebalan cat, dan garansi buyback bebas tabrak &amp; banjir.
          </p>
          <p className="text-[12px] sm:text-[13px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200">
            Apa Adanya &amp; Bergaransi Cek Fisik
          </p>
        </div>

        {/* Kolom 2: Navigasi */}
        <div className="space-y-3">
          <h4 className="font-bold text-[14px] text-[var(--ink)]">Navigasi Halaman</h4>
          <ul className="space-y-2 text-[13px] sm:text-[14px] text-[var(--muted)]">
            <li>
              <Link href="/" className="hover:text-[var(--ink)] transition-colors py-1 inline-block">
                Beranda Showroom
              </Link>
            </li>
            <li>
              <Link href="/katalog" className="hover:text-[var(--ink)] transition-colors py-1 inline-block">
                Katalog Unit Siap Pakai
              </Link>
            </li>
            <li>
              <Link href="/investor" className="hover:text-[var(--ink)] transition-colors py-1 inline-block">
                Portal Transparansi Investor
              </Link>
            </li>
            <li>
              <Link href="/admin/inventory" className="hover:text-[var(--ink)] transition-colors py-1 inline-block">
                Portal Internal Showroom
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Garasi & Kontak */}
        <div className="space-y-3">
          <h4 className="font-bold text-[14px] text-[var(--ink)]">Garasi &amp; Kontak</h4>
          <div className="space-y-2.5 text-[13px] sm:text-[14px] text-[var(--muted)]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
              <span>Garasi Utama Nur Mobil, Jawa Timur, Indonesia</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 shrink-0 text-emerald-700" />
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ink)] hover:underline"
              >
                0812-3456-7890 (WhatsApp Fast Response)
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>Buka Setiap Hari: 08.00 - 20.00 WIB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Hak Cipta */}
      <div className="border-t border-[var(--line)] py-4 text-center text-[12px] sm:text-[13px] text-[var(--muted)] px-4">
        &copy; {new Date().getFullYear()} Nur Mobil. Transparansi Bodi, Rangka &amp; Cek Fisik Mobil Bekas.
      </div>
    </footer>
  );
}
