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
    <header className="border-b border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6 md:px-8 py-3.5 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
      <div>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <h1 className="text-lg sm:text-2xl font-bold text-[var(--ink)] tracking-tight">{title}</h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--muted)] font-medium hidden sm:inline-block">
            {currentDate}
          </span>
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-3xl">{subtitle}</p>}
      </div>

      {children && <div className="flex items-center gap-2 sm:gap-3 flex-wrap">{children}</div>}
    </header>
  );
}
