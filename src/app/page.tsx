import Link from "next/link";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroSearchBar } from "@/components/public/HeroSearchBar";
import { CarCard } from "@/components/public/CarCard";
import { getShowroomHomepageData } from "@/app/actions/catalog";
import { getPublicWhatsAppContactsAction } from "@/app/actions/contact";
import { formatRupiah } from "@/lib/utils";
import { generateDirectWhatsAppLink, DEFAULT_WHATSAPP_ADMINS } from "@/lib/utils/whatsapp";
import {
  Check,
  X,
  Users,
  MapPin,
  ShieldCheck,
  Gauge,
  Wrench,
  FileText,
  Phone,
  ArrowRight,
  Clock,
  Car,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nur Mobil | Showroom Mobil Bekas Bergaransi Cek Fisik",
  description:
    "Showroom jual-beli mobil bekas transparan di Jawa Timur. Setiap unit disertai lembar uji mikron cat 34 titik, garansi bebas tabrak, dan bebas banjir.",
};

export default async function HomePage() {
  const [result, contacts] = await Promise.all([
    getShowroomHomepageData(),
    getPublicWhatsAppContactsAction(),
  ]);
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

  const primaryContact = contacts && contacts.length > 0
    ? contacts.find((c) => c.isPrimary) || contacts[0]
    : DEFAULT_WHATSAPP_ADMINS[0];

  const comparisonData = [
    {
      aspect: "Kondisi Cat & Bodi",
      traditional: "Klaim 'Mulus kempling' padahal dempul tebal atau bekas benturan ditutup poles salon.",
      nurMobil: "Lembar uji mikron cat 34 titik digital. Anda tahu pasti panel mana yang ori kaleng vs dempul.",
    },
    {
      aspect: "Jaminan Riwayat Rangka",
      traditional: "Hanya janji lisan 'Bebas laka mas', tanpa konsekuensi tertulis bila terbukti bekas insiden.",
      nurMobil: "Garansi buyback tertulis bermaterai 100% uang kembali jika terbukti bekas tabrak struktur/pilar.",
    },
    {
      aspect: "Keaslian Odometer & Mesin",
      traditional: "Rentan odometer diputar demi terkesan low KM; riwayat servis tidak diverifikasi jujur.",
      nurMobil: "Transparansi fisik setir, pedal, dan buku servis apa adanya. Kompresi mesin siap diuji.",
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

  // Unique brands from ready vehicles
  const availableBrands = Array.from(new Set(readyVehicles.map((v) => v.brand)));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between">
      <PublicNavbar initialContacts={contacts} />

      <main className="flex-1 w-full pb-20 md:pb-0">
        {/* 1. HERO SECTION (§6.1.1) */}
        <section className="bg-[var(--surface)] border-b border-[var(--line)] py-8 sm:py-12">
          <div className="max-w-[var(--container)] mx-auto px-4 sm:px-5 space-y-6">
            <div className="space-y-3 max-w-[760px]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 border border-[var(--line)] text-[12px] font-semibold text-[var(--ink)]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Showroom Garasi Terbuka · Jawa Timur</span>
              </div>
              <h1 className="text-[clamp(26px,5vw,42px)] font-bold text-[var(--ink)] leading-[1.2] tracking-[-0.015em]">
                Beli Mobil Bekas Tanpa Was-Was.
              </h1>
              <p className="text-[14px] sm:text-[16px] text-[var(--muted)] leading-relaxed max-w-[640px]">
                Semua catatan bodi, riwayat rangka, dan keabsahan surat kami sediakan transparan. Pelajari lembar uji 34 titik secara online atau ajak mekanik kepercayaan Anda untuk cek langsung di garasi.
              </p>
            </div>

            {/* Bar Pencarian */}
            <div className="pt-1">
              <HeroSearchBar
                totalVehicles={stats.readyStock || readyVehicles.length}
                brands={availableBrands}
              />
            </div>

            {/* 4 Pilar Kepercayaan Showroom (Responsif: 2 kolom di mobile, 4 kolom di desktop) */}
            <div className="pt-4 border-t border-[var(--line)] grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)] flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                    {stats.totalSold}+ Unit Terjual
                  </div>
                  <div className="text-[11px] text-[var(--muted)] truncate">
                    Portofolio riil sejak 2021
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)] flex items-start gap-2.5">
                <Gauge className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                    Uji Mikron 34 Titik
                  </div>
                  <div className="text-[11px] text-[var(--muted)] truncate">
                    Panel ori vs dempul dibuka
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                    100% Surat Sah
                  </div>
                  <div className="text-[11px] text-[var(--muted)] truncate">
                    Cek fisik Samsat &amp; on-hand
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)] flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                    Garansi Buyback
                  </div>
                  <div className="text-[11px] text-[var(--muted)] truncate">
                    Jaminan tertulis bermaterai
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTAINER KONTEN DENGAN JARAK RESPONSIF */}
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-5 py-8 sm:py-12 space-y-10 sm:space-y-14">
          {/* 2. UNIT SIAP PAKAI */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-bold text-[var(--ink)] tracking-tight">
                  Unit Siap Pakai
                </h2>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)]">
                  Stok aktif bergaransi cek fisik dan siap serah terima seketika.
                </p>
              </div>
              <Link
                href="/katalog"
                className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-semibold text-[var(--accent)] hover:underline shrink-0"
              >
                <span>Lihat semua</span>
                <span className="hidden sm:inline">({readyVehicles.length} unit)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {readyVehicles.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-8 text-center text-[var(--muted)] text-[14px]">
                Belum ada unit yang dipajang di katalog publik.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-[18px]">
                {readyVehicles.map((v) => (
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
                      inspection: (v as any).inspection,
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 2B. SEGERA HADIR (UPCOMING STOCK) JIKA ADA */}
          {upcomingVehicles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[18px] sm:text-[22px] font-bold text-[var(--ink)] tracking-tight">
                    Segera Hadir di Garasi
                  </h2>
                  <p className="text-[12px] sm:text-[13px] text-[var(--muted)]">
                    Unit dalam tahap persiapan salon dan cek fisik akhir sebelum dipajang.
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-[13px] font-semibold text-[var(--accent)] hover:underline shrink-0"
                >
                  Lihat di katalog &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[18px]">
                {upcomingVehicles.map((v: any) => (
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
                      status: "UPCOMING",
                      photos: v.photos,
                      inspection: null,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. TIGA KEUNGGULAN (BUKTI STANDAR TRANSPARANSI) */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[24px] font-bold text-[var(--ink)] tracking-tight">
                Standar Transparansi Garasi
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[var(--muted)]">
                Tiga komitmen nyata sebelum Anda memutuskan membawa pulang unit dari showroom kami.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-[18px]">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Thickness Gauge Digital</span>
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Uji Mikron Cat 34 Titik
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed">
                  Data ketebalan cat di setiap panel bodi dibuka jujur. Anda tahu pasti mana yang cat orisinil pabrik, repaint wajar, atau hasil dempul sebelum melihat langsung ke garasi.
                </p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Garansi Tertulis Bermaterai</span>
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Rangka Bebas Laka &amp; Banjir
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed">
                  Setiap rangka utama, pilar, dan kolong diperiksa mendalam. Jika terbukti bekas benturan struktur atau rendaman air, garansi buyback 100% uang kembali tanpa potongan.
                </p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Inspeksi Independen Terbuka</span>
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Bawa Montir Kepercayaan
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed">
                  Kami tidak pernah membatasi pemeriksaan unit. Silakan bawa mekanik langganan Anda atau panggil jasa inspektor independen untuk menguji mobil sepuasnya sebelum transaksi.
                </p>
              </div>
            </div>
          </section>

          {/* 4. TABEL PERBANDINGAN (§6.1.4) - RESPONSIVE: CARDS DI MOBILE, TABLE DI DESKTOP */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[24px] font-bold text-[var(--ink)] tracking-tight">
                Mengapa Nur Mobil Berbeda
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[var(--muted)]">
                Perbandingan standar transparansi kami dengan kebiasaan showroom mobil bekas konvensional.
              </p>
            </div>

            {/* A. Tampilan Mobile: Stacked Comparison Cards (Tanpa scroll horizontal!) */}
            <div className="block md:hidden space-y-3">
              {comparisonData.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                    <span className="text-[13px] font-bold text-[var(--ink)]">
                      {idx + 1}. {row.aspect}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Standar Nur Mobil
                    </span>
                  </div>

                  {/* Standar Nur Mobil */}
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-900">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Standar Nur Mobil</span>
                    </div>
                    <p className="text-[13px] text-emerald-950 leading-relaxed pl-5">
                      {row.nurMobil}
                    </p>
                  </div>

                  {/* Konvensional */}
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-stone-700">
                      <X className="w-4 h-4 text-[var(--bad)] shrink-0" />
                      <span>Showroom Konvensional</span>
                    </div>
                    <p className="text-[12px] text-stone-600 leading-relaxed pl-5">
                      {row.traditional}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* B. Tampilan Desktop: Clean Table */}
            <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[var(--line)]">
                      <th className="py-3 px-5 text-[13px] font-semibold text-[var(--muted)] w-1/4">
                        Aspek pemeriksaan
                      </th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[var(--muted)] w-[37.5%]">
                        Showroom konvensional
                      </th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[var(--accent)] w-[37.5%] bg-[#2F5D8C0F]">
                        Standar Nur Mobil
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] text-[14px]">
                    {comparisonData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-4 px-5 font-semibold text-[var(--ink)] align-top">
                          {row.aspect}
                        </td>
                        <td className="py-4 px-5 text-[var(--muted)] align-top leading-relaxed">
                          <div className="flex items-start gap-2">
                            <X className="w-4 h-4 text-[var(--bad)] shrink-0 mt-0.5" />
                            <span>{row.traditional}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-[var(--ink)] font-medium align-top bg-[#2F5D8C0F] leading-relaxed">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                            <span>{row.nurMobil}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. ALUR TRANSAKSI - TIGA LANGKAH JELAS */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[24px] font-bold text-[var(--ink)] tracking-tight">
                Alur Transaksi Jelas &amp; Nyaman
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[var(--muted)]">
                Tiga tahapan sederhana tanpa tekanan, mengutamakan kenyamanan dan kepastian Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-[18px]">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3 relative">
                <div className="w-8 h-8 rounded-full bg-stone-100 border border-[var(--line)] flex items-center justify-center text-[14px] font-bold text-[var(--ink)]">
                  01
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Verifikasi Data Online
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed">
                  Pilih unit di katalog web kami dan pelajari lembar uji mikron 34 titik bodi. Anda tahu kondisi panel mana yang ori vs dempul sebelum memutuskan berangkat ke garasi.
                </p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3 relative">
                <div className="w-8 h-8 rounded-full bg-stone-100 border border-[var(--line)] flex items-center justify-center text-[14px] font-bold text-[var(--ink)]">
                  02
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Uji Fisik &amp; Test Drive
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed">
                  Datang ke garasi dan periksa mobil sepuasnya. Anda dipersilakan membawa montir langganan atau teknisi independen untuk test drive dan cek mesin langsung di tempat.
                </p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3 relative">
                <div className="w-8 h-8 rounded-full bg-stone-100 border border-[var(--line)] flex items-center justify-center text-[14px] font-bold text-[var(--ink)]">
                  03
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  Akad &amp; Garansi Buyback
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--muted)] leading-relaxed">
                  Pembayaran transparan lewat transfer bank resmi dengan tanda terima sah, dokumen lengkap siap balik nama, serta surat garansi buyback tertulis bermaterai.
                </p>
              </div>
            </div>
          </section>

          {/* 6. UNIT YANG BARU TERJUAL (ARSIP BUKTI NYATA) */}
          {soldVehicles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[18px] sm:text-[22px] font-bold text-[var(--ink)] tracking-tight">
                    Unit Yang Baru Terjual
                  </h2>
                  <p className="text-[12px] sm:text-[13px] text-[var(--muted)]">
                    Bukti transparansi riil transaksi yang telah tuntas di Nur Mobil.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {soldVehicles.map((sold) => (
                  <Link
                    key={sold.id}
                    href={`/katalog/${sold.slug}`}
                    className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-input)] rounded-[var(--r-card)] p-3.5 sm:p-4 flex gap-3.5 transition-colors"
                  >
                    <div className="w-28 sm:w-36 aspect-[4/3] rounded-[8px] overflow-hidden relative shrink-0 bg-[#E7EAEE]">
                      <img
                        src={sold.photoUrl}
                        alt={`${sold.brand} ${sold.model}`}
                        className="w-full h-full object-cover filter grayscale-[15%]"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-stone-900/90 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                        TERJUAL
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <div className="text-[11px] text-[var(--muted)] truncate">
                        {sold.brand} · {sold.year} · Plat {sold.plateNumber}
                      </div>
                      <h4 className="text-[14px] sm:text-[15px] font-bold text-[var(--ink)] truncate">
                        {sold.model}
                      </h4>
                      <div className="text-[15px] sm:text-[16px] font-bold text-[var(--ink)]">
                        {formatRupiah(sold.price)}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 pt-0.5 truncate">
                        <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">Pembeli: {sold.buyerName} ({sold.buyerLocation})</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 7. AREA LAYANAN & LOKASI GARASI (§6.1.6) */}
          <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <h3 className="text-[16px] font-bold text-[var(--ink)]">
                    Garasi Utama &amp; Area Layanan
                  </h3>
                </div>
                <p className="text-[13px] text-[var(--muted)]">
                  Garasi buka setiap hari: 08.00 - 20.00 WIB. Melayani pengiriman ke seluruh Jawa Timur.
                </p>
              </div>

              <a
                href={generateDirectWhatsAppLink(
                  primaryContact.phone,
                  "Halo Admin Nur Mobil, saya mau minta share location garasi untuk cek unit."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--line-input)] text-[13px] font-semibold text-[var(--ink)] transition-colors min-h-[44px] shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Minta Share Loc Garasi</span>
              </a>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">
                Kota Jangkauan Pengiriman &amp; Cek Unit:
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["Kediri", "Malang Raya", "Blitar", "Surabaya", "Tulungagung", "Sidoarjo", "Jombang", "Mojokerto", "Madiun", "Nganjuk"].map((city) => (
                  <span
                    key={city}
                    className="bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-[12px] font-medium px-2.5 py-1 rounded-full"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* STICKY BOTTOM QUICK ACTION DOCK KHUSUS MOBILE (Ergonomis satu jempol) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--line)] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-2.5 shadow-lg">
        <Link
          href="/katalog"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-[13px] font-bold active:scale-[0.98] transition-all min-h-[44px]"
        >
          <Car className="w-4 h-4 text-[var(--accent)]" />
          <span>Lihat Stok ({readyVehicles.length})</span>
        </Link>

        <a
          href={generateDirectWhatsAppLink(
            primaryContact.phone,
            "Halo Admin Nur Mobil, saya ingin tanya info stok dan cek unit di garasi."
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-700 text-white text-[13px] font-bold active:scale-[0.98] transition-all shadow-xs min-h-[44px]"
        >
          <Phone className="w-4 h-4" />
          <span>Chat WhatsApp</span>
        </a>
      </div>

      <PublicFooter />
    </div>
  );
}