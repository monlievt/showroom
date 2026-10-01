import { notFound } from "next/navigation";
import { getPublicVehicleDetail } from "@/app/actions/catalog";
import { VehicleDetailClient } from "@/components/public/VehicleDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicVehicleDetail(slug);

  if (!result.success || !result.data) {
    return {
      title: "Unit Tidak Ditemukan | Nur Mobil",
    };
  }

  const v = result.data;
  return {
    title: `${v.brand} ${v.model} ${v.year} (Plat ${v.plateNumber}) | Nur Mobil`,
    description: `Jual mobil bekas ${v.brand} ${v.model} tahun ${v.year} warna ${v.color}. Kilometer ${v.odometer.toLocaleString("id-ID")} KM, transmisi ${v.transmission}. Transparansi cek fisik & uji mikron cat 11 panel lengkap.`,
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicVehicleDetail(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  return <VehicleDetailClient vehicle={result.data as any} />;
}
