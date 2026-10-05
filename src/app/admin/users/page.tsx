import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getUsersListAction } from "@/app/actions/user";
import { requireRole } from "@/lib/auth/session";
import { UsersClient } from "@/components/admin/UsersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Pengguna & Hak Akses | Nur Mobil Admin",
  description: "Manajemen akun staf showroom, pengaturan peran RBAC, dan pengelolaan kata sandi aman.",
};

export default async function UsersPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const usersRes = await getUsersListAction();
  const users = usersRes.data || [];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Kelola Pengguna"
        subtitle="Manajemen staf internal showroom, hak akses (RBAC), dan keamanan kata sandi."
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <UsersClient
          initialUsers={users}
          currentUserId={session.userId}
          investors={usersRes.investors || []}
        />
      </main>
    </div>
  );
}
