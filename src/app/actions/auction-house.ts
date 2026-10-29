"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";

export interface AuctionHouseItem {
  id: string;
  name: string;
  bpkbLeadDays: number;
  notes?: string;
}

const DEFAULT_AUCTION_HOUSES: AuctionHouseItem[] = [
  { id: "JBA", name: "JBA", bpkbLeadDays: 14, notes: "Estimasi BPKB ~14 hari kerja" },
  { id: "AUKSI", name: "AUKSI", bpkbLeadDays: 7, notes: "Estimasi BPKB ~7 hari kerja" },
  { id: "IBID", name: "IBID", bpkbLeadDays: 10, notes: "Estimasi BPKB ~10 hari kerja" },
  { id: "SMARTBID", name: "SmartBid", bpkbLeadDays: 30, notes: "Estimasi BPKB ~30 hari kerja" },
  { id: "ADIRA", name: "Adira Auction", bpkbLeadDays: 21, notes: "Estimasi BPKB ~21 hari kerja" },
  { id: "BCA_FINANCE", name: "BCA Finance Auction", bpkbLeadDays: 14, notes: "Estimasi BPKB ~14 hari kerja" },
  { id: "STAR_AUCTION", name: "Star Auction", bpkbLeadDays: 14, notes: "Estimasi BPKB ~14 hari kerja" },
  { id: "CAREADY", name: "Caready", bpkbLeadDays: 14, notes: "Estimasi BPKB ~14 hari kerja" },
  { id: "LEGOAS", name: "Legoas", bpkbLeadDays: 14, notes: "Estimasi BPKB ~14 hari kerja" },
];

const AUCTION_HOUSES_SETTING_KEY = "AUCTION_HOUSES_LIST";

export async function getAuctionHousesAction(): Promise<AuctionHouseItem[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: AUCTION_HOUSES_SETTING_KEY },
    });

    if (!setting || !setting.value) {
      return DEFAULT_AUCTION_HOUSES;
    }

    const parsed = JSON.parse(setting.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    return DEFAULT_AUCTION_HOUSES;
  } catch (error) {
    console.error("Error reading auction houses setting:", error);
    return DEFAULT_AUCTION_HOUSES;
  }
}

export async function saveAuctionHouseAction(input: {
  id?: string;
  name: string;
  bpkbLeadDays: number;
  notes?: string;
}): Promise<{ success: boolean; data?: AuctionHouseItem[]; error?: string }> {
  try {
    await requireSession();

    const nameClean = input.name.trim();
    if (!nameClean) {
      return { success: false, error: "Nama balai lelang wajib diisi" };
    }

    const currentList = await getAuctionHousesAction();
    let updatedList: AuctionHouseItem[];

    if (input.id) {
      // Edit existing
      updatedList = currentList.map((item) =>
        item.id === input.id
          ? {
              ...item,
              name: nameClean,
              bpkbLeadDays: Math.max(1, Math.min(90, Number(input.bpkbLeadDays) || 14)),
              notes: input.notes?.trim() || undefined,
            }
          : item
      );
    } else {
      // Create new
      const newId = nameClean.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_" + Date.now().toString(36);
      const newItem: AuctionHouseItem = {
        id: newId,
        name: nameClean,
        bpkbLeadDays: Math.max(1, Math.min(90, Number(input.bpkbLeadDays) || 14)),
        notes: input.notes?.trim() || undefined,
      };
      updatedList = [...currentList, newItem];
    }

    await prisma.systemSetting.upsert({
      where: { key: AUCTION_HOUSES_SETTING_KEY },
      create: {
        key: AUCTION_HOUSES_SETTING_KEY,
        value: JSON.stringify(updatedList),
        group: "GENERAL",
        label: "Daftar Balai Lelang & Estimasi BPKB",
        description: "Daftar master balai lelang untuk form pengadaan unit dan tracker BPKB",
      },
      update: {
        value: JSON.stringify(updatedList),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/inventory/new");
    revalidatePath("/admin/inventory");

    return { success: true, data: updatedList };
  } catch (error: any) {
    console.error("Error saving auction house:", error);
    return { success: false, error: error.message || "Gagal menyimpan balai lelang" };
  }
}

export async function deleteAuctionHouseAction(
  id: string
): Promise<{ success: boolean; data?: AuctionHouseItem[]; error?: string }> {
  try {
    await requireSession();

    const currentList = await getAuctionHousesAction();
    if (currentList.length <= 1) {
      return { success: false, error: "Minimal harus ada 1 balai lelang terdaftar." };
    }

    const updatedList = currentList.filter((item) => item.id !== id);

    await prisma.systemSetting.upsert({
      where: { key: AUCTION_HOUSES_SETTING_KEY },
      create: {
        key: AUCTION_HOUSES_SETTING_KEY,
        value: JSON.stringify(updatedList),
        group: "GENERAL",
        label: "Daftar Balai Lelang & Estimasi BPKB",
      },
      update: {
        value: JSON.stringify(updatedList),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/inventory/new");
    revalidatePath("/admin/inventory");

    return { success: true, data: updatedList };
  } catch (error: any) {
    console.error("Error deleting auction house:", error);
    return { success: false, error: error.message || "Gagal menghapus balai lelang" };
  }
}

export async function resetAuctionHousesAction(): Promise<{
  success: boolean;
  data?: AuctionHouseItem[];
  error?: string;
}> {
  try {
    await requireSession();

    await prisma.systemSetting.upsert({
      where: { key: AUCTION_HOUSES_SETTING_KEY },
      create: {
        key: AUCTION_HOUSES_SETTING_KEY,
        value: JSON.stringify(DEFAULT_AUCTION_HOUSES),
        group: "GENERAL",
        label: "Daftar Balai Lelang & Estimasi BPKB",
      },
      update: {
        value: JSON.stringify(DEFAULT_AUCTION_HOUSES),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/inventory/new");
    revalidatePath("/admin/inventory");

    return { success: true, data: DEFAULT_AUCTION_HOUSES };
  } catch (error: any) {
    console.error("Error resetting auction houses:", error);
    return { success: false, error: error.message || "Gagal mereset balai lelang" };
  }
}
