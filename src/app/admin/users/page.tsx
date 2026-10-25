import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getUsersListAction } from "@/app/actions/user";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/admin/UsersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Pengguna & Hak Akses | Nur Mobil Admin",
  description: "Manajemen akun staf showroom, pengaturan peran RBAC, dan pengelolaan kata sandi aman.",
};

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    redirect("/admin");
  }

  const usersRes = await getUsersListAction();
  const users = usersRes.data || [];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Kelola Pengguna"
        subtitle="Manajemen staf internal showroom, hak akses (RBAC), dan keamanan kata sandi."
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {!usersRes.success && (
          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm">
              <p className="font-semibold">Sinkronisasi Database Diperlukan:</p>
              <p>{usersRes.error || "Gagal memuat daftar pengguna dari database."}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Pastikan Anda telah menjalankan perintah berikut di terminal VPS:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white border border-[var(--line)] font-mono text-[var(--ink)]">npx prisma db push</code>
                dan
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white border border-[var(--line)] font-mono text-[var(--ink)]">npm run db:seed-users</code>
              </p>
            </div>
          </div>
        )}

        <UsersClient
          initialUsers={users}
          currentUserId={session.userId}
          investors={usersRes.investors || []}
        />
      </main>
    </div>
  );
}

