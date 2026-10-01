import React from "react";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsClient } from "@/components/admin/SettingsClient";
import { getSystemSettingsAction } from "@/app/actions/setting";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sistem & Kunci API | Nur Mobil Admin",
  description: "Pengaturan Kunci API Gemini, Google reCAPTCHA, Telegram Bot, WhatsApp Gateway, dan audit log.",
};

export default async function SettingsPage() {
  const [logs, auditLogs, settingsRes] = await Promise.all([
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getSystemSettingsAction(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Sistem, Kunci API & Notifikasi"
        subtitle="Konfigurasi integrasi Google Gemini AI, Google reCAPTCHA, Telegram Bot notifikasi HP, WhatsApp Gateway, dan audit trail."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <SettingsClient
          logs={logs.map((l) => ({
            id: l.id,
            type: l.type,
            status: l.status,
            recipientPhone: l.recipientPhone,
            recipientName: l.recipientName,
            messageBody: l.messageBody,
            sentAt: l.sentAt,
            failureReason: l.failureReason,
            retryCount: l.retryCount,
            createdAt: l.createdAt,
          }))}
          auditLogs={auditLogs.map((a) => ({
            id: a.id,
            actorUserId: a.actorUserId,
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            createdAt: a.createdAt,
            afterData: a.afterData,
          }))}
          initialSettings={settingsRes.data || []}
        />
      </main>
    </div>
  );
}
