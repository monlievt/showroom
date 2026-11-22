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
  BarChart3,
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

  const isOwner = userRole === "OWNER" || userRole === "ADMIN";
  const isStaff = userRole === "STAFF_ADMIN";
  const isSales = userRole === "SALES";
  const homeHref = isSales
    ? "/admin/inventory?status=READY_FOR_SALE"
    : isStaff
    ? "/admin/inventory"
    : "/admin";

  const isAdvancedRoute =
    pathname.startsWith("/admin/inspections") ||
    pathname.startsWith("/admin/workshop") ||
    pathname.startsWith("/admin/archive") ||
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/finance/expenses") ||
    pathname.startsWith("/admin/finance/assets") ||
    pathname.startsWith("/admin/investors") ||
    pathname.startsWith("/admin/settings") ||
    pathname.startsWith("/admin/users");

  const [advancedOpen, setAdvancedOpen] = useState(isAdvancedRoute);

  useEffect(() => {
    const saved = localStorage.getItem("nur_mobil_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    if (isAdvancedRoute) {
      setAdvancedOpen(true);
    }
  }, [pathname, isAdvancedRoute]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("nur_mobil_sidebar_collapsed", String(nextState));
  };

  const navLinkClass = (active: boolean, collapsed: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors group",
      active
        ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
        : "text-[var(--ink)] hover:bg-[var(--line)]/50",
      collapsed && "justify-center px-0"
    );

  const iconClass = (active: boolean) =>
    cn(
      "w-4 h-4 shrink-0",
      active ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
    );

  const renderNavLinks = (collapsed: boolean, onLinkClick?: () => void) => (
    <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
      {!collapsed && (
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {isSales ? "Menu Sales" : "Menu Harian"}
        </div>
      )}

      {/* 1. Beranda */}
      {!isSales && (
        <Link
          href="/admin"
          onClick={onLinkClick}
          title={collapsed ? "Beranda" : undefined}
          className={navLinkClass(pathname === "/admin", collapsed)}
        >
          <LayoutDashboard className={iconClass(pathname === "/admin")} />
          {!collapsed && <span className="truncate">Beranda</span>}
        </Link>
      )}

      {/* 2. Stok Unit */}
      <Link
        href="/admin/inventory"
        onClick={onLinkClick}
        title={collapsed ? "Stok Unit" : undefined}
        className={navLinkClass(pathname.startsWith("/admin/inventory"), collapsed)}
      >
        <Car className={iconClass(pathname.startsWith("/admin/inventory"))} />
        {!collapsed && (
          <span className="truncate">{isSales ? "Stok Siap Jual" : "Stok Unit"}</span>
        )}
      </Link>

      {/* 3. Penjualan & Tagihan */}
      {!isSales && (
        <Link
          href="/admin/sales"
          onClick={onLinkClick}
          title={collapsed ? "Penjualan & Tagihan" : undefined}
          className={navLinkClass(pathname.startsWith("/admin/sales"), collapsed)}
        >
          <ReceiptText className={iconClass(pathname.startsWith("/admin/sales"))} />
          {!collapsed && <span className="truncate">Penjualan &amp; Tagihan</span>}
        </Link>
      )}

      {/* 4. Buku Kas (Owner/Admin) */}
      {isOwner && (
        <Link
          href="/admin/finance"
          onClick={onLinkClick}
          title={collapsed ? "Buku Kas" : undefined}
          className={navLinkClass(pathname === "/admin/finance" || pathname.startsWith("/admin/finance/cash") || pathname.startsWith("/admin/finance/equity") || pathname.startsWith("/admin/finance/prive"), collapsed)}
        >
          <Wallet className={iconClass(pathname === "/admin/finance")} />
          {!collapsed && <span className="truncate">Buku Kas</span>}
        </Link>
      )}

      {/* 5. Lihat Web Katalog */}
      <Link
        href="/katalog"
        target="_blank"
        onClick={onLinkClick}
        title={collapsed ? "Lihat Web Katalog" : undefined}
        className={cn(
          "flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors group",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ExternalLink className="w-4 h-4 text-[var(--accent)] shrink-0" />
          {!collapsed && <span className="truncate">Lihat Web Katalog</span>}
        </div>
        {!collapsed && (
          <span className="text-[10px] bg-white border border-[var(--line)] text-[var(--muted)] px-2 py-0.5 rounded-full font-semibold shrink-0">
            Publik
          </span>
        )}
      </Link>

      {/* Menu Lanjutan (Dilipat agar tampilan harian tetap ringkas) */}
      {!isSales && (
        <div className="pt-3 mt-2 border-t border-[var(--line)]">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer"
            >
              <span>Menu Lainnya</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  advancedOpen && "rotate-180"
                )}
              />
            </button>
          ) : (
            <div className="h-1" />
          )}

          {(collapsed || advancedOpen) && (
            <div className="mt-1 space-y-1">
              <Link
                href="/admin/inspections"
                onClick={onLinkClick}
                title={collapsed ? "Cek Fisik & Inspeksi" : undefined}
                className={navLinkClass(pathname.startsWith("/admin/inspections"), collapsed)}
              >
                <ClipboardCheck className={iconClass(pathname.startsWith("/admin/inspections"))} />
                {!collapsed && <span className="truncate">Cek Fisik &amp; Inspeksi</span>}
              </Link>

              {isOwner && (
                <>
                  <Link
                    href="/admin/investors"
                    onClick={onLinkClick}
                    title={collapsed ? "Investor & Bagi Hasil" : undefined}
                    className={navLinkClass(pathname === "/admin/investors", collapsed)}
                  >
                    <Coins className={iconClass(pathname === "/admin/investors")} />
                    {!collapsed && <span className="truncate">Bagi Hasil Investor</span>}
                  </Link>

                  {!collapsed && (
                    <div className="pl-6 pr-1 space-y-1 border-l-2 border-[var(--line)] ml-4">
                      <Link
                        href="/admin/investors/accounts"
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                          pathname.startsWith("/admin/investors/accounts")
                            ? "bg-[var(--accent)] text-white font-semibold"
                            : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40"
                        )}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Daftar Pemodal</span>
                      </Link>
                      <Link
                        href="/admin/investors/history"
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                          pathname.startsWith("/admin/investors/history")
                            ? "bg-[var(--accent)] text-white font-semibold"
                            : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40"
                        )}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Riwayat Bagi Hasil</span>
                      </Link>
                      <Link
                        href="/admin/investors/tier-rules"
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                          pathname.startsWith("/admin/investors/tier-rules")
                            ? "bg-[var(--accent)] text-white font-semibold"
                            : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40"
                        )}
                      >
                        <Sliders className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Aturan Bagi Hasil</span>
                      </Link>
                    </div>
                  )}

                  <Link
                    href="/admin/finance/expenses"
                    onClick={onLinkClick}
                    title={collapsed ? "Beban & Prive" : undefined}
                    className={navLinkClass(pathname.startsWith("/admin/finance/expenses"), collapsed)}
                  >
                    <Split className={iconClass(pathname.startsWith("/admin/finance/expenses"))} />
                    {!collapsed && <span className="truncate">Biaya Operasional &amp; Prive</span>}
                  </Link>
                </>
              )}

              <Link
                href="/admin/workshop"
                onClick={onLinkClick}
                title={collapsed ? "Gudang Bahan & Alat" : undefined}
                className={navLinkClass(pathname.startsWith("/admin/workshop"), collapsed)}
              >
                <Wrench className={iconClass(pathname.startsWith("/admin/workshop"))} />
                {!collapsed && <span className="truncate">Gudang Bahan &amp; Alat</span>}
              </Link>

              <Link
                href="/admin/archive"
                onClick={onLinkClick}
                title={collapsed ? "Arsip Penjualan Lama" : undefined}
                className={navLinkClass(pathname.startsWith("/admin/archive"), collapsed)}
              >
                <History className={iconClass(pathname.startsWith("/admin/archive"))} />
                {!collapsed && <span className="truncate">Arsip Penjualan Lama</span>}
              </Link>

              <Link
                href="/admin/analytics"
                onClick={onLinkClick}
                title={collapsed ? "Analitik & Perputaran" : undefined}
                className={navLinkClass(pathname.startsWith("/admin/analytics"), collapsed)}
              >
                <BarChart3 className={iconClass(pathname.startsWith("/admin/analytics"))} />
                {!collapsed && <span className="truncate">Analitik &amp; Perputaran</span>}
              </Link>

              {isOwner && (
                <>
                  <Link
                    href="/admin/users"
                    onClick={onLinkClick}
                    title={collapsed ? "Kelola Pengguna" : undefined}
                    className={navLinkClass(pathname.startsWith("/admin/users"), collapsed)}
                  >
                    <Users className={iconClass(pathname.startsWith("/admin/users"))} />
                    {!collapsed && <span className="truncate">Kelola Pengguna</span>}
                  </Link>

                  <Link
                    href="/admin/settings"
                    onClick={onLinkClick}
                    title={collapsed ? "Pengaturan Sistem" : undefined}
                    className={navLinkClass(pathname.startsWith("/admin/settings"), collapsed)}
                  >
                    <ShieldCheck className={iconClass(pathname.startsWith("/admin/settings"))} />
                    {!collapsed && <span className="truncate">Pengaturan &amp; Notifikasi</span>}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
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
        <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate">
              {userName}
            </div>
            <div className="text-[11px] text-[var(--muted)] font-medium mt-0.5 truncate">
              {isOwner ? "Owner Showroom" : isStaff ? "Staff Admin" : "Tim Sales"}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => logoutAction()}
        title="Keluar (Logout)"
        aria-label="Keluar dari akun"
        className="w-10 h-10 rounded-lg text-[var(--muted)] hover:text-red-600 hover:bg-[var(--surface)] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* ── MOBILE TOPBAR RINGKAS (< md) ── */}
      <div className="md:hidden sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--line)] px-4 py-2 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2.5 min-h-[40px]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-black text-sm shrink-0">
            N
          </div>
          <div>
            <span className="font-extrabold text-sm text-[var(--ink)] tracking-tight block leading-tight">
              Nur Mobil
            </span>
            <span className="text-[11px] text-[var(--muted)] font-medium block leading-tight">
              {userName}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/katalog"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Web</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] cursor-pointer active:scale-95"
            aria-label="Buka semua menu"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION BAR (< md) ── */}
      <nav
        aria-label="Navigasi utama HP"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--line)] shadow-[0_-2px_10px_rgba(27,36,48,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        {isSales ? (
          <div className="grid grid-cols-2 h-15">
            <Link
              href="/admin/inventory"
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                pathname.startsWith("/admin/inventory")
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              )}
            >
              <Car className="w-5 h-5" />
              <span>Stok Ready</span>
            </Link>
            <Link
              href="/katalog"
              target="_blank"
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[var(--muted)]"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Web Katalog</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-5 h-16">
            <Link
              href="/admin"
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                pathname === "/admin" ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Beranda</span>
            </Link>

            <Link
              href="/admin/inventory"
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                pathname.startsWith("/admin/inventory")
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              )}
            >
              <Car className="w-5 h-5" />
              <span>Stok</span>
            </Link>

            <Link
              href="/admin/sales"
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                pathname.startsWith("/admin/sales")
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              )}
            >
              <ReceiptText className="w-5 h-5" />
              <span>Jual</span>
            </Link>

            {isOwner ? (
              <Link
                href="/admin/finance"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  pathname.startsWith("/admin/finance")
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                )}
              >
                <Wallet className="w-5 h-5" />
                <span>Kas</span>
              </Link>
            ) : (
              <Link
                href="/admin/inspections"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  pathname.startsWith("/admin/inspections")
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                )}
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>Cek Fisik</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer",
                mobileOpen ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              <Menu className="w-5 h-5" />
              <span>Lainnya</span>
            </button>
          </div>
        )}
      </nav>

      {/* ── MOBILE SLIDE-OVER DRAWER (< md) ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <aside
            className="relative z-50 w-76 max-w-[85vw] bg-[var(--surface)] border-r border-[var(--line)] flex flex-col justify-between h-full shadow-2xl"
            aria-label="Menu navigasi lengkap"
          >
            <div className="flex flex-col flex-1 min-h-0">
              <div className="border-b border-[var(--line)] p-4 flex items-center justify-between">
                <Link
                  href={homeHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-black text-base shrink-0">
                    N
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[var(--ink)] tracking-tight block leading-tight">
                      Nur Mobil
                    </span>
                    <span className="text-[11px] text-[var(--muted)] font-medium block leading-tight">
                      Catatan &amp; Web Katalog
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavLinks(false, () => setMobileOpen(false))}
            </div>

            {renderUserFooter(false)}
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR (>= md) ── */}
      <aside
        className={cn(
          "hidden md:flex border-r border-[var(--line)] bg-[var(--surface)] flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 select-none",
          isCollapsed ? "w-20" : "w-64 lg:w-68"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div
            className={cn(
              "border-b border-[var(--line)] flex items-center justify-between transition-all",
              isCollapsed ? "p-3 flex-col gap-2" : "p-4 sm:p-5"
            )}
          >
            <Link
              href={homeHref}
              className="flex items-center gap-3 group overflow-hidden"
              title="Nur Mobil Admin"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-black text-xl shrink-0">
                N
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="font-extrabold text-base text-[var(--ink)] tracking-tight block truncate">
                    Nur Mobil
                  </span>
                  <span className="text-[11px] text-[var(--muted)] block font-medium truncate">
                    Catatan &amp; Web Katalog
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleCollapse}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/60 transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? "Perlebar Sidebar" : "Ciutkan Sidebar"}
              aria-label={isCollapsed ? "Perlebar Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-[var(--muted)]" />
              )}
            </button>
          </div>

          {renderNavLinks(isCollapsed)}
        </div>

        {renderUserFooter(isCollapsed)}
      </aside>
    </>
  );
}
