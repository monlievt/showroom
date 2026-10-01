"use client";

import React, { useState } from "react";
import {
  Bell,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ExternalLink,
  Smartphone,
  MessageSquare,
  Radio,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { retryNotificationLog } from "@/lib/services/whatsapp";
import { sendTestWhatsAppAction } from "@/app/actions/notification";
import { SettingItem } from "@/app/actions/setting";
import { ApiKeySettingsClient } from "./ApiKeySettingsClient";
import { ImportSpreadsheetPanel } from "./ImportSpreadsheetPanel";
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
}

export function SettingsClient({ logs, auditLogs, initialSettings = [] }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "api_keys" | "import_spreadsheet" | "notifications" | "audit" | "backup"
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
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          )}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">
            Sistem, Notifikasi & Audit
          </h1>
          <p className="text-sm text-[#6B6560] mt-1">
            Log audit notifikasi WhatsApp Gateway, mekanisme retry manual, jejak audit finansial, dan backup database.
          </p>
        </div>

        <button
          disabled={cronLoading}
          onClick={handleTriggerCronManual}
          className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", cronLoading && "animate-spin")} />
          <span>Jalankan Cron Pengingat Sekarang</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] mb-2">
            <span className="text-xs font-semibold uppercase">Berhasil Terkirim</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{totalSent}</div>
          <div className="text-xs text-[#6B6560] mt-1">Pesan terkirim ke WhatsApp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] mb-2">
            <span className="text-xs font-semibold uppercase">Gagal (Perlu Retry)</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
          <div className="text-xs text-[#6B6560] mt-1">Siap dipicu ulang secara manual</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] mb-2">
            <span className="text-xs font-semibold uppercase">Jejak Audit Finansial</span>
            <ShieldCheck className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="text-2xl font-bold text-[#1C1917]">{auditLogs.length}</div>
          <div className="text-xs text-[#6B6560] mt-1">Mutasi immutable tercatat</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D9D4CB] gap-4 sm:gap-6 text-sm font-medium overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("api_keys")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "api_keys"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <KeyRound className="w-4 h-4 text-[#D97706]" />
          <span>Kunci API & Integrasi Layanan</span>
        </button>
        <button
          onClick={() => setActiveTab("import_spreadsheet")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "import_spreadsheet"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#D97706]" />
          <span>Impor Data Spreadsheet Lama</span>
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "notifications"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Audit Log Notifikasi WhatsApp ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "audit"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Jejak Audit Transaksi Finansial ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "backup"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Status Backup & Ketentuan Pajak
        </button>
      </div>

      {/* TAB 0: KUNCI API & INTEGRASI */}
      {activeTab === "api_keys" && (
        <ApiKeySettingsClient initialSettings={initialSettings} />
      )}

      {/* TAB 0.5: IMPOR SPREADSHEET */}
      {activeTab === "import_spreadsheet" && (
        <ImportSpreadsheetPanel />
      )}

      {/* TAB 1: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* WAHA Gateway Control Hub */}
          <div className="bg-white rounded-2xl border border-[#D9D4CB] p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EBE7E1]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-[#1C1917] text-base">
                      WhatsApp Gateway (WAHA Engine)
                    </h3>
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Port 2026 Ready
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Self-hosted gateway via Docker (<code className="bg-[#FAF9F6] px-1 py-0.5 rounded text-[11px]">docker-compose.waha.yml</code>).
                    Kirim notifikasi unit laku, rincian bagi hasil, invoice PDF, dan pengingat piutang otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="http://localhost:2026/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9D4CB] bg-[#FAF9F6] hover:bg-[#EFECE8] text-xs font-bold text-[#1C1917] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Dashboard WAHA / Scan QR</span>
                </a>
              </div>
            </div>

            {/* Form Uji Coba Pengiriman Pesan */}
            <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#EBE7E1] space-y-3">
              <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#D97706]" />
                <span>Simulasi & Uji Coba Pengiriman WhatsApp:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-[#6B6560] mb-1">
                    Nomor WhatsApp Penerima
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-1.5 bg-white border border-[#D9D4CB] rounded-lg text-xs font-semibold text-[#1C1917]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[#6B6560] mb-1">
                    Jenis Template Notifikasi
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9D4CB] rounded-lg text-xs font-semibold text-[#1C1917]"
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
                    className="w-full flex items-center justify-center gap-1.5 bg-[#1C1917] hover:bg-[#44403C] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className={cn("w-3.5 h-3.5", testLoading && "animate-spin")} />
                    <span>{testLoading ? "Mengirim..." : "Kirim Uji Coba"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Log Audit Notifikasi */}
          <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm space-y-4">
            <div className="p-5 border-b border-[#D9D4CB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FBF9F6]">
              <div>
                <h3 className="font-bold text-[#1C1917]">Log Audit WhatsApp Gateway (Bukan Fire-and-Forget)</h3>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  Setiap pesan dicatat PENDING sebelum dikirim. Status SENT/FAILED tervalidasi dengan retry manual.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#6B6560]">Filter Tipe:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-white border border-[#D9D4CB] rounded-lg px-2.5 py-1 text-xs font-semibold"
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
                  className="bg-white border border-[#D9D4CB] rounded-lg px-2.5 py-1 text-xs font-semibold"
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
                <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Tipe Pesan</th>
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-4">Isi Pesan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Retry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D4CB]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#6B6560]">
                        Belum ada catatan notifikasi pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const getTypeBadge = (type: string) => {
                        switch (type) {
                          case "UNIT_SOLD":
                            return "bg-blue-100 text-blue-800 border-blue-200";
                          case "PROFIT_DISTRIBUTION":
                            return "bg-emerald-100 text-emerald-800 border-emerald-200";
                          case "DOCUMENT_READY":
                            return "bg-indigo-100 text-indigo-800 border-indigo-200";
                          case "PIUTANG_DUE":
                            return "bg-amber-100 text-amber-800 border-amber-200";
                          case "PAJAK_EXPIRY":
                            return "bg-rose-100 text-rose-800 border-rose-200";
                          default:
                            return "bg-gray-100 text-gray-800 border-gray-200";
                        }
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
                        <tr key={log.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-3 px-4 text-xs text-[#6B6560] whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold whitespace-nowrap">
                            <span className={cn("border px-2 py-0.5 rounded font-bold text-[11px]", getTypeBadge(log.type))}>
                              {getTypeLabel(log.type)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-xs text-[#1C1917] block">
                              {log.recipientName || "Tanpa Nama"}
                            </span>
                            <span className="text-[11px] text-[#6B6560]">{log.recipientPhone}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#1C1917] max-w-xs truncate">
                            {log.messageBody}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                log.status === "SENT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.status === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              )}
                            >
                              {log.status} {log.retryCount > 0 ? `(${log.retryCount}x)` : ""}
                            </span>
                            {log.failureReason && (
                              <span className="block text-[10px] text-red-600 truncate max-w-xs mt-0.5">
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
                              <span className="text-xs text-[#6B6560]">-</span>
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
        <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D9D4CB] bg-[#FBF9F6]">
            <h3 className="font-bold text-[#1C1917]">Jejak Audit Finansial & Operasional</h3>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Setiap pembuatan unit, pencatatan beban biaya, alokasi modal, dan eksekusi bagi hasil tersimpan di AuditLog.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Entitas</th>
                  <th className="py-3 px-4">ID Referensi</th>
                  <th className="py-3 px-4">Pelaku (User)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 px-4 text-xs text-[#6B6560] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-[#1C1917] bg-[#F7F5F2] border border-[#D9D4CB] px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#D97706]">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6B6560] font-mono">
                      {log.entityId}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#1C1917]">
                      {log.actorUserId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & TAX INFO */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#D97706]" />
              <h3 className="font-bold text-base text-[#1C1917]">
                Backup & Disaster Recovery Database MariaDB
              </h3>
            </div>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Karena aplikasi ini di-host mandiri pada VPS / Homeserver pribadi (ARCHITECTURE.md §14.7), pencadangan database dilakukan secara otomatis harian menggunakan skrip executable:
            </p>
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EBE7E1] font-mono text-xs text-[#1C1917]">
              bash /Volumes/Backup/Antigravity/showroom-app/scripts/backup-db.sh
            </div>
            <div className="text-xs text-[#6B6560] space-y-1">
              <p>• Lokasi backup: <code>/backups/nur_mobil_YYYYMMDD_HHMMSS.sql.gz</code></p>
              <p>• Retensi otomatis: 7 hari terakhir (arsip lama dihapus otomatis agar hemat disk).</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#D97706]" />
              <h3 className="font-bold text-base text-[#1C1917]">
                Pencatatan Pajak Fleksibel (ARCHITECTURE.md §11)
              </h3>
            </div>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Model <code>TaxRecord</code> mencatat pelaporan pajak tanpa hardcoding tarif hukum di dalam sistem.
              Owner bersama akuntan menentukan tarif dan skema di luar aplikasi, lalu mencatatnya untuk keperluan pelaporan SPT tahunan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
