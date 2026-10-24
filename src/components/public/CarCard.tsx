import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatRupiah, formatThousands } from "@/lib/utils";
import { InspectionBar } from "./InspectionBar";

export interface CarCardVehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  transmission: string;
  odometer: number;
  plateNumber: string;
  price?: number | null;
  targetSellingPrice?: number | null;
  status: string;
  photos?: Array<{ fileUrl: string; tag?: string | null; category?: string | null }>;
  inspection?: {
    panels?: Array<{
      panelType: string;
      condition: "ORIGINAL" | "REPAINT" | "THICK_FILLER" | string;
      paintThickness?: number | null;
    }>;
  } | null;
}

interface CarCardProps {
  vehicle: CarCardVehicle;
}

export function CarCard({ vehicle }: CarCardProps) {
  const photoUrl = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0].fileUrl : null;
  const effectivePrice = vehicle.price ?? vehicle.targetSellingPrice ?? null;
  const isReady = vehicle.status === "READY_FOR_SALE" || vehicle.status === "READY";
  const isBooked = vehicle.status === "BOOKED";
  const isSold = vehicle.status === "SOLD_SETTLED" || vehicle.status === "SOLD";

  const panels = vehicle.inspection?.panels || null;

  return (
    <Link
      href={`/katalog/${vehicle.slug}`}
      className="group block bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] overflow-hidden transition-colors duration-150 hover:border-[var(--line-input)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      {/* 1. Area Foto (Rasio 16:10, tinggi ~165px) */}
      <div className="relative w-full aspect-[16/10] bg-[#E7EAEE] overflow-hidden">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}, ${vehicle.plateNumber}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs font-medium uppercase tracking-wider">
            Foto unit
          </div>
        )}

        {/* Badge Status di Pojok Kiri Atas Foto */}
        {isReady && (
          <div className="absolute top-2.5 left-2.5 bg-white/95 text-[var(--ok)] border border-[var(--line)] px-2.5 py-0.5 rounded-full text-[12px] font-bold tracking-tight shadow-xs">
            READY
          </div>
        )}
        {isBooked && (
          <div className="absolute top-2.5 left-2.5 bg-white/95 text-[var(--warn)] border border-[var(--line)] px-2.5 py-0.5 rounded-full text-[12px] font-bold tracking-tight shadow-xs">
            BOOKED
          </div>
        )}
        {isSold && (
          <div className="absolute top-2.5 left-2.5 bg-white/95 text-[var(--muted)] border border-[var(--line)] px-2.5 py-0.5 rounded-full text-[12px] font-bold tracking-tight shadow-xs">
            TERJUAL
          </div>
        )}
      </div>

      {/* 2. Isi Kartu */}
      <div className="p-[14px_16px_16px] space-y-2">
        {/* Meta: {tahun} · {transmisi} · {KM} */}
        <div className="text-[12px] text-[var(--muted)] leading-none">
          {vehicle.year} · {vehicle.transmission === "AUTOMATIC" ? "Otomatis" : vehicle.transmission === "MANUAL" ? "Manual" : vehicle.transmission} · {formatThousands(vehicle.odometer)} km
        </div>

        {/* Judul: Nama Unit */}
        <h4 className="text-[16px] font-bold text-[var(--ink)] leading-snug line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
          {vehicle.brand} {vehicle.model}
        </h4>

        {/* Harga */}
        <div className="text-[20px] font-bold text-[var(--ink)] tracking-tight">
          {effectivePrice ? formatRupiah(effectivePrice) : "Hubungi Kami"}
        </div>

        {/* Inspection Bar (8 segmen) */}
        <div className="pt-1 border-t border-[var(--line)]">
          <InspectionBar panels={panels} plateNumber={vehicle.plateNumber} />
        </div>
      </div>
    </Link>
  );
}
