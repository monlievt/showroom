"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Car, 
  ClipboardCheck, 
  ReceiptText, 
  Wallet, 
  Coins,
  ExternalLink, 
  ShieldCheck,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Split,
  Wrench,
  Users,
  Clock,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

interface AdminSidebarProps {
  userRole?: "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR";
  userName?: string;
}

export function AdminSidebar({
  userRole = "ADMIN",
  userName = "Owner Nur Mobil",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Peran Pengguna (RBAC)
  const isOwner = userRole === "OWNER" || userRole === "ADMIN";
  const isStaff = userRole === "STAFF_ADMIN";
  const isSales = userRole === "SALES";

  // Submenu accordion states
  const [financeOpen, setFinanceOpen] = useState(true);
  const [investorOpen, setInvestorOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("nur_mobil_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("nur_mobil_sidebar_collapsed", String(nextState));
  };

  const isFinanceActive = pathname.startsWith("/admin/finance");
  const isInvestorActive = pathname.startsWith("/admin/investors");

  return (
    <aside
      className={cn(
        "border-r border-[#D9D4CB] bg-[#EFECE8] flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 select-none",
        isCollapsed ? "w-20" : "w-64 lg:w-72"
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          className={cn(
            "border-b border-[#D9D4CB] flex items-center justify-between transition-all",
            isCollapsed ? "p-3 flex-col gap-2" : "p-4 sm:p-5"
          )}
        >
          <Link
            href="/admin"
            className="flex items-center gap-3 group overflow-hidden"
            title="Nur Mobil Admin"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D97706] flex items-center justify-center text-white font-black text-xl shadow-sm transition-transform group-hover:scale-105 shrink-0">
              N
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="font-extrabold text-base text-[#1C1917] tracking-tight block truncate">
                  Nur Mobil
                </span>
                <span className="text-[11px] text-[#6B6560] block font-medium truncate">
                  Operasional & Transparansi
                </span>
              </div>
            )}
          </Link>

          {/* Toggle Collapse Button */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-[#6B6560] hover:text-[#1C1917] hover:bg-[#D9D4CB]/60 transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? "Perlebar Sidebar (Expand)" : "Ciutkan Sidebar (Collapse)"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#D97706]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-[#6B6560]" />
            )}
          </button>
        </div>

        {/* Navigation Items (Scrollable if tall) */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B6560]">
              {isSales ? "Menu Sales" : "Menu Operasional"}
            </div>
          )}

          {/* 0. Dashboard Utama (Owner & Staff Admin) */}
          {!isSales && (
            <Link
              href="/admin"
              title={isCollapsed ? "Dashboard Utama" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                pathname === "/admin"
                  ? "bg-[#D97706] text-white shadow-sm font-semibold"
                  : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                isCollapsed && "justify-center px-0"
              )}
            >
              <LayoutDashboard
                className={cn(
                  "w-4 h-4 shrink-0",
                  pathname === "/admin" ? "text-white" : "text-[#6B6560] group-hover:text-[#1C1917]"
                )}
              />
              {!isCollapsed && <span className="truncate">Dashboard Utama</span>}
            </Link>
          )}

          {/* 1. Inventori Unit (Semua Role: Owner, Staff, Sales) */}
          <Link
            href="/admin/inventory"
            title={isCollapsed ? "Inventori Unit" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              pathname.startsWith("/admin/inventory")
                ? "bg-[#D97706] text-white shadow-sm font-semibold"
                : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
              isCollapsed && "justify-center px-0"
            )}
          >
            <Car
              className={cn(
                "w-4 h-4 shrink-0",
                pathname.startsWith("/admin/inventory") ? "text-white" : "text-[#6B6560] group-hover:text-[#1C1917]"
              )}
            />
            {!isCollapsed && (
              <span className="truncate">
                {isSales ? "Katalog Stok Ready" : "Inventori Unit"}
              </span>
            )}
          </Link>

          {/* 2. Cek Fisik & Inspeksi (Owner & Staff) */}
          {!isSales && (
            <Link
              href="/admin/inspections"
              title={isCollapsed ? "Cek Fisik & Inspeksi" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                pathname.startsWith("/admin/inspections")
                  ? "bg-[#D97706] text-white shadow-sm font-semibold"
                  : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                isCollapsed && "justify-center px-0"
              )}
            >
              <ClipboardCheck
                className={cn(
                  "w-4 h-4 shrink-0",
                  pathname.startsWith("/admin/inspections") ? "text-white" : "text-[#6B6560] group-hover:text-[#1C1917]"
                )}
              />
              {!isCollapsed && <span className="truncate">Cek Fisik & Inspeksi</span>}
            </Link>
          )}

          {/* 3. Gudang Bahan & Alat Garasi (Owner & Staff) */}
          {!isSales && (
            <Link
              href="/admin/workshop"
              title={isCollapsed ? "Gudang Bahan & Alat Garasi" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                pathname.startsWith("/admin/workshop")
                  ? "bg-[#D97706] text-white shadow-sm font-semibold"
                  : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Wrench
                className={cn(
                  "w-4 h-4 shrink-0",
                  pathname.startsWith("/admin/workshop") ? "text-white" : "text-[#6B6560] group-hover:text-[#1C1917]"
                )}
              />
              {!isCollapsed && <span className="truncate">Gudang Bahan &amp; Alat</span>}
            </Link>
          )}

          {/* 4. Penjualan & Piutang (Owner & Staff) */}
          {!isSales && (
            <Link
              href="/admin/sales"
              title={isCollapsed ? "Penjualan & Piutang" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                pathname.startsWith("/admin/sales")
                  ? "bg-[#D97706] text-white shadow-sm font-semibold"
                  : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                isCollapsed && "justify-center px-0"
              )}
            >
              <ReceiptText
                className={cn(
                  "w-4 h-4 shrink-0",
                  pathname.startsWith("/admin/sales") ? "text-white" : "text-[#6B6560] group-hover:text-[#1C1917]"
                )}
              />
              {!isCollapsed && <span className="truncate">Penjualan & Piutang</span>}
            </Link>
          )}

          {/* 5. Keuangan & Kas (HANYA OWNER / ADMIN) */}
          {isOwner && (
            <div>
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl transition-all",
                  isFinanceActive
                    ? isCollapsed
                      ? "bg-[#D97706] text-white"
                      : "bg-[#D97706]/10 text-[#D97706] font-bold"
                    : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                  isCollapsed ? "justify-center" : "px-3 py-2"
                )}
              >
                <Link
                  href="/admin/finance"
                  title={isCollapsed ? "Keuangan & Kas" : undefined}
                  className={cn(
                    "flex items-center gap-3 text-sm flex-1",
                    isCollapsed && "p-2.5 justify-center"
                  )}
                >
                  <Wallet
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isFinanceActive
                        ? isCollapsed
                          ? "text-white"
                          : "text-[#D97706]"
                        : "text-[#6B6560]"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">Keuangan & Kas</span>}
                </Link>
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFinanceOpen(!financeOpen);
                    }}
                    className="p-1 rounded-md hover:bg-[#D9D4CB]/60 text-[#6B6560] cursor-pointer"
                    title="Buka/Tutup Submenu"
                  >
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        financeOpen && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Submenu Keuangan */}
              {!isCollapsed && financeOpen && (
                <div className="pl-6 pr-1 py-1 space-y-1 mt-0.5 border-l-2 border-[#D97706]/30 ml-4">
                  <Link
                    href="/admin/finance"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      pathname === "/admin/finance"
                        ? "bg-[#D97706] text-white font-semibold"
                        : "text-[#44403C] hover:bg-[#D9D4CB]/50"
                    )}
                  >
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Buku Kas & Mutasi</span>
                  </Link>

                  <Link
                    href="/admin/finance/expenses"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      pathname.startsWith("/admin/finance/expenses")
                        ? "bg-[#D97706] text-white font-semibold"
                        : "text-[#44403C] hover:bg-[#D9D4CB]/50"
                    )}
                  >
                    <Split className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Beban & Prive (BCA)</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 6. Investor & Bagi Hasil (HANYA OWNER / ADMIN) */}
          {isOwner && (
            <div>
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl transition-all",
                  isInvestorActive
                    ? isCollapsed
                      ? "bg-[#D97706] text-white"
                      : "bg-[#D97706]/10 text-[#D97706] font-bold"
                    : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                  isCollapsed ? "justify-center" : "px-3 py-2"
                )}
              >
                <Link
                  href="/admin/investors"
                  title={isCollapsed ? "Investor & Bagi Hasil" : undefined}
                  className={cn(
                    "flex items-center gap-3 text-sm flex-1",
                    isCollapsed && "p-2.5 justify-center"
                  )}
                >
                  <Coins
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isInvestorActive
                        ? isCollapsed
                          ? "text-white"
                          : "text-[#D97706]"
                        : "text-[#6B6560]"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">Investor & Bagi Hasil</span>}
                </Link>
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setInvestorOpen(!investorOpen);
                    }}
                    className="p-1 rounded-md hover:bg-[#D9D4CB]/60 text-[#6B6560] cursor-pointer"
                    title="Buka/Tutup Submenu"
                  >
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        investorOpen && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Submenu Investor */}
              {!isCollapsed && investorOpen && (
                <div className="pl-6 pr-1 py-1 space-y-1 mt-0.5 border-l-2 border-[#D97706]/30 ml-4">
                  <Link
                    href="/admin/investors"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      pathname === "/admin/investors"
                        ? "bg-[#D97706] text-white font-semibold"
                        : "text-[#44403C] hover:bg-[#D9D4CB]/50"
                    )}
                  >
                    <Coins className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unit Siap Bagi Hasil</span>
                  </Link>

                  <Link
                    href="/admin/investors/accounts"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      pathname.startsWith("/admin/investors/accounts")
                        ? "bg-[#D97706] text-white font-semibold"
                        : "text-[#44403C] hover:bg-[#D9D4CB]/50"
                    )}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Daftar Akun Investor</span>
                  </Link>

                  <Link
                    href="/admin/investors/history"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      pathname.startsWith("/admin/investors/history")
                        ? "bg-[#D97706] text-white font-semibold"
                        : "text-[#44403C] hover:bg-[#D9D4CB]/50"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Riwayat Distribusi Laba</span>
                  </Link>

                  <Link
                    href="/admin/investors/tier-rules"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      pathname.startsWith("/admin/investors/tier-rules")
                        ? "bg-[#D97706] text-white font-semibold"
                        : "text-[#44403C] hover:bg-[#D9D4CB]/50"
                    )}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Aturan Tier 4 Saudara</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 7. Sistem & Notifikasi (HANYA OWNER / ADMIN) */}
          {isOwner && (
            <Link
              href="/admin/settings"
              title={isCollapsed ? "Sistem & Notifikasi" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                pathname.startsWith("/admin/settings")
                  ? "bg-[#D97706] text-white shadow-sm font-semibold"
                  : "text-[#1C1917] hover:bg-[#D9D4CB]/50",
                isCollapsed && "justify-center px-0"
              )}
            >
              <ShieldCheck
                className={cn(
                  "w-4 h-4 shrink-0",
                  pathname.startsWith("/admin/settings") ? "text-white" : "text-[#6B6560] group-hover:text-[#1C1917]"
                )}
              />
              {!isCollapsed && <span className="truncate">Sistem & Notifikasi</span>}
            </Link>
          )}

          {/* Katalog Web Publik */}
          {!isCollapsed && (
            <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B6560]">
              Katalog Publik
            </div>
          )}
          <Link
            href="/katalog"
            target="_blank"
            title={isCollapsed ? "Buka Katalog Web" : undefined}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#1C1917] hover:bg-[#D9D4CB]/50 transition-colors group",
              isCollapsed && "justify-center px-0"
            )}
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-[#D97706] shrink-0" />
              {!isCollapsed && <span className="truncate">Buka Katalog Web</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-bold">
                Publik
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* User Session Footer */}
      <div
        className={cn(
          "border-t border-[#D9D4CB] bg-[#F7F5F2] flex items-center justify-between transition-all",
          isCollapsed ? "p-3 flex-col gap-3" : "p-3.5 sm:p-4"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
                {userName}
              </div>
              <div className="text-[11px] flex items-center gap-1 font-medium mt-0.5">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isOwner ? "bg-[#16A34A] animate-pulse" : isStaff ? "bg-blue-600" : "bg-amber-600"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    isOwner
                      ? "text-emerald-800 bg-emerald-100/80"
                      : isStaff
                      ? "text-blue-800 bg-blue-100/80"
                      : "text-amber-800 bg-amber-100/80"
                  )}
                >
                  {isOwner ? "👑 Owner Showroom" : isStaff ? "🔧 Staff Garasi" : "🎯 Tim Sales"}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => logoutAction()}
          title="Keluar (Logout)"
          className="p-1.5 rounded-lg text-[#6B6560] hover:text-red-600 hover:bg-[#EFECE8] transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
