import React from "react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, children }: AdminHeaderProps) {
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="border-b border-[#D9D4CB] bg-[#F7F5F2] px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">{title}</h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#EFECE8] border border-[#D9D4CB] text-[#6B6560] font-medium hidden sm:inline-block">
            {currentDate}
          </span>
        </div>
        {subtitle && <p className="text-sm text-[#6B6560] mt-1">{subtitle}</p>}
      </div>

      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
