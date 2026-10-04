import Link from "next/link";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getShowroomHomepageData } from "@/app/actions/catalog";
import { formatRupiah, formatUpcomingPrice, cn } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Car,
  Gauge,
  Phone,
  FileCheck,
  Award,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Users,
  Check,
  X,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nur Mobil — Showroom Mobil Bekas Apa Adanya & Bergaransi Cek Fisik",
  description:
    "Showroom jual-beli mobil bekas transparan di Jawa Timur. Rusak dibilang rusak, eks laka dibilang eks laka. Setiap unit disertai lembar uji mikron cat 34 titik dan garansi bebas banjir.",
};

export default async function HomePage() {
  const result = await getShowroomHomepageData();
  const readyVehicles = result.success && result.readyVehicles ? result.readyVehicles : [];
  const upcomingVehicles = result.success && (result as any).upcomingVehicles ? (result as any).upcomingVehicles : [];
  const soldVehicles = result.success && result.soldVehicles ? result.soldVehicles : [];
  const stats = result.success && result.stats ? result.stats : {
    totalSold: 126,
    readyStock: 5,
    pointsTestedPerCar: 34,
    avgDaysToSell: 18,
    samsatVerifiedPct: 100,
    inspectionsDone: 167,
  };

  const comparisonData = [
    {
      aspect: "Kondisi Cat & Bodi",
      traditional: "Klaim 'Mulus kempling' padahal dempul tebal atau bekas bentur ditutup poles.",
      nurMobil: "Lembar uji mikron cat 34 titik digital. Anda tahu pasti panel mana yang ori kaleng vs dempul.",
    },
    {
      aspect: "Jaminan Riwayat Rangka",
      traditional: "Hanya janji lisan 'Bebas laka mas', tanpa konsekuensi bila ternyata bekas insiden parah.",
      nurMobil: "Garansi buyback tertulis bermaterai 100% uang kembali jika terbukti bekas tabrak struktur/pilar.",
    },
    {
      aspect: "Keaslian Odometer & Mesin",
      traditional: "Rentan odometer diputar demi terkesan low KM; riwayat servis tidak diverifikasi.",
      nurMobil: "Transparansi fisik setir, pedal, dan buku servis apa adanya. Kompresi mesin diuji.",
    },
    {
      aspect: "Pemeriksaan Rendaman Banjir",
      traditional: "Cuci salon wangi menutupi endapan lumpur di bawah karpet dan jalur kabel kelistrikan.",
      nurMobil: "Inspeksi teliti kolong dasbor, celah soket sekring, dan rel jok untuk memastikan 0% karat banjir.",
    },
    {
      aspect: "Keabsahan Surat (BPKB & STNK)",
      traditional: "Seringkali BPKB masih ditahan pihak ketiga/leasing atau ada tunggakan pajak menumpuk.",
      nurMobil: "Cek fisik Samsat terverifikasi, dokumen on-hand 100% sah dan siap proses balik nama seketika.",
    },
    {
      aspect: "Inspeksi Pihak Ketiga",
      traditional: "Sering enggan atau membatasi pembeli yang membawa montir luar atau jasa inspektor.",
      nurMobil: "Sangat dipersilakan! Bawa montir langganan atau teknisi independen untuk cek sepuasnya.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#1C1917] flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 space-y-16 py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* HERO SECTION */}
        <section className="bg-[#EFECE8] border border-[#D9D4CB] rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-sm">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
              <span>Standar Transparansi Nur Mobil</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#1C1917] tracking-tight leading-tight">
              Beli Mobil Bekas Tanpa Was-Was.{" "}
              <span className="text-[#D97706]">Rusak Dibilang Rusak</span>, Eks Laka Dibilang Eks Laka.
            </h1>

            <p className="text-base sm:text-lg text-[#6B6560] leading-relaxed">
              Kami bukan dealer yang sekadar menjual polesan mengkilap. Kami menyajikan fakta apa adanya lewat alat uji mikron ketebalan cat di 34 titik bodi, uji mesin, keabsahan Samsat, dan garansi resmi bebas tabrak & bebas banjir.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
              <Link
                href="/katalog"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow"
              >
                <span>Lihat Katalog Mobil Ready ({stats.readyStock} Unit)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20Nur%20Mobil,%20saya%20tertarik%20tanya%20unit%20mobil%20ready"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D97706]" />
                <span>Konsultasi Langsung via WA</span>
              </a>
            </div>
          </div>
        </section>

        {/* 1. COUNTER STATISTIK KEPERCAYAAN & REKAM JEJAK */}
        <section className="bg-white rounded-2xl border border-[#D9D4CB] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E5E0D8]">
            <div className="space-y-1 text-center sm:text-left pt-3 md:pt-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#D97706]">
                <TrendingUp className="w-5 h-5" />
                <span className="text-3xl font-black text-[#1C1917]">{stats.totalSold}+</span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] uppercase tracking-wide">Unit Terjual</p>
              <p className="text-[11px] text-[#6B6560]">Kepercayaan pembeli sejak 2021 se-Jawa Timur</p>
            </div>

            <div className="space-y-1 text-center sm:text-left pt-3 md:pt-0 md:pl-6">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-blue-600">
                <Gauge className="w-5 h-5" />
                <span className="text-3xl font-black text-[#1C1917]">{stats.pointsTestedPerCar} Titik</span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] uppercase tracking-wide">Uji Sensor Mikron</p>
              <p className="text-[11px] text-[#6B6560]">Standar uji presisi di 15 panel bodi & pilar</p>
            </div>

            <div className="space-y-1 text-center sm:text-left pt-3 md:pt-0 md:pl-6">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600">
                <FileCheck className="w-5 h-5" />
                <span className="text-3xl font-black text-[#1C1917]">{stats.samsatVerifiedPct}%</span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] uppercase tracking-wide">Dokumen Sah Samsat</p>
              <p className="text-[11px] text-[#6B6560]">Cek fisik BPKB, STNK & Faktur bebas blokir hukum</p>
            </div>

            <div className="space-y-1 text-center sm:text-left pt-3 md:pt-0 md:pl-6">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-purple-600">
                <Clock className="w-5 h-5" />
                <span className="text-3xl font-black text-[#1C1917]">&lt; {stats.avgDaysToSell} Hari</span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] uppercase tracking-wide">Rata-rata Terjual</p>
              <p className="text-[11px] text-[#6B6560]">Perputaran cepat karena harga riil & transparan</p>
            </div>

            <div className="space-y-1 text-center sm:text-left pt-3 md:pt-0 md:pl-6 col-span-2 md:col-span-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#D97706]">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-3xl font-black text-[#1C1917]">100%</span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] uppercase tracking-wide">Garansi Buyback</p>
              <p className="text-[11px] text-[#6B6560]">Jaminan uang kembali jika ada eks laka berat/banjir</p>
            </div>
          </div>
        </section>

        {/* 2. 3 PILAR KEUNGGULAN TRANSPARANSI */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Uji Mikron Cat 34 Titik Panel Bodi</h3>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Setiap panel logam (kap mesin, atap, 4 pintu, 4 fender/quarter, bagasi) diukur dengan sensor mikron digital. Anda tahu pasti bagian mana yang masih cat original, mana yang repaint tipis, dan mana yang dempul tebal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Garansi Rangka Bebas Laka & Banjir</h3>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Pemeriksaan tulang sasis, apron depan, pilar A/B/C, dan lantai bagasi. Kami memberikan jaminan uang kembali bermaterai jika unit terbukti bekas insiden tabrakan berat atau rendaman banjir.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Keabsahan Dokumen 100% Legal</h3>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Cek fisik Samsat, validitas BPKB, STNK, dan Faktur terjamin bersih tanpa blokir leasing atau masalah hukum. Dokumen on-hand siap pakai dan siap balik nama seketika.
            </p>
          </div>
        </section>

        {/* 3. UNIT PILIHAN SIAP PAKAI (READY STOCK) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block">
                Stok Terkini Showroom
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                Unit Mobil Pilihan Siap Pakai
              </h2>
            </div>
            <Link
              href="/katalog"
              className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua Unit di Katalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {readyVehicles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D9D4CB] p-8 text-center text-[#6B6560]">
              Belum ada unit yang dipajang di katalog publik.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readyVehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/katalog/${v.slug}`}
                  className="bg-white rounded-2xl border border-[#D9D4CB] hover:border-amber-400/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-inherit no-underline"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-[#EFECE8] overflow-hidden">
                      {v.photos[0] ? (
                        <img
                          src={v.photos[0].fileUrl}
                          alt={`${v.brand} ${v.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#6B6560]">
                          <Car className="w-12 h-12 opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm",
                            v.status === "BOOKED"
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-600 text-white"
                          )}
                        >
                          {v.status === "BOOKED" ? "BOOKED" : "READY"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                          Plat {v.plateNumber}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="text-[11px] font-bold text-[#D97706] uppercase">
                        {v.brand} • {v.year} • {v.transmission}
                      </div>
                      <h3 className="font-bold text-base text-[#1C1917] group-hover:text-[#D97706] transition-colors line-clamp-1">
                        {v.model}
                      </h3>
                      <div className="text-lg font-extrabold text-[#1C1917]">
                        {v.price ? formatRupiah(v.price) : "Hubungi Kami"}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6B6560] pt-2 border-t border-[#EBE7E1]">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
                          {v.odometer.toLocaleString("id-ID")} KM
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Inspeksi 34 Titik
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="w-full flex items-center justify-center gap-1.5 bg-[#F7F5F2] group-hover:bg-[#D97706] group-hover:text-white border border-[#D9D4CB] group-hover:border-[#D97706] text-[#1C1917] text-xs font-bold py-2.5 rounded-xl transition-all">
                      <span>Lihat Detail & Hasil Inspeksi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 3B. UNIT SEGERA HADIR (UPCOMING STOCK / DALAM PERSIAPAN) */}
        {upcomingVehicles.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-[#EBE7E1] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Baru Masuk • Tahap Salon &amp; Detailing</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                  Segera Hadir di Showroom (Upcoming Stock)
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6560] mt-1">
                  Unit baru tiba yang sedang menjalani rekondisi minor dan persiapan siap jual. Anda bisa booking atau tanya lebih awal.
                </p>
              </div>
              <Link
                href="/katalog"
                className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Lihat Tab Segera Hadir di Katalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingVehicles.map((v: any) => (
                <Link
                  key={v.id}
                  href={`/katalog/${v.slug}`}
                  className="bg-white rounded-2xl border border-amber-300 hover:border-amber-500 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer text-inherit no-underline"
                >
                  <div>
                    <div className="relative aspect-[16/11] bg-amber-50/50 overflow-hidden">
                      {v.photos[0] ? (
                        <img
                          src={v.photos[0].fileUrl}
                          alt={`${v.brand} ${v.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#6B6560]">
                          <Car className="w-12 h-12 opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-sm bg-amber-500 text-stone-950 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>SEGERA HADIR</span>
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                          Plat {v.plateNumber}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="text-[10px] font-bold text-[#D97706] uppercase">
                        {v.brand} • {v.year} • {v.transmission}
                      </div>
                      <h3 className="font-bold text-sm text-[#1C1917] group-hover:text-[#D97706] transition-colors line-clamp-1">
                        {v.model}
                      </h3>
                      <div>
                        <div className="text-base font-extrabold text-amber-900">
                          {formatUpcomingPrice(v.price)}
                        </div>
                        <span className="text-[10px] text-stone-500 block">
                          *Tahap rekondisi &amp; salon
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B6560] pt-2 border-t border-[#EBE7E1]">
                        <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{v.odometer.toLocaleString("id-ID")} KM</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="w-full flex items-center justify-center gap-1.5 bg-amber-50 group-hover:bg-[#D97706] group-hover:text-white border border-amber-300 group-hover:border-[#D97706] text-amber-900 text-xs font-bold py-2 rounded-xl transition-all">
                      <span>Booking Duluan / Lihat Info</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. SHOWCASE UNIT YANG BARU SAJA TERJUAL (SOLD OUT REEL) */}
        {soldVehicles.length > 0 && (
          <section className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-[#EBE7E1] pb-5">
              <div>
                <div className="inline-flex items-center gap-2 bg-stone-100 text-[#6B6560] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bukti Transparansi Nyata</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                  Unit yang Baru Saja Terjual (Sold Out)
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6560] mt-1">
                  Catatan kondisi apa adanya dan realisasi harga transaksi unit yang telah sampai ke garasi konsumen kami.
                </p>
              </div>
              <div className="text-xs text-[#6B6560]">
                Perputaran cepat berkat <span className="font-bold text-[#1C1917]">harga riil tanpa markup tinggi</span>.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {soldVehicles.map((sold) => (
                <Link
                  key={sold.id}
                  href={`/katalog/${sold.slug}`}
                  className="bg-[#FBF9F6] border border-[#E5E0D8] hover:border-stone-400 hover:shadow-lg transition-all duration-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden group cursor-pointer text-inherit no-underline"
                >
                  <div className="sm:w-48 aspect-[16/11] sm:aspect-square rounded-xl overflow-hidden relative shrink-0 bg-[#EFECE8]">
                    <img
                      src={sold.photoUrl}
                      alt={`${sold.brand} ${sold.model}`}
                      className="w-full h-full object-cover filter grayscale-[15%] group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                      <span className="bg-stone-950/90 border border-amber-500/50 text-amber-400 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-md">
                        TERJUAL
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wide">
                        {sold.brand} • {sold.year}
                      </span>
                      <span className="text-[11px] font-bold text-[#6B6560] bg-[#EFECE8] px-2 py-0.5 rounded">
                        Plat {sold.plateNumber}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#1C1917] group-hover:text-[#D97706] transition-colors leading-snug">
                      {sold.model}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#6B6560]">Harga Realisasi:</span>
                      <span className="text-base font-black text-emerald-700">
                        {formatRupiah(sold.price)}
                      </span>
                    </div>

                    <div className="text-xs text-[#6B6560] bg-white p-2.5 rounded-lg border border-[#EBE7E1] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#1C1917] font-semibold">
                        <Users className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Pembeli: {sold.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#6B6560]">
                        <MapPin className="w-3 h-3 text-[#6B6560]" />
                        <span>Wilayah: {sold.buyerLocation}</span>
                      </div>
                      {sold.notes && (
                        <p className="text-[11px] text-[#6B6560] italic pt-1 border-t border-[#F2EFE9] line-clamp-2">
                          &ldquo;{sold.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#D97706] group-hover:underline">
                      <span>Buka Lembar Arsip & Cek Fisik</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. TABEL KOMPARASI HEAD-TO-HEAD: SHOWROOM BIASA VS STANDAR NUR MOBIL */}
        <section className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-10 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block">
              Mengapa Nur Mobil Berbeda?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
              Bandingkan Sebelum Memutuskan Membeli
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6560]">
              Kami percaya kejujuran di awal jauh lebih berharga daripada kekecewaan setelah mobil terparkir di rumah Anda.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-[#D9D4CB]">
                  <th className="py-3 px-4 text-xs font-bold text-[#6B6560] uppercase tracking-wider w-1/4">
                    Aspek Pemeriksaan
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-red-600 uppercase tracking-wider w-[37.5%] bg-red-50/50 rounded-t-xl">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Showroom Mobil Bekas Biasa</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-emerald-700 uppercase tracking-wider w-[37.5%] bg-emerald-50/60 rounded-t-xl">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Standar Kejujuran Nur Mobil</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE7E1] text-xs sm:text-sm">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-4 px-4 font-bold text-[#1C1917] align-top">
                      {row.aspect}
                    </td>
                    <td className="py-4 px-4 text-[#6B6560] align-top bg-red-50/20 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#1C1917] font-medium align-top bg-emerald-50/20 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{row.nurMobil}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. ALUR PEMBELIAN 3 LANGKAH TANPA WAS-WAS */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block">
              Alur Transaksi Aman
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
              3 Langkah Beli Mobil Tanpa Rasa Curiga
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-[#E5E0D8] absolute top-4 right-4">01</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center font-black">
                1
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Pilih Unit & Cek Laporan Mikron</h3>
              <p className="text-xs text-[#6B6560] leading-relaxed">
                Pelajari lembar blueprint inspeksi 34 titik online. Ketahui titik mana saja yang cat kaleng ori, ada solan, atau minus minor sebelum datang ke lokasi.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-[#E5E0D8] absolute top-4 right-4">02</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center font-black">
                2
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Cek Fisik & Bebas Bawa Montir</h3>
              <p className="text-xs text-[#6B6560] leading-relaxed">
                Kunjungi showroom kami. Anda dipersilakan membawa montir kepercayaan Anda sendiri untuk memeriksa mesin, transmisi, dan test drive di jalan sepuasnya.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-3 relative">
              <span className="text-4xl font-black text-[#E5E0D8] absolute top-4 right-4">03</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center font-black">
                3
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Transaksi Aman & Garansi Buyback</h3>
              <p className="text-xs text-[#6B6560] leading-relaxed">
                Pembayaran via transfer bank resmi dengan kuitansi sah serta surat garansi buyback tertulis jaminan keabsahan surat dan bebas riwayat insiden parah.
              </p>
            </div>
          </div>
        </section>

        {/* 7. JANGKAUAN WILAYAH & KEPERCAYAAN JAWA TIMUR */}
        <section className="bg-[#EFECE8] border border-[#D9D4CB] rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-[#1C1917]">
                Melayani Pembeli di Seluruh Jawa Timur & Sekitarnya
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6560]">
                Unit kami telah terkirim dan dinikmati keluarga di berbagai kota dengan pengurusan mutasi & balik nama dibantu tuntas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Kediri", "Malang Raya", "Blitar", "Surabaya", "Tulungagung", "Sidoarjo", "Jombang", "Mojokerto"].map((city) => (
                <span
                  key={city}
                  className="bg-white border border-[#D9D4CB] text-[#1C1917] font-semibold text-xs px-3 py-1.5 rounded-full shadow-2xs flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-[#D97706]" />
                  {city}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
