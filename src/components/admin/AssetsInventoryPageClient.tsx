"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Wrench,
  Plus,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Wallet,
  ShieldCheck,
  Building,
  TrendingDown,
  Droplet,
  Sparkles,
  ArrowRight,
  Package,
  History,
  Coins,
  Paperclip,
} from "lucide-react";
import {
  formatRupiah,
  formatDate,
  cn,
  parseProofUrls,
  serializeProofUrls,
} from "@/lib/utils";
import { createShowroomAsset, deleteShowroomAsset } from "@/app/actions/asset";
import {
  createWorkshopSupplyAction,
  restockWorkshopSupplyAction,
  recordSupplyUsageAction,
  deleteWorkshopSupplyAction,
} from "@/app/actions/supplies";
import { ProofUploadField } from "@/components/admin/ProofUploadField";
import {
  ProofPreviewModal,
  type ProofPreviewItem,
} from "@/components/admin/ProofPreviewModal";
import { FinanceSubNav } from "./FinanceSubNav";

interface AssetsInventoryProps {
  summary: {
    cashBalance: number;
    totalInventoryValue?: number;
    totalAssetValue?: number;
    activeVehiclesCount?: number;
    assetsCount?: number;
  };
  assets: {
    items: Array<{
      id: string;
      name: string;
      category: string;
      purchaseDate: string | Date;
      purchaseCost: number;
      currentValue: number;
      condition: string;
      location?: string | null;
      notes?: string | null;
    }>;
    totalPurchaseCost: number;
    totalCurrentValue: number;
    totalItems: number;
  };
  supplies: {
    items: Array<{
      id: string;
      name: string;
      category: string;
      unit: string;
      currentStock: number;
      minStockAlert: number;
      costPerUnit: number;
      standardHppCharge: number;
      stockValue: number;
      isLowStock: boolean;
      location?: string | null;
      photoUrl?: string | null;
      receiptUrl?: string | null;
      notes?: string | null;
      usages: Array<{
        id: string;
        quantityUsed: number;
        unitCostAtUsage: number;
        chargedHppAmount: number;
        workshopMargin: number;
        serviceType?: string | null;
        usedDate: string | Date;
        notes?: string | null;
        vehicle: {
          id: string;
          plateNumber: string;
          brand: string;
          model: string;
        };
      }>;
    }>;
    totalStockValue: number;
    totalItemsInStock: number;
    lowStockCount: number;
    summary: {
      totalSuppliesCostUsed: number;
      totalHppChargedToVehicles: number;
      totalWorkshopMarginEarned: number;
    };
  };
  activeVehicles: Array<{
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
  }>;
}

const ASSET_CATEGORY_LABELS: Record<string, string> = {
  INSPECTION_TOOLS: "Peralatan Cek Fisik & Inspeksi",
  WORKSHOP_EQUIPMENT: "Peralatan Poles & Bengkel Garasi",
  OFFICE_ELECTRONICS: "Elektronik & Kasir Showroom",
  FACILITY_FURNITURE: "Fasilitas, Neon Box & Furniture",
  OPERATIONAL_VEHICLE: "Kendaraan Operasional / Kurir",
  OTHER: "Aset Tetap Lainnya",
};

const ASSET_CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  EXCELLENT: { label: "Sangat Baik (Prima)", color: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]" },
  GOOD: { label: "Baik (Normal)", color: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]" },
  FAIR: { label: "Cukup (Butuh Servis)", color: "bg-[var(--bg)] text-[var(--muted)] border-[var(--line)]" },
  DAMAGED: { label: "Rusak / Afkir", color: "bg-rose-50 text-rose-800 border-rose-200" },
};

const SUPPLY_CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  OIL_AND_FLUIDS: { label: "Pelumas & Oli", color: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]" },
  FAST_MOVING_PARTS: { label: "Filter & Bohlam Lampu", color: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]" },
  DETAILING_CHEMICALS: { label: "Chemical Salon & Poles", color: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]" },
  OTHER_SUPPLIES: { label: "Perlengkapan Lainnya", color: "bg-[var(--bg)] text-[var(--muted)] border-[var(--line)]" },
};

export function AssetsInventoryPageClient({
  summary,
  assets,
  supplies,
  activeVehicles,
}: AssetsInventoryProps) {
  const router = useRouter();
  // Main Tab State
  const [activeMainTab, setActiveMainTab] = useState<"SUPPLIES" | "ASSETS" | "HISTORY">("SUPPLIES");
  const [previewProof, setPreviewProof] = useState<ProofPreviewItem | null>(null);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedSupplyForUsage, setSelectedSupplyForUsage] = useState<any | null>(null);

  // Form State: Add Asset
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState<
    "INSPECTION_TOOLS" | "WORKSHOP_EQUIPMENT" | "OFFICE_ELECTRONICS" | "FACILITY_FURNITURE" | "OPERATIONAL_VEHICLE" | "OTHER"
  >("INSPECTION_TOOLS");
  const [assetPurchaseDate, setAssetPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [assetPurchaseCost, setAssetPurchaseCost] = useState("");
  const [assetCurrentValue, setAssetCurrentValue] = useState("");
  const [assetCondition, setAssetCondition] = useState<"EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED">("GOOD");
  const [assetLocation, setAssetLocation] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [assetDeductCash, setAssetDeductCash] = useState(false);

  // Form State: Add / Restock Supply
  const [supplyModalMode, setSupplyModalMode] = useState<"NEW" | "RESTOCK">("NEW");
  const [restockSupplyId, setRestockSupplyId] = useState("");
  const [supplyName, setSupplyName] = useState("");
  const [supplyCategory, setSupplyCategory] = useState<
    "OIL_AND_FLUIDS" | "FAST_MOVING_PARTS" | "DETAILING_CHEMICALS" | "OTHER_SUPPLIES"
  >("OIL_AND_FLUIDS");
  const [supplyUnit, setSupplyUnit] = useState("Galon");
  const [supplyStock, setSupplyStock] = useState("");
  const [supplyMinAlert, setSupplyMinAlert] = useState("2");
  const [supplyCostPerUnit, setSupplyCostPerUnit] = useState("");
  const [supplyStandardHpp, setSupplyStandardHpp] = useState("");
  const [supplyLocation, setSupplyLocation] = useState("Rak Gudang Garasi");
  const [supplyPhotoUrls, setSupplyPhotoUrls] = useState<string[]>([]);
  const [supplyReceiptUrls, setSupplyReceiptUrls] = useState<string[]>([]);
  const [supplyNotes, setSupplyNotes] = useState("");
  const [supplyDeductCash, setSupplyDeductCash] = useState(false);

  // Form State: Use Supply for Vehicle
  const [usageVehicleId, setUsageVehicleId] = useState(activeVehicles[0]?.id || "");
  const [usageQty, setUsageQty] = useState("1");
  const [usageHppCharged, setUsageHppCharged] = useState("500000");
  const [usageServiceType, setUsageServiceType] = useState<"GANTI_OLI" | "SALON_MANDIRI" | "GANTI_BOHLAM" | "LAINNYA">("GANTI_OLI");
  const [usageNotes, setUsageNotes] = useState("");

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Submit Asset
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetPurchaseCost) return;

    setLoading(true);
    const res = await createShowroomAsset(
      {
        name: assetName,
        category: assetCategory,
        purchaseDate: new Date(assetPurchaseDate),
        purchaseCost: Number(assetPurchaseCost),
        currentValue: assetCurrentValue ? Number(assetCurrentValue) : Number(assetPurchaseCost),
        condition: assetCondition,
        location: assetLocation,
        notes: assetNotes,
      },
      assetDeductCash
    );
    setLoading(false);

    if (res.success) {
      showNotification("Aset tetap showroom berhasil ditambahkan ke inventaris!", "success");
      setShowAssetModal(false);
      setAssetName("");
      setAssetPurchaseCost("");
      setAssetCurrentValue("");
      setAssetLocation("");
      setAssetNotes("");
      setAssetDeductCash(false);
    } else {
      showNotification(res.error || "Gagal menambah aset", "error");
    }
  };

  const openNewSupplyModal = () => {
    setSupplyModalMode("NEW");
    setRestockSupplyId(supplies.items[0]?.id || "");
    setSupplyName("");
    setSupplyStock("");
    setSupplyCostPerUnit("");
    setSupplyStandardHpp("");
    setSupplyPhotoUrls([]);
    setSupplyReceiptUrls([]);
    setSupplyNotes("");
    setSupplyDeductCash(false);
    setShowSupplyModal(true);
  };

  const openRestockModal = (item: AssetsInventoryProps["supplies"]["items"][number]) => {
    setSupplyModalMode("RESTOCK");
    setRestockSupplyId(item.id);
    setSupplyStock("");
    setSupplyCostPerUnit(String(item.costPerUnit));
    setSupplyStandardHpp(String(item.standardHppCharge));
    setSupplyPhotoUrls(item.photoUrl ? [item.photoUrl] : []);
    setSupplyReceiptUrls([]);
    setSupplyNotes("");
    setSupplyDeductCash(false);
    setShowSupplyModal(true);
  };

  // Submit Supply Create or Restock
  const handleSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const photoUrl = supplyPhotoUrls[0] || null;
    const receiptUrl = serializeProofUrls(supplyReceiptUrls);

    if (supplyModalMode === "RESTOCK") {
      if (!restockSupplyId || !supplyStock) return;
      setLoading(true);
      const res = await restockWorkshopSupplyAction(
        {
          supplyId: restockSupplyId,
          addedStock: Number(supplyStock),
          costPerUnit: supplyCostPerUnit ? Number(supplyCostPerUnit) : undefined,
          standardHppCharge: supplyStandardHpp ? Number(supplyStandardHpp) : undefined,
          photoUrl,
          receiptUrl,
          notes: supplyNotes,
        },
        supplyDeductCash
      );
      setLoading(false);

      if (res.success) {
        showNotification("Stok barang berhasil ditambahkan (restock)!", "success");
        setShowSupplyModal(false);
        router.refresh();
      } else {
        showNotification(res.error || "Gagal menambah stok", "error");
      }
      return;
    }

    if (!supplyName || !supplyCostPerUnit || !supplyStock) return;

    setLoading(true);
    const res = await createWorkshopSupplyAction(
      {
        name: supplyName,
        category: supplyCategory,
        unit: supplyUnit,
        currentStock: Number(supplyStock),
        minStockAlert: Number(supplyMinAlert) || 2,
        costPerUnit: Number(supplyCostPerUnit),
        standardHppCharge: supplyStandardHpp ? Number(supplyStandardHpp) : Number(supplyCostPerUnit),
        location: supplyLocation,
        photoUrl,
        receiptUrl,
        notes: supplyNotes,
      },
      supplyDeductCash
    );
    setLoading(false);

    if (res.success) {
      showNotification("Stok barang habis pakai berhasil ditambahkan ke gudang!", "success");
      setShowSupplyModal(false);
      setSupplyName("");
      setSupplyStock("");
      setSupplyCostPerUnit("");
      setSupplyStandardHpp("");
      setSupplyPhotoUrls([]);
      setSupplyReceiptUrls([]);
      setSupplyNotes("");
      setSupplyDeductCash(false);
      router.refresh();
    } else {
      showNotification(res.error || "Gagal menambah stok", "error");
    }
  };

  // Open Usage Modal
  const openUsageModal = (supply: any) => {
    setSelectedSupplyForUsage(supply);
    setUsageQty("1");
    setUsageHppCharged(String(supply.standardHppCharge || 500000));
    setUsageServiceType(
      supply.category === "DETAILING_CHEMICALS"
        ? "SALON_MANDIRI"
        : supply.category === "FAST_MOVING_PARTS"
        ? "GANTI_BOHLAM"
        : "GANTI_OLI"
    );
    setUsageNotes("");
    setShowUsageModal(true);
  };

  // Submit Usage to Vehicle
  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplyForUsage || !usageVehicleId) return;

    setLoading(true);
    const res = await recordSupplyUsageAction({
      supplyId: selectedSupplyForUsage.id,
      vehicleId: usageVehicleId,
      quantityUsed: Number(usageQty),
      chargedHppAmount: Number(usageHppCharged),
      serviceType: usageServiceType,
      notes: usageNotes,
    });
    setLoading(false);

    if (res.success) {
      showNotification(res.message || "Pemakaian berhasil dicatat ke mobil!", "success");
      setShowUsageModal(false);
      setSelectedSupplyForUsage(null);
    } else {
      showNotification(res.error || "Gagal mencatat pemakaian", "error");
    }
  };

  // Delete Handlers
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Hapus aset "${name}" dari inventaris?`)) return;
    setLoading(true);
    const res = await deleteShowroomAsset(id);
    setLoading(false);
    if (res.success) {
      showNotification(`Aset "${name}" berhasil dihapus.`, "success");
    } else {
      showNotification(res.error || "Gagal menghapus aset", "error");
    }
  };

  const handleDeleteSupply = async (id: string, name: string) => {
    if (!confirm(`Hapus barang "${name}" dari gudang bahan?`)) return;
    setLoading(true);
    const res = await deleteWorkshopSupplyAction(id);
    setLoading(false);
    if (res.success) {
      showNotification(`Barang "${name}" berhasil dihapus dari persediaan.`, "success");
    } else {
      showNotification(res.error || "Gagal menghapus barang", "error");
    }
  };

  // Filtered lists
  const filteredAssets = assets.items.filter((item) => {
    const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredSupplies = supplies.items.filter((item) => {
    const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Flatten all usages for History Tab
  const allHistoryUsages = supplies.items.flatMap((s) =>
    s.usages.map((u) => ({
      ...u,
      supplyName: s.name,
      supplyUnit: s.unit,
      costPerUnit: s.costPerUnit,
    }))
  ).sort((a, b) => new Date(b.usedDate).getTime() - new Date(a.usedDate).getTime());

  // Kalkulasi preview selisih pada modal usage
  const modalQtyNum = Number(usageQty) || 1;
  const modalCostTotal = selectedSupplyForUsage ? selectedSupplyForUsage.costPerUnit * modalQtyNum : 0;
  const modalHppNum = Number(usageHppCharged) || 0;
  const modalMarginNum = modalHppNum - modalCostTotal;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm transition-all",
            feedback.type === "success"
              ? "bg-[var(--bg)] border-[var(--line)] text-[var(--ok)]"
              : "bg-[var(--bg)] border-[var(--bad)]/30 text-[var(--bad)]"
          )}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}



      {/* ── 4 KPI CARDS: LENGKAP DENGAN STOK HABIS PAKAI & MARGIN JASA ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Stok Mobil (Dagangan) */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">1. Stok Mobil (Dagangan)</span>
            <Car className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(summary.totalInventoryValue || 0)}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {summary.activeVehiclesCount || 0} unit aktif (perputaran cepat)
          </p>
        </div>

        {/* 2. Stok Barang Habis Pakai (Gudang Bahan) */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">2. Stok Bahan Habis Pakai</span>
            <Droplet className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(supplies.totalStockValue)}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {supplies.totalItemsInStock} item fisik oli, filter &amp; salon di garasi
          </p>
        </div>

        {/* 3. Aset Tetap Showroom (Alat) */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">3. Aset Tetap (Peralatan)</span>
            <Wrench className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(assets.totalCurrentValue)}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {assets.totalItems} alat kerja permanen (mesin poles, scanner, dll)
          </p>
        </div>

        {/* 4. Laba Keringat Jasa Mandiri Showroom */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">4. Laba Jasa Garasi Mandiri</span>
            <Coins className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--accent)] tracking-tight">
            +{formatRupiah(supplies.summary.totalWorkshopMarginEarned)}
          </div>
          <p className="text-xs text-[var(--muted)] font-medium">
            Keringat jasa sendiri (masuk kantong showroom)
          </p>
        </div>
      </div>

      {/* ── EDUKASI 3 PILAR KEKAYAAN SHOWROOM ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--ink)]">
            <Car className="w-4 h-4 text-[var(--accent)]" />
            <span>Stok Mobil (Aset Lancar)</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Unit dagangan yang dibeli lelang/langsung untuk <strong>segera dijual kembali</strong>. Nilainya dicatat dari <strong>HPP (Beli + Servis/Salon)</strong> dan langsung cair menjadi kas setelah laku.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--ink)]">
            <Droplet className="w-4 h-4 text-[var(--accent)]" />
            <span>Bahan Habis Pakai (Supplies)</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Persediaan oli, filter, bohlam, dan chemical salon. Saat dipakai sendiri ke mobil (misal ganti oli Rp 500rb), <strong>stok terpotong, HPP mobil naik, dan selisihnya menjadi laba jasa showroom Anda!</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--ink)]">
            <Wrench className="w-4 h-4 text-[var(--accent)]" />
            <span>Aset Tetap (Peralatan Kerja)</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Peralatan garasi yang <strong>tidak habis dan tidak dijual</strong> (Mesin Poles Shinemate, Scanner OBD2, Paint Gauge, Dongkrak Buaya, Neon Box). Memiliki masa pakai lama &amp; nilai bukunya menyusut.
          </p>
        </div>
      </div>

      {/* ── MAIN TAB BUTTONS ── */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
        <button
          onClick={() => {
            setActiveMainTab("SUPPLIES");
            setCategoryFilter("ALL");
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2",
            activeMainTab === "SUPPLIES"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Droplet className="w-4 h-4" />
          <span>Stok Bahan Habis Pakai ({supplies.items.length})</span>
          {supplies.lowStockCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
              {supplies.lowStockCount} Menipis
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveMainTab("ASSETS");
            setCategoryFilter("ALL");
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2",
            activeMainTab === "ASSETS"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>Aset Tetap &amp; Peralatan ({assets.totalItems})</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab("HISTORY");
            setCategoryFilter("ALL");
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2",
            activeMainTab === "HISTORY"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Alokasi ke Mobil ({allHistoryUsages.length})</span>
        </button>
      </div>

      {/* ── TOOLBAR / ACTION BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeMainTab === "SUPPLIES"
                ? "Cari oli, filter, compound, sabun cuci..."
                : activeMainTab === "ASSETS"
                ? "Cari nama alat, lokasi, catatan..."
                : "Cari riwayat pemakaian ke mobil..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--line)] rounded-xl text-xs sm:text-sm bg-[var(--bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {activeMainTab === "SUPPLIES" && (
            <button
              onClick={openNewSupplyModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[#92400E] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Beli / Restock Bahan Baru</span>
            </button>
          )}

          {activeMainTab === "ASSETS" && (
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--ink)] hover:bg-[#44403C] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Aset Tetap</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: STOK BARANG HABIS PAKAI (SUPPLIES) ── */}
      {activeMainTab === "SUPPLIES" && (
        <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] font-bold uppercase text-[10px] sm:text-xs">
                  <th className="py-3 px-4">Nama Barang &amp; Lokasi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Sisa Stok Fisik</th>
                  <th className="py-3 px-4 text-right">Modal Beli / Satuan</th>
                  <th className="py-3 px-4 text-right">Standar HPP Alokasi</th>
                  <th className="py-3 px-4 text-right">Total Nilai Stok</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--muted)]">
                      Belum ada stok barang habis pakai yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredSupplies.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg)]/60 transition-colors">
                      {/* Nama & Lokasi + Foto Produk & Nota */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          {item.photoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewProof({
                                  url: item.photoUrl!,
                                  title: `Foto Produk • ${item.name}`,
                                  subtitle: `${item.location || "Rak Gudang Garasi"} • Stok: ${item.currentStock} ${item.unit}`,
                                })
                              }
                              className="w-11 h-11 rounded-xl border border-[var(--line)] overflow-hidden shrink-0 bg-[var(--bg)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                              title="Klik untuk memperbesar foto produk"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-11 h-11 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--muted)] shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-bold text-[var(--ink)]">{item.name}</div>
                            <div className="text-[11px] text-[var(--muted)] mt-0.5">
                              📍 {item.location || "Rak Gudang Garasi"}
                            </div>
                            {item.notes && (
                              <div className="text-[10px] text-[#92400E] mt-0.5 italic">{item.notes}</div>
                            )}
                            {(() => {
                              const receipts = parseProofUrls(item.receiptUrl);
                              if (receipts.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {receipts.map((url, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() =>
                                        setPreviewProof({
                                          url,
                                          title:
                                            receipts.length > 1
                                              ? `Nota Beli #${idx + 1} • ${item.name}`
                                              : `Nota Beli • ${item.name}`,
                                          subtitle: `Modal: ${formatRupiah(item.costPerUnit)} / ${item.unit}`,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[var(--line)] hover:border-[var(--accent)] text-[10px] font-semibold text-[var(--ink)] cursor-pointer"
                                    >
                                      <Paperclip className="w-2.5 h-2.5 text-[var(--accent)]" />
                                      <span>{receipts.length > 1 ? `Nota #${idx + 1}` : "Lihat Nota"}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                            SUPPLY_CATEGORY_LABELS[item.category]?.color || "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
                          )}
                        >
                          {SUPPLY_CATEGORY_LABELS[item.category]?.label || item.category}
                        </span>
                      </td>

                      {/* Sisa Stok */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="inline-flex items-center gap-1.5 font-black text-sm text-[var(--ink)]">
                          <span>{item.currentStock}</span>
                          <span className="text-xs font-normal text-[var(--muted)]">{item.unit}</span>
                        </div>
                        {item.isLowStock && (
                          <div className="text-[10px] font-bold text-red-600 mt-0.5 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Stok Menipis!</span>
                          </div>
                        )}
                      </td>

                      {/* Modal Beli per Satuan */}
                      <td className="py-3.5 px-4 align-top text-right text-xs text-[var(--muted)]">
                        {formatRupiah(item.costPerUnit)}
                      </td>

                      {/* Standar HPP Alokasi ke Mobil */}
                      <td className="py-3.5 px-4 align-top text-right font-bold text-[var(--accent)]">
                        {formatRupiah(item.standardHppCharge)}
                        <div className="text-[10px] text-[var(--accent)] font-semibold mt-0.5">
                          Jasa: +{formatRupiah(item.standardHppCharge - item.costPerUnit)}
                        </div>
                      </td>

                      {/* Total Nilai Stok */}
                      <td className="py-3.5 px-4 align-top text-right font-black text-[var(--ink)]">
                        {formatRupiah(item.stockValue)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => openUsageModal(item)}
                            disabled={item.currentStock <= 0}
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[#92400E] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                            title="Gunakan untuk servis mandiri mobil tertentu"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Pakai ke Mobil</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openRestockModal(item)}
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[var(--ink)] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Tambah stok (restock) barang ini beserta lampiran nota baru"
                          >
                            <Plus className="w-3 h-3 text-[var(--accent)]" />
                            <span>Restock</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSupply(item.id, item.name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Hapus barang"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: ASET TETAP SHOWROOM (ALAT) ── */}
      {activeMainTab === "ASSETS" && (
        <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] font-bold uppercase text-[10px] sm:text-xs">
                  <th className="py-3 px-4">Nama Barang &amp; Lokasi</th>
                  <th className="py-3 px-4">Kategori Aset</th>
                  <th className="py-3 px-4">Kondisi Alat</th>
                  <th className="py-3 px-4 text-right">Harga Beli Awal</th>
                  <th className="py-3 px-4 text-right">Nilai Buku Saat Ini</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                      Belum ada aset tetap yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg)]/60 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-[var(--ink)]">{item.name}</div>
                        <div className="text-[11px] text-[var(--muted)] mt-0.5">
                          Beli: {formatDate(item.purchaseDate)} • Lokasi: {item.location || "Showroom"}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-[var(--muted)] mt-0.5 italic">{item.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs text-[var(--ink)]">
                        {ASSET_CATEGORY_LABELS[item.category] || item.category}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                            ASSET_CONDITION_LABELS[item.condition]?.color || "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
                          )}
                        >
                          {ASSET_CONDITION_LABELS[item.condition]?.label || item.condition}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right text-xs text-[var(--muted)]">
                        {formatRupiah(item.purchaseCost)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right font-black text-[var(--ink)]">
                        {formatRupiah(item.currentValue)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-center">
                        <button
                          onClick={() => handleDeleteAsset(item.id, item.name)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Hapus aset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: RIWAYAT PEMAKAIAN KE MOBIL & LABA JASA GARASI ── */}
      {activeMainTab === "HISTORY" && (
        <div className="space-y-4">
          <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <div>
              <span className="font-bold block text-sm mb-0.5 text-[var(--ink)]">Ringkasan Laba Efisiensi Servis Mandiri Garasi</span>
              <span>
                Total bahan fisik terpakai: <strong className="text-[var(--ink)]">{formatRupiah(supplies.summary.totalSuppliesCostUsed)}</strong>.
                Total HPP yang dibebankan ke mobil: <strong className="text-[var(--ink)]">{formatRupiah(supplies.summary.totalHppChargedToVehicles)}</strong>.
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider block font-semibold text-[var(--muted)]">Total Laba Jasa Showroom</span>
              <span className="text-xl font-black text-[var(--accent)]">
                +{formatRupiah(supplies.summary.totalWorkshopMarginEarned)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] font-bold uppercase text-[10px] sm:text-xs">
                    <th className="py-3 px-4">Tanggal &amp; Mobil Target</th>
                    <th className="py-3 px-4">Jenis Servis &amp; Bahan Dipakai</th>
                    <th className="py-3 px-4 text-right">Modal Bahan Fisik</th>
                    <th className="py-3 px-4 text-right">HPP Masuk ke Mobil</th>
                    <th className="py-3 px-4 text-right">Laba Jasa Showroom</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {allHistoryUsages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                        Belum ada riwayat alokasi pemakaian bahan ke mobil.
                      </td>
                    </tr>
                  ) : (
                    allHistoryUsages.map((usage) => (
                      <tr key={usage.id} className="hover:bg-[var(--bg)]/60 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-[var(--ink)]">{usage.vehicle.plateNumber}</div>
                          <div className="text-[11px] text-[var(--muted)]">
                            {usage.vehicle.brand} {usage.vehicle.model}
                          </div>
                          <div className="text-[10px] text-[#8C827A] mt-0.5">{formatDate(usage.usedDate)}</div>
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] mb-1">
                            {usage.serviceType === "SALON_MANDIRI"
                              ? "Salon / Detailing Mandiri"
                              : usage.serviceType === "GANTI_BOHLAM"
                              ? "Ganti Lampu / Fast Moving"
                              : "Ganti Oli & Servis Mandiri"}
                          </span>
                          <div className="text-xs font-semibold text-[var(--ink)]">
                            {usage.quantityUsed} {usage.supplyUnit} {usage.supplyName}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top text-right text-xs text-[var(--muted)]">
                          {formatRupiah(usage.unitCostAtUsage)}
                        </td>

                        <td className="py-3.5 px-4 align-top text-right font-bold text-[var(--ink)]">
                          {formatRupiah(usage.chargedHppAmount)}
                        </td>

                        <td className="py-3.5 px-4 align-top text-right font-black text-[var(--accent)]">
                          +{formatRupiah(usage.workshopMargin)}
                        </td>

                        <td className="py-3.5 px-4 align-top text-xs text-[var(--muted)]">
                          {usage.notes || "Pengerjaan mandiri di garasi showroom"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: ALOKASI / PAKAI BAHAN KE MOBIL (DIY SERVICE) ── */}
      {showUsageModal && selectedSupplyForUsage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--line)] space-y-4">
            <div className="border-b border-[var(--bg)] pb-3 flex items-center gap-3">
              {selectedSupplyForUsage.photoUrl && (
                <div className="w-12 h-12 rounded-xl border border-[var(--line)] overflow-hidden shrink-0 bg-[var(--bg)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSupplyForUsage.photoUrl}
                    alt={selectedSupplyForUsage.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Pengerjaan Servis Mandiri di Garasi
                </span>
                <h3 className="text-lg font-black text-[var(--ink)] mt-0.5 truncate">
                  Gunakan {selectedSupplyForUsage.name}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Stok tersedia saat ini: <strong>{selectedSupplyForUsage.currentStock} {selectedSupplyForUsage.unit}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleUsageSubmit} className="space-y-4">
              {/* Pilih Mobil Target */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Pilih Mobil yang Dikerjakan *
                </label>
                <select
                  required
                  value={usageVehicleId}
                  onChange={(e) => setUsageVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs sm:text-sm font-semibold text-[var(--ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.brand} {v.model} ({v.year})
                    </option>
                  ))}
                </select>
              </div>

              {/* Jumlah Barang & Jenis Pengerjaan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Jumlah Dipakai ({selectedSupplyForUsage.unit}) *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={selectedSupplyForUsage.currentStock}
                    value={usageQty}
                    onChange={(e) => setUsageQty(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-sm font-bold text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Jenis Servis
                  </label>
                  <select
                    value={usageServiceType}
                    onChange={(e) => setUsageServiceType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs font-semibold text-[var(--ink)]"
                  >
                    <option value="GANTI_OLI">Ganti Oli Mandiri</option>
                    <option value="SALON_MANDIRI">Salon &amp; Poles Mandiri</option>
                    <option value="GANTI_BOHLAM">Ganti Bohlam / Fast Moving</option>
                    <option value="LAINNYA">Servis Ringan Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Nilai HPP yang Dibebankan ke Mobil */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Nilai HPP yang Dibebankan ke Mobil (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)]">
                    Rp
                  </span>
                  <input
                    required
                    type="number"
                    value={usageHppCharged}
                    onChange={(e) => setUsageHppCharged(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--line)] text-sm font-black text-[var(--accent)]"
                  />
                </div>
                <span className="text-[11px] text-[var(--muted)] mt-1 block">
                  Nilai ini otomatis masuk ke HPP modal mobil dan ditarik kembali saat mobil laku terjual.
                </span>
              </div>

              {/* ── LIVE PREVIEW SELISIH KEUNTUNGAN SHOWROOM ── */}
              <div className="p-3.5 rounded-xl bg-white border border-[var(--line)] shadow-xs space-y-1.5 text-xs text-[var(--muted)]">
                <div className="flex justify-between items-center">
                  <span>Modal Fisik Bahan Terpakai:</span>
                  <span className="font-semibold text-[var(--ink)]">{formatRupiah(modalCostTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Nilai HPP Masuk ke Mobil:</span>
                  <span className="font-bold text-[var(--ink)]">{formatRupiah(modalHppNum)}</span>
                </div>
                <div className="border-t border-[var(--line)] pt-1.5 flex justify-between items-center font-bold text-sm">
                  <span className="text-[var(--ink)]">Upah Jasa Mandiri Showroom:</span>
                  <span className="text-[var(--accent)] font-black">+{formatRupiah(modalMarginNum)}</span>
                </div>
                <p className="text-[10px] text-[var(--muted)] pt-0.5">
                  💡 Selisih Rp {modalMarginNum.toLocaleString("id-ID")} ini adalah upah keringat kerja mandiri Anda yang murni menjadi keuntungan showroom (tidak dibagi ke investor)!
                </p>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Ganti oli mesin + bersihkan filter udara"
                  value={usageNotes}
                  onChange={(e) => setUsageNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUsageModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[#92400E] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Terapkan ke Mobil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: TAMBAH / RESTOCK BARANG HABIS PAKAI ── */}
      {showSupplyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowSupplyModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[var(--line)] space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--bg)] pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Gudang Persediaan Garasi
                </span>
                <h3 className="text-lg font-black text-[var(--ink)] mt-0.5">
                  {supplyModalMode === "RESTOCK"
                    ? "Restock Stok Bahan yang Sudah Ada"
                    : "Beli / Tambah Stok Bahan Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupplyModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {supplies.items.length > 0 && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => {
                    setSupplyModalMode("NEW");
                    setSupplyPhotoUrls([]);
                    setSupplyReceiptUrls([]);
                  }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    supplyModalMode === "NEW"
                      ? "bg-white text-[var(--ink)] shadow-2xs border border-[var(--line)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  )}
                >
                  + Barang Baru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const first =
                      supplies.items.find((s) => s.id === restockSupplyId) || supplies.items[0];
                    if (first) openRestockModal(first);
                  }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    supplyModalMode === "RESTOCK"
                      ? "bg-white text-[var(--accent)] shadow-2xs border border-[var(--line)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  )}
                >
                  Restock Barang Eksisting
                </button>
              </div>
            )}

            <form onSubmit={handleSupplySubmit} className="space-y-3.5">
              {supplyModalMode === "RESTOCK" ? (
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    Pilih Barang yang Mau Di-restock *
                  </label>
                  <select
                    required
                    value={restockSupplyId}
                    onChange={(e) => {
                      const picked = supplies.items.find((s) => s.id === e.target.value);
                      setRestockSupplyId(e.target.value);
                      if (picked) {
                        setSupplyCostPerUnit(String(picked.costPerUnit));
                        setSupplyStandardHpp(String(picked.standardHppCharge));
                        setSupplyPhotoUrls(picked.photoUrl ? [picked.photoUrl] : []);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-semibold bg-white"
                  >
                    {supplies.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Sisa stok: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                      Nama Barang / Part *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Oli Mesin Shell Helix HX7 10W-40, Filter Oli Brio, Compound 3M"
                      value={supplyName}
                      onChange={(e) => setSupplyName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kategori *</label>
                      <select
                        value={supplyCategory}
                        onChange={(e) => setSupplyCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                      >
                        <option value="OIL_AND_FLUIDS">Pelumas &amp; Oli</option>
                        <option value="FAST_MOVING_PARTS">Filter &amp; Bohlam Lampu</option>
                        <option value="DETAILING_CHEMICALS">Chemical Salon &amp; Poles</option>
                        <option value="OTHER_SUPPLIES">Perlengkapan Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ink)] mb-1">Satuan Barang</label>
                      <select
                        value={supplyUnit}
                        onChange={(e) => setSupplyUnit(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                      >
                        <option value="Galon">Galon (4L)</option>
                        <option value="Pcs">Pcs / Buah</option>
                        <option value="Botol">Botol (1L)</option>
                        <option value="Jerigen">Jerigen (5L)</option>
                        <option value="Liter">Liter</option>
                        <option value="Set">Set</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {supplyModalMode === "RESTOCK" ? "Tambah Jumlah Stok *" : "Jumlah Beli (Stok) *"}
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="Contoh: 10"
                    value={supplyStock}
                    onChange={(e) => setSupplyStock(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  />
                </div>

                {supplyModalMode === "NEW" ? (
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                      Batas Alert Menipis
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={supplyMinAlert}
                      onChange={(e) => setSupplyMinAlert(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">Catatan Restock</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tambah beli dari toko rekanan"
                      value={supplyNotes}
                      onChange={(e) => setSupplyNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    Harga Modal Beli / Satuan *
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="280000"
                    value={supplyCostPerUnit}
                    onChange={(e) => setSupplyCostPerUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    Standar HPP Alokasi ke Mobil
                  </label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={supplyStandardHpp}
                    onChange={(e) => setSupplyStandardHpp(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--accent)]"
                  />
                </div>
              </div>

              {supplyModalMode === "NEW" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">Lokasi Simpan</label>
                    <input
                      type="text"
                      value={supplyLocation}
                      onChange={(e) => setSupplyLocation(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">Catatan</label>
                    <input
                      type="text"
                      placeholder="Grosir toko oli rekanan"
                      value={supplyNotes}
                      onChange={(e) => setSupplyNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Foto Produk & Lampiran Nota */}
              <div className="space-y-3 pt-1 border-t border-[var(--line)]">
                <ProofUploadField
                  label="Foto Produk / Kemasan Barang (Opsional — Biar Mudah Dikenali)"
                  value={supplyPhotoUrls}
                  onChange={(urls) => setSupplyPhotoUrls(urls.slice(0, 1))}
                  uploadType="DOCUMENT"
                  helperText="Upload 1 foto kemasan/botol produk agar mekanik & admin mudah membedakan barang (JPG/PNG/WEBP)"
                />
                <ProofUploadField
                  label="Lampiran Nota / Struk Pembelian (Opsional)"
                  value={supplyReceiptUrls}
                  onChange={setSupplyReceiptUrls}
                  uploadType="RECEIPT"
                  helperText="Bisa upload foto nota toko atau PDF invoice pembelian stok"
                />
              </div>

              {/* Potong Kas */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                <input
                  type="checkbox"
                  id="supplyDeductCash"
                  checked={supplyDeductCash}
                  onChange={(e) => setSupplyDeductCash(e.target.checked)}
                  className="rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label htmlFor="supplyDeductCash" className="text-xs text-[var(--ink)] cursor-pointer">
                  Catat pengeluaran kas sekarang (Total: {formatRupiah(Number(supplyStock || 0) * Number(supplyCostPerUnit || 0))})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[#92400E] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? "Menyimpan..."
                    : supplyModalMode === "RESTOCK"
                    ? "Tambah Stok (Restock)"
                    : "Simpan Stok Bahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: TAMBAH ASET TETAP ── */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--line)] space-y-4">
            <div className="border-b border-[var(--bg)] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Inventaris Tetap Showroom
              </span>
              <h3 className="text-lg font-black text-[var(--ink)] mt-0.5">
                Tambah Peralatan / Aset Tetap
              </h3>
            </div>

            <form onSubmit={handleAssetSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nama Peralatan / Aset *</label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Mesin Poles Shinemate EX620, Scanner OBD2"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kategori Aset *</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  >
                    <option value="INSPECTION_TOOLS">Peralatan Cek Fisik &amp; Inspeksi</option>
                    <option value="WORKSHOP_EQUIPMENT">Peralatan Poles &amp; Bengkel Garasi</option>
                    <option value="OFFICE_ELECTRONICS">Elektronik &amp; Kasir Showroom</option>
                    <option value="FACILITY_FURNITURE">Fasilitas, Neon Box &amp; Furniture</option>
                    <option value="OPERATIONAL_VEHICLE">Kendaraan Operasional / Kurir</option>
                    <option value="OTHER">Aset Tetap Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kondisi Saat Ini</label>
                  <select
                    value={assetCondition}
                    onChange={(e) => setAssetCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  >
                    <option value="EXCELLENT">Sangat Baik (Prima)</option>
                    <option value="GOOD">Baik (Normal)</option>
                    <option value="FAIR">Cukup (Butuh Servis)</option>
                    <option value="DAMAGED">Rusak / Afkir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Harga Beli Awal (Rp) *</label>
                  <input
                    required
                    type="number"
                    placeholder="3500000"
                    value={assetPurchaseCost}
                    onChange={(e) => setAssetPurchaseCost(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nilai Buku Taksiran (Rp)</label>
                  <input
                    type="number"
                    placeholder="Kosongkan jika sama dengan harga beli"
                    value={assetCurrentValue}
                    onChange={(e) => setAssetCurrentValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tanggal Beli</label>
                  <input
                    type="date"
                    value={assetPurchaseDate}
                    onChange={(e) => setAssetPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Lokasi Penyimpanan</label>
                  <input
                    type="text"
                    placeholder="Koper Inspeksi / Meja Kasir"
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">Catatan Aset</label>
                <input
                  type="text"
                  placeholder="Nomor seri, kelengkapan adaptor, atau garansi"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                <input
                  type="checkbox"
                  id="assetDeductCash"
                  checked={assetDeductCash}
                  onChange={(e) => setAssetDeductCash(e.target.checked)}
                  className="rounded border-[var(--line)] text-[var(--ink)] focus:ring-[var(--ink)]"
                />
                <label htmlFor="assetDeductCash" className="text-xs text-[var(--ink)] cursor-pointer">
                  Catat pengeluaran kas pembelian aset sekarang ({formatRupiah(Number(assetPurchaseCost) || 0)})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[var(--ink)] hover:bg-[#44403C] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan Aset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Pratinjau Foto Produk / Nota Pembelian */}
      <ProofPreviewModal preview={previewProof} onClose={() => setPreviewProof(null)} />
    </div>
  );
}
