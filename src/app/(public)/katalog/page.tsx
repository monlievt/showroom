import { Suspense } from "react";
import { getPublicCatalog } from "@/app/actions/catalog";
import { CatalogClient } from "@/components/public/CatalogClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Mobil Bekas Bergaransi Cek Fisik | Nur Mobil",
  description:
    "Katalog mobil bekas siap pakai dengan transparansi penuh: hasil uji mikron ketebalan cat 34 titik bodi, garansi bebas tabrak & banjir, dan unduh sertifikat inspeksi resmi.",
};

export default async function CatalogPage() {
  const result = await getPublicCatalog();
  const vehicles = result.success && result.data ? result.data : [];

  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-[var(--muted)] text-[14px]">
          Memuat katalog unit...
        </div>
      }
    >
      <CatalogClient initialVehicles={vehicles} />
    </Suspense>
  );
}
