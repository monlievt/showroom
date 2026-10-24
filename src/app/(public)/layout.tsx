import React from "react";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between">
      <PublicNavbar />
      <div className="flex-1 max-w-[1180px] mx-auto w-full px-5 py-8">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
