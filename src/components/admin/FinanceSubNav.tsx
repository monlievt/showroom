"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Split, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceSubNavProps {
  assetsCount?: number;
}

export function FinanceSubNav({ assetsCount }: FinanceSubNavProps) {
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
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      label: "Aset & Bahan Habis Pakai (Oli, Filter & Alat)",
      href: "/admin/finance/assets",
      exact: false,
      icon: Wrench,
      badge: assetsCount !== undefined ? `${assetsCount} Alat & Bahan` : null,
      badgeColor: "bg-blue-100 text-blue-800",
    },
  ];

  return (
    <div className="flex border-b border-[#D9D4CB] gap-2 sm:gap-4 overflow-x-auto pb-px">
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
                ? "border-b-2 border-[#D97706] text-[#D97706] bg-white shadow-xs font-bold"
                : "text-[#6B6560] hover:text-[#1C1917] hover:bg-white/60"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-[#D97706]" : "text-[#6B6560]")} />
            <span>{link.label}</span>
            {link.badge && (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  link.badgeColor || "bg-amber-100 text-amber-800"
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
