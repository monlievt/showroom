"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Split } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceSubNavProps {
  assetsCount?: number;
}

export function FinanceSubNav(_props?: FinanceSubNavProps) {
  const pathname = usePathname();

  const links = [
    {
      label: "Buku Kas & Mutasi Rekening BCA",
      href: "/admin/finance",
      exact: true,
      icon: Wallet,
      badge: null,
    },
    {
      label: "Pemisahan Beban & Prive (BCA)",
      href: "/admin/finance/expenses",
      exact: false,
      icon: Split,
      badge: "Pemisah Kas",
      badgeColor: "bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]",
    },
  ];

  return (
    <div className="flex border-b border-[var(--line)] gap-2 sm:gap-4 overflow-x-auto pb-px">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all -mb-px shrink-0",
              isActive
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)] bg-white shadow-xs font-bold"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-white/60"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-[var(--accent)]" : "text-[var(--muted)]")} />
            <span>{link.label}</span>
            {link.badge && (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-semibold",
                  link.badgeColor || "bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]"
                )}
              >
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
