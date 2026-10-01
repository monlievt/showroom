import { getPublicCatalog } from "@/app/actions/catalog";
import { CatalogClient } from "@/components/public/CatalogClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Mobil Bekas Bergaransi Cek Fisik | Nur Mobil",
  description:
    "Katalog mobil bekas siap pakai dengan transparansi penuh: hasil uji mikron ketebalan cat 11 panel body, garansi bebas tabrak & banjir, dan unduh sertifikat inspeksi resmi.",
};

export default async function CatalogPage() {
  const result = await getPublicCatalog();
  const vehicles = result.success && result.data ? result.data : [];

  return <CatalogClient initialVehicles={vehicles} />;
}
