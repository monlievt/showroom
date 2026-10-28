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
  Split, 
  Wrench, 
  Users, 
  Clock, 
  Sliders, 
  PanelLeftClose, 
  PanelLeftOpen, 
  LayoutDashboard, 
  History,
  Menu,
  X,
  BarChart3
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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Tutup drawer mobile secara otomatis ketika route berubah
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("nur_mobil_sidebar_collapsed", String(nextState));
  };

  const isFinanceActive = pathname.startsWith("/admin/finance");
  const isInvestorActive = pathname.startsWith("/admin/investors");

  const renderNavLinks = (collapsed: boolean, onLinkClick?: () => void) => (
    <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
      {!collapsed && (
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {isSales ? "Menu Sales" : "Menu Operasional"}
        </div>
      )}

      {/* 0. Dashboard Utama (Owner & Staff Admin) */}
      {!isSales && (
        <Link
          href="/admin"
          onClick={onLinkClick}
          title={collapsed ? "Dashboard Utama" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname === "/admin"
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <LayoutDashboard
            className={cn(
              "w-4 h-4 shrink-0",
              pathname === "/admin" ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Dashboard Utama</span>}
        </Link>
      )}

      {/* 1. Inventori Unit (Semua Role: Owner, Staff, Sales) */}
      <Link
        href="/admin/inventory"
        onClick={onLinkClick}
        title={collapsed ? "Inventori Unit" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
          pathname.startsWith("/admin/inventory")
            ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
            : "text-[var(--ink)] hover:bg-[var(--line)]/50",
          collapsed && "justify-center px-0"
        )}
      >
        <Car
          className={cn(
            "w-4 h-4 shrink-0",
            pathname.startsWith("/admin/inventory") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
          )}
        />
        {!collapsed && (
          <span className="truncate">
            {isSales ? "Katalog Stok Ready" : "Inventori Unit"}
          </span>
        )}
      </Link>

      {/* 2. Cek Fisik & Inspeksi (Owner & Staff) */}
      {!isSales && (
        <Link
          href="/admin/inspections"
          onClick={onLinkClick}
          title={collapsed ? "Cek Fisik & Inspeksi" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/inspections")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <ClipboardCheck
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/inspections") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Cek Fisik & Inspeksi</span>}
        </Link>
      )}

      {/* 3. Gudang Bahan & Alat Garasi (Owner & Staff) */}
      {!isSales && (
        <Link
          href="/admin/workshop"
          onClick={onLinkClick}
          title={collapsed ? "Gudang Bahan & Alat Garasi" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/workshop")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <Wrench
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/workshop") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Gudang Bahan &amp; Alat</span>}
        </Link>
      )}

      {/* 4. Penjualan & Piutang (Owner & Staff) */}
      {!isSales && (
        <Link
          href="/admin/sales"
          onClick={onLinkClick}
          title={collapsed ? "Penjualan & Piutang" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/sales")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <ReceiptText
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/sales") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Penjualan & Piutang</span>}
        </Link>
      )}

      {/* 4b. Arsip & Benchmark Toko Lama */}
      {!isSales && (
        <Link
          href="/admin/archive"
          onClick={onLinkClick}
          title={collapsed ? "Arsip & Benchmark" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/archive")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <History
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/archive") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Arsip & Benchmark</span>}
        </Link>
      )}

      {/* 4c. Analitik & Perputaran Unit */}
      {!isSales && (
        <Link
          href="/admin/analytics"
          onClick={onLinkClick}
          title={collapsed ? "Analitik & Perputaran" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/analytics")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <BarChart3
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/analytics") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Analitik &amp; Perputaran</span>}
        </Link>
      )}

      {/* 5. Keuangan & Kas (HANYA OWNER / ADMIN) */}
      {isOwner && (
        <div>
          <div
            className={cn(
              "flex items-center justify-between rounded-xl transition-all",
              isFinanceActive
                ? collapsed
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--accent)]/10 text-[var(--accent)] font-bold"
                : "text-[var(--ink)] hover:bg-[var(--line)]/50",
              collapsed ? "justify-center" : "px-3 py-2"
            )}
          >
            <Link
              href="/admin/finance"
              onClick={onLinkClick}
              title={collapsed ? "Keuangan & Kas" : undefined}
              className={cn(
                "flex items-center gap-3 text-sm flex-1",
                collapsed && "p-2.5 justify-center"
              )}
            >
              <Wallet
                className={cn(
                  "w-4 h-4 shrink-0",
                  isFinanceActive
                    ? collapsed
                      ? "text-white"
                      : "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                )}
              />
              {!collapsed && <span className="truncate">Keuangan & Kas</span>}
            </Link>
            {!collapsed && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setFinanceOpen(!financeOpen);
                }}
                className="p-1 rounded-md hover:bg-[var(--line)]/60 text-[var(--muted)] cursor-pointer"
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
          {!collapsed && financeOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 mt-0.5 border-l-2 border-[var(--accent)]/30 ml-4">
              <Link
                href="/admin/finance"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname === "/admin/finance"
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--line)]/50"
                )}
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Buku Kas & Mutasi</span>
              </Link>

              <Link
                href="/admin/finance/expenses"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname.startsWith("/admin/finance/expenses")
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--line)]/50"
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
                ? collapsed
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--accent)]/10 text-[var(--accent)] font-bold"
                : "text-[var(--ink)] hover:bg-[var(--line)]/50",
              collapsed ? "justify-center" : "px-3 py-2"
            )}
          >
            <Link
              href="/admin/investors"
              onClick={onLinkClick}
              title={collapsed ? "Investor & Bagi Hasil" : undefined}
              className={cn(
                "flex items-center gap-3 text-sm flex-1",
                collapsed && "p-2.5 justify-center"
              )}
            >
              <Coins
                className={cn(
                  "w-4 h-4 shrink-0",
                  isInvestorActive
                    ? collapsed
                      ? "text-white"
                      : "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                )}
              />
              {!collapsed && <span className="truncate">Investor & Bagi Hasil</span>}
            </Link>
            {!collapsed && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setInvestorOpen(!investorOpen);
                }}
                className="p-1 rounded-md hover:bg-[var(--line)]/60 text-[var(--muted)] cursor-pointer"
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
          {!collapsed && investorOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 mt-0.5 border-l-2 border-[var(--accent)]/30 ml-4">
              <Link
                href="/admin/investors"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname === "/admin/investors"
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--line)]/50"
                )}
              >
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Unit Siap Bagi Hasil</span>
              </Link>

              <Link
                href="/admin/investors/accounts"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname.startsWith("/admin/investors/accounts")
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--line)]/50"
                )}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Daftar Akun Investor</span>
              </Link>

              <Link
                href="/admin/investors/history"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname.startsWith("/admin/investors/history")
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--line)]/50"
                )}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Riwayat Distribusi Laba</span>
              </Link>

              <Link
                href="/admin/investors/tier-rules"
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pathname.startsWith("/admin/investors/tier-rules")
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--line)]/50"
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
          onClick={onLinkClick}
          title={collapsed ? "Sistem & Notifikasi" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/settings")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <ShieldCheck
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/settings") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Sistem & Notifikasi</span>}
        </Link>
      )}

      {/* 8. Manajemen Pengguna (HANYA OWNER / ADMIN) */}
      {isOwner && (
        <Link
          href="/admin/users"
          onClick={onLinkClick}
          title={collapsed ? "Kelola Pengguna" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname.startsWith("/admin/users")
              ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
              : "text-[var(--ink)] hover:bg-[var(--line)]/50",
            collapsed && "justify-center px-0"
          )}
        >
          <Users
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/admin/users") ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
            )}
          />
          {!collapsed && <span className="truncate">Kelola Pengguna</span>}
        </Link>
      )}

      {/* Katalog Web Publik */}
      {!collapsed && (
        <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Katalog Publik
        </div>
      )}
      <Link
        href="/katalog"
        target="_blank"
        title={collapsed ? "Buka Katalog Web" : undefined}
        className={cn(
          "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors group",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-3">
          <ExternalLink className="w-4 h-4 text-[var(--accent)] shrink-0" />
          {!collapsed && <span className="truncate">Buka Katalog Web</span>}
        </div>
        {!collapsed && (
          <span className="text-[10px] bg-white border border-[var(--line)] text-[var(--ink)] px-2 py-0.5 rounded-full font-bold shadow-2xs">
            Publik
          </span>
        )}
      </Link>
    </nav>
  );

  const renderUserFooter = (collapsed: boolean) => (
    <div
      className={cn(
        "border-t border-[var(--line)] bg-[var(--bg)] flex items-center justify-between transition-all",
        collapsed ? "p-3 flex-col gap-3" : "p-3.5 sm:p-4"
      )}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate">
              {userName}
            </div>
            <div className="text-[11px] flex items-center gap-1 font-medium mt-0.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isOwner ? "bg-[var(--ok)] animate-pulse" : isStaff ? "bg-[var(--accent)]" : "bg-[var(--warn)]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                  isOwner
                    ? "text-[var(--ok)] bg-white border-[var(--ok)]/30"
                    : isStaff
                    ? "text-[var(--accent)] bg-white border-[var(--accent)]/30"
                    : "text-[var(--warn)] bg-white border-[var(--warn)]/30"
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
        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-600 hover:bg-[var(--surface)] transition-colors cursor-pointer shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* ── MOBILE TOPBAR (Hanya tampil di layar ponsel/tablet < md) ── */}
      <div className="md:hidden sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--line)] px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5 text-[var(--ink)]" />
          </button>
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm text-[var(--ink)] tracking-tight block leading-tight">
                Nur Mobil
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium block leading-tight">
                Admin Operasional
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]">
            {isOwner ? "👑 Owner" : isStaff ? "🔧 Staff" : "🎯 Sales"}
          </span>
        </div>
      </div>

      {/* ── MOBILE SLIDE-OVER DRAWER (Hanya saat dibuka di < md) ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop gelap transparan */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <aside
            className="relative z-50 w-72 max-w-[85vw] bg-[var(--surface)] border-r border-[var(--line)] flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-left duration-200"
            aria-label="Sidebar Navigasi Mobile"
          >
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Header */}
              <div className="border-b border-[var(--line)] p-4 flex items-center justify-between">
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
                    N
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[var(--ink)] tracking-tight block leading-tight">
                      Nur Mobil
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-medium block leading-tight">
                      Operasional & Transparansi
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items (Scrollable di layar kecil) */}
              {renderNavLinks(false, () => setMobileOpen(false))}
            </div>

            {/* Footer Profil Pengguna */}
            {renderUserFooter(false)}
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR (Hanya tampil di layar desktop/laptop >= md) ── */}
      <aside
        className={cn(
          "hidden md:flex border-r border-[var(--line)] bg-[var(--surface)] flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 select-none",
          isCollapsed ? "w-20" : "w-64 lg:w-72"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div
            className={cn(
              "border-b border-[var(--line)] flex items-center justify-between transition-all",
              isCollapsed ? "p-3 flex-col gap-2" : "p-4 sm:p-5"
            )}
          >
            <Link
              href="/admin"
              className="flex items-center gap-3 group overflow-hidden"
              title="Nur Mobil Admin"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-black text-xl shadow-xs transition-transform group-hover:scale-105 shrink-0">
                N
              </div>
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <span className="font-extrabold text-base text-[var(--ink)] tracking-tight block truncate">
                    Nur Mobil
                  </span>
                  <span className="text-[11px] text-[var(--muted)] block font-medium truncate">
                    Operasional & Transparansi
                  </span>
                </div>
              )}
            </Link>

            {/* Toggle Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/60 transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? "Perlebar Sidebar (Expand)" : "Ciutkan Sidebar (Collapse)"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-[var(--muted)]" />
              )}
            </button>
          </div>

          {/* Navigation Items (Scrollable if tall) */}
          {renderNavLinks(isCollapsed)}
        </div>

        {/* User Session Footer */}
        {renderUserFooter(isCollapsed)}
      </aside>
    </>
  );
}
