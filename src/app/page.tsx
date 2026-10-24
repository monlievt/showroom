import Link from "next/link";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroSearchBar } from "@/components/public/HeroSearchBar";
import { CarCard } from "@/components/public/CarCard";
import { getShowroomHomepageData } from "@/app/actions/catalog";
import { formatRupiah, formatThousands } from "@/lib/utils";
import { Check, X, Phone, Users, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nur Mobil | Showroom Mobil Bekas Apa Adanya & Bergaransi Cek Fisik",
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

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";
  const waConsultUrl = `https://wa.me/${waNumber}?text=Halo%20Admin%20Nur%20Mobil,%20saya%20tertarik%20tanya%20unit%20mobil%20ready`;

  // Unique brands from ready vehicles
  const availableBrands = Array.from(new Set(readyVehicles.map((v) => v.brand)));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 w-full">
        {/* 1. HERO SECTION (§6.1.1) */}
        <section className="bg-[var(--surface)] border-b border-[var(--line)] py-11 sm:py-12">
          <div className="max-w-[var(--container)] mx-auto px-5 space-y-6">
            <div className="space-y-4 max-w-[760px]">
              <h1 className="text-[clamp(28px,3.6vw,42px)] font-bold text-[var(--ink)] leading-[1.15] tracking-[-0.015em]">
                Beli Mobil Bekas Tanpa Was-Was. Rusak Dibilang Rusak, Eks Laka Dibilang Eks Laka.
              </h1>
              <p className="text-[15px] sm:text-[16px] text-[var(--muted)] leading-[1.55] max-w-[640px]">
                Kami bukan dealer yang sekadar menjual polesan mengkilap. Kami menyajikan fakta apa adanya lewat alat uji mikron ketebalan cat di 34 titik bodi, uji mesin, keabsahan surat, dan garansi resmi bebas tabrak &amp; bebas banjir.
              </p>
            </div>

            {/* Bar Pencarian */}
            <div className="pt-1">
              <HeroSearchBar
                totalVehicles={stats.readyStock || readyVehicles.length}
                brands={availableBrands}
              />
            </div>

            {/* Tombol Sekunder & Baris Kepercayaan */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
              <a
                href={waConsultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-[var(--ink)] border border-[var(--line-input)] hover:border-[var(--ink)] px-4 py-2.5 rounded-[var(--r-btn)] text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] w-fit"
              >
                <Phone className="w-4 h-4 text-[var(--accent)]" />
                <span>Konsultasi Langsung via WA</span>
              </a>
            </div>

            {/* Baris Kepercayaan (§6.1.1) */}
            <div className="pt-2 border-t border-[var(--line)] flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[var(--muted)]">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>{stats.totalSold}+ unit terjual sejak 2021</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>Uji mikron 34 titik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>Dokumen 100% sah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>Garansi buyback tertulis</span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTAINER KONTEN DENGAN JARAK 36-48px */}
        <div className="max-w-[var(--container)] mx-auto px-5 py-10 sm:py-12 space-y-12">
          {/* 2. UNIT SIAP PAKAI (§6.1.2) */}
          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em]">
                Unit siap pakai
              </h2>
              <Link
                href="/katalog"
                className="text-[14px] font-semibold text-[var(--accent)] hover:underline"
              >
                Lihat semua unit
              </Link>
            </div>

            {readyVehicles.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-8 text-center text-[var(--muted)] text-[15px]">
                Belum ada unit yang dipajang di katalog publik.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
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
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-[var(--ink)] tracking-[-0.01em]">
                    Segera hadir di showroom
                  </h2>
                  <p className="text-[13px] text-[var(--muted)]">
                    Unit dalam tahap persiapan salon dan cek fisik akhir.
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-[14px] font-semibold text-[var(--accent)] hover:underline"
                >
                  Lihat di katalog
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
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

          {/* 3. TIGA KEUNGGULAN (§6.1.3) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-2">
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                Uji mikron cat 34 titik
              </h3>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed">
                Data ketebalan cat di setiap panel body dibuka jujur. Anda tahu pasti mana yang cat orisinil pabrik dan mana yang hasil dempul.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-2">
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                Rangka bebas laka &amp; banjir
              </h3>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed">
                Setiap rangka utama, pilar, dan kolong diperiksa ketat. Bebas bekas insiden benturan struktur dan bebas karat rendaman air.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-2">
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                Bawa montir sendiri
              </h3>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed">
                Sangat dipersilakan membawa mekanik kepercayaan atau jasa inspeksi pihak ketiga untuk menguji unit sepuasnya sebelum transaksi.
              </p>
            </div>
          </section>

          {/* 4. TABEL PERBANDINGAN (§6.1.4) */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em]">
                Mengapa Nur Mobil berbeda
              </h2>
              <p className="text-[14px] text-[var(--muted)]">
                Perbandingan standar transparansi kami dengan showroom mobil bekas konvensional.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] overflow-hidden">
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

          {/* 5. ALUR TRANSAKSI (§6.1.5) */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em]">
                Alur transaksi
              </h2>
              <p className="text-[14px] text-[var(--muted)]">
                Tiga langkah pembelian jelas dan aman, tanpa tekanan.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] divide-y divide-[var(--line)]">
              <div className="p-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                <div className="w-[200px] shrink-0 font-bold text-[15px] text-[var(--ink)]">
                  Langkah 1: Verifikasi
                </div>
                <div className="text-[14px] text-[var(--muted)] leading-relaxed">
                  Pilih unit di katalog dan pelajari lembar uji mikron 34 titik bodi secara online. Anda tahu pasti kondisi panel mana yang ori kaleng vs dempul sebelum datang.
                </div>
              </div>

              <div className="p-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                <div className="w-[200px] shrink-0 font-bold text-[15px] text-[var(--ink)]">
                  Langkah 2: Uji fisik
                </div>
                <div className="text-[14px] text-[var(--muted)] leading-relaxed">
                  Datang ke garasi dan cek unit sepuasnya. Anda dipersilakan membawa montir langganan atau teknisi independen untuk test drive dan cek mesin langsung.
                </div>
              </div>

              <div className="p-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                <div className="w-[200px] shrink-0 font-bold text-[15px] text-[var(--ink)]">
                  Langkah 3: Akad &amp; garansi
                </div>
                <div className="text-[14px] text-[var(--muted)] leading-relaxed">
                  Pembayaran transparan lewat transfer bank resmi dengan tanda terima sah serta surat jaminan garansi buyback tertulis bermaterai.
                </div>
              </div>
            </div>
          </section>

          {/* 6. UNIT YANG BARU TERJUAL (ARSIP BUKTI NYATA) */}
          {soldVehicles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-[var(--ink)] tracking-[-0.01em]">
                    Unit yang baru terjual
                  </h2>
                  <p className="text-[13px] text-[var(--muted)]">
                    Bukti transparansi riil transaksi yang telah tuntas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {soldVehicles.map((sold) => (
                  <Link
                    key={sold.id}
                    href={`/katalog/${sold.slug}`}
                    className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-input)] rounded-[var(--r-card)] p-4 flex flex-col sm:flex-row gap-4 transition-colors"
                  >
                    <div className="sm:w-40 aspect-[16/10] sm:aspect-square rounded-[8px] overflow-hidden relative shrink-0 bg-[#E7EAEE]">
                      <img
                        src={sold.photoUrl}
                        alt={`${sold.brand} ${sold.model}`}
                        className="w-full h-full object-cover filter grayscale-[10%]"
                      />
                      <div className="absolute top-2 left-2 bg-white/95 text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-full text-[11px] font-bold">
                        TERJUAL
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5 text-left">
                      <div className="text-[12px] text-[var(--muted)]">
                        {sold.brand} · {sold.year} · Plat {sold.plateNumber}
                      </div>
                      <h4 className="text-[15px] font-bold text-[var(--ink)]">
                        {sold.model}
                      </h4>
                      <div className="text-[16px] font-bold text-[var(--ink)]">
                        {formatRupiah(sold.price)}
                      </div>
                      <div className="text-[12px] text-[var(--muted)] flex items-center gap-1.5 pt-1">
                        <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span>Pembeli: {sold.buyerName} ({sold.buyerLocation})</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 7. AREA LAYANAN (§6.1.6) */}
          <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                Area layanan
              </h3>
              <p className="text-[14px] text-[var(--muted)]">
                Melayani pembelian dan pengiriman unit ke seluruh wilayah Jawa Timur dan sekitarnya.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Kediri", "Malang Raya", "Blitar", "Surabaya", "Tulungagung", "Sidoarjo", "Jombang", "Mojokerto", "Madiun", "Nganjuk"].map((city) => (
                <span
                  key={city}
                  className="bg-white border border-[var(--line)] text-[var(--muted)] text-[13px] font-medium px-3 py-1 rounded-full"
                >
                  {city}
                </span>
              ))}
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
