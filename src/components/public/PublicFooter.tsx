import Link from "next/link";
import { ShieldCheck, MapPin, Phone, Clock } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-[#EFECE8] border-t border-[#D9D4CB] text-[#1C1917] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Col */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D97706] flex items-center justify-center text-white font-bold text-base shadow-sm">
              N
            </div>
            <span className="font-bold text-lg text-[#1C1917]">Nur Mobil</span>
          </div>
          <p className="text-xs text-[#6B6560] leading-relaxed max-w-sm">
            Showroom jual-beli mobil bekas yang mengutamakan transparansi dan kejujuran apa adanya.
            Setiap unit melalui inspeksi 11 panel body, uji mikron ketebalan cat, dan garansi bebas tabrak & banjir.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706]">
            <ShieldCheck className="w-4 h-4" />
            <span>Garansi Apa Adanya — Rusak Dibilang Rusak</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1917]">Navigasi</h4>
          <ul className="space-y-1.5 text-xs text-[#6B6560]">
            <li>
              <Link href="/" className="hover:text-[#D97706]">
                Beranda
              </Link>
            </li>
            <li>
              <Link href="/katalog" className="hover:text-[#D97706]">
                Katalog Mobil Ready
              </Link>
            </li>
            <li>
              <Link href="/investor" className="hover:text-[#D97706]">
                Portal Investor
              </Link>
            </li>
            <li>
              <Link href="/admin/inventory" className="hover:text-[#D97706]">
                Login Admin
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1917]">Garasi & Kontak</h4>
          <div className="space-y-1.5 text-xs text-[#6B6560]">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
              <span>Garasi Utama Nur Mobil, Jawa Timur, Indonesia</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-[#D97706]" />
              <span>0812-3456-7890 (Admin Fast Response)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-[#D97706]" />
              <span>Setiap Hari: 08.00 - 17.00 WIB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#D9D4CB] py-4 text-center text-xs text-[#6B6560]">
        &copy; {new Date().getFullYear()} Nur Mobil. Platform Operasional & Katalog Transparansi.
      </div>
    </footer>
  );
}
