"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Menu, X, ChevronDown, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WhatsAppAdminContact,
  DEFAULT_WHATSAPP_ADMINS,
  generateDirectWhatsAppLink,
} from "@/lib/utils/whatsapp";
import { getPublicWhatsAppContactsAction } from "@/app/actions/contact";

interface PublicNavbarProps {
  initialContacts?: WhatsAppAdminContact[];
}

export function PublicNavbar({ initialContacts }: PublicNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contacts, setContacts] = useState<WhatsAppAdminContact[]>(
    initialContacts && initialContacts.length > 0 ? initialContacts : DEFAULT_WHATSAPP_ADMINS
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil daftar kontak terbaru dari server jika tidak ada initialContacts
  useEffect(() => {
    let isMounted = true;
    getPublicWhatsAppContactsAction()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setContacts(data);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat kontak admin di navbar:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Tutup dropdown jika klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Kontak utama untuk fallback 1-klik
  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0] || DEFAULT_WHATSAPP_ADMINS[0];
  const hasMultipleContacts = contacts.length > 1;

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--line)] sticky top-0 z-50">
      <div className="max-w-[var(--container)] mx-auto px-5 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-base shadow-xs">
            N
          </div>
          <span className="font-bold text-[18px] text-[var(--ink)] tracking-tight">
            Nur Mobil
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium">
          <Link
            href="/"
            className={cn(
              "transition-colors",
              pathname === "/" ? "text-[var(--ink)] font-semibold" : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            className={cn(
              "transition-colors",
              pathname.startsWith("/katalog") ? "text-[var(--ink)] font-semibold" : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Katalog Unit
          </Link>
          <Link
            href="/admin/inventory"
            className={cn(
              "transition-colors",
              pathname.startsWith("/admin") ? "text-[var(--ink)] font-semibold" : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Portal Internal
          </Link>
        </nav>

        {/* Desktop WhatsApp CTA */}
        <div className="hidden md:flex items-center gap-3">
          {!hasMultipleContacts ? (
            <a
              href={generateDirectWhatsAppLink(
                primaryContact.phone,
                "Halo Admin Nur Mobil, saya ingin tanya info stok unit mobil bekas."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-[var(--r-btn)] text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Hubungi Admin</span>
            </a>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-[var(--r-btn)] text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Admin</span>
                <ChevronDown
                  className={cn("w-3.5 h-3.5 transition-transform duration-200", dropdownOpen && "rotate-180")}
                />
              </button>

              {/* Popover Dropdown Pilihan Kontak Admin */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl shadow-xl border border-[var(--line)] p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 border-b border-[var(--line)] mb-2">
                    <p className="text-[13px] font-bold text-[var(--ink)]">Hubungi Tim Nur Mobil</p>
                    <p className="text-[11px] text-[var(--muted)]">Pilih kontak sesuai kebutuhan konsultasi Anda</p>
                  </div>

                  <div className="space-y-1.5">
                    {contacts.map((c) => (
                      <a
                        key={c.id}
                        href={generateDirectWhatsAppLink(
                          c.phone,
                          `Halo ${c.name}, saya ingin konsultasi mengenai unit mobil di Nur Mobil.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDropdownOpen(false)}
                        className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-[var(--bg)] transition-colors border border-transparent hover:border-[var(--line)]"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[13px] font-bold text-[var(--ink)] truncate">{c.name}</span>
                            {c.isPrimary && (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                                Utama
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--muted)] line-clamp-1">{c.role}</p>
                          <p className="text-[11px] font-mono font-medium text-emerald-700 mt-0.5">{c.phone}</p>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[var(--line)] px-2 text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Buka setiap hari: 08.00 - 20.00 WIB</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--ink)] hover:bg-[var(--bg)] rounded-[var(--r-btn)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-b border-[var(--line)] px-5 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "block text-[14px] py-1.5 transition-colors",
              pathname === "/" ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"
            )}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "block text-[14px] py-1.5 transition-colors",
              pathname.startsWith("/katalog") ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"
            )}
          >
            Katalog Unit
          </Link>
          <Link
            href="/admin/inventory"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[14px] py-1.5 text-[var(--muted)]"
          >
            Portal Internal
          </Link>

          {/* Mobile WhatsApp Section */}
          <div className="pt-3 border-t border-[var(--line)] space-y-2">
            <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
              Kontak WhatsApp Showroom
            </p>
            {contacts.map((c) => (
              <a
                key={c.id}
                href={generateDirectWhatsAppLink(
                  c.phone,
                  `Halo ${c.name}, saya ingin tanya info stok unit di Nur Mobil.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-[var(--ink)] truncate">{c.name}</span>
                    {c.isPrimary && (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded">Utama</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--muted)] line-clamp-1">{c.role}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-[12px] font-semibold shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
