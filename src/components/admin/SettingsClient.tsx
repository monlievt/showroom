"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Database,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Smartphone,
  MessageSquare,
  Radio,
  Download,
  Cloud,
  HardDrive,
  Terminal,
  Copy,
  Check,
  Phone,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { retryNotificationLog } from "@/lib/services/whatsapp";
import { sendTestWhatsAppAction } from "@/app/actions/notification";
import { SettingItem } from "@/app/actions/setting";
import { ApiKeySettingsClient } from "./ApiKeySettingsClient";
import { WhatsAppContactsSettingsClient } from "./WhatsAppContactsSettingsClient";
import { WhatsAppAdminContact } from "@/lib/utils/whatsapp";
import { KeyRound } from "lucide-react";

interface SettingsProps {
  logs: Array<{
    id: string;
    type: string;
    status: string;
    recipientPhone: string;
    recipientName?: string | null;
    messageBody: string;
    sentAt?: string | Date | null;
    failureReason?: string | null;
    retryCount: number;
    createdAt: string | Date;
  }>;
  auditLogs: Array<{
    id: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string | Date;
    afterData?: any;
  }>;
  initialSettings?: SettingItem[];
  initialContacts?: WhatsAppAdminContact[];
}

export function SettingsClient({
  logs,
  auditLogs,
  initialSettings = [],
  initialContacts = [],
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "api_keys" | "whatsapp_contacts" | "notifications" | "audit" | "backup"
  >("api_keys");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [testPhone, setTestPhone] = useState("081234567890");
  const [testType, setTestType] = useState<string>("UNIT_SOLD");
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleRetry = async (id: string) => {
    setLoading(id);
    const res = await retryNotificationLog(id);
    setLoading(null);

    if (res.success) {
      showNotification("Notifikasi WhatsApp berhasil dikirim ulang!", "success");
    } else {
      showNotification(res.error || "Gagal mengirim ulang notifikasi", "error");
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) return;
    setTestLoading(true);
    const res = await sendTestWhatsAppAction(testType as any, testPhone);
    setTestLoading(false);
    if (res.success) {
      showNotification(`Uji coba pesan ${testType} berhasil dikirim ke ${testPhone}!`, "success");
    } else {
      showNotification(res.error || "Gagal mengirim pesan uji coba", "error");
    }
  };

  const handleTriggerCronManual = async () => {
    setCronLoading(true);
    try {
      const res = await fetch("/api/cron/reminders", {
        method: "POST",
        headers: {
          Authorization: `Bearer default_local_cron_secret`,
        },
      });
      const data = await res.json();
      setCronLoading(false);

      if (data.success) {
        showNotification(
          `Cron selesai: ${data.summary?.piutangSent || 0} pengingat piutang, ${data.summary?.pajakSent || 0} pengingat pajak terkirim.`,
          "success"
        );
      } else {
        showNotification(data.error || "Gagal memproses cron", "error");
      }
    } catch (err: any) {
      setCronLoading(false);
      showNotification(err.message, "error");
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && log.type !== typeFilter) return false;
    return true;
  });

  const totalSent = logs.filter((l) => l.status === "SENT").length;
  const totalFailed = logs.filter((l) => l.status === "FAILED").length;
  const totalPending = logs.filter((l) => l.status === "PENDING" || l.status === "RETRY").length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm transition-all",
            feedback.type === "success"
              ? "bg-[var(--bg)] border-[var(--line)] text-[var(--ok)]"
              : "bg-[var(--bg)] border-[var(--bad)]/30 text-[var(--bad)]"
          )}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
            Sistem, Notifikasi & Audit
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Log audit notifikasi WhatsApp Gateway, mekanisme retry manual, jejak audit finansial, dan backup database.
          </p>
        </div>

        <button
          disabled={cronLoading}
          onClick={handleTriggerCronManual}
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", cronLoading && "animate-spin")} />
          <span>Jalankan Cron Pengingat Sekarang</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--muted)] mb-2">
            <span className="text-xs font-semibold uppercase">Berhasil Terkirim</span>
            <CheckCircle2 className="w-5 h-5 text-[var(--ok)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)]">{totalSent}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Pesan terkirim ke WhatsApp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--muted)] mb-2">
            <span className="text-xs font-semibold uppercase">Gagal (Perlu Retry)</span>
            <AlertCircle className="w-5 h-5 text-[var(--bad)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--bad)]">{totalFailed}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Siap dipicu ulang secara manual</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)] mb-2">
            <span className="text-xs font-semibold uppercase">Jejak Audit Finansial</span>
            <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)]">{auditLogs.length}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Mutasi immutable tercatat</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--line)] gap-4 sm:gap-6 text-sm font-medium overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("api_keys")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "api_keys"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <KeyRound className="w-4 h-4 text-[var(--accent)]" />
          <span>Kunci API & Integrasi Layanan</span>
        </button>
        <button
          onClick={() => setActiveTab("whatsapp_contacts")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "whatsapp_contacts"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Phone className="w-4 h-4 text-[var(--accent)]" />
          <span>Kontak WhatsApp Admin</span>
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "notifications"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          Audit Log Notifikasi WhatsApp ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "audit"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          Jejak Audit Transaksi Finansial ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "backup"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          Status Backup & Ketentuan Pajak
        </button>
      </div>

      {/* TAB 0: KUNCI API & INTEGRASI */}
      {activeTab === "api_keys" && (
        <ApiKeySettingsClient initialSettings={initialSettings} />
      )}

      {/* TAB: KONTAK WHATSAPP ADMIN */}
      {activeTab === "whatsapp_contacts" && (
        <WhatsAppContactsSettingsClient initialContacts={initialContacts} />
      )}

      {/* TAB 1: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* WAHA Gateway Control Hub */}
          <div className="bg-white rounded-2xl border border-[var(--line)] p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center shrink-0 shadow-2xs">
                  <Smartphone className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-[var(--ink)] text-base">
                      WhatsApp Gateway (WAHA Engine)
                    </h3>
                    <span className="inline-flex items-center gap-1 bg-white border border-[var(--line)] text-[var(--ink)] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
                      Port 2026 Ready
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Self-hosted gateway via Docker (<code className="bg-[var(--bg)] px-1 py-0.5 rounded text-[11px]">docker-compose.waha.yml</code>).
                    Kirim notifikasi unit laku, rincian bagi hasil, invoice PDF, dan pengingat piutang otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="http://localhost:2026/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--bg)] text-xs font-bold text-[var(--ink)] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Dashboard WAHA / Scan QR</span>
                </a>
              </div>
            </div>

            {/* Form Uji Coba Pengiriman Pesan */}
            <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line)] space-y-3">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                <span>Simulasi & Uji Coba Pengiriman WhatsApp:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Nomor WhatsApp Penerima
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-semibold text-[var(--ink)]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Jenis Template Notifikasi
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-semibold text-[var(--ink)]"
                  >
                    <option value="UNIT_SOLD">🚗 Unit Terjual (Ke Owner/Investor)</option>
                    <option value="PROFIT_DISTRIBUTION">💰 Rincian Bagi Hasil (Ke Investor)</option>
                    <option value="DOCUMENT_READY">📄 Dokumen Selesai (Ke Pembeli)</option>
                    <option value="PIUTANG_DUE">🔔 Pengingat Sisa Piutang Showroom</option>
                    <option value="PAJAK_EXPIRY">⚠️ Pengingat Pajak STNK Habis</option>
                  </select>
                </div>

                <div className="sm:col-span-3 sm:self-end">
                  <button
                    type="button"
                    disabled={testLoading}
                    onClick={handleSendTest}
                    className="w-full flex items-center justify-center gap-1.5 bg-[var(--ink)] hover:bg-[#44403C] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className={cn("w-3.5 h-3.5", testLoading && "animate-spin")} />
                    <span>{testLoading ? "Mengirim..." : "Kirim Uji Coba"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Log Audit Notifikasi */}
          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm space-y-4">
            <div className="p-5 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FBF9F6]">
              <div>
                <h3 className="font-bold text-[var(--ink)]">Log Audit WhatsApp Gateway (Bukan Fire-and-Forget)</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Setiap pesan dicatat PENDING sebelum dikirim. Status SENT/FAILED tervalidasi dengan retry manual.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Filter Tipe:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-white border border-[var(--line)] rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="ALL">Semua Jenis Pesan</option>
                  <option value="UNIT_SOLD">Unit Terjual</option>
                  <option value="PROFIT_DISTRIBUTION">Bagi Hasil</option>
                  <option value="DOCUMENT_READY">Dokumen Siap</option>
                  <option value="PIUTANG_DUE">Piutang Tempo</option>
                  <option value="PAJAK_EXPIRY">Pajak STNK</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-[var(--line)] rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="FAILED">Hanya Gagal (FAILED)</option>
                  <option value="SENT">Hanya Terkirim (SENT)</option>
                  <option value="PENDING">Pending / Antrean</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg)] text-xs uppercase text-[var(--muted)] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Tipe Pesan</th>
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-4">Isi Pesan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Retry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted)]">
                        Belum ada catatan notifikasi pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const getTypeBadge = (_type: string) => {
                        return "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]";
                      };

                      const getTypeLabel = (type: string) => {
                        switch (type) {
                          case "UNIT_SOLD":
                            return "🚗 Unit Terjual";
                          case "PROFIT_DISTRIBUTION":
                            return "💰 Bagi Hasil";
                          case "DOCUMENT_READY":
                            return "📄 Dokumen Siap";
                          case "PIUTANG_DUE":
                            return "🔔 Piutang Tempo";
                          case "PAJAK_EXPIRY":
                            return "⚠️ Pajak STNK";
                          default:
                            return type;
                        }
                      };

                      return (
                        <tr key={log.id} className="hover:bg-[var(--bg)]">
                          <td className="py-3 px-4 text-xs text-[var(--muted)] whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold whitespace-nowrap">
                            <span className={cn("border px-2 py-0.5 rounded font-bold text-[11px]", getTypeBadge(log.type))}>
                              {getTypeLabel(log.type)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-xs text-[var(--ink)] block">
                              {log.recipientName || "Tanpa Nama"}
                            </span>
                            <span className="text-[11px] text-[var(--muted)]">{log.recipientPhone}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--ink)] max-w-xs truncate">
                            {log.messageBody}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border",
                                log.status === "SENT"
                                  ? "bg-[var(--bg)] text-[var(--ok)] border-[var(--ok)]/30"
                                  : log.status === "FAILED"
                                  ? "bg-[var(--bg)] text-[var(--bad)] border-[var(--bad)]/30"
                                  : "bg-[var(--bg)] text-[var(--warn)] border-[var(--warn)]/30"
                              )}
                            >
                              {log.status} {log.retryCount > 0 ? `(${log.retryCount}x)` : ""}
                            </span>
                            {log.failureReason && (
                              <span className="block text-[10px] text-[var(--bad)] truncate max-w-xs mt-0.5">
                                {log.failureReason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {log.status === "FAILED" ? (
                              <button
                                disabled={loading === log.id}
                                onClick={() => handleRetry(log.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                              >
                                <RotateCcw className={cn("w-3 h-3", loading === log.id && "animate-spin")} />
                                <span>Retry</span>
                              </button>
                            ) : (
                              <span className="text-xs text-[var(--muted)]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeTab === "audit" && (
        <AuditLogTab auditLogs={auditLogs} />
      )}

      {/* TAB 3: BACKUP MULTI-LAYER & DISASTER RECOVERY */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          {/* Header & Instant Download Action */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-[var(--accent)]/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-extrabold text-base text-[var(--ink)]">
                  Strategi Multi-Layer Backup (VPS Mandiri 100% Bebas Biaya)
                </h3>
              </div>
              <p className="text-xs text-[var(--muted)] max-w-2xl leading-relaxed">
                Menjamin keamanan data transaksi & foto mobil garasi tanpa biaya bulanan AWS/S3. Menggunakan 4 lapis perlindungan: lokal VPS, Telegram Bot Cloud, Google Drive Rclone, dan Git.
              </p>
            </div>

            <a
              href="/api/backup/download"
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Snapshot JSON Instan</span>
            </a>
          </div>

          {/* 4 Lapisan Backup Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lapis 1: Lokal VPS */}
            <div className="bg-white rounded-2xl border border-[var(--line)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shadow-2xs">
                    L1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ink)]">Snapshot Lokal VPS</h4>
                    <span className="text-[11px] text-[var(--muted)] font-semibold">Rotasi Otomatis 7 Hari</span>
                  </div>
                </div>
                <HardDrive className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Dump database <code>.sql.gz</code> dan arsip foto mobil <code>.tar.gz</code> otomatis setiap malam. Backup lama &gt; 7 hari otomatis dibersihkan agar kapasitas disk VPS tetap lega.
              </p>
              <div className="bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--line)] text-[11px] font-mono text-[var(--muted)]">
                Lokasi: <code>/backups/db/</code> &amp; <code>/backups/media/</code>
              </div>
            </div>

            {/* Lapis 2: Telegram Bot Cloud */}
            <div className="bg-white rounded-2xl border border-[var(--line)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shadow-2xs">
                    L2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ink)]">Off-Site Telegram Bot</h4>
                    <span className="text-[11px] text-[var(--muted)] font-semibold">100% Gratis &amp; Unlimited Storage</span>
                  </div>
                </div>
                <Cloud className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Setiap malam database terkompresi dikirim langsung ke chat Telegram pribadi Owner. Jika VPS terbakar/rusak fatal, file cadangan tetap utuh dan aman di server cloud Telegram.
              </p>
              <div className="bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--line)] text-[11px] font-mono text-[var(--muted)]">
                Setup: <code>TELEGRAM_BOT_TOKEN</code> &amp; <code>TELEGRAM_CHAT_ID</code>
              </div>
            </div>

            {/* Lapis 3: Google Drive via Rclone */}
            <div className="bg-white rounded-2xl border border-[var(--line)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shadow-2xs">
                    L3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ink)]">Google Drive Rclone Sync</h4>
                    <span className="text-[11px] text-[var(--muted)] font-semibold">Gratis Kuota Akun Google 15 GB</span>
                  </div>
                </div>
                <Cloud className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Menggunakan utility open-source <code>rclone</code> untuk menyinkronkan seluruh folder foto mobil garasi ke Google Drive secara otomatis tanpa intervensi manual.
              </p>
              <div className="bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--line)] text-[11px] font-mono text-[var(--muted)]">
                Folder: <code>gdrive:nur_mobil_backups/</code>
              </div>
            </div>

            {/* Lapis 4: GitHub Repository */}
            <div className="bg-white rounded-2xl border border-[var(--line)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center font-bold text-xs">
                    L4
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ink)]">GitHub Repository</h4>
                    <span className="text-[11px] text-[var(--muted)] font-semibold">Source Code &amp; Skema DB</span>
                  </div>
                </div>
                <Database className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Seluruh kode program aplikasi, skema Prisma, dan dokumentasi operasional ter-commit aman di repositori GitHub. Memungkinkan deploy ulang ke VPS baru dalam hitungan menit.
              </p>
              <div className="bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--line)] text-[11px] font-mono text-[var(--ink)] truncate">
                Repo: <code>monlievt/showroom.git</code>
              </div>
            </div>
          </div>

          {/* Panduan Setup Cron Job VPS (1 Baris) */}
          <div className="bg-white rounded-2xl border border-[var(--line)] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="font-bold text-sm text-[var(--ink)]">
                Konfigurasi Penjadwalan Otomatis di VPS (Cron Job)
              </h4>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Jalankan perintah berikut di terminal SSH VPS Anda untuk mengaktifkan backup otomatis setiap malam pukul 02:00 WIB:
            </p>
            <div className="bg-[var(--ink)] text-white p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              <code>0 2 * * * cd /path/to/showroom-app &amp;&amp; bash scripts/backup-multi-layer.sh &gt;&gt; /var/log/nur_mobil_backup.log 2&gt;&amp;1</code>
            </div>
          </div>

          {/* Panduan Disaster Recovery (Restore Cepat) */}
          <div className="bg-white rounded-2xl border border-[var(--line)] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-600" />
              <h4 className="font-bold text-sm text-[var(--ink)]">
                Pemulihan Bencana (Disaster Recovery Restore)
              </h4>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Bila server mengalami kendala atau database rusak, jalankan script restore 1 klik untuk memulihkan seluruh data dari snapshot terakhir:
            </p>
            <div className="bg-[var(--ink)] text-white p-3 rounded-xl font-mono text-xs">
              <code>bash scripts/restore-db.sh</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AuditLogTab Component ─────────────────────────────────────────────────────

type AuditLogEntry = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string | Date;
  afterData?: any;
};

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  CREATE:        { bg: "bg-[var(--bg)]",  text: "text-[var(--ok)]",    border: "border-[var(--ok)]/30",   label: "Buat" },
  UPDATE:        { bg: "bg-[var(--bg)]",  text: "text-[var(--accent)]", border: "border-[var(--line)]",   label: "Ubah" },
  VOID:          { bg: "bg-[var(--bg)]",  text: "text-[var(--bad)]",   border: "border-[var(--bad)]/30",  label: "Batal" },
  CORRECTION:    { bg: "bg-[var(--bg)]",  text: "text-[var(--warn)]",  border: "border-[var(--warn)]/30", label: "Koreksi" },
  PROFIT_SHARE:  { bg: "bg-[var(--bg)]",  text: "text-[var(--ink)]",   border: "border-[var(--line)]",    label: "Bagi Hasil" },
  SALE:          { bg: "bg-[var(--bg)]",  text: "text-[var(--ink)]",   border: "border-[var(--line)]",    label: "Penjualan" },
  STATUS_CHANGE: { bg: "bg-[var(--bg)]",  text: "text-[var(--accent)]", border: "border-[var(--line)]",   label: "Ubah Status" },
};

const ENTITY_LABELS: Record<string, string> = {
  Vehicle:            "Unit Kendaraan",
  Expense:            "Beban Unit",
  Sale:               "Penjualan",
  Investment:         "Modal Investor",
  CapitalLedger:      "Buku Modal",
  ProfitShareRule:    "Aturan Bagi Hasil",
  OperationalExpense: "Pengeluaran Ops",
  CashTransaction:    "Kas Masuk/Keluar",
  Asset:              "Aset Inventaris",
  Setting:            "Pengaturan",
  Investor:           "Investor",
};

function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d);
}

function getEntityLink(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "Vehicle":  return `/admin/inventory/${entityId}`;
    case "Sale":     return `/admin/inventory/${entityId}`;
    case "OperationalExpense":
    case "CashTransaction": return `/admin/finance`;
    case "Asset":    return `/admin/assets`;
    case "Investor":
    case "Investment":
    case "CapitalLedger":
    case "ProfitShareRule": return `/admin/investors`;
    default: return null;
  }
}

function AuditLogTab({ auditLogs }: { auditLogs: AuditLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterEntity, setFilterEntity] = useState("ALL");
  const [searchId, setSearchId] = useState("");

  const uniqueActions = useMemo(
    () => ["ALL", ...Array.from(new Set(auditLogs.map((l) => l.action)))],
    [auditLogs]
  );
  const uniqueEntities = useMemo(
    () => ["ALL", ...Array.from(new Set(auditLogs.map((l) => l.entityType)))],
    [auditLogs]
  );

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filterAction !== "ALL" && log.action !== filterAction) return false;
      if (filterEntity !== "ALL" && log.entityType !== filterEntity) return false;
      if (searchId && !log.entityId.toLowerCase().includes(searchId.toLowerCase())) return false;
      return true;
    });
  }, [auditLogs, filterAction, filterEntity, searchId]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-[var(--line)] bg-[#FBF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
              Jejak Audit Finansial &amp; Operasional
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {auditLogs.length} entri tercatat &middot; Klik <strong>Lihat</strong> pada baris untuk membuka detail perubahan data
            </p>
          </div>
          <span className="text-xs bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-bold px-3 py-1 rounded-full self-start sm:self-auto whitespace-nowrap shadow-2xs">
            Immutable &middot; Read-only
          </span>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--bg)] flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Cari ID Referensi..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="border border-[var(--line)] rounded-lg px-3 py-1.5 bg-white text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-[var(--line)] rounded-lg px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a === "ALL" ? "Semua Aksi" : a}</option>
            ))}
          </select>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="border border-[var(--line)] rounded-lg px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {uniqueEntities.map((e) => (
              <option key={e} value={e}>
                {e === "ALL" ? "Semua Entitas" : (ENTITY_LABELS[e] ?? e)}
              </option>
            ))}
          </select>
          {(filterAction !== "ALL" || filterEntity !== "ALL" || searchId) && (
            <button
              onClick={() => { setFilterAction("ALL"); setFilterEntity("ALL"); setSearchId(""); }}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline"
            >
              Reset filter
            </button>
          )}
          <span className="ml-auto text-xs text-[var(--muted)] whitespace-nowrap">{filtered.length} ditampilkan</span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-4">
            <ShieldCheck className="w-10 h-10 text-[var(--line)]" />
            <p className="text-sm font-semibold text-[var(--ink)]">
              {auditLogs.length === 0 ? "Belum ada jejak audit" : "Tidak ada hasil filter"}
            </p>
            <p className="text-xs text-[var(--muted)] max-w-xs">
              {auditLogs.length === 0
                ? "Jejak audit muncul otomatis saat ada transaksi: pembuatan unit, catat biaya, penjualan, dll."
                : "Coba ubah filter atau reset untuk melihat semua entri."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg)] text-xs uppercase text-[var(--muted)] font-semibold border-b border-[var(--line)]">
                <tr>
                  <th className="py-3 px-4 w-40">Waktu</th>
                  <th className="py-3 px-4 w-28">Aksi</th>
                  <th className="py-3 px-4">Entitas</th>
                  <th className="py-3 px-4">ID Referensi</th>
                  <th className="py-3 px-4">Pelaku</th>
                  <th className="py-3 px-4 w-16 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filtered.map((log) => {
                  const actionStyle = ACTION_COLORS[log.action] ?? {
                    bg: "bg-[var(--bg)]", text: "text-[var(--ink)]", border: "border-[var(--line)]", label: log.action,
                  };
                  const entityLink = getEntityLink(log.entityType, log.entityId);
                  const isExpanded = expandedId === log.id;
                  const hasDetail =
                    log.afterData != null &&
                    typeof log.afterData === "object" &&
                    Object.keys(log.afterData).length > 0;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={cn("transition-colors", isExpanded ? "bg-[var(--bg)]" : "hover:bg-[var(--bg)]")}>
                        {/* Waktu */}
                        <td className="py-3 px-4 text-xs text-[var(--muted)] whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        {/* Aksi */}
                        <td className="py-3 px-4">
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", actionStyle.bg, actionStyle.text, actionStyle.border)}>
                            {actionStyle.label}
                          </span>
                        </td>
                        {/* Entitas */}
                        <td className="py-3 px-4 text-xs font-semibold text-[var(--accent)]">
                          {ENTITY_LABELS[log.entityType] ?? log.entityType}
                        </td>
                        {/* ID Referensi */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-xs text-[var(--muted)] font-mono truncate max-w-[160px]"
                              title={log.entityId}
                            >
                              {log.entityId.length > 20
                                ? `${log.entityId.slice(0, 8)}…${log.entityId.slice(-6)}`
                                : log.entityId}
                            </span>
                            {entityLink && (
                              <a
                                href={entityLink}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)] shrink-0"
                                title="Buka halaman terkait"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        {/* Pelaku */}
                        <td className="py-3 px-4 text-xs text-[var(--ink)] font-medium">
                          {log.actorUserId === "SYSTEM" ? (
                            <span className="text-[var(--muted)] italic">Sistem</span>
                          ) : (
                            <span title={log.actorUserId}>
                              {log.actorUserId.length > 20
                                ? `${log.actorUserId.slice(0, 16)}…`
                                : log.actorUserId}
                            </span>
                          )}
                        </td>
                        {/* Detail toggle */}
                        <td className="py-3 px-4 text-center">
                          {hasDetail ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className={cn(
                                "text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium cursor-pointer",
                                isExpanded
                                  ? "bg-[var(--ink)] border-[var(--ink)] text-white shadow-2xs"
                                  : "bg-white border-[var(--line)] text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--ink)]"
                              )}
                            >
                              {isExpanded ? "Tutup" : "Lihat"}
                            </button>
                          ) : (
                            <span className="text-xs text-[var(--line)]">–</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && hasDetail && (
                        <tr className="bg-[var(--bg)]/60">
                          <td colSpan={6} className="px-6 pb-5 pt-2">
                            <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-2xs">
                              <p className="text-xs font-bold text-[var(--ink)] mb-3 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                                Data setelah perubahan (afterData)
                              </p>
                              <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap break-all leading-relaxed font-mono bg-[var(--bg)] rounded-lg p-3 border border-[var(--line)] max-h-72 overflow-y-auto">
                                {JSON.stringify(log.afterData, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
