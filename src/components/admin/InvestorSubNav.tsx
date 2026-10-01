"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, Users, Clock, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestorSubNavProps {
  pendingCount?: number;
  investorsCount?: number;
  historyCount?: number;
}

export function InvestorSubNav({
  pendingCount = 0,
  investorsCount,
  historyCount,
}: InvestorSubNavProps) {
  const pathname = usePathname();

  const links = [
    {
      label: "Unit Siap Bagi Hasil",
      href: "/admin/investors",
      exact: true,
      icon: HeartHandshake,
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      label: "Daftar Akun Investor",
      href: "/admin/investors/accounts",
      exact: false,
      icon: Users,
      badge: investorsCount !== undefined ? `${investorsCount}` : null,
      badgeColor: "bg-[#EFECE8] text-[#1C1917]",
    },
    {
      label: "Riwayat Distribusi Laba",
      href: "/admin/investors/history",
      exact: false,
      icon: Clock,
      badge: historyCount !== undefined ? `${historyCount}` : null,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      label: "Aturan Tier 4 Saudara",
      href: "/admin/investors/tier-rules",
      exact: false,
      icon: Sliders,
      badge: "Skema Laba",
      badgeColor: "bg-purple-100 text-purple-800",
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
