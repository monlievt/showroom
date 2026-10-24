import React from "react";
import { cn } from "@/lib/utils";

export interface InspectionPanelData {
  panelType: string;
  condition: "ORIGINAL" | "REPAINT" | "THICK_FILLER" | string;
  paintThickness?: number | null;
}

interface InspectionBarProps {
  panels?: InspectionPanelData[] | null;
  plateNumber: string;
  className?: string;
  showText?: boolean;
}

// 8 Zona Uji Mikron (NURMOBIL_UI_REDESIGN.md §4.4)
const ZONE_KEYS = [
  { name: "Depan (Kap Mesin)", types: ["HOOD", "BUMPER_FRONT"] },
  { name: "Atap", types: ["ROOF"] },
  { name: "Pintu Kiri", types: ["FRONT_DOOR_LEFT", "REAR_DOOR_LEFT"] },
  { name: "Pintu Kanan", types: ["FRONT_DOOR_RIGHT", "REAR_DOOR_RIGHT"] },
  { name: "Fender/Quarter Kiri", types: ["FENDER_FRONT_LEFT", "QUARTER_PANEL_LEFT"] },
  { name: "Fender/Quarter Kanan", types: ["FENDER_FRONT_RIGHT", "QUARTER_PANEL_RIGHT"] },
  { name: "Belakang (Bagasi)", types: ["TRUNK_LID", "BUMPER_REAR"] },
  { name: "Rangka Bawah/Rocker", types: ["ROCKER_PANEL_LEFT", "ROCKER_PANEL_RIGHT"] },
];

export function InspectionBar({
  panels,
  plateNumber,
  className,
  showText = true,
}: InspectionBarProps) {
  const hasInspection = panels && panels.length > 0;

  if (!hasInspection) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div
          className="flex items-center gap-[2px] w-full"
          aria-label="Unit belum diinspeksi uji mikron"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[6px] rounded-[2px] bg-[var(--line)]"
            />
          ))}
        </div>
        {showText && (
          <div className="text-[12px] text-[var(--muted)] leading-tight">
            Belum diinspeksi · {plateNumber}
          </div>
        )}
      </div>
    );
  }

  // Petakan 8 zona berdasarkan kondisi terparah di tiap zona
  const zoneStatuses = ZONE_KEYS.map((zone) => {
    const matchedPanels = panels.filter((p) => zone.types.includes(p.panelType));
    if (matchedPanels.length === 0) return "ORIGINAL"; // default fallback bila panel belum terisi

    const hasThickFiller = matchedPanels.some((p) => p.condition === "THICK_FILLER");
    if (hasThickFiller) return "THICK_FILLER";

    const hasRepaint = matchedPanels.some((p) => p.condition === "REPAINT");
    if (hasRepaint) return "REPAINT";

    return "ORIGINAL";
  });

  const originalCount = zoneStatuses.filter((s) => s === "ORIGINAL").length;
  const ariaText = `Uji mikron: ${originalCount} dari 8 zona cat original`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-[2px] w-full" aria-label={ariaText} role="img">
        {zoneStatuses.map((status, i) => {
          let bgClass = "bg-[var(--ok)]"; // Hijau #2E8B6A
          if (status === "REPAINT") {
            bgClass = "bg-[var(--warn)]"; // Kuning #E0A526
          } else if (status === "THICK_FILLER") {
            bgClass = "bg-[var(--bad)]"; // Merah #C0392B
          }

          return (
            <div
              key={i}
              title={`${ZONE_KEYS[i].name}: ${status === "ORIGINAL" ? "Cat Original" : status === "REPAINT" ? "Repaint Tipis" : "Dempul Tebal"}`}
              className={cn("flex-1 h-[6px] rounded-[2px]", bgClass)}
            />
          );
        })}
      </div>
      {showText && (
        <div className="text-[12px] text-[var(--muted)] leading-tight">
          Inspeksi 34 titik · {plateNumber}
        </div>
      )}
    </div>
  );
}
